// scripts/seed-admin.js — Create the first admin user
// Run with: node scripts/seed-admin.js
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { init, getDB } from '../src/services/dbService.js';

async function seed() {
  init();
  const db = getDB();

  const email = process.env.ADMIN_EMAIL || 'admin@prisha.app';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) {
    // Upgrade to admin
    db.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', email);
    console.log(`✅ User ${email} upgraded to admin`);
  } else {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (id, email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, email, hash, 'Admin', 'admin', 'active');
    console.log(`✅ Admin user created: ${email} / ${password}`);
  }

  console.log('Admin seed complete.');
  process.exit(0);
}

seed().catch(e => {
  console.error('Seed failed:', e);
  process.exit(1);
});
