const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, 'sports_gear.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.run(`CREATE TABLE IF NOT EXISTS gear (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sport TEXT NOT NULL,
        type TEXT NOT NULL,
        usage_metric TEXT NOT NULL, -- e.g., 'km', 'hours', 'games'
        current_usage REAL DEFAULT 0,
        max_usage REAL NOT NULL,
        purchase_date DATE,
        status TEXT DEFAULT 'Good' -- 'Good', 'Worn', 'Replace Soon'
    )`, (err) => {
        if (err) {
            console.error("Error creating table", err);
        } else {
            console.log("Gear table ready.");
            // Seed some data if empty
            db.get("SELECT count(*) as count FROM gear", [], (err, row) => {
                if (err) return;
                if (row.count === 0) {
                    insertSeedData();
                }
            });
        }
    });
}

function insertSeedData() {
    const seeds = [
        ['Nike Pegasus 39', 'Running', 'Shoes', 'km', 120, 800, '2023-01-15'],
        ['Wilson Tennis Racket', 'Tennis', 'Racket', 'hours', 10, 200, '2023-05-20'],
        ['Speedo Goggles', 'Swimming', 'Goggles', 'months', 6, 12, '2023-08-01']
    ];
    const stmt = db.prepare("INSERT INTO gear (name, sport, type, usage_metric, current_usage, max_usage, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
    seeds.forEach(s => stmt.run(s));
    stmt.finalize();
    console.log("Seeded initial data.");
}

module.exports = db;
