// services/calendarService.js — לוח שנה יהודי + זמני היום אמיתיים באמצעות @hebcal/core
import { Location, Zmanim, HebrewCalendar, HDate, flags as hebcalFlags } from '@hebcal/core';

const LOCATIONS = {
  '281184': { name: 'ירושלים', hebrewName: 'ירושלים', lat: 31.7683, lng: 35.2137, tz: 'Asia/Jerusalem' },
  '293397': { name: 'תל אביב', hebrewName: 'תל אביב', lat: 32.0853, lng: 34.7818, tz: 'Asia/Jerusalem' },
  '294514': { name: 'חיפה', hebrewName: 'חיפה', lat: 32.7940, lng: 34.9896, tz: 'Asia/Jerusalem' },
  '282185': { name: 'באר שבע', hebrewName: 'באר שבע', lat: 31.2520, lng: 34.7915, tz: 'Asia/Jerusalem' },
  '293308': { name: 'נתניה', hebrewName: 'נתניה', lat: 32.3215, lng: 34.8532, tz: 'Asia/Jerusalem' },
  '293286': { name: 'פתח תקווה', hebrewName: 'פתח תקווה', lat: 32.0880, lng: 34.8867, tz: 'Asia/Jerusalem' },
  '293896': { name: 'אשדוד', hebrewName: 'אשדוד', lat: 31.8044, lng: 34.6553, tz: 'Asia/Jerusalem' },
  '294387': { name: 'אילת', hebrewName: 'אילת', lat: 29.5577, lng: 34.9519, tz: 'Asia/Jerusalem' },
  '293783': { name: 'צפת', hebrewName: 'צפת', lat: 32.9646, lng: 35.4968, tz: 'Asia/Jerusalem' },
  '281109': { name: 'טבריה', hebrewName: 'טבריה', lat: 32.7927, lng: 35.5314, tz: 'Asia/Jerusalem' },
};

export function getLocation(id) {
  const loc = LOCATIONS[id];
  if (!loc) return null;
  return { id, name: loc.name, hebrewName: loc.hebrewName, lat: loc.lat, lng: loc.lng, timezone: loc.tz };
}

export function getAllLocations() {
  return Object.entries(LOCATIONS).map(([id, loc]) => ({
    id,
    name: loc.name,
    hebrewName: loc.hebrewName,
    lat: loc.lat,
    lng: loc.lng,
    timezone: loc.tz,
  }));
}

function toHebcalLocation(locData) {
  return new Location(locData.lat, locData.lng, true, locData.tz);
}

function formatTime(dt) {
  if (!dt) return null;
  const h = dt.getUTCHours();
  const m = dt.getUTCMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getZmanimForDate(loc, date) {
  try {
    const z = new Zmanim(loc, date);
    return {
      alot: formatTime(z.alotHaShachar()),
      sunrise: formatTime(z.neitzHaChama()),
      sofZman: formatTime(z.sofZmanShma()),
      mincha: formatTime(z.minchaGedola()),
      sunset: formatTime(z.shkiah()),
      tzeit: formatTime(z.tzeit()),
    };
  } catch {
    return {
      alot: null, sunrise: null, sofZman: null, mincha: null, sunset: null, tzeit: null,
    };
  }
}

/**
 * Determine if an event is a "holiday" for display purposes.
 * We include: CHAG, MINOR_FAST, MAJOR_FAST, MODERN_HOLIDAY, MINOR_HOLIDAY, ROSH_CHODESH, EREV, CHOL_HAMOED
 * We exclude: LIGHT_CANDLES, YOM_TOV_ENDS, CANDLE_LIGHTING types (handled separately)
 */
const HOLIDAY_FLAGS =
  hebcalFlags.CHAG |
  hebcalFlags.MINOR_FAST |
  hebcalFlags.MAJOR_FAST |
  hebcalFlags.MODERN_HOLIDAY |
  hebcalFlags.MINOR_HOLIDAY |
  hebcalFlags.ROSH_CHODESH;

function isHolidayEvent(ev) {
  const f = ev.getFlags();
  // Skip candle-lighting and havdalah events (handled separately)
  if (f & (hebcalFlags.LIGHT_CANDLES | hebcalFlags.YOM_TOV_ENDS | hebcalFlags.LIGHT_CANDLES_TZEIS)) return false;
  // Skip parsha, daf yomi, omer, daily learning
  if (f & (hebcalFlags.PARSHA_HASHAVUA | hebcalFlags.DAF_YOMI | hebcalFlags.OMER_COUNT | hebcalFlags.DAILY_LEARNING)) return false;
  return (f & HOLIDAY_FLAGS) !== 0;
}

function isCandleEvent(ev) {
  return (ev.getFlags() & hebcalFlags.LIGHT_CANDLES) !== 0 || (ev.getFlags() & hebcalFlags.LIGHT_CANDLES_TZEIS) !== 0;
}

function isHavdalahEvent(ev) {
  return (ev.getFlags() & hebcalFlags.YOM_TOV_ENDS) !== 0;
}

function isParshaEvent(ev) {
  return ev.constructor.name === 'ParshaEvent' || (ev.getFlags() & hebcalFlags.PARSHA_HASHAVUA) !== 0;
}

export async function getMonth(year, month, locationId) {
  const locData = LOCATIONS[locationId];
  if (!locData) return null;

  const hebcalLoc = toHebcalLocation(locData);

  // Get Hebrew month/year from the first day of the requested month
  const firstOfMonth = new Date(year, month - 1, 1);
  const hd = new HDate(firstOfMonth);

  // Build days array using @hebcal/core calendar events
  const events = HebrewCalendar.calendar({ year, month });

  // Index events by date string
  const eventsByDate = {};
  for (const ev of events) {
    const g = ev.date.greg();
    const dateStr = g.toISOString().slice(0, 10);
    if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
    eventsByDate[dateStr].push(ev);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = date.toISOString().slice(0, 10);
    const hdDay = new HDate(date);
    const dayEvents = eventsByDate[dateStr] || [];

    const holidays = dayEvents
      .filter(isHolidayEvent)
      .map(ev => ev.render('he'))
      .filter(Boolean);

    const candleEv = dayEvents.find(isCandleEvent);
    const havdalahEv = dayEvents.find(isHavdalahEvent);
    const parshaEv = dayEvents.find(isParshaEvent);

    const zmanim = getZmanimForDate(hebcalLoc, date);

    days.push({
      gregorian: dateStr,
      hebrew: hdDay.render('he'),
      parsha: parshaEv ? parshaEv.render('he') : null,
      zmanim,
      holidays: [...new Set(holidays)],
      candleLighting: candleEv ? candleEv.render('he') : null,
      havdalah: havdalahEv ? havdalahEv.render('he') : null,
    });
  }

  return {
    year,
    month,
    hebrewMonth: hd.getMonthName(),
    hebrewYear: String(hd.getFullYear()),
    days,
    location: { id: locationId, name: locData.name },
  };
}
