// api/admin.js — Admin endpoints (stats, users, settings, algorithms)
import { authMiddleware } from './auth.js';
import * as db from '../services/dbService.js';
import { getAlgorithmNames } from '../services/eventService.js';

/**
 * Middleware: require authenticated user with admin role
 */
export function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    const user = db.getUser(req.user.sub);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'גישת מנהל נדרשת' });
    }
    req.adminUser = user;
    next();
  });
}

export function registerRoutes(app) {
  // GET /api/admin/stats
  app.get('/api/admin/stats', adminMiddleware, (req, res) => {
    try {
      const stats = db.getSystemStats();
      const algorithms = getAlgorithmNames().length;
      res.json({ ...stats, totalAlgorithms: algorithms });
    } catch (e) {
      console.error('Admin stats error:', e.message);
      res.status(500).json({ error: 'שגיאה בשליפת סטטיסטיקות' });
    }
  });

  // GET /api/admin/users
  app.get('/api/admin/users', adminMiddleware, (req, res) => {
    try {
      const users = db.getAllUsers();
      res.json({ users });
    } catch (e) {
      console.error('Admin users error:', e.message);
      res.status(500).json({ error: 'שגיאה בשליפת משתמשים' });
    }
  });

  // PATCH /api/admin/users/:id/status
  app.patch('/api/admin/users/:id/status', adminMiddleware, (req, res) => {
    try {
      const userId = req.params.id;
      const { status } = req.body || {};

      if (!status || !['active', 'blocked'].includes(status)) {
        return res.status(400).json({ error: 'סטטוס לא תקין. חובה: active או blocked' });
      }

      const user = db.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'משתמש לא נמצא' });
      }

      db.setUserStatus(userId, status);
      res.json({ id: userId, status });
    } catch (e) {
      console.error('Admin set status error:', e.message);
      res.status(500).json({ error: 'שגיאה בעדכון סטטוס משתמש' });
    }
  });

  // DELETE /api/admin/users/:id
  app.delete('/api/admin/users/:id', adminMiddleware, (req, res) => {
    try {
      const userId = req.params.id;

      const user = db.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'משתמש לא נמצא' });
      }

      if (user.role === 'admin') {
        // Check it's not the last admin
        const allUsers = db.getAllUsers();
        const adminCount = allUsers.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'לא ניתן למחוק את המנהל האחרון במערכת' });
        }
      }

      db.deleteUser(userId);
      res.json({ deleted: true, id: userId });
    } catch (e) {
      console.error('Admin delete user error:', e.message);
      res.status(500).json({ error: 'שגיאה במחיקת משתמש' });
    }
  });

  // GET /api/admin/settings
  app.get('/api/admin/settings', adminMiddleware, (req, res) => {
    try {
      const settings = db.getAllSystemSettings();
      const map = {};
      for (const s of settings) {
        map[s.key] = s.value;
      }
      // Return defaults for unset keys
      if (!map.system_name) map.system_name = 'פרישה';
      if (!map.max_predictions_future_months) map.max_predictions_future_months = '6';

      res.json({ settings: map });
    } catch (e) {
      console.error('Admin settings error:', e.message);
      res.status(500).json({ error: 'שגיאה בשליפת הגדרות' });
    }
  });

  // PUT /api/admin/settings/:key
  app.put('/api/admin/settings/:key', adminMiddleware, (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body || {};

      if (!value && value !== '') {
        return res.status(400).json({ error: 'נדרש ערך (value)' });
      }

      db.setSystemSetting(key, String(value));
      res.json({ key, value: String(value) });
    } catch (e) {
      console.error('Admin set setting error:', e.message);
      res.status(500).json({ error: 'שגיאה בעדכון הגדרה' });
    }
  });

  // GET /api/admin/algorithms
  app.get('/api/admin/algorithms', adminMiddleware, (req, res) => {
    try {
      const algorithms = getAlgorithmNames().map(name => {
        const descriptions = {
          monthly: 'עונת החודש — 30 יום לאחר ראייה',
          medium: 'עונה בינונית — 30 ו-31 יום לאחר ראייה',
          haflaga: 'עונת הפלגה — ממוצע מרווחי זמן בין ראיות',
        };
        return { name, description: descriptions[name] || '' };
      });
      res.json({ algorithms });
    } catch (e) {
      console.error('Admin algorithms error:', e.message);
      res.status(500).json({ error: 'שגיאה בשליפת אלגוריתמים' });
    }
  });
}
