// services/authService.js — אימות והרשמה
import * as db from './dbService.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const SALT_ROUNDS = 10;

export async function register(email, password, name) {
  if (!email || !password) throw new Error('אימייל וסיסמה נדרשים');
  if (password.length < 6) throw new Error('סיסמה חייבת להיות לפחות 6 תווים');

  const existing = db.getUserByEmail(email);
  if (existing) throw new Error('משתמש עם אימייל זה כבר קיים');

  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  db.insertUser(id, email, hash, name || '');
  const user = db.getUser(id);
  const token = generateToken(user);

  return { user: sanitizeUser(user), token };
}

export async function login(email, password) {
  if (!email || !password) throw new Error('אימייל וסיסמה נדרשים');

  const user = db.getUserByEmail(email);
  if (!user) throw new Error('אימייל או סיסמה שגויים');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error('אימייל או סיסמה שגויים');

  const token = generateToken(user);
  return { user: sanitizeUser(user), token };
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function sanitizeUser(user) {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.created_at };
}
