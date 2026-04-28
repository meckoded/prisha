// api/veset.js — POST /api/veset/calculate
import { calculateAll } from '../services/vesetService.js';

export function registerRoutes(app) {
  app.post('/api/veset/calculate', (req, res) => {
    try {
      const { sightings, vesetTypes } = req.body || {};
      if (!sightings || sightings.length === 0) {
        return res.status(400).json({ error: 'חובה להזין לפחות תאריך ראייה אחד' });
      }

      const predictions = calculateAll(sightings, vesetTypes);
      res.json({ predictions });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}
