// services/vesetService.js — חישוב ימי עונה (מודולרי עם algorithm registry)
// כל אלגוריתם חדש: registerAlgorithm(name, fn) → fn(sightings) → { dates, cycleLength?, description }

const algorithmRegistry = new Map();

export function registerAlgorithm(name, fn, description) {
  algorithmRegistry.set(name, { fn, description });
}

export function getAlgorithmNames() {
  return [...algorithmRegistry.keys()];
}

export function getAlgorithmDescription(name) {
  return algorithmRegistry.get(name)?.description || '';
}

// ─── Helpers ───

function addDays(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const dateA = new Date(Date.UTC(ay, am - 1, ad, 12, 0, 0));
  const dateB = new Date(Date.UTC(by, bm - 1, bd, 12, 0, 0));
  return Math.round((dateB - dateA) / (1000 * 60 * 60 * 24));
}

function parseSightings(sightings) {
  if (!Array.isArray(sightings)) return [];
  return sightings
    .map(s => (typeof s === 'string' ? s : s?.date || s?.gregorianDate))
    .filter(Boolean)
    .sort();
}

// ─── Default algorithms ───

registerAlgorithm('monthly', (sightings) => {
  const dates = parseSightings(sightings);
  return { dates: dates.map(d => addDays(d, 30)), description: 'עונת החודש — 30 יום לאחר ראייה' };
}, 'עונת החודש — 30 יום לאחר ראייה');

registerAlgorithm('medium', (sightings) => {
  const dates = parseSightings(sightings);
  return { dates: dates.flatMap(d => [addDays(d, 30), addDays(d, 31)]), description: 'עונה בינונית — 30 ו-31 יום לאחר ראייה' };
}, 'עונה בינונית — 30 ו-31 יום לאחר הראייה');

registerAlgorithm('haflaga', (sightings) => {
  const dates = parseSightings(sightings);
  if (dates.length < 2) return { dates: [], cycleLength: 0, description: 'עונת הפלגה — דרושות לפחות 2 ראיות' };
  const intervals = [];
  for (let i = 1; i < dates.length; i++) {
    intervals.push(daysBetween(dates[i - 1], dates[i]));
  }
  const avg = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
  const last = dates[dates.length - 1];
  return { dates: [addDays(last, avg)], cycleLength: avg, description: `עונת הפלגה — מחזור ממוצע ${avg} ימים` };
}, 'עונת הפלגה — חישוב לפי ממוצע מרווחים');

// ─── Public API ───

export function calculateAll(sightings, algorithmNames) {
  const results = [];
  const names = algorithmNames || ['monthly', 'medium', 'haflaga'];

  for (const name of names) {
    const algo = algorithmRegistry.get(name);
    if (!algo) continue;
    try {
      const result = algo.fn(sightings);
      results.push({
        type: name,
        description: result.description || algo.description || '',
        dates: result.dates || [],
        cycleLength: result.cycleLength,
      });
    } catch (e) {
      console.error(`Algorithm "${name}" error:`, e.message);
    }
  }

  return results;
}

// ─── From user events → sightings ───

export function eventsToSightings(events) {
  return (events || [])
    .filter(e => e.type === 'period' || e.type === 'birth')
    .map(e => e.gregorian_date || e.gregorianDate)
    .filter(Boolean)
    .sort();
}
