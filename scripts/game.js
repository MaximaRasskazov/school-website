const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startGame');
const stopBtn = document.getElementById('stopGame');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const gameMsg = document.getElementById('gameMsg');
const gameOverMessage = document.getElementById('gameOverMessage');

// Переменные игры
let gameRunning = false;
let animationId;
let score = 0;

// Полосы движения (3 полосы)
const lanes = [50, 150, 250];
let currentLane = 1; // Начинаем со средней полосы
const playerWidth = 40;
const playerHeight = 60;

// Препятствия
let obstacles = [];
let obstacleSpeed = 2;
let lastObstacleY = -100; // Начальное значение для первого препятствия
const minObstacleGap = 120; // Минимальное расстояние между препятствиями (2x высота машины)

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
        const color = `hsl(${Math.random() * 60 + 0}, 70%, 50%)`; // Красные/оранжевые оттенки
        
        obstacles.push({
            x: x,
            y: -height,
            width: width,
            height: height,
            lane: lane,
            color: color
        });
    });
    
    lastObstacleY = -60; // Сбрасываем для следующего препятствия
}

function updateObstacles() {
    // Двигаем препятствия
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += obstacleSpeed;
        
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
        lastObstacleY += obstacleSpeed;
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
            
            return true; // Столкновение
        }
    }
    
    return false; // Столкновений нет
}

function gameLoop() {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка дороги
    drawRoad();
    
    // Обновление и отрисовка препятствий
    updateObstacles();
    drawObstacles();
    
    // Отрисовка игрока
    drawPlayer();
    
    // Проверка столкновений
    if (checkCollisions()) {
        stopGame();
        gameOverMessage.textContent = `Авария! Счёт: ${score}`;
        return;
    }
    
    // Увеличиваем сложность со временем
    if (obstacleSpeed < 5 && score % 5 === 0) {
        obstacleSpeed += 0.01;
    }
    
    // Продолжаем игровой цикл
    if (gameRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        score = 0;
        obstacles = [];
        lastObstacleY = -100;
        obstacleSpeed = 2;
        gameMsg.textContent = 'Игра началась! Управляйте машиной.';
        gameOverMessage.style.display = 'none';
        
        gameLoop();
    }
}

function stopGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    gameOverMessage.style.display = 'block';
}

function moveLeft() {
    if (gameRunning) {
        if (currentLane > 0) {
            currentLane--;
        } else {
            // Если на первой полосе (0), перемещаемся на последнюю (2)
            currentLane = 2;
        }
    }
}

function moveRight() {
    if (gameRunning) {
        if (currentLane < 2) {
            currentLane++;
        } else {
            // Если на последней полосе (2), перемещаемся на первую (0)
            currentLane = 0;
        }
    }
}

// Обработчики событий
startBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', stopGame);
leftBtn.addEventListener('click', moveLeft);
rightBtn.addEventListener('click', moveRight);

// Обработка клавиатуры
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveLeft();
    if (e.key === 'ArrowRight') moveRight();
    if (e.key === ' ') { // Пробел для старта/остановки
        if (gameRunning) {
            stopGame();
        } else {
            startGame();
        }
    }
});

// Инициализация игры
drawRoad();
drawPlayer();
gameMsg.textContent = 'Нажмите "Старт" чтобы начать';