const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startGame');
const stopBtn = document.getElementById('stopGame');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const gameMsg = document.getElementById('gameMsg');
const gameOverMessage = document.getElementById('gameOverMessage');

// Настройки размера холста
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 500;

// Установка размера холста
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Переменные игры
let gameRunning = false;
let gamePaused = false;
let animationId;
let score = 0;
let lastUpdateTime = 0;

// Полосы движения (3 полосы)
const lanes = [50, 150, 250];
let currentLane = 1;
const playerWidth = 40;
const playerHeight = 60;

// Препятствия
let obstacles = [];
let obstacleSpeed = 1.1;
let lastObstacleY = -100;
const minObstacleGap = 120;

// Цвета из палитры
const colors = {
    dark: '#062456',
    accent1: '#88b990',
    accent2: '#328275',
    road: '#1d3867',
    player: '#e3e7ee',
    obstacle: '#ff6b6b',
    roadMarking: '#4a6188'
};

function drawRoad() {
    // Дорога
    ctx.fillStyle = colors.road;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Разметка полос
    ctx.strokeStyle = '#7a8ca9';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    
    // Вертикальные линии разделения полос
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(100, canvas.height);
    ctx.moveTo(200, 0);
    ctx.lineTo(200, canvas.height);
    ctx.stroke();
    
    // Горизонтальные пунктирные линии
    ctx.beginPath();
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.moveTo(canvas.width / 2 - 5, y);
        ctx.lineTo(canvas.width / 2 + 5, y);
    }
    ctx.stroke();
    
    ctx.setLineDash([]);
}

function drawPlayer() {
    const x = lanes[currentLane] - playerWidth / 2;
    const y = canvas.height - playerHeight - 10;
    
    // Кузов машины
    ctx.fillStyle = colors.player;
    ctx.fillRect(x, y, playerWidth, playerHeight);
    
    // Окна
    ctx.fillStyle = '#93a2ba';
    ctx.fillRect(x + 5, y + 5, playerWidth - 10, 15);
    ctx.fillRect(x + 5, y + 25, playerWidth - 10, 10);
    
    // Колёса
    ctx.fillStyle = '#334d77';
    ctx.fillRect(x - 3, y + 10, 3, 15);
    ctx.fillRect(x - 3, y + 35, 3, 15);
    ctx.fillRect(x + playerWidth, y + 10, 3, 15);
    ctx.fillRect(x + playerWidth, y + 35, 3, 15);
    
    // Фары
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(x + 5, y + playerHeight - 5, 8, 3);
    ctx.fillRect(x + playerWidth - 13, y + playerHeight - 5, 8, 3);
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        // Кузов препятствия
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Детали препятствия
        ctx.fillStyle = '#ff8a8a';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 10);
        ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 15, obstacle.width - 10, 10);
        
        // Колёса
        ctx.fillStyle = '#334d77';
        ctx.fillRect(obstacle.x - 3, obstacle.y + 10, 3, 15);
        ctx.fillRect(obstacle.x - 3, obstacle.y + obstacle.height - 25, 3, 15);
        ctx.fillRect(obstacle.x + obstacle.width, obstacle.y + 10, 3, 15);
        ctx.fillRect(obstacle.x + obstacle.width, obstacle.y + obstacle.height - 25, 3, 15);
    });
}

function createObstacle() {
    // Гарантируем, что будет хотя бы одна свободная полоса
    const availableLanes = [0, 1, 2];
    
    // Определяем сколько препятствий создать (1 или 2, но не 3)
    const numObstacles = Math.random() < 0.7 ? 1 : 2;
    
    // Выбираем случайные полосы для препятствий
    const obstacleLanes = [];
    for (let i = 0; i < numObstacles; i++) {
        const randomIndex = Math.floor(Math.random() * availableLanes.length);
        obstacleLanes.push(availableLanes[randomIndex]);
        availableLanes.splice(randomIndex, 1);
    }
    
    // Создаем препятствия на выбранных полосах
    obstacleLanes.forEach(lane => {
        const width = 40;
        const height = 60;
        const x = lanes[lane] - width / 2;
        const color = `hsl(${Math.random() * 60 + 0}, 70%, 50%)`;
        
        obstacles.push({
            x: x,
            y: -height,
            width: width,
            height: height,
            lane: lane,
            color: color
        });
    });
    
    lastObstacleY = -60;
}

function updateObstacles(deltaTime) {
    // Двигаем препятствия только если игра не на паузе
    if (!gamePaused) {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].y += obstacleSpeed * (deltaTime / 16);
            
            // Удаляем препятствия, которые уехали за экран
            if (obstacles[i].y > canvas.height) {
                obstacles.splice(i, 1);
                score++;
                gameMsg.textContent = `Счёт: ${score}`;
            }
        }
        
        // Создаем новые препятствия с правильным интервалом
        if (obstacles.length === 0 || (lastObstacleY + minObstacleGap) < 0) {
            createObstacle();
        } else {
            lastObstacleY += obstacleSpeed * (deltaTime / 16);
        }
    }
}

function checkCollisions() {
    const playerX = lanes[currentLane] - playerWidth / 2;
    const playerY = canvas.height - playerHeight - 10;
    
    for (let obstacle of obstacles) {
        // Простая проверка столкновения по прямоугольникам
        if (playerX < obstacle.x + obstacle.width &&
            playerX + playerWidth > obstacle.x &&
            playerY < obstacle.y + obstacle.height &&
            playerY + playerHeight > obstacle.y) {
            
            return true;
        }
    }
    
    return false;
}

function gameLoop(timestamp) {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Вычисляем время, прошедшее с последнего кадра
    const deltaTime = timestamp - lastUpdateTime;
    lastUpdateTime = timestamp;
    
    // Отрисовка дороги
    drawRoad();
    
    // Обновление и отрисовка препятствий
    updateObstacles(deltaTime);
    drawObstacles();
    
    // Отрисовка игрока
    drawPlayer();
    
    // Проверка столкновений (только если игра не на паузе)
    if (!gamePaused && checkCollisions()) {
        gameOver();
        return;
    }
    
    // Увеличиваем сложность со временем (только если игра не на паузе)
    // ИЗМЕНИТЕ ЭТИ ЗНАЧЕНИЯ ДЛЯ РЕГУЛИРОВКИ СКОРОСТИ:
    if (!gamePaused && obstacleSpeed < 3 && score % 3 === 0) {
        obstacleSpeed += 0.3; // Шаг увеличения скорости
    }
    
    // Продолжаем игровой цикл
    if (gameRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        score = 0;
        obstacles = [];
        lastObstacleY = -100;
        obstacleSpeed = 1.1;
        lastUpdateTime = 0;
        gameMsg.textContent = 'Игра началась! Управляйте машиной.';
        gameOverMessage.style.display = 'none';
        
        animationId = requestAnimationFrame(gameLoop);
    } else if (gamePaused) {
        // Если игра была на паузе, снимаем с паузы
        gamePaused = false;
        lastUpdateTime = performance.now();
        gameMsg.textContent = `Продолжаем! Счёт: ${score}`;
    }
}

function pauseGame() {
    if (gameRunning && !gamePaused) {
        gamePaused = true;
        gameMsg.textContent = `Пауза. Счёт: ${score}`;
    } else if (gameRunning && gamePaused) {
        // Если уже на паузе, снимаем с паузы
        gamePaused = false;
        lastUpdateTime = performance.now();
        gameMsg.textContent = `Продолжаем! Счёт: ${score}`;
    }
}

function gameOver() {
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    gameOverMessage.textContent = `Авария! Счёт: ${score}`;
    gameOverMessage.style.display = 'block';
}

function moveLeft() {
    if (gameRunning && !gamePaused) {
        if (currentLane > 0) {
            currentLane--;
        } else {
            currentLane = 2;
        }
    }
}

function moveRight() {
    if (gameRunning && !gamePaused) {
        if (currentLane < 2) {
            currentLane++;
        } else {
            currentLane = 0;
        }
    }
}

// Обработчики событий
startBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', pauseGame);
leftBtn.addEventListener('click', moveLeft);
rightBtn.addEventListener('click', moveRight);

// Обработка клавиатуры
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveLeft();
    if (e.key === 'ArrowRight') moveRight();
    if (e.key === ' ') {
        pauseGame();
    }
});

// Инициализация игры
drawRoad();
drawPlayer();
gameMsg.textContent = 'Нажмите "Старт" чтобы начать';