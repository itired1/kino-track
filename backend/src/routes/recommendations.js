// ============================================
// Маршруты для рекомендаций
// ============================================

const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const filmService = require('../services/filmService');

// Персональные рекомендации
router.get('/:telegramId', (req, res) => {
    try {
        const user = userService.getUserByTelegramId(req.params.telegramId);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        // Топ жанров пользователя
        const topGenres = userService.getTopGenres(user.id, 5);
        const genreNames = topGenres.map(g => g.genre);

        // Фильмы, которые не оценивал
        let unratedFilms = filmService.getUnratedFilms(user.id, genreNames, 20);

        // Если мало — добавляем просто популярные
        if (unratedFilms.length < 5) {
            const moreFilms = filmService.getUnratedFilms(user.id, [], 20);
            const existingIds = new Set(unratedFilms.map(f => f.id));
            moreFilms.forEach(f => {
                if (!existingIds.has(f.id)) unratedFilms.push(f);
            });
        }

        // Топ 5 по рейтингу
        const recommendations = unratedFilms
            .sort((a, b) => (b.rating_kp || 0) - (a.rating_kp || 0))
            .slice(0, 5)
            .map(film => ({
                ...film,
                recommendation_reason: genreNames.length > 0
                    ? `Рекомендуем, потому что вам нравятся: ${genreNames.slice(0, 3).join(', ')}`
                    : 'Высокорейтинговый фильм'
            }));

        res.json({
            success: true,
            data: recommendations,
            meta: { based_on_genres: genreNames, total_available: unratedFilms.length }
        });
    } catch (error) {
        console.error('Recommendations error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
