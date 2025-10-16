var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");
var characterImage = localStorage.getItem('selectedCharacter');
var characterImgObj = new Image();
characterImgObj.src = characterImage;
var player = { x: 270, y: 350, width: 50, height: 50 };
var answers = [];
var obstacles = [];
var score = 0;
var highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
var gameActive = false;
var totalQuestions = 5;
var currentQuestion = null;

// Speed variables for increasing difficulty
var speedIncreaseFactor = 0; // Tracks the speed increase over time
var entitySpeed = 5; // Initial speed of entities
var obstacleSpeed = 6; // Initial speed of obstacles

// Get audio elements
var backgroundMusic = document.getElementById("backgroundMusic");
var twinkleSound = document.getElementById("twinkleSound");

function startGame() {
    score = 0; // Reset score
    answers = [];
    obstacles = [];
    gameActive = true;
    document.getElementById("stopButton").disabled = false;
    updateScoreDisplay(); 
    generateEntities();
    askQuestion();
   
    gameLoop();
}

function endGame() {
    gameActive = false;
    document.getElementById("stopButton").disabled = true;
    backgroundMusic.pause(); // Stop background music

    if (currentQuestion) {  
        alert(`Game Over! Your final score is: ${score}. The correct answer was: ${currentQuestion}`);
    }

    if (score > highScore) {
        highScore = score; // Update high score
        localStorage.setItem('highScore', highScore); // Save high score to local storage
        alert(`New High Score! Your final score is: ${score}`);
    } else {
        alert(`Game Over! Your final score is: ${score}`);
    }
}

function generateEntities() {
    for (let i = 0; i < totalQuestions; i++) {
        let num1 = Math.floor(Math.random() * 10) + 1;
        let num2 = Math.floor(Math.random() * 10) + 1;
        answers.push({ x: Math.random() * (canvas.width - 20), y: -20, answer: num1 * num2 });
    }
    obstacles.push({ x: Math.random() * (canvas.width - 30), y: -20, width: 30, height: 30 });
}

function askQuestion() {
    if (!gameActive) return;

    let num1 = Math.floor(Math.random() * 12) + 1;
    let num2 = Math.floor(Math.random() * 12) + 1;
    currentQuestion = num1 * num2;

    setTimeout(() => {
        let userAnswer = prompt(`What is ${num1} x ${num2}?`);

        if (userAnswer === null) {
            endGame();
            return;
        }

        let parsedAnswer = parseInt(userAnswer);
        if (isNaN(parsedAnswer)) {
            alert("Please enter a valid number.");
            askQuestion();
            return;
        }

        console.log(`Question: ${num1} x ${num2}, Expected Answer: ${currentQuestion}, User Answer: ${userAnswer}`);

        if (parsedAnswer === currentQuestion) {
            score++;
            speedIncreaseFactor++;
            entitySpeed += 0.5;
            obstacleSpeed += 0.5;
            updateScoreDisplay();
            generateEntities();
            askQuestion();
        } else {
            endGame();
        }
    }, 5000); 
}
function updateScoreDisplay() {
    document.getElementById("scoreDisplay").innerText = `Score: ${score}`;
    document.getElementById("highScoreDisplay").innerText = `High Score: ${highScore}`;
}

function gameLoop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    updateEntities();
    drawEntities();
    checkCollisions();
    requestAnimationFrame(gameLoop);
}

function drawPlayer() {
    ctx.drawImage(characterImgObj, player.x - 10, player.y - 10, player.width + 20, player.height + 20);
}

function updateEntities() {
    answers.forEach(answer => {
        answer.y += entitySpeed; 
    });
    obstacles.forEach(obstacle => {
        obstacle.y += obstacleSpeed; 
    });
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    var rot = (Math.PI / 2) * 3;
    var x = cx;
    var y = cy;
    var step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (var i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function drawEntities() {
    ctx.fillStyle = "yellow";
    answers.forEach(answer => {
        drawStar(ctx, answer.x + 10, answer.y + 10, 5, 15, 7); 
    });
    ctx.fillStyle = "red";
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function checkCollisions() {
    answers.forEach((answer, index) => {
        if (answer.y > canvas.height) {
            answers.splice(index, 1);
        } else if (answer.y + 20 > player.y && answer.y < player.y + player.height &&
                   answer.x + 20 > player.x && answer.x < player.x + player.width) {
            score++;
            answers.splice(index, 1);
            twinkleSound.play(); 
            let newNum1 = Math.floor(Math.random() * 10) + 1;
            let newNum2 = Math.floor(Math.random() * 10) + 1;
            answers.push({ x: Math.random() * (canvas.width - 20), y: -20, answer: newNum1 * newNum2 });
        }
    });
    
    obstacles.forEach((obstacle) => {
        if (obstacle.y + obstacle.height > player.y && obstacle.y < player.y + player.height &&
            obstacle.x + obstacle.width > player.x && obstacle.x < player.x + player.width) {
            endGame();
        }
    });
    
    document.getElementById("scoreDisplay").innerText = `Score: ${score}`;
}

function movePlayer(direction) {
    if (gameActive) {
        if (direction === 'left') {
            player.x = Math.max(0, player.x - 15);
        } else if (direction === 'right') {
            player.x = Math.min(canvas.width - player.width, player.x + 15);
        }
    }
}

document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowLeft") {
        movePlayer('left');
    } else if (event.key === "ArrowRight") {
        movePlayer('right');
    }
});

// Touch events for mobile
canvas.addEventListener("touchstart", function(event) {
    event.preventDefault(); 
    const touchX = event.touches[0].clientX - canvas.getBoundingClientRect().left;
    if (touchX < player.x) {
        movePlayer('left');
    } else {
        movePlayer('right');
    }
});

document.getElementById("startButton").addEventListener("click", function() {
    startGame(); 
});

document.getElementById("stopButton").addEventListener("click", function() {
    endGame();  
});

document.getElementById("audioToggle").addEventListener("change", function() {
    if (this.checked) {
        backgroundMusic.play(); // Resume background music if checked
    } else {
        backgroundMusic.pause(); // Pause background music if unchecked
    }
});

document.getElementById("homeButton").addEventListener("click", function() {
    window.location.href = "index.html"; // Navigate to home page
});

// Update the initial high score display
document.getElementById("highScoreDisplay").innerText = `High Score: ${highScore}`;