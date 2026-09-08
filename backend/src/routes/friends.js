// ============================================
// Маршруты для друзей
// ============================================

const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { db, parseJsonArray } = require('../db');

// Список друзей пользователя
router.get('/:telegramId', (req, res) => {
    try {
        const user = userService.getUserByTelegramId(req.params.telegramId);
        if (!user) return res.json({ success: true, data: [] });

        const friends = userService.getFriends(user.id);
        res.json({ success: true, data: friends });
    } catch (error) {
        console.error('Friends list error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Поиск пользователей для добавления в друзья
router.get('/:telegramId/search', (req, res) => {
    try {
        const user = userService.getUserByTelegramId(req.params.telegramId);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        const { q } = req.query;
        if (!q) return res.json({ success: true, data: [] });

        const results = userService.searchUsers(q, user.id);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Friend search error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Добавление друга
router.post('/:telegramId', (req, res) => {
    try {
        const user = userService.getUserByTelegramId(req.params.telegramId);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        const { friend_telegram_id } = req.body;
        const result = userService.addFriend(user.id, friend_telegram_id);

        if (result.error) return res.status(400).json({ error: result.error });
        res.json(result);
    } catch (error) {
        console.error('Friend add error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Удаление друга
router.delete('/:telegramId/:friendTelegramId', (req, res) => {
    try {
        const user = userService.getUserByTelegramId(req.params.telegramId);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        const result = userService.removeFriend(user.id, req.params.friendTelegramId);
        if (result.error) return res.status(400).json({ error: result.error });
        res.json(result);
    } catch (error) {
        console.error('Friend remove error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Профиль друга: его оценки, статистика, недавняя активность
router.get('/:telegramId/:friendTelegramId/profile', (req, res) => {
    try {
        const friend = userService.getUserByTelegramId(req.params.friendTelegramId);
        if (!friend) return res.status(404).json({ error: 'Пользователь не найден' });

        const stats = userService.getUserStats(friend.id);
        const ratingDistribution = userService.getRatingDistribution(friend.id);
        const recentRatings = userService.getRecentRatings(friend.id, 20);
        const favorites = {
            genres: userService.getTopGenres(friend.id),
            directors: userService.getTopDirectors(friend.id),
            actors: userService.getTopActors(friend.id)
        };

        res.json({
            success: true,
            data: {
                user: {
                    id: friend.id,
                    telegram_id: friend.telegram_id,
                    username: friend.username,
                    first_name: friend.first_name,
                    last_name: friend.last_name
                },
                stats,
                ratingDistribution,
                recentRatings,
                favorites
            }
        });
    } catch (error) {
        console.error('Friend profile error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;