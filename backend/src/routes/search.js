// ============================================
// Маршруты для поиска фильмов
// ============================================

const express = require('express');
const router = express.Router();
const filmService = require('../services/filmService');
const kinopoisk = require('../services/kinopoisk');
const { db } = require('../db');

// Фолбэк: если внешний Kinopoisk API недоступен (лимит/ошибка),
// отдаём ранее закэшированные фильмы из БД — блоки не падают.
function cachedFallback({ orderBy = '', limit = 10, random = false } = {}) {
    try {
        let rows;
        if (random) {
            rows = db.prepare(
                'SELECT * FROM films WHERE poster_url IS NOT NULL AND poster_url != \'\' ORDER BY RANDOM() LIMIT ?'
            ).all(1);
        } else {
            rows = db.prepare(
                `SELECT * FROM films WHERE poster_url IS NOT NULL AND poster_url != '' ORDER BY ${orderBy} LIMIT ?`
            ).all(limit);
        }
        return rows.map(filmService.formatFilm).filter(Boolean);
    } catch (e) {
        console.error('Cache fallback error:', e.message);
        return [];
    }
}

// Получение новинок
router.get('/releases', async (req, res) => {
    try {
        const films = await kinopoisk.getReleases(10);
        // Кэшируем в БД
        const cached = films.map(f => {
            try { return filmService.cacheFilm(f); } catch(e) { return null; }
        }).filter(Boolean);
        res.json({ success: true, data: cached.length ? cached : cachedFallback({ orderBy: 'year DESC', limit: 10 }) });
    } catch (error) {
        console.error('Releases error:', error.message);
        res.json({ success: true, data: cachedFallback({ orderBy: 'year DESC', limit: 10 }) });
    }
});

// Получение популярных
router.get('/popular', async (req, res) => {
    try {
        const films = await kinopoisk.getPopular(8);
        const cached = films.map(f => {
            try { return filmService.cacheFilm(f); } catch(e) { return null; }
        }).filter(Boolean);
        res.json({ success: true, data: cached.length ? cached : cachedFallback({ orderBy: 'rating_kp DESC', limit: 8 }) });
    } catch (error) {
        console.error('Popular error:', error.message);
        res.json({ success: true, data: cachedFallback({ orderBy: 'rating_kp DESC', limit: 8 }) });
    }
});

// Случайный фильм
router.get('/random', async (req, res) => {
    try {
        const film = await kinopoisk.getRandom();
        if (!film) return res.status(404).json({ error: 'Не удалось найти фильм' });
        const cached = filmService.cacheFilm(film);
        res.json({ success: true, data: cached });
    } catch (error) {
        console.error('Random error:', error.message);
        const fallback = cachedFallback({ random: true });
        if (fallback.length) return res.json({ success: true, data: fallback[0] });
        res.status(404).json({ error: 'Не удалось найти фильм' });
    }
});

// Поиск фильмов
router.post('/', async (req, res) => {
    try {
        const { query, year, actor } = req.body;

        if (!query && !actor) {
            return res.status(400).json({ error: 'Укажите query или actor' });
        }

        const films = await filmService.searchFilms(actor || query, year);
        res.json({ success: true, data: films });
    } catch (error) {
        console.error('Search error:', error.message);
        // Фолбэк: ищем по закэшированным фильмам, чтобы поиск не падал при лимите API
        try {
            const needle = `%${(actor || query || '').trim()}%`;
            const rows = db.prepare(
                'SELECT * FROM films WHERE name_ru LIKE ? OR name_original LIKE ? ORDER BY rating_kp DESC LIMIT 20'
            ).all(needle, needle);
            res.json({ success: true, data: rows.map(filmService.formatFilm).filter(Boolean) });
        } catch (e2) {
            res.json({ success: true, data: [] });
        }
    }
});

// Получение фильма по ID
router.get('/:id', (req, res) => {
    try {
        const film = filmService.getFilmById(req.params.id);
        if (!film) return res.status(404).json({ error: 'Фильм не найден' });
        res.json({ success: true, data: film });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
