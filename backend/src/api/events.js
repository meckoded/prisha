// api/events.js — POST /api/events, GET /api/events, DELETE /api/events/:id
import * as db from '../services/dbService.js';
import { calculateAll, eventsToSightings } from '../services/vesetService.js';
import { authMiddleware } from './auth.js';

export function registerRoutes(app) {
  // POST /api/events — add a user event (period, spot, birth) + recalculate predictions
  app.post('/api/events', authMiddleware, (req, res) => {
    try {
      const { type, gregorianDate, hebrewDate, dayOrNight } = req.body || {};
      const userId = req.user.sub;

      if (!type || !gregorianDate) {
        return res.status(400).json({ error: 'סוג הארוע ותאריך חובה' });
      }
      if (!['period', 'spot', 'birth'].includes(type)) {
        return res.status(400).json({ error: 'סוג ארוע לא תקין. אופציות: period, spot, birth' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(gregorianDate)) {
        return res.status(400).json({ error: 'תאריך לא תקין. פורמט: YYYY-MM-DD' });
      }

      // Save the event
      db.insertEvent({
        userId,
        type,
        gregorianDate,
        hebrewDate: hebrewDate || '',
        dayOrNight: dayOrNight || 'day',
        createdBySystem: false,
        predictionType: null,
        notes: '',
      });

      // Recalculate predictions from all user events
      const events = db.getEvents(userId, false);
      const sightings = eventsToSightings(events);
      const predictions = calculateAll(sightings);

      // Replace old system predictions with new ones
      db.deleteSystemPredictions(userId);
      for (const pred of predictions) {
        for (const date of pred.dates) {
          db.insertEvent({
            userId,
            type: 'prediction',
            gregorianDate: date,
            hebrewDate: '',
            dayOrNight: 'day',
            createdBySystem: true,
            predictionType: pred.type,
            notes: pred.description || '',
          });
        }
      }

      // Return updated events + predictions
      const allEvents = db.getEvents(userId, true);
      res.status(201).json({
        event: { type, gregorianDate, hebrewDate, dayOrNight, createdBySystem: false },
        predictions,
        allEvents: allEvents.map(e => ({
          id: e.id,
          type: e.type,
          gregorianDate: e.gregorian_date,
          hebrewDate: e.hebrew_date,
          dayOrNight: e.day_or_night,
          createdBySystem: !!e.created_by_system,
          predictionType: e.prediction_type,
          notes: e.notes,
        })),
      });
    } catch (e) {
      console.error('Events error:', e.message);
      res.status(500).json({ error: 'שגיאה בשמירת הארוע' });
    }
  });

  // GET /api/events — get all user events (with predictions)
  app.get('/api/events', authMiddleware, (req, res) => {
    try {
      const userId = req.user.sub;
      const includeSystem = req.query.includePredictions === 'true';
      const events = db.getEvents(userId, includeSystem);
      res.json({
        events: events.map(e => ({
          id: e.id,
          type: e.type,
          gregorianDate: e.gregorian_date,
          hebrewDate: e.hebrew_date,
          dayOrNight: e.day_or_night,
          createdBySystem: !!e.created_by_system,
          predictionType: e.prediction_type,
          notes: e.notes,
          createdAt: e.created_at,
        })),
      });
    } catch (e) {
      console.error('Events get error:', e.message);
      res.status(500).json({ error: 'שגיאה בטעינת הארועים' });
    }
  });

  // DELETE /api/events/:id — delete a user event + recalculate
  app.delete('/api/events/:id', authMiddleware, (req, res) => {
    try {
      const userId = req.user.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'מזהה ארוע לא תקין' });

      db.deleteEvent(id, userId);
      db.deleteSystemPredictions(userId);

      // Recalculate
      const events = db.getEvents(userId, false);
      const sightings = eventsToSightings(events);
      const predictions = calculateAll(sightings);
      for (const pred of predictions) {
        for (const date of pred.dates) {
          db.insertEvent({
            userId,
            type: 'prediction',
            gregorianDate: date,
            hebrewDate: '',
            dayOrNight: 'day',
            createdBySystem: true,
            predictionType: pred.type,
            notes: pred.description || '',
          });
        }
      }

      res.json({ success: true, predictions });
    } catch (e) {
      console.error('Events delete error:', e.message);
      res.status(500).json({ error: 'שגיאה במחיקת הארוע' });
    }
  });
}
