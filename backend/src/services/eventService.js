// services/eventService.js — Event management with auto-predictions
import * as db from './dbService.js';
import { calculateAll } from './vesetService.js';

/**
 * Add a user event and regenerate predictions
 */
export function addEvent(userId, { type, gregorianDate, hebrewDate, dayOrNight, notes }) {
  if (!userId) throw new Error('נדרש מזהה משתמש');
  if (!type || !['period', 'spot', 'birth'].includes(type)) throw new Error('סוג אירוע לא תקין');
  if (!gregorianDate || !/^\d{4}-\d{2}-\d{2}$/.test(gregorianDate)) throw new Error('תאריך לא תקין');

  // Insert the event
  const result = db.insertEvent(userId, type, gregorianDate, hebrewDate || null, dayOrNight || 'day', false, null, notes || null);

  // Regenerate predictions if this is a period event
  if (type === 'period') {
    regeneratePredictions(userId);
  }

  return db.getEventById(result.lastInsertRowid);
}

/**
 * Delete an event and regenerate predictions
 */
export function deleteEventById(eventId, userId) {
  const event = db.getEventById(eventId);
  if (!event) throw new Error('האירוע לא נמצא');
  if (event.user_id !== userId) throw new Error('אין הרשאה למחוק אירוע זה');

  db.deleteEvent(eventId);

  // Regenerate if the deleted event was a period
  if (event.type === 'period') {
    regeneratePredictions(userId);
  }

  return { deleted: true };
}

/**
 * Get user events with optional prediction inclusion
 */
export function getUserEvents(userId, includePredictions = true) {
  return db.getEvents(userId, includePredictions);
}

/**
 * Get events for a specific month range
 */
export function getEventsForMonth(userId, year, month, includePredictions = true) {
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const toDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  return db.getEventsInRange(userId, fromDate, toDate, includePredictions);
}

/**
 * Regenerate predictions based on user's period events
 */
function regeneratePredictions(userId) {
  // Delete existing system predictions
  db.deleteSystemPredictions(userId);

  // Get all user-entered period events (not system predictions)
  const periodEvents = db.getEvents(userId, false)
    .filter(e => e.type === 'period')
    .sort((a, b) => a.gregorian_date.localeCompare(b.gregorian_date));

  if (periodEvents.length === 0) return;

  // Extract dates for veset calculation
  const sightings = periodEvents.map(e => e.gregorian_date);

  // Calculate all prediction types
  const predictions = calculateAll(sightings, ['monthly', 'medium', 'haflaga']);

  // Insert each prediction as a system event
  for (const pred of predictions) {
    for (const date of pred.dates) {
      // Skip dates already in the user's period events
      const alreadyExists = periodEvents.some(e => e.gregorian_date === date);
      if (!alreadyExists) {
        db.insertEvent(userId, 'prediction', date, null, 'day', true, pred.type, pred.description);
      }
    }
  }
}

/**
 * Get available algorithm names
 */
export function getAlgorithmNames() {
  return ['monthly', 'medium', 'haflaga'];
}
