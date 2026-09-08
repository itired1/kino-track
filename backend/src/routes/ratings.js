// ============================================
// Маршруты для оценок
// ============================================

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const filmService = require('../services/filmService');

// Добавление оценки
router.post('/', (req, res) => {
    try {
        const { telegram_id, kinopoisk_id, rating, review, status } = req.body;

        if (!telegram_id || !kinopoisk_id || !rating) {
            return res.status(400).json({ error: 'telegram_id, kinopoisk_id, rating обязательны' });
        }

        if (rating < 1 || rating > 10) {
            return res.status(400).json({ error: 'Оценка от 1 до 10' });
        }

        // Находим пользователя
        let user = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(telegram_id);
        if (!user) {
            const result = db.prepare('INSERT INTO users (telegram_id) VALUES (?)').run(telegram_id);
            user = { id: result.lastInsertRowid };
        }

        // Находим фильм
        const film = filmService.getFilmByKinopoiskId(kinopoisk_id);
        if (!film) {
            return res.status(404).json({ error: 'Фильм не найден. Сначала выполните поиск.' });
        }

        // Добавляем или обновляем оценку
        const existing = db.prepare('SELECT id FROM user_ratings WHERE user_id = ? AND film_id = ?').get(user.id, film.id);

        if (existing) {
            db.prepare(`UPDATE user_ratings SET rating=?, review=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(
                rating, review || null, status || 'rated', existing.id
            );
        } else {
            db.prepare(`INSERT INTO user_ratings (user_id, film_id, rating, review, status) VALUES (?, ?, ?, ?, ?)`).run(
                user.id, film.id, rating, review || null, status || 'rated'
            );
        }

        res.json({ success: true, message: 'Оценка сохранена' });
    } catch (error) {
        console.error('Rating error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Получение всех оценок пользователя
router.get('/:telegramId', (req, res) => {
    try {
        const user = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(req.params.telegramId);
        if (!user) return res.json({ success: true, data: [] });

        const ratings = db.prepare(`
            SELECT ur.id, ur.rating, ur.review, ur.status, ur.created_at,
                   f.kinopoisk_id, f.name_ru, f.name_original, f.year,
                   f.poster_url, f.rating_kp, f.genres
            FROM user_ratings ur
            JOIN films f ON ur.film_id = f.id
            WHERE ur.user_id = ?
            ORDER BY ur.created_at DESC
        `).all(user.id);

        res.json({ success: true, data: ratings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удаление оценки
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM user_ratings WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Оценка удалена' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
