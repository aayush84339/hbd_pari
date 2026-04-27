/* ===================================================================
   flappy.js  –  Flappy Pari: Birthday-themed Flappy Bird game
   =================================================================== */

let flappyCanvas, flappyCtx;
let gameStarted = false;
let gameOver = false;
let gameAnimFrame = null;
let score = 0;

// Bird properties
const bird = {
    x: 80,
    y: 250,
    width: 40,
    height: 30,
    velocity: 0,
    gravity: 0.45,
    jumpForce: -7.5,
    rotation: 0
};

// Pipe properties
let pipes = [];
const pipeWidth = 55;
const pipeGap = 155;
const pipeSpeed = 2.5;
let pipeTimer = 0;
const pipeInterval = 100; // frames

// Ground
const groundHeight = 60;

// Colors
const BIRD_COLOR_1 = '#FFD700';
const BIRD_COLOR_2 = '#FFA500';
const PIPE_COLOR_1 = '#2ecc71';
const PIPE_COLOR_2 = '#27ae60';
const PIPE_COLOR_DARK = '#1e8449';

// Cute birthday messages based on score
const cuteMessages = [
    { min: 0, max: 2, msg: "Aww Pari, don't worry! Even the cutest birds stumble 🐣💕" },
    { min: 3, max: 5, msg: "Nice try, Pari! You're just warming up! 🌸✨" },
    { min: 6, max: 10, msg: "Wow Pari! You're getting good at this! Keep soaring! 🦋💫" },
    { min: 11, max: 15, msg: "Amazing, Pari! You fly like a birthday star! 🌟🎂" },
    { min: 16, max: 20, msg: "Incredible skills, birthday girl! Pari the flappy queen! 👑🎀" },
    { min: 21, max: 30, msg: "UNSTOPPABLE Pari! You're a legend! This birthday is YOURS! 🚀🎉" },
    { min: 31, max: 999, msg: "OMG PARI!! You broke the game!! You're the ultimate birthday champion! 🏆👑💖🎂" }
];

function getCuteMessage(score) {
    for (const m of cuteMessages) {
        if (score >= m.min && score <= m.max) return m.msg;
    }
    return "Happy Birthday Pari! 🎂";
}

function initFlappyGame() {
    flappyCanvas = document.getElementById('flappyCanvas');
    flappyCtx = flappyCanvas.getContext('2d');

    // Adjust canvas size for mobile
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
        flappyCanvas.width = Math.min(340, window.innerWidth - 40);
        flappyCanvas.height = 500;
    } else {
        flappyCanvas.width = 400;
        flappyCanvas.height = 600;
    }

    resetGame();
    drawStartScreen();

    // Get all interactive game elements
    const gameArea = document.querySelector('.game-area');
    const overlay = document.getElementById('gameOverlay');

    // Remove old listeners to avoid duplicates
    flappyCanvas.removeEventListener('click', handleFlappyClick);
    flappyCanvas.removeEventListener('touchstart', handleFlappyTouch);
    flappyCanvas.removeEventListener('touchend', handleFlappyTouchEnd);
    gameArea.removeEventListener('click', handleFlappyClick);
    gameArea.removeEventListener('touchstart', handleFlappyTouch);
    gameArea.removeEventListener('touchend', handleFlappyTouchEnd);
    overlay.removeEventListener('click', handleFlappyClick);
    overlay.removeEventListener('touchstart', handleFlappyTouch);
    overlay.removeEventListener('touchend', handleFlappyTouchEnd);
    document.removeEventListener('keydown', handleFlappyKey);

    // Attach to game area (parent of both canvas and overlay) so taps always register
    gameArea.addEventListener('click', handleFlappyClick);
    gameArea.addEventListener('touchstart', handleFlappyTouch, { passive: false });
    gameArea.addEventListener('touchend', handleFlappyTouchEnd, { passive: false });

    // Also attach directly to overlay for safety
    overlay.addEventListener('click', handleFlappyClick);
    overlay.addEventListener('touchstart', handleFlappyTouch, { passive: false });
    overlay.addEventListener('touchend', handleFlappyTouchEnd, { passive: false });

    document.addEventListener('keydown', handleFlappyKey);
}

function resetGame() {
    bird.y = flappyCanvas.height / 2 - 50;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    pipeTimer = 0;
    score = 0;
    gameStarted = false;
    gameOver = false;
    updateScoreDisplay();
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('gameOverlay').classList.remove('hidden');
}

function handleFlappyClick(e) {
    e.preventDefault();
    e.stopPropagation();
    flap();
}

function handleFlappyTouch(e) {
    e.preventDefault();
    e.stopPropagation();
    flap();
}

function handleFlappyTouchEnd(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFlappyKey(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
    }
}

function flap() {
    if (gameOver) return;

    if (!gameStarted) {
        gameStarted = true;
        document.getElementById('gameOverlay').classList.add('hidden');
        gameLoop();
    }

    bird.velocity = bird.jumpForce;
}

function gameLoop() {
    if (gameOver) return;

    update();
    draw();
    gameAnimFrame = requestAnimationFrame(gameLoop);
}

function update() {
    // Bird physics
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Bird rotation based on velocity
    bird.rotation = Math.min(Math.max(bird.velocity * 3, -30), 70);

    // Ground collision
    if (bird.y + bird.height > flappyCanvas.height - groundHeight) {
        bird.y = flappyCanvas.height - groundHeight - bird.height;
        endGame();
        return;
    }

    // Ceiling collision
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    // Pipe management
    pipeTimer++;
    if (pipeTimer >= pipeInterval) {
        pipeTimer = 0;
        const minTop = 60;
        const maxTop = flappyCanvas.height - groundHeight - pipeGap - 60;
        const topHeight = Math.random() * (maxTop - minTop) + minTop;

        pipes.push({
            x: flappyCanvas.width,
            topHeight: topHeight,
            scored: false
        });
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;

        // Score
        if (!pipes[i].scored && pipes[i].x + pipeWidth < bird.x) {
            pipes[i].scored = true;
            score++;
            updateScoreDisplay();
        }

        // Remove off-screen pipes
        if (pipes[i].x + pipeWidth < -10) {
            pipes.splice(i, 1);
            continue;
        }

        // Collision detection
        if (checkCollision(pipes[i])) {
            endGame();
            return;
        }
    }
}

function checkCollision(pipe) {
    const birdLeft = bird.x + 5;
    const birdRight = bird.x + bird.width - 5;
    const birdTop = bird.y + 5;
    const birdBottom = bird.y + bird.height - 5;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipeWidth;
    const gapTop = pipe.topHeight;
    const gapBottom = pipe.topHeight + pipeGap;

    if (birdRight > pipeLeft && birdLeft < pipeRight) {
        if (birdTop < gapTop || birdBottom > gapBottom) {
            return true;
        }
    }
    return false;
}

function endGame() {
    gameOver = true;
    cancelAnimationFrame(gameAnimFrame);

    document.getElementById('finalScore').textContent = score;
    document.getElementById('cuteMessage').textContent = getCuteMessage(score);
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function restartGame() {
    resetGame();
    drawStartScreen();
}

function updateScoreDisplay() {
    document.getElementById('gameScore').textContent = `Score: ${score}`;
}

function draw() {
    const ctx = flappyCtx;
    const W = flappyCanvas.width;
    const H = flappyCanvas.height;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#4dc9f6');
    skyGrad.addColorStop(0.5, '#87CEEB');
    skyGrad.addColorStop(0.8, '#b8e6b8');
    skyGrad.addColorStop(1, '#7ec87e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Clouds
    drawClouds(ctx, W, H);

    // Pipes
    pipes.forEach(pipe => drawPipe(ctx, pipe, H));

    // Ground
    drawGround(ctx, W, H);

    // Bird
    drawBird(ctx);

    // Score on canvas
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 4;
    ctx.font = 'bold 36px Poppins';
    ctx.textAlign = 'center';
    ctx.strokeText(score, W / 2, 55);
    ctx.fillText(score, W / 2, 55);
}

function drawBird(ctx) {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate((bird.rotation * Math.PI) / 180);

    // Body
    const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, bird.width / 2);
    bodyGrad.addColorStop(0, '#FFE44D');
    bodyGrad.addColorStop(1, '#FFB800');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    const wingY = Math.sin(Date.now() * 0.015) * 4;
    ctx.ellipse(-5, wingY - 2, 12, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(10, -6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(12, -6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(13, -7.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF5722';
    ctx.beginPath();
    ctx.moveTo(16, -1);
    ctx.lineTo(25, 2);
    ctx.lineTo(16, 5);
    ctx.closePath();
    ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255, 107, 157, 0.4)';
    ctx.beginPath();
    ctx.arc(6, 5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Birthday hat (tiny party hat!)
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(-2, -15);
    ctx.lineTo(-12, -2);
    ctx.lineTo(8, -2);
    ctx.closePath();
    ctx.fill();

    // Hat star
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(-2, -16, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawPipe(ctx, pipe, H) {
    const x = pipe.x;
    const topH = pipe.topHeight;
    const bottomY = topH + pipeGap;
    const bottomH = H - groundHeight - bottomY;

    // Top pipe
    const topGrad = ctx.createLinearGradient(x, 0, x + pipeWidth, 0);
    topGrad.addColorStop(0, '#2ecc71');
    topGrad.addColorStop(0.3, '#58d68d');
    topGrad.addColorStop(0.7, '#2ecc71');
    topGrad.addColorStop(1, '#1e8449');
    ctx.fillStyle = topGrad;
    ctx.fillRect(x, 0, pipeWidth, topH);

    // Top pipe cap
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x - 4, topH - 25, pipeWidth + 8, 25);
    ctx.strokeStyle = '#1e8449';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 4, topH - 25, pipeWidth + 8, 25);

    // Bottom pipe
    ctx.fillStyle = topGrad;
    ctx.fillRect(x, bottomY, pipeWidth, bottomH);

    // Bottom pipe cap
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x - 4, bottomY, pipeWidth + 8, 25);
    ctx.strokeStyle = '#1e8449';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 4, bottomY, pipeWidth + 8, 25);
}

function drawGround(ctx, W, H) {
    const groundY = H - groundHeight;

    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, '#8B4513');
    groundGrad.addColorStop(0.1, '#A0522D');
    groundGrad.addColorStop(1, '#654321');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, groundHeight);

    // Grass on top
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, groundY, W, 8);
    ctx.fillStyle = '#66BB6A';
    for (let i = 0; i < W; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, groundY + 8);
        ctx.lineTo(i + 6, groundY - 4);
        ctx.lineTo(i + 12, groundY + 8);
        ctx.fill();
    }
}

let cloudOffset = 0;
function drawClouds(ctx, W, H) {
    cloudOffset += 0.2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

    const clouds = [
        { x: 50, y: 80, r: 25 },
        { x: 80, y: 70, r: 30 },
        { x: 110, y: 80, r: 25 },
        { x: 250, y: 120, r: 20 },
        { x: 275, y: 110, r: 28 },
        { x: 300, y: 120, r: 22 },
        { x: 150, y: 200, r: 18 },
        { x: 170, y: 190, r: 24 },
        { x: 195, y: 200, r: 18 },
    ];

    clouds.forEach(c => {
        ctx.beginPath();
        ctx.arc((c.x + cloudOffset) % (W + 100) - 50, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawStartScreen() {
    const ctx = flappyCtx;
    const W = flappyCanvas.width;
    const H = flappyCanvas.height;

    // Draw background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#4dc9f6');
    skyGrad.addColorStop(0.5, '#87CEEB');
    skyGrad.addColorStop(0.8, '#b8e6b8');
    skyGrad.addColorStop(1, '#7ec87e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    drawClouds(ctx, W, H);
    drawGround(ctx, W, H);

    // Draw bird at center
    bird.y = H / 2 - 50;
    bird.rotation = 0;
    drawBird(ctx);
}
