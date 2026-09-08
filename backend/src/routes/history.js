// ============================================
// Маршруты для истории просмотров
// ============================================

const express = require('express');
const router = express.Router();
const { db, parseJsonArray } = require('../db');
const kinopoiskService = require('../services/kinopoisk');
const filmService = require('../services/filmService');

// Добавление в историю
router.post('/', async (req, res) => {
    try {
        const { telegram_id, kinopoisk_id, status, rating, review } = req.body;

        const validStatuses = ['watching', 'watchlist', 'dropped', 'rated'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Неверный статус' });
        }

        if (!telegram_id || !kinopoisk_id) {
            return res.status(400).json({ error: 'telegram_id и kinopoisk_id обязательны' });
        }

        // Находим или создаём пользователя
        let user = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(telegram_id);
        if (!user) {
            const result = db.prepare('INSERT INTO users (telegram_id) VALUES (?)').run(telegram_id);
            user = { id: result.lastInsertRowid };
        }

        // Находим фильм (или загружаем из API)
        let film = filmService.getFilmByKinopoiskId(kinopoisk_id);
        if (!film) {
            try {
                const apiFilm = await kinopoiskService.getFilmById(kinopoisk_id);
                film = filmService.cacheFilm(apiFilm);
            } catch (e) {
                return res.status(404).json({ error: 'Фильм не найден' });
            }
        }

        if (status === 'rated' && !rating) {
            return res.status(400).json({ error: 'Для статуса rated нужна оценка' });
        }

        // Обновляем или создаём запись
        const existing = db.prepare('SELECT id FROM user_ratings WHERE user_id = ? AND film_id = ?').get(user.id, film.id);

        if (existing) {
            db.prepare(`UPDATE user_ratings SET status=?, rating=COALESCE(?, rating), review=COALESCE(?, review), updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(
                status || 'watchlist', rating || null, review || null, existing.id
            );
        } else {
            db.prepare(`INSERT INTO user_ratings (user_id, film_id, rating, review, status) VALUES (?, ?, ?, ?, ?)`).run(
                user.id, film.id, rating || null, review || null, status || 'watchlist'
            );
        }

        res.json({ success: true, message: 'Добавлено в историю' });
    } catch (error) {
        console.error('History error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Получение истории
router.get('/:telegramId', (req, res) => {
    try {
        const user = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(req.params.telegramId);
        if (!user) return res.json({ success: true, data: { watching: [], watchlist: [], dropped: [], rated: [] }, total: 0 });

        const { status } = req.query;

        let query = `
            SELECT ur.id, ur.rating, ur.review, ur.status, ur.created_at,
                   f.id as film_id, f.kinopoisk_id, f.name_ru, f.name_original,
                   f.year, f.poster_url, f.rating_kp, f.genres, f.duration
            FROM user_ratings ur
            JOIN films f ON ur.film_id = f.id
            WHERE ur.user_id = ?
        `;
        const params = [user.id];

        if (status) {
            query += ' AND ur.status = ?';
            params.push(status);
        }

        query += ' ORDER BY ur.created_at DESC';

        const rows = db.prepare(query).all(...params);

        // Форматируем и группируем
        const grouped = { watching: [], watchlist: [], dropped: [], rated: [] };
        rows.forEach(row => {
            const formatted = { ...row, genres: parseJsonArray(row.genres) };
            if (grouped[row.status]) {
                grouped[row.status].push(formatted);
            }
        });

        res.json({ success: true, data: grouped, total: rows.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновление статуса
router.put('/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['watching', 'watchlist', 'dropped', 'rated'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Неверный статус' });
        }

        db.prepare('UPDATE user_ratings SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, req.params.id);
        res.json({ success: true, message: 'Статус обновлён' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удаление из истории
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM user_ratings WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Удалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
