// api/calendar.js — GET /api/locations, GET /api/calendar
import { getAllLocations, getMonth } from '../services/calendarService.js';

export function registerRoutes(app) {
  app.get('/api/locations', (req, res) => {
    try {
      const locations = getAllLocations();
      res.json({ locations });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/calendar', (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
      const locationId = req.query.locationId || '281184';

      const data = getMonth(year, month, locationId);
      if (!data) {
        return res.status(400).json({ error: 'מיקום לא נמצא' });
      }

      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}
