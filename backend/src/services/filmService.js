// ============================================
// Сервис фильмов (SQLite + Kinopoisk API v1.4)
// ============================================

const { db, toJsonArray, parseJsonArray } = require('../db');
const kinopoisk = require('./kinopoisk');

// Получить фильм из кэша по ID
function getFilmById(id) {
    const row = db.prepare('SELECT * FROM films WHERE id = ?').get(id);
    return row ? formatFilm(row) : null;
}

// Получить фильм по Kinopoisk ID
function getFilmByKinopoiskId(kpId) {
    const row = db.prepare('SELECT * FROM films WHERE kinopoisk_id = ?').get(kpId);
    return row ? formatFilm(row) : null;
}

// Сохранить фильм в кэш
function cacheFilm(filmData) {
    const kpId = filmData.id;

    const data = {
        kinopoisk_id: kpId,
        name_ru: filmData.nameRu || filmData.name || null,
        name_original: filmData.nameOriginal || filmData.alternativeName || null,
        year: filmData.year || null,
        description: filmData.description || filmData.shortDescription || null,
        poster_url: filmData.posterUrl || (filmData.poster && filmData.poster.url) || null,
        cover_url: filmData.posterUrlPreview || (filmData.poster && filmData.poster.previewUrl) || null,
        type: filmData.type || null,
        rating_kp: filmData.ratingKinopoisk || (filmData.rating && filmData.rating.kp) || null,
        rating_imdb: filmData.ratingImdb || (filmData.rating && filmData.rating.imdb) || null,
        duration: filmData.filmLength || filmData.movieLength || null,
        countries: toJsonArray(filmData.countries || []),
        genres: toJsonArray(filmData.genres || []),
        directors: toJsonArray(filmData.directors || []),
        actors: toJsonArray(filmData.actors || [])
    };

    const existing = getFilmByKinopoiskId(kpId);

    if (existing) {
        db.prepare(`UPDATE films SET
            name_ru=?, name_original=?, year=?, description=?, poster_url=?,
            cover_url=?, type=?, rating_kp=?, rating_imdb=?, duration=?,
            countries=?, genres=?, directors=?, actors=?, updated_at=CURRENT_TIMESTAMP
            WHERE kinopoisk_id=?`).run(
            data.name_ru, data.name_original, data.year, data.description,
            data.poster_url, data.cover_url, data.type, data.rating_kp,
            data.rating_imdb, data.duration, data.countries, data.genres,
            data.directors, data.actors, kpId
        );
        return getFilmByKinopoiskId(kpId);
    } else {
        const result = db.prepare(`INSERT INTO films
            (kinopoisk_id, name_ru, name_original, year, description, poster_url,
             cover_url, type, rating_kp, rating_imdb, duration, countries,
             genres, directors, actors)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
            data.kinopoisk_id, data.name_ru, data.name_original, data.year,
            data.description, data.poster_url, data.cover_url, data.type,
            data.rating_kp, data.rating_imdb, data.duration, data.countries,
            data.genres, data.directors, data.actors
        );
        return getFilmById(result.lastInsertRowid);
    }
}

// Поиск фильмов
async function searchFilms(queryText, year = null) {
    // Ищем в кэше
    const searchPattern = `%${queryText}%`;
    let rows;

    if (year) {
        rows = db.prepare(
            'SELECT * FROM films WHERE (name_ru LIKE ? OR name_original LIKE ?) AND year = ? LIMIT 10'
        ).all(searchPattern, searchPattern, year);
    } else {
        rows = db.prepare(
            'SELECT * FROM films WHERE name_ru LIKE ? OR name_original LIKE ? LIMIT 10'
        ).all(searchPattern, searchPattern);
    }

    if (rows.length > 0) {
        return rows.map(formatFilm);
    }

    // Запрашиваем из API
    try {
        const apiFilms = await kinopoisk.searchFilms(queryText, year);
        return apiFilms.map(film => {
            const cached = cacheFilm(film);
            return cached;
        }).filter(Boolean);
    } catch (error) {
        console.error('API search error:', error.message);
        return [];
    }
}

// Фильмы, которые пользователь не оценивал
function getUnratedFilms(userId, preferredGenres = [], limit = 10) {
    let rows;

    if (preferredGenres.length > 0) {
        const genreConditions = preferredGenres.slice(0, 5).map(() => 'genres LIKE ?').join(' OR ');
        const params = preferredGenres.slice(0, 5).map(g => `%${g}%`);

        rows = db.prepare(`
            SELECT * FROM films f
            WHERE f.id NOT IN (SELECT film_id FROM user_ratings WHERE user_id = ?)
            AND f.rating_kp >= 6.5
            AND (${genreConditions})
            ORDER BY f.rating_kp DESC LIMIT ?
        `).all(userId, ...params, limit);
    } else {
        rows = db.prepare(`
            SELECT * FROM films f
            WHERE f.id NOT IN (SELECT film_id FROM user_ratings WHERE user_id = ?)
            AND f.rating_kp >= 6.5
            ORDER BY f.rating_kp DESC LIMIT ?
        `).all(userId, limit);
    }

    return rows.map(formatFilm);
}

// Форматирование фильма из БД
function formatFilm(row) {
    if (!row) return null;
    return {
        id: row.id,
        kinopoisk_id: row.kinopoisk_id,
        name_ru: row.name_ru,
        name_original: row.name_original,
        year: row.year,
        description: row.description,
        poster_url: row.poster_url,
        cover_url: row.cover_url,
        type: row.type,
        rating_kp: row.rating_kp,
        rating_imdb: row.rating_imdb,
        duration: row.duration,
        countries: parseJsonArray(row.countries),
        genres: parseJsonArray(row.genres),
        directors: parseJsonArray(row.directors),
        actors: parseJsonArray(row.actors)
    };
}

module.exports = {
    getFilmById,
    getFilmByKinopoiskId,
    cacheFilm,
    searchFilms,
    getUnratedFilms,
    formatFilm
};
