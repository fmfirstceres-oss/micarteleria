const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Ensure tables exist
        db.serialize(() => {
            // Media Table
            db.run(`CREATE TABLE IF NOT EXISTS media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                url TEXT NOT NULL,
                originalName TEXT NOT NULL
            )`);

            // Playlists Table
            db.run(`CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                items_json TEXT NOT NULL
            )`);

            // Screens Table
            db.run(`CREATE TABLE IF NOT EXISTS screens (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                current_playlist_id INTEGER,
                FOREIGN KEY (current_playlist_id) REFERENCES playlists (id)
            )`);
        });
    }
});

module.exports = db;
