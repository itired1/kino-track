// ============================================
// Маршруты для рецензий к фильмам
// ============================================

const express = require('express');
const router = express.Router();
const userService = require('../services/userService');

// Получение рецензий на фильм (по kinopoisk_id или внутреннему id фильма)
router.get('/film/:filmId', (req, res) => {
    try {
        const { db, parseJsonArray } = require('../db');

        // Ищем фильм: сначала по внутреннему id, потом по kinopoisk_id
        let film = db.prepare('SELECT * FROM films WHERE id = ? OR kinopoisk_id = ?').get(req.params.filmId, req.params.filmId);
        if (!film) return res.json({ success: true, data: [] });

        const reviews = db.prepare(`
            SELECT fr.id, fr.user_id, fr.rating, fr.text, fr.is_spoiler, fr.created_at,
                   u.telegram_id, u.username, u.first_name, u.last_name
            FROM film_reviews fr
            JOIN users u ON fr.user_id = u.id
            WHERE fr.film_id = ?
            ORDER BY fr.created_at DESC
        `).all(film.id);

        res.json({ success: true, data: reviews.map(r => ({ ...r, is_spoiler: !!r.is_spoiler })) });
    } catch (error) {
        console.error('Reviews list error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Создание рецензии
router.post('/', (req, res) => {
    try {
        const { db } = require('../db');
        const { telegram_id, film_id, rating, text, is_spoiler } = req.body;

        if (!telegram_id || !film_id) {
            return res.status(400).json({ error: 'telegram_id и film_id обязательны' });
        }
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Рецензия не может быть пустой' });
        }

        const user = userService.getUserByTelegramId(telegram_id);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        // Находим фильм (внутренний id или kinopoisk_id)
        let film = db.prepare('SELECT * FROM films WHERE id = ? OR kinopoisk_id = ?').get(film_id, film_id);
        if (!film) return res.status(404).json({ error: 'Фильм не найден' });

        const spoiler = is_spoiler ? 1 : 0;
        db.prepare(`
            INSERT INTO film_reviews (user_id, film_id, rating, text, is_spoiler)
            VALUES (?, ?, ?, ?, ?)
        `).run(user.id, film.id, rating || null, text.trim(), spoiler);

        // Если пользователь ставил оценку — обновляем в user_ratings
        if (rating) {
            const existingRating = db.prepare('SELECT id FROM user_ratings WHERE user_id = ? AND film_id = ?').get(user.id, film.id);
            if (existingRating) {
                db.prepare(`UPDATE user_ratings SET rating=?, review=COALESCE(?, review), updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(
                    rating, text.trim(), existingRating.id
                );
            }
        }

        res.json({ success: true, message: 'Рецензия добавлена' });
    } catch (error) {
        console.error('Review create error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Удаление рецензии
router.delete('/:id', (req, res) => {
    try {
        const { db } = require('../db');
        db.prepare('DELETE FROM film_reviews WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Рецензия удалена' });
    } catch (error) {
        console.error('Review delete error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Рецензии конкретного пользователя
router.get('/user/:telegramId', (req, res) => {
    try {
        const { db } = require('../db');
        const user = userService.getUserByTelegramId(req.params.telegramId);
        if (!user) return res.json({ success: true, data: [] });

        const reviews = db.prepare(`
            SELECT fr.id, fr.user_id, fr.rating, fr.text, fr.is_spoiler, fr.created_at,
                   f.id AS film_id, f.kinopoisk_id, f.name_ru, f.name_original, f.year, f.poster_url
            FROM film_reviews fr
            JOIN films f ON fr.film_id = f.id
            WHERE fr.user_id = ?
            ORDER BY fr.created_at DESC
        `).all(user.id);

        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('User reviews error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;