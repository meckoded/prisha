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
      status TEXT DEFAULT 'active',
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_locations (
      user_id TEXT REFERENCES users(id),
      location_id TEXT,
      is_default BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('period','spot','birth','prediction')),
      gregorian_date TEXT NOT NULL,
      hebrew_date TEXT,
      day_or_night TEXT DEFAULT 'day' CHECK(day_or_night IN ('day','night')),
      created_by_system INTEGER DEFAULT 0,
      prediction_type TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

export function getDB() {
  if (!db) init();
  return db;
}

// ——— Users ———

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

export function getAllUsers() {
  const d = getDB();
  return d.prepare('SELECT id, email, name, status, role, created_at FROM users ORDER BY created_at DESC').all();
}

export function updateUserStatus(id, status) {
  const d = getDB();
  return d.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
}

export function deleteUser(id) {
  const d = getDB();
  d.prepare('DELETE FROM events WHERE user_id = ?').run(id);
  d.prepare('DELETE FROM user_locations WHERE user_id = ?').run(id);
  return d.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// ——— Locations ———

export function setUserLocation(userId, locationId) {
  const d = getDB();
  d.prepare('DELETE FROM user_locations WHERE user_id = ?').run(userId);
  return d.prepare('INSERT INTO user_locations (user_id, location_id, is_default) VALUES (?, ?, ?)').run(userId, locationId, true);
}

export function getUserLocation(userId) {
  const d = getDB();
  return d.prepare('SELECT * FROM user_locations WHERE user_id = ?').get(userId);
}

// ——— Events (periods, spots, births, predictions) ———

export function insertEvent({ userId, type, gregorianDate, hebrewDate, dayOrNight, createdBySystem, predictionType, notes }) {
  const d = getDB();
  const stmt = d.prepare(`
    INSERT INTO events (user_id, type, gregorian_date, hebrew_date, day_or_night, created_by_system, prediction_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(userId, type, gregorianDate, hebrewDate || '', dayOrNight || 'day', createdBySystem ? 1 : 0, predictionType || null, notes || '');
}

export function getEvents(userId, includeSystem = false) {
  const d = getDB();
  let sql = 'SELECT * FROM events WHERE user_id = ?';
  if (!includeSystem) sql += ' AND created_by_system = 0';
  sql += ' ORDER BY gregorian_date ASC';
  return d.prepare(sql).all(userId);
}

export function getAllEvents(includeSystem = false) {
  const d = getDB();
  let sql = 'SELECT * FROM events';
  if (!includeSystem) sql += ' WHERE created_by_system = 0';
  sql += ' ORDER BY gregorian_date ASC';
  return d.prepare(sql).all();
}

export function deleteEvent(id, userId) {
  const d = getDB();
  return d.prepare('DELETE FROM events WHERE id = ? AND user_id = ? AND created_by_system = 0').run(id, userId);
}

export function deleteSystemPredictions(userId) {
  const d = getDB();
  return d.prepare('DELETE FROM events WHERE user_id = ? AND created_by_system = 1').run(userId);
}

export function getEventsBetween(userId, fromDate, toDate, includeSystem = false) {
  const d = getDB();
  let sql = 'SELECT * FROM events WHERE user_id = ? AND gregorian_date >= ? AND gregorian_date <= ?';
  if (!includeSystem) sql += ' AND created_by_system = 0';
  sql += ' ORDER BY gregorian_date ASC';
  return d.prepare(sql).all(userId, fromDate, toDate);
}

// ——— System Settings ———

export function getSetting(key) {
  const d = getDB();
  const row = d.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function setSetting(key, value) {
  const d = getDB();
  d.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, value);
}

export function getAllSettings() {
  const d = getDB();
  return d.prepare('SELECT * FROM system_settings ORDER BY key').all();
}
