-- ============================================
-- SQLite схема для KinoTrack
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_films_kp ON films(kinopoisk_id);
CREATE INDEX IF NOT EXISTS idx_films_name ON films(name_ru);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON user_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_film ON user_ratings(film_id);
CREATE INDEX IF NOT EXISTS idx_ratings_status ON user_ratings(status);
