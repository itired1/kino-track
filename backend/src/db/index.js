// ============================================
// Подключение к базе данных SQLite
// ============================================

const Database = require('better-sqlite3');
const path = require('path');

// Путь к файлу базы данных
const DB_PATH = path.join(__dirname, '../../kino.db');

// Создаём подключение
const db = new Database(DB_PATH);

// Включаем WAL режим для лучшей производительности
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('✅ Подключение к SQLite базе данных установлено');

// ============================================
// Создание таблиц (если не существуют)
// ============================================

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS films (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kinopoisk_id INTEGER UNIQUE NOT NULL,
        name_ru TEXT,
        name_original TEXT,
        year INTEGER,
        description TEXT,
        poster_url TEXT,
        cover_url TEXT,
        type TEXT,
        rating_kp REAL,
        rating_imdb REAL,
        duration INTEGER,
        countries TEXT DEFAULT '[]',
        genres TEXT DEFAULT '[]',
        directors TEXT DEFAULT '[]',
        actors TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        film_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
        review TEXT,
        status TEXT DEFAULT 'rated',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE,
        UNIQUE(user_id, film_id)
    );

    CREATE TABLE IF NOT EXISTS user_friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS film_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        film_id INTEGER NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 10),
        text TEXT NOT NULL,
        is_spoiler INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collection_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL,
        film_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE,
        UNIQUE(collection_id, film_id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_films_kinopoisk_id ON films(kinopoisk_id);
    CREATE INDEX IF NOT EXISTS idx_films_name_ru ON films(name_ru);
    CREATE INDEX IF NOT EXISTS idx_user_ratings_user_id ON user_ratings(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_ratings_film_id ON user_ratings(film_id);
    CREATE INDEX IF NOT EXISTS idx_user_ratings_status ON user_ratings(status);
    CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);
    CREATE INDEX IF NOT EXISTS idx_film_reviews_film_id ON film_reviews(film_id);
    CREATE INDEX IF NOT EXISTS idx_film_reviews_user_id ON film_reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
    CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
    CREATE INDEX IF NOT EXISTS idx_collection_items_film ON collection_items(film_id);
`);

// ============================================
// Вспомогательные функции для работы с JSON массивами
// ============================================

function parseJsonArray(str) {
    if (!str) return [];
    try {
        return JSON.parse(str);
    } catch {
        return [];
    }
}

function toJsonArray(arr) {
    if (!arr || !Array.isArray(arr)) return '[]';
    return JSON.stringify(arr);
}

// Функция для выполнения запроса (совместимость с PG API)
function query(sql, params = []) {
    const start = Date.now();
    try {
        // SELECT запросы
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            const stmt = db.prepare(sql);
            const rows = stmt.all(...params);
            const duration = Date.now() - start;
            console.log('Query:', { text: sql.substring(0, 50), duration, rows: rows.length });
            return { rows };
        }
        // INSERT/UPDATE/DELETE
        else {
            const stmt = db.prepare(sql);
            const result = stmt.run(...params);
            const duration = Date.now() - start;
            console.log('Query:', { text: sql.substring(0, 50), duration, changes: result.changes });
            return { rows: [{ id: result.lastInsertRowid, ...result }], rowCount: result.changes };
        }
    } catch (error) {
        console.error('Query error:', error.message);
        throw error;
    }
}

// Функция для транзакций
function transaction(fn) {
    return db.transaction(fn)();
}

// Функция для получения клиента (совместимость)
function getClient() {
    return {
        query: query,
        release: () => {}
    };
}

module.exports = {
    db,
    query,
    getClient,
    transaction,
    parseJsonArray,
    toJsonArray
};
