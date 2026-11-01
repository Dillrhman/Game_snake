// script.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const mainMenu = document.getElementById("mainMenu");
const gameUI = document.getElementById("gameUI");
const gameOverModal = document.getElementById("gameOverModal");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const gameSpeedMs = 150; 

let gameInterval;
let snake = [];
let dx = 0;
let dy = -1;
let apple = { x: 5, y: 5 };
let score = 0;
let inputQueue = [];

function initDefaults() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0;
    dy = -1;
    score = 0;
    inputQueue = [];
    spawnApple();
}

// ---------------- KONTROL KEYBOARD ----------------
document.addEventListener("keydown", (event) => {
    if (gameUI.style.display === "none") return;

    const key = event.key.toLowerCase(); 
    let newDx = 0;
    let newDy = 0;
    let validKey = false;
    
    if (event.key === "ArrowUp" || key === "w") { newDx = 0; newDy = -1; validKey = true; }
    else if (event.key === "ArrowDown" || key === "s") { newDx = 0; newDy = 1; validKey = true; }
    else if (event.key === "ArrowLeft" || key === "a") { newDx = -1; newDy = 0; validKey = true; }
    else if (event.key === "ArrowRight" || key === "d") { newDx = 1; newDy = 0; validKey = true; }

    if (validKey && inputQueue.length < 3) {
        inputQueue.push({ x: newDx, y: newDy });
    }
});

// ---------------- KONTROL MOBILE (D-PAD) ----------------
function handleMobileInput(direction) {
    if (gameUI.style.display === "none") return;
    
    let newDx = 0;
    let newDy = 0;
    let validKey = true;

    if (direction === "up") { newDx = 0; newDy = -1; }
    else if (direction === "down") { newDx = 0; newDy = 1; }
    else if (direction === "left") { newDx = -1; newDy = 0; }
    else if (direction === "right") { newDx = 1; newDy = 0; }

    if (validKey && inputQueue.length < 3) {
        inputQueue.push({ x: newDx, y: newDy });
    }
}

// Menyatukan event sentuh layar (mobile) dan klik mouse (tes di desktop)
function bindMobileButton(btnId, direction) {
    const btn = document.getElementById(btnId);
    
    // Event touchstart menghilangkan delay bawaan browser mobile (300ms) saat mengetuk
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Mencegah fitur zoom-in atau double-tap
        handleMobileInput(direction);
    }, { passive: false });
    
    // Event mousedown jika Anda mencoba menekan tombol D-pad menggunakan mouse di Desktop
    btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        handleMobileInput(direction);
    });
}

bindMobileButton("btnUp", "up");
bindMobileButton("btnDown", "down");
bindMobileButton("btnLeft", "left");
bindMobileButton("btnRight", "right");
// --------------------------------------------------------

document.getElementById('playBtn').addEventListener('click', () => {
    mainMenu.style.display = 'none';
    gameUI.style.display = 'flex';
    startGame();
});

document.getElementById('restartBtn').addEventListener('click', () => {
    gameOverModal.classList.remove('show');
    startGame();
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
    gameOverModal.classList.remove('show');
    gameUI.style.display = 'none';
    mainMenu.style.display = 'flex';
});

function startGame() {
    initDefaults();
    if(gameInterval) clearInterval(gameInterval); 
    gameInterval = setInterval(gameLoop, gameSpeedMs);
}

function gameLoop() {
    processInput();
    updateSnake();
    if (checkGameOver()) return; 
    checkAppleCollision();
    calculateCalculusMetrics();
    drawGame();
}

function processInput() {
    while (inputQueue.length > 0) {
        const input = inputQueue.shift();
        if (input.x !== 0 && dx === -input.x) continue;
        if (input.y !== 0 && dy === -input.y) continue; 
        if (input.x === dx && input.y === dy) continue;
        dx = input.x;
        dy = input.y;
        break; 
    }
}

function updateSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    snake.pop(); 
}

function checkAppleCollision() {
    if (snake[0].x === apple.x && snake[0].y === apple.y) {
        snake.push({ ...snake[snake.length - 1] }); 
        score++;
        spawnApple();
    }
}

function spawnApple() {
    apple.x = Math.floor(Math.random() * tileCount);
    apple.y = Math.floor(Math.random() * tileCount);
    snake.forEach(part => {
        if (part.x === apple.x && part.y === apple.y) spawnApple();
    });
}

function checkGameOver() {
    const head = snake[0];
    let isGameOver = false;

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        isGameOver = true;
    }
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            isGameOver = true;
            break; 
        }
    }

    if (isGameOver) {
        clearInterval(gameInterval); 
        gameOverModal.classList.add('show'); 
    }
    return isGameOver;
}

function calculateCalculusMetrics() {
    const head = snake[0];
    const diffX = head.x - apple.x;
    const diffY = head.y - apple.y;
    const s = Math.sqrt((diffX * diffX) + (diffY * diffY)); 
    const v = 1000 / gameSpeedMs;
    const c = 1;
    const safe_s = s === 0 ? 0.001 : s;
    const dLdt = c * (v / safe_s);

    document.getElementById('ui-length').innerText = snake.length;
    document.getElementById('ui-growth').innerText = dLdt.toFixed(3);
}

function drawGame() {
    // Render Papan
    ctx.fillStyle = "#111526"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Grid Papan
    ctx.strokeStyle = "rgba(0, 229, 255, 0.15)";
    for(let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Render Apel 
    ctx.fillStyle = "#ff00c8";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff00c8"; 
    ctx.beginPath();
    ctx.arc(apple.x * gridSize + gridSize/2, apple.y * gridSize + gridSize/2, gridSize/2.5, 0, Math.PI * 2);
    ctx.fill();

    // Render Ular 
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? "#ffffff" : "#00e5ff"; 
        ctx.shadowBlur = index === 0 ? 15 : 8; 
        ctx.shadowColor = "#00e5ff";
        ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });

    ctx.shadowBlur = 0; 
}