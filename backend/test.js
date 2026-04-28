// test.js — debugging Hebcal API
import { HebrewCalendar, HDate, Location, Zmanim, getHolidaysOnDate, getSedra, flags, GeoLocation } from '@hebcal/core';

console.log('=== Hebcal API Test ===');

// Create Hebrew date
const hd = new HDate(new Date(2026, 3,安排)); // April 28
console.log('HDate:', hd.render('he'));
console.log('Month name:', hd.getMonthName());
console.log('Full year:', hd.getFullYear());

// Try HebrewCalendar.getHolidaysOnDate
console.log('\n--- HebrewCalendar.getHolidaysOnDate ---');
const holidays = HebrewCalendar.getHolidaysOnDate(hd, false);
console.log('holidays type:', typeof holidays, 'is array?', Array.isArray(holidays));
if (Array.isArray(holidays)) {
  console.log('Number of events:', holidays.length);
  holidays.forEach(e => {
    console.log('  ', e.render('he'), e.getDesc ? e.getDesc() : '', 'flags:', e.getFlags());
  });
} else {
  console.log('holidays:', holidays);
}

// Try getSedra
console.log('\n--- getSedra ---');
const sedra = getSedra(hd, false);
console.log('sedra:', JSON.stringify(sedra));

// Try GeoLocation + Zmanim
console.log('\n--- Zmanim Test ---');
const geo = new GeoLocation(null, 'Jerusalem', 31.7683, 35.2137, 800, 'Asia/Jerusalem');
console.log('GeoLocation created:', geo.getName());
const z = new Zmanim(new Date(2026, 3, 28), geo);
const times = z.getTimes();
console.log('Times object keys:', Object.keys(times));
const sampleKeys = ['alotHaShachar', 'sunrise', 'sunset', 'tzeitHaKochavim'];
for (const key of sampleKeys) {
  if (times[key]) console.log(`  ${key}:`, times[key]);
}

// Check flags constant
console.log('\n--- flags.PARSHA_HASHAVUA ---');
console.log('PARSHA_HASHAVUA hex:', flags.PARSHA_HASHAVUA);
