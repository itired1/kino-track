// ============================================
// Главный файл сервера Express + SQLite
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const { startBot } = require('./bot');
const { restoreDbIfMissing, startBackupLoop } = require('./dbBackup');
const PORT = process.env.PORT || 3000;

// Восстановление БД из Git-бэкапа (если настроено и файла нет) ДО открытия
restoreDbIfMissing();

// Подключение к БД (SQLite создаёт таблицы автоматически)
const db = require('./db');
console.log('📦 База данных: SQLite (kino.db)');

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// Маршруты
app.use('/api/search', require('./routes/search'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/history', require('./routes/history'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/collections', require('./routes/collections'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: 'sqlite', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Ошибки
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});

// Периодический Git-бэкап БД
startBackupLoop(db);

// Запуск Telegram-бота (приветствие, кнопки)
startBot();
