// ============================================
// Маршруты для пользователей и статистики
// ============================================

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const userService = require('../services/userService');
const { validateInitData } = require('../middleware/auth');

// Вход через Telegram initData (валидированная авторизация)
router.post('/login', (req, res) => {
    try {
        const { initData } = req.body;
        const telegramUser = validateInitData(initData);

        if (!telegramUser) {
            return res.status(401).json({ error: 'Невалидные данные авторизации Telegram' });
        }

        // Создаём/обновляем пользователя
        const user = userService.findOrCreateUser(telegramUser);

        // Отдаём данные пользователя (в реальном проекте — токен сессии)
        res.json({
            success: true,
            data: {
                id: user.id,
                telegram_id: user.telegram_id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                language_code: user.language_code,
                photo_url: telegramUser.photo_url || null,
                is_premium: telegramUser.is_premium || false
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Инициализация пользователя
router.post('/init', (req, res) => {
    try {
        const { telegram_user } = req.body;
        if (!telegram_user || !telegram_user.id) {
            return res.status(400).json({ error: 'telegram_user обязателен' });
        }

        const user = userService.findOrCreateUser(telegram_user);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Полный профиль
router.get('/:telegramId/profile', (req, res) => {
    try {
        const user = userService.getUserByTelegramId(req.params.telegramId);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        const stats = userService.getUserStats(user.id);
        const ratingDistribution = userService.getRatingDistribution(user.id);
        const favorites = {
            genres: userService.getTopGenres(user.id),
            directors: userService.getTopDirectors(user.id),
            actors: userService.getTopActors(user.id)
        };
        const recentRatings = userService.getRecentRatings(user.id, 5);
        const extendedStats = userService.getExtendedStats(user.id);
        const badges = userService.getBadges(user.id);

        res.json({
            success: true,
            data: { user, stats, ratingDistribution, favorites, recentRatings, extendedStats, badges }
        });
    } catch (error) {
        console.error('Profile error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Статистика
router.get('/:telegramId/stats', (req, res) => {
    try {
        const user = userService.getUserByTelegramId(req.params.telegramId);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        const stats = userService.getUserStats(user.id);
        const ratingDistribution = userService.getRatingDistribution(user.id);

        res.json({ success: true, data: { stats, ratingDistribution } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
