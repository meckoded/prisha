// services/vesetService.js — חישוב ימי עונה (מודולרי)

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

function parseSightings(sightings) {
  return sightings
    .map(s => (typeof s === 'string' ? s : s.date))
    .sort();
}

export function calculateMonthly(sightings) {
  const dates = parseSightings(sightings);
  return dates.map(d => addDays(d, 30));
}

export function calculateMedium(sightings) {
  const dates = parseSightings(sightings);
  return dates.flatMap(d => [addDays(d, 30), addDays(d, 31)]);
}

export function calculateHaflaga(sightings) {
  const dates = parseSightings(sightings);
  if (dates.length < 2) return { dates: [], cycleLength: 0 };
  const intervals = [];
  for (let i = 1; i < dates.length; i++) {
    intervals.push(daysBetween(dates[i - 1], dates[i]));
  }
  const avg = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
  const last = dates[dates.length - 1];
  return { dates: [addDays(last, avg)], cycleLength: avg };
}

export function calculateAll(sightings, vesetTypes) {
  const results = [];
  const types = vesetTypes || ['monthly', 'medium', 'haflaga'];

  if (types.includes('monthly')) {
    results.push({
      type: 'monthly',
      description: 'עונת החודש — יום 30 לאחר ראייה',
      dates: calculateMonthly(sightings),
    });
  }

  if (types.includes('medium')) {
    results.push({
      type: 'medium',
      description: 'עונה בינונית — יום 30 ויום 31 לאחר הראייה',
      dates: calculateMedium(sightings),
    });
  }

  if (types.includes('haflaga')) {
    const haflaga = calculateHaflaga(sightings);
    if (haflaga.dates.length > 0) {
      results.push({
        type: 'haflaga',
        description: 'עונת הפלגה — חישוב לפי ממוצע מרווחים',
        dates: haflaga.dates,
        cycleLength: haflaga.cycleLength,
      });
    }
  }

  return results;
}
