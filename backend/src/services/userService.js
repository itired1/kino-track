// ============================================
// Сервис для работы с пользователями (SQLite)
// ============================================

const { db, parseJsonArray } = require('../db');

// Создание или обновление пользователя
function findOrCreateUser(telegramUser) {
    const { id, username, first_name, last_name, language_code } = telegramUser;

    const existing = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(id);

    if (existing) {
        db.prepare(`UPDATE users SET username=?, first_name=?, last_name=?, language_code=?, updated_at=CURRENT_TIMESTAMP WHERE telegram_id=?`).run(
            username, first_name, last_name, language_code, id
        );
        return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(id);
    } else {
        const result = db.prepare(`INSERT INTO users (telegram_id, username, first_name, last_name, language_code) VALUES (?, ?, ?, ?, ?)`).run(
            id, username, first_name, last_name, language_code
        );
        return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }
}

// Получение пользователя по Telegram ID
function getUserByTelegramId(telegramId) {
    return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId) || null;
}

// Статистика пользователя
function getUserStats(userId) {
    const row = db.prepare(`
        SELECT
            u.id AS user_id,
            u.telegram_id,
            COUNT(ur.id) AS total_ratings,
            ROUND(COALESCE(AVG(ur.rating), 0), 2) AS average_rating,
            SUM(CASE WHEN ur.status = 'watching' THEN 1 ELSE 0 END) AS watching_count,
            SUM(CASE WHEN ur.status = 'watchlist' THEN 1 ELSE 0 END) AS watchlist_count,
            SUM(CASE WHEN ur.status = 'dropped' THEN 1 ELSE 0 END) AS dropped_count
        FROM users u
        LEFT JOIN user_ratings ur ON u.id = ur.user_id
        WHERE u.id = ?
        GROUP BY u.id
    `).get(userId);

    return row || {
        user_id: userId,
        total_ratings: 0,
        average_rating: 0,
        watching_count: 0,
        watchlist_count: 0,
        dropped_count: 0
    };
}

// Распределение оценок
function getRatingDistribution(userId) {
    const rows = db.prepare(`
        SELECT rating_value, COUNT(ur.id) as count
        FROM (SELECT 1 as rating_value UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) vals
        LEFT JOIN user_ratings ur ON ur.user_id = ? AND ur.rating = vals.rating_value
        GROUP BY rating_value
        ORDER BY rating_value
    `).all(userId);

    return rows;
}

// Последние оценки
function getRecentRatings(userId, limit = 10) {
    return db.prepare(`
        SELECT
            ur.rating, ur.review, ur.status, ur.created_at,
            f.id AS film_id, f.kinopoisk_id, f.name_ru, f.name_original,
            f.year, f.poster_url, f.rating_kp, f.genres
        FROM user_ratings ur
        JOIN films f ON ur.film_id = f.id
        WHERE ur.user_id = ?
        ORDER BY ur.created_at DESC
        LIMIT ?
    `).all(userId, limit).map(row => ({
        ...row,
        genres: parseJsonArray(row.genres)
    }));
}

// Топ жанров
function getTopGenres(userId, limit = 3) {
    const rows = db.prepare(`
        SELECT genre, COUNT(*) as count, ROUND(AVG(ur.rating), 1) as avg_rating
        FROM user_ratings ur
        JOIN films f ON ur.film_id = f.id,
        (SELECT 1 as genre UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) AS idx,
        json_each(f.genres) AS je
        WHERE ur.user_id = ? AND ur.rating >= 7
        GROUP BY je.value
        ORDER BY count DESC, avg_rating DESC
        LIMIT ?
    `).all(userId, limit);

    // Если json_each не работает, используем другой подход
    if (rows.length === 0) {
        return getTopGenresFallback(userId, limit);
    }
    return rows;
}

// Fallback для топ жанров (без json_each)
function getTopGenresFallback(userId, limit) {
    const userFilms = db.prepare(`
        SELECT f.genres, ur.rating
        FROM user_ratings ur
        JOIN films f ON ur.film_id = f.id
        WHERE ur.user_id = ? AND ur.rating >= 7
    `).all(userId);

    const genreCount = {};
    userFilms.forEach(row => {
        const genres = parseJsonArray(row.genres);
        genres.forEach(g => {
            if (!genreCount[g]) genreCount[g] = { count: 0, sum: 0 };
            genreCount[g].count++;
            genreCount[g].sum += row.rating;
        });
    });

    return Object.entries(genreCount)
        .map(([genre, data]) => ({
            genre,
            count: data.count,
            avg_rating: (data.sum / data.count).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

// Топ режиссёров
function getTopDirectors(userId, limit = 3) {
    const userFilms = db.prepare(`
        SELECT f.directors, ur.rating
        FROM user_ratings ur
        JOIN films f ON ur.film_id = f.id
        WHERE ur.user_id = ? AND ur.rating >= 7
    `).all(userId);

    const directorCount = {};
    userFilms.forEach(row => {
        const directors = parseJsonArray(row.directors);
        directors.forEach(d => {
            if (!directorCount[d]) directorCount[d] = { count: 0, sum: 0 };
            directorCount[d].count++;
            directorCount[d].sum += row.rating;
        });
    });

    return Object.entries(directorCount)
        .map(([director, data]) => ({
            director,
            count: data.count,
            avg_rating: (data.sum / data.count).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

// Топ актёров
function getTopActors(userId, limit = 3) {
    const userFilms = db.prepare(`
        SELECT f.actors, ur.rating
        FROM user_ratings ur
        JOIN films f ON ur.film_id = f.id
        WHERE ur.user_id = ? AND ur.rating >= 7
    `).all(userId);

    const actorCount = {};
    userFilms.forEach(row => {
        const actors = parseJsonArray(row.actors);
        actors.forEach(a => {
            if (!actorCount[a]) actorCount[a] = { count: 0, sum: 0 };
            actorCount[a].count++;
            actorCount[a].sum += row.rating;
        });
    });

    return Object.entries(actorCount)
        .map(([actor, data]) => ({
            actor,
            count: data.count,
            avg_rating: (data.sum / data.count).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

// ============================================
// Друзья
// ============================================

// Добавление друга (по telegram_id друга)
function addFriend(userId, friendTelegramId) {
    if (!friendTelegramId) return { error: 'Нужно указать друга' };

    const friend = getUserByTelegramId(friendTelegramId);
    if (!friend) return { error: 'Пользователь не найден' };
    if (friend.id === userId) return { error: 'Нельзя добавить самого себя' };

    const existing = db.prepare('SELECT id FROM user_friends WHERE user_id = ? AND friend_id = ?').get(userId, friend.id);
    if (existing) return { error: 'Уже в друзьях' };

    db.prepare('INSERT INTO user_friends (user_id, friend_id) VALUES (?, ?)').run(userId, friend.id);
    return { success: true, friend: publicUser(friend) };
}

// Удаление друга
function removeFriend(userId, friendTelegramId) {
    const friend = getUserByTelegramId(friendTelegramId);
    if (!friend) return { error: 'Пользователь не найден' };

    db.prepare('DELETE FROM user_friends WHERE user_id = ? AND friend_id = ?').run(userId, friend.id);
    return { success: true };
}

// Список друзей с их статистикой
function getFriends(userId) {
    const rows = db.prepare(`
        SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name
        FROM user_friends uf
        JOIN users u ON uf.friend_id = u.id
        WHERE uf.user_id = ?
        ORDER BY u.first_name
    `).all(userId);

    return rows.map(u => {
        const stats = getUserStats(u.id);
        return {
            ...publicUser(u),
            total_ratings: Number(stats.total_ratings || 0),
            average_rating: Number(stats.average_rating || 0)
        };
    });
}

// Поиск пользователей по нику/имени
function searchUsers(query, excludeUserId) {
    const q = `%${query}%`;
    const rows = db.prepare(`
        SELECT * FROM users
        WHERE id != ?
          AND (username LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
        ORDER BY first_name
        LIMIT 20
    `).all(excludeUserId, q, q, q);
    return rows.map(publicUser);
}

// Публичные данные пользователя
function publicUser(u) {
    return {
        id: u.id,
        telegram_id: u.telegram_id,
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name
    };
}

module.exports = {
    findOrCreateUser,
    getUserByTelegramId,
    getUserStats,
    getRatingDistribution,
    getRecentRatings,
    getTopGenres,
    getTopDirectors,
    getTopActors,
    addFriend,
    removeFriend,
    getFriends,
    searchUsers
};
