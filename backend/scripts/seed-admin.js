// scripts/seed-admin.js — Create initial admin user
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import * as db from '../src/services/dbService.js';

async function seed() {
  db.init();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@prisha.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const adminName = process.env.ADMIN_NAME || 'מנהל מערכת';

  // Check if admin already exists
  const existing = db.getUserByEmail(adminEmail);
  if (existing) {
    console.log(`⚠️  Admin already exists: ${adminEmail}`);
    // Ensure the existing admin has admin role
    db.getDB().prepare("UPDATE users SET role = 'admin' WHERE email = ? AND role != 'admin'").run(adminEmail);
    console.log('✅ Admin role verified.');
    return;
  }

  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(adminPassword, 10);

  // Insert admin user manually to bypass authService's 'user' default role
  const d = db.getDB();
  d.prepare("INSERT INTO users (id, email, password_hash, name, status, role) VALUES (?, ?, ?, ?, 'active', 'admin')")
    .run(id, adminEmail, hash, adminName);

  console.log(`✅ Admin user created: ${adminEmail}`);
  console.log(`   ID: ${id}`);
  console.log(`   Password: ${adminPassword}`);
}

seed().catch(e => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
