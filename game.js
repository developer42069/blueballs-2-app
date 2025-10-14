// Floating Header Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const sideMenu = document.getElementById('side-menu');
const headerLogo = document.getElementById('header-logo');

// Start with menu closed on all devices
sideMenu.classList.remove('menu-open');

menuToggle.addEventListener('click', () => {
    sideMenu.classList.toggle('menu-open');
});

// Make logo refresh the page
headerLogo.addEventListener('click', () => {
    window.location.reload();
});

// Close menu when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !sideMenu.contains(e.target) && e.target !== menuToggle) {
        sideMenu.classList.remove('menu-open');
    }
});

// Game Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const shareButton = document.getElementById('share-button');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreValue = document.getElementById('final-score-value');
const restartButton = document.getElementById('restart-button');
const shareScoreButton = document.getElementById('share-score-button');

// Canvas Resize Function
function resizeCanvas() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    const aspectRatio = canvas.width / canvas.height;
    let newWidth, newHeight;
    
    if (window.innerWidth < window.innerHeight) {
        newWidth = Math.min(window.innerWidth * 0.9, 600);
        newHeight = newWidth / aspectRatio;
    } else {
        newHeight = Math.min(window.innerHeight * 0.7, 600);
        newWidth = newHeight * aspectRatio;
    }
    
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
    
    // Position the start screen at specific coordinates
    startScreen.style.top = '228px';
    startScreen.style.left = '50%';
    startScreen.style.transform = 'translateX(-50%)';
}

// Share Functions
async function shareScore(score) {
    const currentUrl = window.location.href;
    const shareText = `I scored ${score} in Blue Balls! Can you beat me?`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Blue Balls Game',
                text: shareText,
                url: currentUrl,
            });
        } catch (error) {
            copyToClipboard(shareText + ' ' + currentUrl);
        }
    } else {
        copyToClipboard(shareText + ' ' + currentUrl);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard: ' + text);
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Share text copied to clipboard: ' + text);
    });
}

// Initialize canvas on load
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Game Variables
let bird = { x: 50, y: 300, velocity: 0, gravity: 0.2, jump: -5, size: 15 };
let pipes = [];
let score = 0;
let gameStarted = false;
let gameOver = false;
const pipeGap = 200;
const pipeSpacing = 220;
const pipeSpeed = 1.5;

// Game Functions
function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
    pipes.push({ 
        x: canvas.width, 
        topHeight: height, 
        bottomY: height + pipeGap, 
        passed: false,
        topSpikeWidth: 80, // Width of the spike at base
        bottomSpikeWidth: 80
    });
}

function drawBird() {
    ctx.fillStyle = '#00008B';
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.size, 0, Math.PI * 2);
    ctx.fill();
}

function drawPipes() {
    ctx.fillStyle = '#E40078';
    pipes.forEach(pipe => {
        // Draw top spike (pointing down)
        ctx.beginPath();
        ctx.moveTo(pipe.x, 0);
        ctx.lineTo(pipe.x + pipe.topSpikeWidth, 0);
        ctx.lineTo(pipe.x + (pipe.topSpikeWidth/2), pipe.topHeight);
        ctx.closePath();
        ctx.fill();
        
        // Draw bottom spike (pointing up)
        ctx.beginPath();
        ctx.moveTo(pipe.x, canvas.height);
        ctx.lineTo(pipe.x + pipe.bottomSpikeWidth, canvas.height);
        ctx.lineTo(pipe.x + (pipe.bottomSpikeWidth/2), pipe.bottomY);
        ctx.closePath();
        ctx.fill();
    });
}

function update() {
    if (!gameStarted || gameOver) return;

    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;
        if (!pipe.passed && pipe.x + (pipe.topSpikeWidth/2) < bird.x) {
            score++;
            scoreElement.textContent = score;
            pipe.passed = true;
        }
        
        // Collision detection with spikes
        const topSpikeLeft = pipe.x;
        const topSpikeRight = pipe.x + pipe.topSpikeWidth;
        const topSpikeBottom = pipe.topHeight;
        const topSpikeCenterX = pipe.x + (pipe.topSpikeWidth/2);
        
        const bottomSpikeLeft = pipe.x;
        const bottomSpikeRight = pipe.x + pipe.bottomSpikeWidth;
        const bottomSpikeTop = pipe.bottomY;
        const bottomSpikeCenterX = pipe.x + (pipe.bottomSpikeWidth/2);
        
        // Check if bird is within the spike's horizontal range
        if (bird.x + bird.size > topSpikeLeft && bird.x - bird.size < topSpikeRight) {
            // Check collision with top spike
            if (bird.y - bird.size < topSpikeBottom) {
                // Calculate if bird is within the triangle
                const relativeX = bird.x - topSpikeCenterX;
                const slope = (topSpikeBottom * 2) / pipe.topSpikeWidth;
                const maxYAtX = topSpikeBottom - Math.abs(relativeX) * slope;
                
                if (bird.y - bird.size < maxYAtX) {
                    endGame();
                }
            }
            
            // Check collision with bottom spike
            if (bird.y + bird.size > bottomSpikeTop) {
                const relativeX = bird.x - bottomSpikeCenterX;
                const slope = ((canvas.height - bottomSpikeTop) * 2) / pipe.bottomSpikeWidth;
                const minYAtX = bottomSpikeTop + Math.abs(relativeX) * slope;
                
                if (bird.y + bird.size > minYAtX) {
                    endGame();
                }
            }
        }
    });

    pipes = pipes.filter(pipe => pipe.x > -Math.max(pipe.topSpikeWidth, pipe.bottomSpikeWidth));
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeSpacing) {
        createPipe();
    }

    if (bird.y + bird.size > canvas.height || bird.y - bird.size < 0) {
        endGame();
    }

    requestAnimationFrame(update);
    draw();
}

function endGame() {
    gameOver = true;
    finalScoreValue.textContent = score;
    gameOverOverlay.style.display = 'flex';
    restartButton.disabled = false;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPipes();
    drawBird();
}

function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    scoreElement.textContent = '0';
    bird.y = 300;
    bird.velocity = 0;
    pipes = [];
    startScreen.style.display = 'none';
    gameOverOverlay.style.display = 'none';
    update();
}

function resetToStartScreen() {
    gameStarted = false;
    gameOver = false;
    score = 0;
    scoreElement.textContent = '0';
    bird.y = 300;
    bird.velocity = 0;
    pipes = [];
    startScreen.style.display = 'block';
    gameOverOverlay.style.display = 'none';
    draw();
}

// Event Listeners
restartButton.addEventListener('click', resetToStartScreen);
shareScoreButton.addEventListener('click', () => shareScore(score));
shareButton.addEventListener('click', () => shareScore(0));

// Make all ads open in new tab
document.querySelectorAll('a').forEach(link => {
    if (link.href.includes('highperformanceformat.com') || 
        link.href.includes('effectiveratecpm.com') ||
        link.href.includes('ko-fi.com')) {
        link.target = '_blank';
    }
});

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameStarted) {
            startGame();
        } else if (!gameOver) {
            bird.velocity = bird.jump;
        }
        e.preventDefault();
    }
});

// Touch Controls
canvas.addEventListener('touchstart', (e) => {
    if (!gameStarted) {
        startGame();
    } else if (!gameOver) {
        bird.velocity = bird.jump;
    }
    e.preventDefault();
}, { passive: false });

// Mouse Controls
canvas.addEventListener('click', () => {
    if (!gameStarted) {
        startGame();
    } else if (!gameOver) {
        bird.velocity = bird.jump;
    }
});

// Prevent scrolling during game
document.addEventListener('touchmove', (e) => {
    if (gameStarted) {
        e.preventDefault();
    }
}, { passive: false });

// Initialize game
draw();
setTimeout(resizeCanvas, 100);

// Improved pull-to-refresh handling
let touchStartY = 0;
let isAtBottom = false;
const refreshThreshold = 100;

document.addEventListener('touchstart', (e) => {
    if (!gameStarted) {
        touchStartY = e.touches[0].clientY;
        isAtBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 10;
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!gameStarted && touchStartY < 50 && e.touches[0].clientY > touchStartY + 100) {
        e.preventDefault();
        location.reload();
    }
}, { passive: false });