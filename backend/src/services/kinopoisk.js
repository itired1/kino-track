// ============================================
// Сервис Kinopoisk API (v1.4)
// ============================================

const axios = require('axios');

const API_URL = 'https://api.kinopoisk.dev/v1.4';
const API_KEY = process.env.KINOPOISK_API_KEY;

const api = axios.create({
    baseURL: API_URL,
    headers: { 'X-API-KEY': API_KEY }
});

// Поиск фильмов
async function searchFilms(query, year = null) {
    const params = { query, page: 1, limit: 6 };
    if (year) params.year = year;

    const response = await api.get('/movie/search', { params });
    const docs = response.data.docs || [];

    // Получаем полные данные параллельно (быстрее)
    const detailed = await Promise.all(
        docs.slice(0, 6).map(async (doc) => {
            try {
                const full = await getFilmById(doc.id);
                return full;
            } catch (e) {
                return formatSearchResult(doc);
            }
        })
    );
    return detailed;
}

// Получение полной информации о фильме
async function getFilmById(filmId) {
    const response = await api.get(`/movie/${filmId}`);
    const f = response.data;

    const directors = (f.persons || [])
        .filter(p => p.enProfession === 'director')
        .map(p => p.name);

    const actors = (f.persons || [])
        .filter(p => p.enProfession === 'actor')
        .map(p => p.name);

    return {
        id: f.id,
        nameRu: f.name || null,
        nameOriginal: f.alternativeName || f.enName || null,
        year: f.year || null,
        description: f.description || f.shortDescription || null,
        posterUrl: f.poster?.url || f.poster?.previewUrl || null,
        posterUrlPreview: f.poster?.previewUrl || null,
        type: f.type || null,
        ratingKinopoisk: f.rating?.kp || null,
        ratingImdb: f.rating?.imdb || null,
        filmLength: f.movieLength || null,
        countries: (f.countries || []).map(c => c.name),
        genres: (f.genres || []).map(g => g.name),
        directors: directors,
        actors: actors
    };
}

// Форматирование результатов поиска (без persons)
function formatSearchResult(doc) {
    return {
        id: doc.id,
        nameRu: doc.name || null,
        nameOriginal: doc.alternativeName || doc.enName || null,
        year: doc.year || null,
        description: doc.description || doc.shortDescription || null,
        posterUrl: doc.poster?.url || doc.poster?.previewUrl || null,
        posterUrlPreview: doc.poster?.previewUrl || null,
        type: doc.type || null,
        ratingKinopoisk: doc.rating?.kp || null,
        ratingImdb: doc.rating?.imdb || null,
        filmLength: doc.movieLength || null,
        countries: (doc.countries || []).map(c => c.name),
        genres: (doc.genres || []).map(g => g.name),
        directors: [],
        actors: []
    };
}

// Получение новинок (актуальных фильмов)
async function getReleases(limit = 12) {
    const now = new Date();
    const currentYear = now.getFullYear();
    // Год премьеры: текущий, прошлый и следующий
    const yearFilter = `${currentYear - 1}-${currentYear + 1}`;

    const response = await api.get('/movie', {
        params: {
            page: 1,
            limit: limit * 2,
            year: yearFilter,
            'rating.kp': '6-10',
            sortField: 'rating.kp',
            sortType: '-1',
            type: 'movie'
        }
    });

    const docs = (response.data.docs || [])
        .filter(d => d.poster?.url || d.poster?.previewUrl)
        .slice(0, limit);

    // Получаем детали (режиссёры/актёры) параллельно
    const detailed = await Promise.all(
        docs.map(async (doc) => {
            try {
                const full = await getFilmById(doc.id);
                return full;
            } catch (e) {
                return formatSearchResult(doc);
            }
        })
    );
    return detailed;
}

// Получение популярных фильмов
async function getPopular(limit = 10) {
    const response = await api.get('/movie', {
        params: {
            page: 1,
            limit,
            sortField: 'rating.kp',
            sortType: '-1',
            'rating.kp': '7-10',
            type: 'movie'
        }
    });

    const docs = (response.data.docs || [])
        .filter(d => d.poster?.url || d.poster?.previewUrl)
        .slice(0, limit);

    const detailed = await Promise.all(
        docs.map(async (doc) => {
            try {
                const full = await getFilmById(doc.id);
                return full;
            } catch (e) {
                return formatSearchResult(doc);
            }
        })
    );
    return detailed;
}

module.exports = { searchFilms, getFilmById, getReleases, getPopular };
