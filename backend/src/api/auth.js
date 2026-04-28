// api/auth.js — POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
import { register, login, verifyToken } from '../services/authService.js';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'נדרשת הזדהות' });
  }
  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'טוקן לא תקין או פג תוקף' });
  }
}

export function registerRoutes(app) {
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body || {};
      const result = await register(email, password, name);
      res.status(201).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      const result = await login(email, password);
      res.json(result);
    } catch (e) {
      res.status(401).json({ error: e.message });
    }
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });
}
