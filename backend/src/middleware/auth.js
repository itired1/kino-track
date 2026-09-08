// ============================================
// Middleware аутентификации через Telegram
// Валидация initData по секретному ключу бота
// ============================================

const crypto = require('crypto');

// Получение секретного ключа из токена бота
function getSecretKey() {
    const token = process.env.TELEGRAM_BOT_TOKEN || '8623644777:AAHi2vnGjG0a8rU6HJr2BSiwllb86qsA2CU';
    // HMAC-SHA256 от токена с ключом "WebAppData"
    return crypto.createHmac('sha256', 'WebAppData').update(token).digest();
}

// Валидация initData строки из Telegram
function validateInitData(initData) {
    if (!initData) return null;

    try {
        // Разбираем строку в объект
        const data = new URLSearchParams(initData);
        const hash = data.get('hash');
        data.delete('hash');

        // Сортируем ключи
        const sorted = [...data.entries()]
            .map(([key, value]) => `${key}=${value}`)
            .sort()
            .join('\n');

        // Вычисляем HMAC
        const secretKey = getSecretKey();
        const checkHash = crypto
            .createHmac('sha256', secretKey)
            .update(sorted)
            .digest('hex');

        if (checkHash !== hash) {
            console.warn('⚠ initData не прошла валидацию');
            return null;
        }

        // Проверяем срок давности (24 часа)
        const authDate = parseInt(data.get('auth_date') || '0', 10);
        const now = Math.floor(Date.now() / 1000);
        if (now - authDate > 24 * 60 * 60) {
            console.warn('⚠ initData устарела');
            return null;
        }

        // Возвращаем данные пользователя
        const userStr = data.get('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Auth parse error:', error.message);
        return null;
    }
}

// Middleware: проверяем заголовок Authorization
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const initData = authHeader.startsWith('Telegram ') ? authHeader.slice(9) : null;

    const user = validateInitData(initData);
    if (user) {
        req.telegramUser = user;
        req.isAuthenticated = true;
    } else {
        req.isAuthenticated = false;
        req.telegramUser = null;
    }
    next();
}

module.exports = { validateInitData, authMiddleware };
