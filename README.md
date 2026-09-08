# 🎬 KinoTrack - Telegram Mini App

Приложение для отслеживания и оценки фильмов с интеграцией Telegram.

**Бот:** [@kinopoisklilbot](https://t.me/kinopoisklilbot)

## 📋 Структура проекта

```
.
├── database/           # SQL-скрипты для базы данных
├── backend/            # Серверная часть (Node.js + Express)
│   └── src/
│       ├── routes/     # API маршруты
│       ├── services/   # Бизнес-логика
│       └── db/         # Подключение к БД
└── frontend/           # Клиентская часть (React + Vite)
    └── src/
        ├── pages/      # Страницы приложения
        └── components/ # React-компоненты
```

## 🚀 Быстрый старт

### 1. Требования

- Node.js 18+
- PostgreSQL 14+
- API ключ от [Kinopoisk.dev](https://kinopoisk.dev/)
- Telegram Bot Token (от [@BotFather](https://t.me/BotFather))

### 2. Настройка базы данных

```bash
# Создайте базу данных
createdb kino_app

# Импортируйте схему
psql -d kino_app -f database/schema.sql
```

### 3. Настройка бэкенда

```bash
cd backend

# Установите зависимости
npm install

# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env, указав:
# - DATABASE_URL или параметры подключения к PostgreSQL
# - KINOPOISK_API_KEY
# - TELEGRAM_BOT_TOKEN
```

### 4. Запуск бэкенда

```bash
# Режим разработки
npm run dev

# Продакшен режим
npm start
```

Сервер запустится на `http://localhost:3000`

### 5. Настройка фронтенда

```bash
cd frontend

# Установите зависимости
npm install

# Создайте .env файл (опционально)
echo "VITE_API_URL=http://localhost:3000/api" > .env

# Запустите сервер разработки
npm run dev
```

Фронтенд запустится на `http://localhost:5173`

### 6. Сборка для продакшена

```bash
cd frontend
npm run build
```

Собранные файлы будут в папке `dist/`

## 🔧 Настройка Telegram Mini App

### 1. Создайте бота

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Сохраните полученный токен

### 2. Настройте Mini App

1. В BotFather отправьте `/newapp`
2. Выберите вашего бота
3. Введите название и описание
4. Укажите URL веб-приложения (ваш фронтенд)
5. Получите ссылку на Mini App

### 3. Добавьте кнопку меню

1. В BotFather отправьте `/mybots`
2. Выберите бота → Bot Settings → Menu Button
3. Укажите URL Mini App

## 🌐 Деплой

### Вариант 1: Vercel (фронтенд) + Railway (бэкенд)

#### Фронтенд на Vercel

1. Запушьте код на GitHub
2. Подключите репозиторий в [Vercel](https://vercel.com)
3. Укажите настройки сборки:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Добавьте переменную окружения `VITE_API_URL`

#### Бэкенд на Railway

1. Создайте новый проект на [Railway](https://railway.app)
2. Подключите репозиторий
3. Укажите Root Directory: `backend`
4. Добавьте переменные окружения из `.env`
5. Railway автоматически создаст PostgreSQL

### Вариант 2: Docker

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Вариант 3: VPS (Ubuntu)

```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Установка PM2 для управления процессами
sudo npm install -g pm2

# Клонирование репозитория
git clone <your-repo>
cd kino-telegram-app

# Настройка бэкенда
cd backend
npm install
cp .env.example .env
# Редактируем .env

# Запуск бэкенда через PM2
pm2 start src/index.js --name kino-backend

# Настройка фронтенда
cd ../frontend
npm install
npm run build

# Настройка Nginx
sudo nano /etc/nginx/sites-available/kino
```

Конфигурация Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Применяем конфигурацию
sudo ln -s /etc/nginx/sites-available/kino /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Настройка HTTPS через Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📡 API Endpoints

### Поиск фильмов

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/search` | Поиск по названию |
| GET | `/api/search/:id` | Получить фильм по ID |
| GET | `/api/search/kinopoisk/:kpId` | Получить фильм по Kinopoisk ID |

### Оценки

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/ratings` | Добавить оценку |
| GET | `/api/ratings/:telegramId` | Получить все оценки |
| DELETE | `/api/ratings/:id` | Удалить оценку |

### Пользователь

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/users/init` | Инициализация пользователя |
| GET | `/api/users/:telegramId/profile` | Полный профиль |
| GET | `/api/users/:telegramId/stats` | Статистика |
| GET | `/api/users/:telegramId/favorites` | Любимые жанры/режиссёры |

### Рекомендации

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/recommendations/:telegramId` | Персональные рекомендации |
| GET | `/api/recommendations/:telegramId/similar/:filmId` | Похожие фильмы |

### История

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/history` | Добавить в историю |
| GET | `/api/history/:telegramId` | Получить историю |
| PUT | `/api/history/:id/status` | Обновить статус |
| DELETE | `/api/history/:id` | Удалить из истории |

## 🔐 Безопасность

1. **CORS**: Настройте `FRONTEND_URL` в `.env` для ограничения доменов
2. **Helmet**: Используется для защиты HTTP-заголовков
3. **Валидация**: Все входные данные валидируются
4. **SQL-инъекции**: Используются параметризированные запросы

## 🎨 Дополнительные функции

### Экспорт статистики

Для экспорта статистики в изображение можно использовать библиотеку `html-to-image`:

```bash
npm install html-to-image
```

### Уведомления о новых фильмах

Создайте cron-задачу для проверки новых фильмов:

```javascript
// backend/src/jobs/newFilmsNotification.js
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

cron.schedule('0 10 * * *', async () => {
  // Ежедневно в 10:00 проверять новые фильмы
  // любимых режиссёров пользователей
});
```

## 🐛 Отладка

### Логи бэкенда

```bash
# Просмотр логов PM2
pm2 logs kino-backend

# Логи в реальном времени
tail -f backend/logs/app.log
```

### Логи фронтенда

Откройте DevTools в браузере → Console

### Тестирование API

```bash
# Поиск фильмов
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Матрица"}'

# Добавление оценки
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": 123456789, "kinopoisk_id": 123, "rating": 8}'
```

## 📝 Лицензия

MIT

## 👥 Контакты

Для вопросов и предложений создавайте Issues на GitHub.
