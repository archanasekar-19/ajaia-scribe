// db.js
// Sets up a SQLite database (file-based, persists across restarts) and seeds
// a handful of demo users so reviewers can test sharing without building an
// auth system. This is intentionally simple: no passwords, no sessions.
// See AI_WORKFLOW.md / ARCHITECTURE.md for the reasoning behind this cut.

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DATA_DIR = process.env.AJAIASCRIBE_DATA_DIR || path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "ajaiascribe.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT 'Untitled document',
    content TEXT NOT NULL DEFAULT '',
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS document_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL DEFAULT 'edit',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(document_id, user_id)
  );
`);

// Seed demo users if the table is empty. These are the "mocked auth"
// accounts referenced in the README - pick one from a dropdown, no password.
const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
if (userCount === 0) {
  const insert = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
  const seed = db.transaction((users) => {
    for (const u of users) insert.run(u.name, u.email);
  });
  seed([
    { name: "Archana Sekar", email: "archana@example.com" },
    { name: "Priya Raman", email: "priya@example.com" },
    { name: "Dev Kumar", email: "dev@example.com" },
  ]);
}

module.exports = db;
