// api/admin.js — Admin dashboard API (statistics, settings, users)
import * as db from '../services/dbService.js';
import { getAlgorithmNames, getAlgorithmDescription } from '../services/vesetService.js';
import { authMiddleware } from './auth.js';

// Admin middleware — requires admin role
function adminMiddleware(req, res, next) {
  const user = db.getUser(req.user.sub);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'גישת מנהל בלבד' });
  }
  req.userRecord = user;
  next();
}

export function registerRoutes(app) {
  // ——— Users Management ———

  // GET /api/admin/users — list all users
  app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
    try {
      const users = db.getAllUsers();
      res.json({ users });
    } catch (e) {
      console.error('Admin users error:', e.message);
      res.status(500).json({ error: 'שגיאה בטעינת המשתמשים' });
    }
  });

  // PATCH /api/admin/users/:id/status — block/unblock user
  app.patch('/api/admin/users/:id/status', authMiddleware, adminMiddleware, (req, res) => {
    try {
      const { status } = req.body || {};
      if (!['active', 'blocked'].includes(status)) {
        return res.status(400).json({ error: 'סטטוס לא תקין. אופציות: active, blocked' });
      }
      db.updateUserStatus(req.params.id, status);
      res.json({ success: true, status });
    } catch (e) {
      console.error('Admin user status error:', e.message);
      res.status(500).json({ error: 'שגיאה בעדכון סטטוס המשתמש' });
    }
  });

  // DELETE /api/admin/users/:id — delete user and all their data
  app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
    try {
      db.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (e) {
      console.error('Admin user delete error:', e.message);
      res.status(500).json({ error: 'שגיאה במחיקת המשתמש' });
    }
  });

  // ——— Statistics ———

  // GET /api/admin/stats — system statistics
  app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
    try {
      const allUsers = db.getAllUsers();
      const allEvents = db.getAllEvents(true);
      const userEvents = allEvents.filter(e => !e.created_by_system);
      const systemEvents = allEvents.filter(e => e.created_by_system);

      const eventTypeCount = {};
      for (const e of userEvents) {
        eventTypeCount[e.type] = (eventTypeCount[e.type] || 0) + 1;
      }

      res.json({
        stats: {
          totalUsers: allUsers.length,
          activeUsers: allUsers.filter(u => u.status === 'active').length,
          blockedUsers: allUsers.filter(u => u.status === 'blocked').length,
          totalUserEvents: userEvents.length,
          totalSystemPredictions: systemEvents.length,
          eventTypeCount,
          registeredAlgorithms: getAlgorithmNames(),
        },
      });
    } catch (e) {
      console.error('Admin stats error:', e.message);
      res.status(500).json({ error: 'שגיאה בטעינת סטטיסטיקות' });
    }
  });

  // ——— Settings ———

  // GET /api/admin/settings — all settings
  app.get('/api/admin/settings', authMiddleware, adminMiddleware, (req, res) => {
    try {
      const settings = db.getAllSettings();
      res.json({ settings });
    } catch (e) {
      console.error('Admin settings error:', e.message);
      res.status(500).json({ error: 'שגיאה בטעינת הגדרות' });
    }
  });

  // PUT /api/admin/settings/:key — update a setting
  app.put('/api/admin/settings/:key', authMiddleware, adminMiddleware, (req, res) => {
    try {
      const { value } = req.body || {};
      if (value === undefined || value === null) {
        return res.status(400).json({ error: 'ערך חובה' });
      }
      db.setSetting(req.params.key, String(value));
      res.json({ success: true, key: req.params.key, value: String(value) });
    } catch (e) {
      console.error('Admin setting update error:', e.message);
      res.status(500).json({ error: 'שגיאה בעדכון ההגדרה' });
    }
  });

  // ——— Algorithm Info ———

  // GET /api/admin/algorithms — list registered algorithms with descriptions
  app.get('/api/admin/algorithms', authMiddleware, adminMiddleware, (req, res) => {
    try {
      const algorithms = getAlgorithmNames().map(name => ({
        name,
        description: getAlgorithmDescription(name),
      }));
      res.json({ algorithms });
    } catch (e) {
      console.error('Admin algorithms error:', e.message);
      res.status(500).json({ error: 'שגיאה בטעינת האלגוריתמים' });
    }
  });
}
