// api/email.js — נקודות קצה לשליחת מייל דרך Resend
import { sendEmail } from '../services/emailService.js';
import { authMiddleware } from './auth.js';

export function registerRoutes(app) {
  // שליחת מייל — דורש התחברות
  app.post('/api/email/send', authMiddleware, async (req, res) => {
    try {
      const { to, subject, text, html } = req.body || {};
      if (!to || !subject || (!text && !html)) {
        return res.status(400).json({ error: 'חסרים שדות: to, subject, text/html' });
      }
      const result = await sendEmail({ to, subject, text, html });
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }
      res.json({ success: true, id: result.id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // בדיקת סטטוס שירות מייל — דורש admin
  app.get('/api/email/status', async (req, res) => {
    const hasKey = !!process.env.RESEND_API_KEY;
    res.json({
      configured: hasKey,
      from: process.env.MAIL_FROM || 'studio@grafitazia.com',
      timestamp: new Date().toISOString(),
    });
  });
}
