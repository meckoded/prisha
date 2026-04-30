// services/emailService.js — שליחת מיילים דרך Resend API
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.MAIL_FROM || 'studio@grafitazia.com';

/**
 * שליחת מייל דרך Resend
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.text
 * @param {string} [params.html]
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[emailService] RESEND_API_KEY לא מוגדר — מייל לא נשלח');
    return { success: false, error: 'RESEND_API_KEY missing' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject,
      text,
      html,
    });
    console.log('[emailService] מייל נשלח:', result.id);
    return { success: true, id: result.id };
  } catch (err) {
    console.error('[emailService] שגיאה בשליחת מייל:', err.message);
    return { success: false, error: err.message };
  }
}
