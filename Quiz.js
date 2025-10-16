// Game variables
var score = 0;
var totalQuestions = 10;
var currentQuestion = 0;
var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");
var gameActive = false;
var audioEnabled = true; // Audio state
var correctSound = document.getElementById("correctSound");
var incorrectSound = document.getElementById("incorrectSound");
var backgroundMusic = document.getElementById("backgroundMusic");

// Confetti control variable
let confettiActive = false; // New flag to control individual confetti bursts

// User authentication and game state variables
let currentUser = null;
let gameStartTime;

// --- Initial UI Setup ---
document.getElementById("gameArea").style.display = "none";
document.getElementById("createAccountForm").style.display = "none";
document.getElementById("signInForm").style.display = "block";

// Retrieve remembered username if available
const rememberedUsername = localStorage.getItem('rememberedUsername');
if (rememberedUsername) {
    document.getElementById('username').value = rememberedUsername;
    document.getElementById('rememberMe').checked = true;
}

// --- Event Listeners ---
document.getElementById("createAccountButton").addEventListener("click", createAccount);
document.getElementById("showCreateAccountButton").addEventListener("click", showCreateAccountForm);
document.getElementById("signInButton").addEventListener("click", signIn);
document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("stopButton").addEventListener("click", endGame);
document.getElementById("progressReportButton").addEventListener("click", generateProgressReport);
document.getElementById("homeButton").addEventListener("click", function() {
    window.location.href = "index.html"; // Navigate to home page
});
document.getElementById("audioToggle").addEventListener("change", toggleAudio); // Use change event
document.getElementById("backToSignInButton").addEventListener("click", function() {
    toggleForms(false); // Go back to sign-in form
});


// --- Form Management Functions ---
function showCreateAccountForm() {
    toggleForms(true); // Show create account form
}

function toggleForms(showCreateAccount) {
    document.getElementById("signInForm").style.display = showCreateAccount ? "none" : "block";
    document.getElementById("createAccountForm").style.display = showCreateAccount ? "block" : "none";
    document.getElementById("accountErrorMessage").innerText = ""; // Clear any previous error message
    document.getElementById("errorMessage").innerText = ""; // Clear sign-in error message too
}

function createAccount() {
    var newUsername = document.getElementById("newUsername").value;
    var newPassword = document.getElementById("newPassword").value;

    if (!newUsername || !newPassword) {
        document.getElementById("accountErrorMessage").innerText = "Please enter a username and password!";
        return;
    }

    if (!localStorage.getItem(newUsername)) {
        localStorage.setItem(newUsername, newPassword); // Store the new account
        // Using a custom modal/message box instead of alert()
        showMessageBox('Account created! You can now sign in.', 'success');
        toggleForms(false); // Hide create account form
    } else {
        document.getElementById("accountErrorMessage").innerText = "Username already exists! Please choose another.";
    }
}

function signIn() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var rememberMe = document.getElementById("rememberMe").checked;

    if (localStorage.getItem(username) === password) {
        currentUser = username;

        // "Remember Me" functionality
        if (rememberMe) {
            localStorage.setItem('rememberedUsername', username);
        } else {
            localStorage.removeItem('rememberedUsername');
        }

        document.getElementById("signInForm").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
        initializeGame();
        startGame();
    } else {
        document.getElementById("errorMessage").innerText = "Invalid username or password!";
    }
}

// --- Game Initialization and Control Functions ---
function initializeGame() {
    score = 0;
    currentQuestion = 0;
    gameActive = false;
    gameStartTime = new Date();
    // Ensure background music starts only if audio is enabled
    if (audioEnabled) {
        backgroundMusic.play().catch(e => console.log("Background music play failed:", e));
    }
}

function startGame() {
    score = 0;
    currentQuestion = 0;
    gameActive = true;
    configureGameUI(false);
    document.getElementById("startButton").style.display = "none"; // Hide the Start Quiz button

    drawText("Get ready!", "black"); // Display a "Get ready!" message

    // Wait for a few seconds before showing the first question
    setTimeout(showNextQuestion, 3000);
}

function configureGameUI(isGameOver) {
    document.getElementById("stopButton").disabled = isGameOver;
    document.getElementById("socialButtons").style.display = isGameOver ? "block" : "none";
    document.getElementById("scoreDisplay").style.display = isGameOver ? "block" : "none";
    document.getElementById("startButton").style.display = isGameOver ? "block" : "none"; // Show start button again if game is over
}

function showNextQuestion() {
    if (currentQuestion < totalQuestions && gameActive) {
        let num1 = getRandomNumber(1, 12);
        let num2 = getRandomNumber(1, 12);
        let answer = multiply(num1, num2);

        // Using a custom message box for questions instead of prompt()
        showQuestionBox(`What is ${num1} x ${num2}?`, (userAnswer) => {
            if (userAnswer === null || userAnswer.toLowerCase() === 'exit') {
                endGame();
            } else {
                checkAnswer(userAnswer, answer);
            }
        });
    } else {
        endGame();
    }
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function multiply(a, b) {
    return a * b;
}

function playSound(sound) {
    if (audioEnabled) {
        // Temporarily lower background music volume for effect sounds
        backgroundMusic.volume = 0.2;
        sound.currentTime = 0; // Restart sound if it's already playing
        sound.play().catch(e => console.log("Sound effect play failed:", e));
        sound.onended = () => {
            backgroundMusic.volume = 1; // Restore volume after sound ends
        };
    }
}

function checkAnswer(userAnswer, correctAnswer) {
    const isCorrect = parseInt(userAnswer) === correctAnswer;

    if (isCorrect) {
        score++;
        drawText(`Correct! Your score is: ${score}`, "green");
        playSound(correctSound);
        // --- Confetti code for correct answers ---
        setupConfettiParticles(); // Prepare confetti particles
        confettiActive = true; // Activate confetti animation
        animateConfetti(); // Start the confetti animation loop

        // Stop confetti after a short duration (e.g., 3 seconds)
        setTimeout(() => {
            confettiActive = false; // Deactivate confetti animation
            // Clear canvas only if confetti was active and no other drawing needs to persist
            if (!gameActive) { // If game is not active, it will be cleared by endGame or congratulateUser
                // No specific action here as endGame or showNextQuestion will handle drawing.
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear only confetti
                // Re-draw the "Correct!" message or prepare for the next question
                if (currentQuestion < totalQuestions) {
                    drawText(`Correct! Your score is: ${score}`, "green");
                }
            }
        }, 3000); // Confetti lasts for 3 seconds
    } else {
        drawText(`Incorrect! The correct answer was: ${correctAnswer}`, "red");
        playSound(incorrectSound);
    }

    currentQuestion++;
    // This timeout needs to be long enough to allow confetti to play and clear
    setTimeout(showNextQuestion, 4000); // Wait 4 seconds before next question
}

function endGame() {
    gameActive = false;
    confettiActive = false; // Ensure confetti is off if game ends prematurely
    document.getElementById("stopButton").disabled = true;
    displayScore();
    saveScore();
    setupSocialMediaLinks();
    configureGameUI(true); // Show social buttons and score display
    drawText(""); // Clear question from canvas
    congratulateUser(); // Call the congratulatory function for overall game completion
    if (audioEnabled) {
        backgroundMusic.pause(); // Pause music on game end
        backgroundMusic.currentTime = 0; // Rewind for next game
    }
    // Optionally redirect after a delay or offer restart
    // setTimeout(() => {
    //     window.location.href = "index.html";
    // }, 10000); // Redirect after 10 seconds
}

// --- Confetti Animation Functions ---
let confettiParticles = [];

function congratulateUser() {
    // This function is for the end-of-game congratulations, not individual answers.
    let congratsMessage = "Congratulations! You've completed the quiz!";
    drawText(congratsMessage, "gold"); // You can change color as needed

    setupConfettiParticles(); // Prepare the confetti
    // This confetti burst should continue until the user closes the modal or navigates
    // We don't set confettiActive to false here, allowing it to run until explicitly cleared
    confettiActive = true; // Ensure confetti is active for the end-game celebration
    animateConfetti(); // Start the confetti animation
}

function setupConfettiParticles() {
    confettiParticles = []; // Ensure we start fresh each time
    for (var i = 0; i < 100; i++) {
        confettiParticles.push(new ConfettiParticle());
    }
}

function animateConfetti() {
    // Request animation frame for smooth animation
    // Stop confetti animation if game is not active and confettiActive is false
    // or if the game is active but confettiActive has been explicitly turned off (for short bursts)
    if (!confettiActive && !gameActive) { // If both confetti and game are truly done
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas once game is truly over
        drawText("Game Over!", "black"); // Final message
        return;
    }

    if (!confettiActive && gameActive) { // If confetti is explicitly off but game is still running
        // This means a short confetti burst has ended, and we need to clear the confetti drawings
        // The checkAnswer's setTimeout already handles re-drawing the text after confetti.
        return; // Stop animation frame for confetti when confettiActive is false
    }

    // Only draw confetti if confettiActive is true
    if (confettiActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing confetti
        // When congratulating for the end of the game, redraw the congrats message
        if (!gameActive && confettiActive) { // Only redraw if it's the end-game celebration
             drawText("Congratulations! You've completed the quiz!", "gold"); // Redraw congratulations message
        } else if (gameActive && confettiActive) { // During a correct answer burst
             drawText(`Correct! Your score is: ${score}`, "green"); // Keep the "Correct!" message visible
        }

        confettiParticles.forEach(function(p) {
            p.update();
            p.draw(ctx);
        });
        requestAnimationFrame(animateConfetti); // Keep animating while active
    }
}

class ConfettiParticle {
    constructor() {
        this.x = Math.random() * canvas.width; // Use canvas dimensions
        this.y = Math.random() * canvas.height - 100;
        this.size = Math.random() * 5 + 5;
        this.speedY = Math.random() * 3 + 1;
        this.color = this.randomColor();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.1 - 0.05;
    }

    randomColor() {
        const colors = ['#ff0c0c', '#ffb300', '#ff6b00', '#48ff00', '#09f0ff', '#8300ff', '#ff00d4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        if (this.y > canvas.height) { // Use canvas dimensions
            this.y = -10;
            this.x = Math.random() * canvas.width;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

// --- Score and Report Functions ---
function displayScore() {
    document.getElementById("scoreDisplay").innerText = `Game over! Your final score is: ${score} out of ${totalQuestions}`;
}

function saveScore() {
    let userScores = JSON.parse(localStorage.getItem(currentUser + '_scores')) || [];
    let gameEndTime = new Date();
    let duration = Math.round((gameEndTime - gameStartTime) / 1000);

    let scoreData = {
        score: score,
        date: gameEndTime.toISOString(),
        duration: duration,
        perfectScore: score === totalQuestions
    };

    userScores.push(scoreData);
    localStorage.setItem(currentUser + '_scores', JSON.stringify(userScores));
}

function setupSocialMediaLinks() {
    let shareText = encodeURIComponent(`I've just scored ${score} in Multiply Quest!`);
    let twitterUrl = `https://twitter.com/share?text=${shareText}`;
    let facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${shareText}`;

    document.getElementById("twitterShare").setAttribute("href", twitterUrl);
    document.getElementById("facebookShare").setAttribute("href", facebookUrl);
}

function generateProgressReport() {
    let userScores = JSON.parse(localStorage.getItem(currentUser + '_scores')) || [];

    let report = "Progress Report:\n\n";
    report += `Total Attempts: ${userScores.length}\n`;

    userScores.forEach(entry => {
        let formattedDate = formatDate(entry.date);
        report += `Date: ${formattedDate}, Score: ${entry.score || 0}, Duration: ${entry.duration || 0} seconds, Perfect Score: ${entry.perfectScore ? 'Yes' : 'No'}\n`;
    });

    report += `Average Score: ${(userScores.reduce((sum, entry) => sum + entry.score, 0) / (userScores.length || 1)).toFixed(2)} out of ${totalQuestions}\n`;
    report += `Best Score: ${Math.max(...userScores.map(entry => entry.score)) || 0}\n`;

    // Using a custom message box instead of alert()
    showMessageBox(report, 'info', true);
}

function formatDate(dateString) {
    let date = new Date(dateString);
    return !isNaN(date.getTime())
        ? `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`
        : "Invalid Date";
}

function drawText(message, color) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "24px 'Comic Sans MS'"; // Use Comic Sans MS for a fun look
    ctx.fillStyle = color || "black";
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "top"; // Align text to the top for multi-line display

    const maxWidth = canvas.width - 40; // Max width for text, with 20px padding on each side
    const lineHeight = 30; // Height of each line of text
    let y = 20; // Starting Y position, with 20px padding from top

    const words = message.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, canvas.width / 2, y);
}

// --- Audio Control Function ---
function toggleAudio() {
    audioEnabled = document.getElementById("audioToggle").checked;
    if (audioEnabled) {
        backgroundMusic.play().catch(e => console.log("Background music auto-play failed:", e));
        showMessageBox("Audio enabled", 'info');
    } else {
        backgroundMusic.pause();
        showMessageBox("Audio disabled", 'info');
    }
}

// --- Custom Message Box and Question Box (instead of alert/prompt) ---
// This is a basic implementation. For a real app, you'd create more elaborate modal dialogs.
function showMessageBox(message, type = 'info', isReport = false) {
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.backgroundColor = 'white';
    dialog.style.border = `2px solid ${type === 'error' ? 'red' : (type === 'success' ? 'green' : 'blue')}`;
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '10px';
    dialog.style.zIndex = '1000';
    dialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    dialog.style.maxWidth = '80vw';
    dialog.style.maxHeight = '80vh';
    dialog.style.overflowY = 'auto'; // Make scrollable for long reports

    const messageContent = document.createElement('p');
    messageContent.innerText = message;
    messageContent.style.whiteSpace = isReport ? 'pre-wrap' : 'normal'; // Preserve newlines for reports

    const closeButton = document.createElement('button');
    closeButton.innerText = 'OK';
    closeButton.style.marginTop = '15px';
    closeButton.style.padding = '8px 15px';
    closeButton.style.backgroundColor = '#32cd32';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';

    closeButton.onclick = () => dialog.remove();

    dialog.appendChild(messageContent);
    dialog.appendChild(closeButton);
    document.body.appendChild(dialog);
}

function showQuestionBox(question, callback) {
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.backgroundColor = 'white';
    dialog.style.border = '2px solid orange';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '10px';
    dialog.style.zIndex = '1000';
    dialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';

    const questionContent = document.createElement('p');
    questionContent.innerText = question;
    questionContent.style.marginBottom = '10px';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Your answer';
    input.style.width = 'calc(100% - 20px)';
    input.style.padding = '8px';
    input.style.marginBottom = '10px';
    input.style.borderRadius = '5px';
    input.style.border = '1px solid #ccc';

    const submitButton = document.createElement('button');
    submitButton.innerText = 'Submit';
    submitButton.style.marginRight = '10px';
    submitButton.style.padding = '8px 15px';
    submitButton.style.backgroundColor = '#32cd32';
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.borderRadius = '5px';
    submitButton.style.cursor = 'pointer';

    const exitButton = document.createElement('button');
    exitButton.innerText = 'Exit Game';
    exitButton.style.padding = '8px 15px';
    exitButton.style.backgroundColor = '#ff4500';
    exitButton.style.color = 'white';
    exitButton.style.border = 'none';
    exitButton.style.borderRadius = '5px';
    exitButton.style.cursor = 'pointer';

    submitButton.onclick = () => {
        dialog.remove();
        callback(input.value);
    };

    exitButton.onclick = () => {
        dialog.remove();
        callback('exit'); // Pass 'exit' to the callback
    };

    // Allow pressing Enter to submit
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitButton.click();
        }
    });

    dialog.appendChild(questionContent);
    dialog.appendChild(input);
    dialog.appendChild(submitButton);
    dialog.appendChild(exitButton);
    document.body.appendChild(dialog);
    input.focus(); // Focus on the input field
}