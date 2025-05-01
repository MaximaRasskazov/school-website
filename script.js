// Пример данных для проверки
const validUsername = "student";
const validPassword = "password123";

// Получаем элементы формы и сообщения
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error');
const welcomeMessage = document.getElementById('welcomeMessage');

// Обработчик отправки формы
loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Отменяем стандартное поведение формы

    // Получаем значения логина и пароля
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Проверяем логин и пароль
    if (username === validUsername && password === validPassword) {
        // Если данные правильные, показываем приветственное сообщение
        welcomeMessage.textContent = `Привет, ${username}! Добро пожаловать на сайт.`;
        welcomeMessage.style.display = 'block'; // Показываем сообщение
        errorMessage.style.display = 'none'; // Скрываем сообщение об ошибке
    } else {
        // Если данные неверные, показываем ошибку
        errorMessage.style.display = 'block'; // Показываем ошибку
        welcomeMessage.style.display = 'none'; // Скрываем приветственное сообщение
    }
});
