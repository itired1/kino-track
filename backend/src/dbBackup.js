// ============================================
// Git-бэкап БД: хранение SQLite-файла в приватном репозитории GitHub.
// Нужен только бесплатный GitHub + PAT-токен (repo scope).
// ============================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_FILE = 'kino.db';

function getDbPath() {
    return process.env.DB_PATH || path.join(__dirname, '..', 'kino.db');
}

function isConfigured() {
    return !!(process.env.DB_BACKUP_REPO && process.env.DB_BACKUP_TOKEN);
}

// Восстановление при старте: если локального файла БД нет — берём из GitHub.
// Вызывается ДО открытия БД (require('./db')).
function restoreDbIfMissing() {
    if (!isConfigured()) return;
    const dbPath = getDbPath();
    if (fs.existsSync(dbPath)) return;

    const repo = process.env.DB_BACKUP_REPO;
    const token = process.env.DB_BACKUP_TOKEN;
    const url = `https://api.github.com/repos/${repo}/contents/${BACKUP_FILE}`;

    try {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        execSync(
            `curl -sL -f -H "Accept: application/vnd.github.v3.raw" -H "Authorization: Bearer ${token}" "${url}" -o "${dbPath}"`,
            { timeout: 30000, stdio: 'pipe' }
        );
        const size = fs.statSync(dbPath).size;
        if (size > 0) {
            console.log(`📥 БД восстановлена из Git-бэкапа (${size} bytes)`);
        } else {
            fs.unlinkSync(dbPath);
        }
    } catch (e) {
        console.log('📭 Git-бэкап пуст или недоступен — стартуем с новой БД:', e.message);
        try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); } catch (_) {}
    }
}

// Сохранение БД в GitHub (через better-sqlite3 backup API — целостный снимок).
async function uploadDatabase(syncDb) {
    if (!isConfigured()) return false;
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) return false;

    const repo = process.env.DB_BACKUP_REPO;
    const token = process.env.DB_BACKUP_TOKEN;
    const tmp = path.join(path.dirname(dbPath), '.backup-tmp.db');
    const url = `https://api.github.com/repos/${repo}/contents/${BACKUP_FILE}`;

    try {
        await syncDb.backup(tmp);
        const buf = fs.readFileSync(tmp);
        const isEmpty = buf.length < 4096;
        const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };

        let sha = null;
        const head = await fetch(url, { headers });
        if (head.ok) {
            const meta = await head.json();
            sha = meta.sha;
            if (sha && isEmpty) {
                console.warn('⏭ Пропускаю бэкап: локальная БД пуста, а в Git уже есть версия');
                return false;
            }
        }

        const res = await fetch(url, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `backup ${new Date().toISOString()}`,
                content: buf.toString('base64'),
                ...(sha ? { sha } : {})
            })
        });

        if (res.ok) {
            console.log('☁️ БД сохранена в Git-бэкап');
            return true;
        }
        console.warn('⚠️ Ошибка сохранения бэкапа: ' + (await res.text()).slice(0, 300));
        return false;
    } catch (e) {
        console.warn('⚠️ Ошибка бэкапа:', e.message);
        return false;
    } finally {
        try { fs.unlinkSync(tmp); } catch (_) {}
    }
}

// Периодический бэкап + сохранение при остановке (SIGTERM/SIGINT).
function startBackupLoop(syncDb) {
    if (!isConfigured()) return;
    const minutes = parseInt(process.env.DB_BACKUP_INTERVAL_MIN, 10) || 5;
    setInterval(() => uploadDatabase(syncDb), minutes * 60 * 1000);
    const shutdown = () => {
        Promise.race([uploadDatabase(syncDb), new Promise(r => setTimeout(r, 8000))])
            .finally(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

module.exports = { restoreDbIfMissing, uploadDatabase, startBackupLoop };