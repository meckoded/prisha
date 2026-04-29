// api/veset.js — POST /api/veset/calculate
import { calculateAll } from '../services/vesetService.js';

function errorResponse(res, status, message) {
  return res.status(status).json({ error: message });
}

export function registerRoutes(app) {
  app.post('/api/veset/calculate', (req, res) => {
    try {
      const { sightings, vesetTypes } = req.body || {};

      // Validate sightings is an array
      if (!sightings || !Array.isArray(sightings) || sightings.length === 0) {
        return errorResponse(res, 400, 'חובה להזין לפחות תאריך ראייה אחד כמערך');
      }

      // Validate each sighting has a date
      for (const s of sightings) {
        const date = typeof s === 'string' ? s : s?.date;
        if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return errorResponse(res, 400, `תאריך לא תקין: ${JSON.stringify(s)}. פורמט נדרש: YYYY-MM-DD`);
        }
      }

      // Validate vesetTypes if provided
      if (vesetTypes && !Array.isArray(vesetTypes)) {
        return errorResponse(res, 400, 'vesetTypes חייב להיות מערך');
      }

      const predictions = calculateAll(sightings, vesetTypes);
      res.json({ predictions });
    } catch (e) {
      // Safe error — don't expose internal details
      console.error('Veset calculation error:', e.message);
      res.status(500).json({ error: 'שגיאה בחישוב הווסת. נסה שוב מאוחר יותר.' });
    }
  });
}
