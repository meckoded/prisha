// services/dbService.js — SQLite database (better-sqlite3, synchronous)
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'prisha.db');

let db;

export function init() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_locations (
      user_id TEXT REFERENCES users(id),
      location_id TEXT,
      is_default BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

export function getDB() {
  if (!db) init();
  return db;
}

export function insertUser(id, email, hash, name) {
  const d = getDB();
  const stmt = d.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)');
  return stmt.run(id, email, hash, name);
}

export function getUser(id) {
  const d = getDB();
  return d.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function getUserByEmail(email) {
  const d = getDB();
  return d.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function insertPeriod(userId, date, notes) {
  const d = getDB();
  return d.prepare('INSERT INTO periods (user_id, date, notes) VALUES (?, ?, ?)').run(userId, date, notes || '');
}

export function getPeriods(userId) {
  const d = getDB();
  return d.prepare('SELECT * FROM periods WHERE user_id = ? ORDER BY date ASC').all(userId);
}

export function setUserLocation(userId, locationId) {
  const d = getDB();
  d.prepare('DELETE FROM user_locations WHERE user_id = ?').run(userId);
  return d.prepare('INSERT INTO user_locations (user_id, location_id, is_default) VALUES (?, ?, ?)').run(userId, locationId, true);
}

export function getUserLocation(userId) {
  const d = getDB();
  return d.prepare('SELECT * FROM user_locations WHERE user_id = ?').get(userId);
}
