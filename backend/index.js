// index.js — Express server for Prisha backend
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes as registerCalendar } from './src/api/calendar.js';
import { registerRoutes as registerVeset } from './src/api/veset.js';
import { registerRoutes as registerAuth } from './src/api/auth.js';
import { init } from './src/services/dbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
init();

// Routes
registerCalendar(app);
registerVeset(app);
registerAuth(app);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  // Express 5 catch-all — sendFile for non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🕎 Prisha backend running on http://localhost:${PORT}`);
});

export default app;
