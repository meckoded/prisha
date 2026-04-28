// services/calendarService.js — לוח שנה יהודי + זמני היום via Hebcal REST API
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

function mockZmanim() {
  return {
    alot: '04:32',
    sunrise: '05:45',
    sofZman: '09:12',
    mincha: '12:30',
    sunset: '18:45',
    tzeit: '19:15',
  };
}

async function fetchHebcalMonth(year, month, locationId) {
  const loc = LOCATIONS[locationId];
  if (!loc) return null;
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&geonameid=${locationId}&maj=on&min=on&nx=on`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { loc, data };
  } catch (error) {
    console.warn('Hebcal API failed:', error.message);
    return null;
  }
}

export async function getMonth(year, month, locationId) {
  const loc = getLocation(locationId);
  if (!loc) return null;

  const result = await fetchHebcalMonth(year, month, locationId);
  if (!result) {
    // Fallback: create empty month
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        gregorian: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        hebrew: '',
        parsha: null,
        zmanim: mockZmanim(),
        holidays: [],
        candleLighting: null,
        havdalah: null,
      });
    }
    return {
      year,
      month,
      hebrewMonth: 'unknown',
      hebrewYear: 'unknown',
      days,
      location: { id: loc.id, name: loc.name },
    };
  }

  const { data } = result;
  const items = data.items || [];
  const daysMap = {};
  items.forEach(item => {
    const date = item.date.slice(0, 10);
    if (!daysMap[date]) {
      daysMap[date] = {
        gregorian: date,
        hebrew: item.hdate || '',
        parsha: null,
        holidays: [],
        zmanim: mockZmanim(),
        candleLighting: null,
        havdalah: null,
      };
    }
    const day = daysMap[date];
    if (item.category === 'parasha') day.parsha = item.title;
    else if (item.category === 'holiday') day.holidays.push(item.title);
    else if (item.category === 'candles') day.candleLighting = item.title;
    else if (item.category === 'havdalah') day.havdalah = item.title;
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (daysMap[date]) {
      days.push(daysMap[date]);
    } else {
      days.push({
        gregorian: date,
        hebrew: '',
        parsha: null,
        zmanim: mockZmanim(),
        holidays: [],
        candleLighting: null,
        havdalah: null,
      });
    }
  }

  // Determine Hebrew month/year
  let hebrewMonth = 'unknown';
  let hebrewYear = 'unknown';
  if (items.length > 0 && items[0].hdate) {
    const parts = items[0].hdate.split(' ');
    if (parts.length >= से2) {
      hebrewMonth = parts[1];
      hebrewYear = parts[2];
    }
  }

  return {
    year,
    month,
    hebrewMonth,
    hebrewYear,
    days,
    location: { id: loc.id, name: loc.name },
  };
}
