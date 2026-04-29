// api/calendar.js — GET /api/locations, GET /api/calendar
import { getAllLocations, getMonth } from '../services/calendarService.js';

export function registerRoutes(app) {
  app.get('/api/locations', (req, res) => {
    try {
      const locations = getAllLocations();
      res.json({ locations });
    } catch (e) {
      console.error('Locations error:', e.message);
      res.status(500).json({ error: 'שגיאה בטעינת רשימת המיקומים' });
    }
  });

  app.get('/api/calendar', async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
      const locationId = req.query.locationId || '281184';

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: 'שנה או חודש לא תקינים' });
      }

      const data = await getMonth(year, month, locationId);
      if (!data) {
        return res.status(400).json({ error: 'מיקום לא נמצא' });
      }

      res.json(data);
    } catch (e) {
      console.error('Calendar error:', e.message);
      res.status(500).json({ error: 'שגיאה בטעינת לוח השנה' });
    }
  });
}
