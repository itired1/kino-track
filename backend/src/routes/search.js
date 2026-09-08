// ============================================
// Маршруты для поиска фильмов
// ============================================

const express = require('express');
const router = express.Router();
const filmService = require('../services/filmService');
const kinopoisk = require('../services/kinopoisk');
const { db } = require('../db');

// Получение новинок
router.get('/releases', async (req, res) => {
    try {
        const films = await kinopoisk.getReleases(10);
        // Кэшируем в БД
        const cached = films.map(f => {
            try { return filmService.cacheFilm(f); } catch(e) { return null; }
        }).filter(Boolean);
        res.json({ success: true, data: cached });
    } catch (error) {
        console.error('Releases error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Получение популярных
router.get('/popular', async (req, res) => {
    try {
        const films = await kinopoisk.getPopular(8);
        const cached = films.map(f => {
            try { return filmService.cacheFilm(f); } catch(e) { return null; }
        }).filter(Boolean);
        res.json({ success: true, data: cached });
    } catch (error) {
        console.error('Popular error:', error.message);
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
