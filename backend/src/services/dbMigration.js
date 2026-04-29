// services/dbMigration.js — Migrate existing DB to add new columns
import { getDB } from './dbService.js';

export function migrate() {
  const db = getDB();

  // Check if status column exists in users
  const cols = db.prepare("PRAGMA table_info('users')").all();
  const hasStatus = cols.some(c => c.name === 'status');
  const hasRole = cols.some(c => c.name === 'role');

  if (!hasStatus) {
    console.log('🔧 Migrating: adding status column to users...');
    db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
  }

  if (!hasRole) {
    console.log('🔧 Migrating: adding role column to users...');
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
    // First user gets admin role
    const firstUser = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get();
    if (firstUser) {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ? AND role = 'user'").run(firstUser.id);
      console.log('🔧 First user promoted to admin.');
    }
  }

  // Check if old 'periods' table exists and migrate data
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const hasPeriods = tables.some(t => t.name === 'periods');

  if (hasPeriods) {
    console.log('🔧 Migrating: moving data from periods to events table...');
    const periods = db.prepare('SELECT * FROM periods').all();
    const insertEvent = db.prepare(
      "INSERT OR IGNORE INTO events (user_id, type, gregorian_date, notes) VALUES (?, 'period', ?, ?)"
    );
    for (const p of periods) {
      insertEvent.run(p.user_id, p.date, p.notes || '');
    }
    console.log(`🔧 Migrated ${periods.length} period records to events.`);
  }

  console.log('✅ Migration complete.');
}

// Auto-run
migrate();
