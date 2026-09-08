# 🚀 Быстрый старт для kinopoisklilbot

## ⚡ Автоматическая установка (Windows)

1. **Запустите скрипт установки:**
   ```
   Откройте PowerShell в папке проекта и выполните:
   .\setup.ps1
   ```

2. **Запустите приложение:**
   ```
   .\start.ps1
   ```

3. **Откройте браузер:**
   - Фронтенд: http://localhost:5173
   - Бэкенд: http://localhost:3000

---

## 📋 Ручная установка

### Шаг 1: Установка Node.js

Скачайте и установите с https://nodejs.org/ (версия 18+)

### Шаг 2: Установка PostgreSQL

Скачайте с https://www.postgresql.org/download/windows/

Или используйте Docker:
```bash
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=kino_app \
  -p 5432:5432 \
  postgres:15-alpine
```

### Шаг 3: Настройка базы данных

```bash
# Создайте базу данных
createdb kino_app

# Импортируйте схему
psql -d kino_app -f database/schema.sql
```

### Шаг 4: Установка зависимостей

```bash
# Бэкенд
cd backend
npm install

# Фронтенд
cd frontend
npm install
```

### Шаг 5: Запуск

**Терминал 1 - Бэкенд:**
```bash
cd backend
npm run dev
```

**Терминал 2 - Фронтенд:**
```bash
cd frontend
npm run dev
```

**Терминал 3 - Бот (опционально):**
```bash
cd backend
npm run bot
```

---

## 🔧 Настройка Telegram бота

### 1. Откройте @BotFather в Telegram

### 2. Настройте Menu Button:
```
/mybots → kinopoisklilbot → Bot Settings → Menu Button → Configure
```

Укажите URL: `http://localhost:5173` (или ваш URL после деплоя)

### 3. Настройте Web App:
```
/mybots → kinopoisklilbot → Bot Settings → Web App
```

---

## 🌐 Деплой на продакшен

### Вариант 1: Vercel + Railway

**Фронтенд (Vercel):**
1. Запушьте на GitHub
2. Подключите в https://vercel.com
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Environment Variable: `VITE_API_URL=https://your-backend.railway.app/api`

**Бэкенд (Railway):**
1. Подключите репозиторий в https://railway.app
2. Root Directory: `backend`
3. Добавьте переменные из `.env`
4. Railway создаст PostgreSQL автоматически

### Вариант 2: Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs -f
```

### Вариант 3: VPS (Ubuntu)

```bash
# Установка зависимостей
sudo apt update
sudo apt install -y nodejs npm postgresql nginx

# Клонирование репозитория
git clone <your-repo>
cd kino-telegram-app

# Установка и запуск
./setup.ps1  # или вручную как выше

# Настройка Nginx
sudo nano /etc/nginx/sites-available/kinopoisklilbot

# Конфигурация:
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}

# Применение
sudo ln -s /etc/nginx/sites-available/kinopoisklilbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# HTTPS (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📡 API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/search` | Поиск фильмов |
| POST | `/api/ratings` | Добавить оценку |
| GET | `/api/users/:id/profile` | Профиль пользователя |
| GET | `/api/recommendations/:id` | Рекомендации |
| POST | `/api/history` | В историю |
| GET | `/api/history/:id` | История |

---

## 🐛 Отладка

### Проверка бэкенда
```bash
curl http://localhost:3000/api/health
```

### Проверка базы данных
```bash
psql -d kino_app -c "SELECT * FROM users LIMIT 5;"
```

### Логи
```bash
# Бэкенд логи
Get-Content backend\logs\app.log -Tail 50

# Docker логи
docker-compose logs -f backend
```

---

## 📱 Использование в Telegram

1. Откройте @kinopoisklilbot
2. Нажмите /start
3. Нажмите кнопку "🎬 Открыть KinoTrack"
4. Пользуйтесь приложением!

---

## 🔑 Ваши текущие настройки

| Параметр | Значение |
|----------|----------|
| Бот | @kinopoisklilbot |
| API Key | KR02M90-3EQMXMS-KKH4CS9-MVJYDYP |
| Бэкенд | http://localhost:3000 |
| Фронтенд | http://localhost:5173 |
| БД | PostgreSQL:5432/kino_app |

---

## ⚠️ Важно!

1. **Не коммитьте .env файлы в Git** (они в .gitignore)
2. **Смените пароли** для продакшена
3. **Используйте HTTPS** для продакшена
4. **Настройте CORS** для вашего домена

---

## 📞 Поддержка

При проблемах:
1. Проверьте логи (`docker-compose logs -f`)
2. Убедитесь что PostgreSQL запущен
3. Проверьте переменные в `.env`
