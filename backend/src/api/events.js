// api/events.js — POST/GET/DELETE /api/events
import { authMiddleware } from './auth.js';
import { addEvent, deleteEventById, getUserEvents, getEventsForMonth, getAlgorithmNames } from '../services/eventService.js';

export function registerRoutes(app) {
  // POST /api/events — Add a new event
  app.post('/api/events', authMiddleware, (req, res) => {
    try {
      const { type, gregorianDate, hebrewDate, dayOrNight, notes } = req.body || {};

      if (!type || !gregorianDate) {
        return res.status(400).json({ error: 'נדרשים סוג אירוע ותאריך' });
      }

      const event = addEvent(req.user.sub, {
        type,
        gregorianDate,
        hebrewDate,
        dayOrNight,
        notes,
      });

      res.status(201).json({ event });
    } catch (e) {
      console.error('Add event error:', e.message);
      res.status(400).json({ error: e.message || 'שגיאה בהוספת האירוע' });
    }
  });

  // GET /api/events — Get user events
  app.get('/api/events', authMiddleware, (req, res) => {
    try {
      const includePredictions = req.query.predictions !== 'false';
      const year = req.query.year ? parseInt(req.query.year) : null;
      const month = req.query.month ? parseInt(req.query.month) : null;

      let events;
      if (year && month) {
        events = getEventsForMonth(req.user.sub, year, month, includePredictions);
      } else {
        events = getUserEvents(req.user.sub, includePredictions);
      }

      res.json({ events });
    } catch (e) {
      console.error('Get events error:', e.message);
      res.status(500).json({ error: 'שגיאה בשליפת האירועים' });
    }
  });

  // DELETE /api/events/:id — Delete an event
  app.delete('/api/events/:id', authMiddleware, (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: 'מזהה אירוע לא תקין' });
      }

      const result = deleteEventById(eventId, req.user.sub);
      res.json(result);
    } catch (e) {
      console.error('Delete event error:', e.message);
      res.status(400).json({ error: e.message || 'שגיאה במחיקת האירוע' });
    }
  });
}
