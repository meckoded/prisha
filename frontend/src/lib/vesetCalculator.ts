// lib/vesetCalculator.ts — חישובי וסת (צד לקוח)
// Used as fallback when backend is offline

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const dateA = new Date(Date.UTC(ay, am - 1, ad, 12, 0, 0));
  const dateB = new Date(Date.UTC(by, bm - 1, bd, 12, 0, 0));
  return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}

export interface VesetSighting {
  date: string;
}

export interface VesetPrediction {
  type: string;
  description: string;
  dates: string[];
  cycleLength?: number;
}

function parseSightings(sightings: VesetSighting[]): string[] {
  return sightings.map(s => s.date).filter(Boolean).sort();
}

export function calculateMonthly(sightings: VesetSighting[]): string[] {
  return parseSightings(sightings).map(d => addDays(d, 30));
}

export function calculateMedium(sightings: VesetSighting[]): string[] {
  return parseSightings(sightings).flatMap(d => [addDays(d, 30), addDays(d, 31)]);
}

export function calculateHaflaga(sightings: VesetSighting[]): { dates: string[]; cycleLength: number } {
  const dates = parseSightings(sightings);
  if (dates.length < 2) return { dates: [], cycleLength: 0 };
  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    intervals.push(daysBetween(dates[i - 1], dates[i]));
  }
  const avg = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
  return { dates: [addDays(dates[dates.length - 1], avg)], cycleLength: avg };
}

export function calculateAll(sightings: VesetSighting[], vesetTypes?: string[]): VesetPrediction[] {
  const results: VesetPrediction[] = [];
  const types = vesetTypes || ['monthly', 'medium', 'haflaga'];

  if (types.includes('monthly')) {
    results.push({
      type: 'monthly',
      description: 'עונת החודש — 30 יום לאחר ראייה',
      dates: calculateMonthly(sightings),
    });
  }
  if (types.includes('medium')) {
    results.push({
      type: 'medium',
      description: 'עונה בינונית — 30 ו-31 יום לאחר ראייה',
      dates: calculateMedium(sightings),
    });
  }
  if (types.includes('haflaga')) {
    const h = calculateHaflaga(sightings);
    if (h.dates.length > 0) {
      results.push({ type: 'haflaga', description: `עונת הפלגה — מחזור ממוצע של ${h.cycleLength} ימים`, dates: h.dates, cycleLength: h.cycleLength });
    }
  }
  return results;
}
