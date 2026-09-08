// ============================================
// Маршруты для личных полок (коллекций)
// ============================================

const express = require('express');
const router = express.Router();
const { db, parseJsonArray } = require('../db');
const userService = require('../services/userService');

// Получить полки пользователя (со списком фильмов)
router.get('/:telegramId', (req, res) => {
    try {
        const user = userService.getUserByTelegramId(req.params.telegramId);
        if (!user) return res.json({ success: true, data: [] });

        const collections = db.prepare('SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC').all(user.id);

        const data = collections.map(c => {
            const items = db.prepare(`
                SELECT f.id AS film_id, f.kinopoisk_id, f.name_ru, f.name_original,
                       f.year, f.poster_url, f.rating_kp, f.duration, f.genres
                FROM collection_items ci
                JOIN films f ON ci.film_id = f.id
                WHERE ci.collection_id = ?
                ORDER BY ci.created_at DESC
            `).all(c.id).map(r => ({ ...r, genres: parseJsonArray(r.genres) }));

            return { id: c.id, name: c.name, created_at: c.created_at, films: items, count: items.length };
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Collections list error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Полки конкретного пользователя (для просмотра профиля друга)
router.get('/user/:otherTelegramId', (req, res) => {
    try {
        const user = userService.getUserByTelegramId(req.params.otherTelegramId);
        if (!user) return res.json({ success: true, data: [] });

        const collections = db.prepare('SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
        const data = collections.map(c => {
            const items = db.prepare(`
                SELECT f.id AS film_id, f.kinopoisk_id, f.name_ru, f.name_original,
                       f.year, f.poster_url, f.rating_kp, f.duration, f.genres
                FROM collection_items ci
                JOIN films f ON ci.film_id = f.id
                WHERE ci.collection_id = ?
                ORDER BY ci.created_at DESC
            `).all(c.id).map(r => ({ ...r, genres: parseJsonArray(r.genres) }));

            return { id: c.id, name: c.name, created_at: c.created_at, films: items, count: items.length };
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('User collections error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Создать полку
router.post('/', (req, res) => {
    try {
        const { telegram_id, name } = req.body;
        if (!telegram_id || !name || !name.trim()) {
            return res.status(400).json({ error: 'Название полки обязательно' });
        }

        const user = userService.getUserByTelegramId(telegram_id);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        const result = db.prepare('INSERT INTO collections (user_id, name) VALUES (?, ?)').run(user.id, name.trim());
        res.json({ success: true, id: result.lastInsertRowid, name: name.trim() });
    } catch (error) {
        console.error('Collection create error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Добавить фильм в полку
router.post('/:collectionId/films', (req, res) => {
    try {
        const { film_id } = req.body;
        if (!film_id) return res.status(400).json({ error: 'film_id обязателен' });

        const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.collectionId);
        if (!collection) return res.status(404).json({ error: 'Полка не найдена' });

        let film = db.prepare('SELECT * FROM films WHERE id = ? OR kinopoisk_id = ?').get(film_id, film_id);
        if (!film) return res.status(404).json({ error: 'Фильм не найден' });

        try {
            db.prepare('INSERT INTO collection_items (collection_id, film_id) VALUES (?, ?)').run(collection.id, film.id);
        } catch (e) {
            if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(400).json({ error: 'Фильм уже в этой полке' });
            }
            throw e;
        }

        res.json({ success: true, message: 'Добавлено в полку' });
    } catch (error) {
        console.error('Collection add film error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Удалить фильм из полки
router.delete('/:collectionId/films/:filmId', (req, res) => {
    try {
        db.prepare('DELETE FROM collection_items WHERE collection_id = ? AND film_id = ?').run(
            req.params.collectionId, req.params.filmId
        );
        res.json({ success: true, message: 'Удалено из полки' });
    } catch (error) {
        console.error('Collection remove film error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Удалить полку
router.delete('/:id', (req, res) => {
    try {
        const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
        if (!collection) return res.status(404).json({ error: 'Полка не найдена' });

        db.prepare('DELETE FROM collection_items WHERE collection_id = ?').run(collection.id);
        db.prepare('DELETE FROM collections WHERE id = ?').run(collection.id);
        res.json({ success: true, message: 'Полка удалена' });
    } catch (error) {
        console.error('Collection delete error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;