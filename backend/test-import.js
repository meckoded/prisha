// test-import.js
import { HDate, getSedra, GeoLocation, Zmanim } from '@hebcal/core';

console.log('Testing Hebcal core import...');

const hd = new HDate(new Date(2026, 3, 28));
console.log('HDate:', hd.render('he'));
console.log('Month:', hd.getMonthName());
console.log('Year:', hd.getFullYear());

const sedra = getSedra(hd, false);
console.log('Sedra:', sedra ? JSON.stringify(sedra) : 'null');

const geo = new GeoLocation(null, 'Jerusalem', 31.7683, 35.2137, 800, 'Asia/Jerusalem');
console.log('GeoLocation:', geo.getName());

const z = new Zmanim(new Date(2026, 3, 28), geo);
const times = z.getTimes();
console.log('Times keys count:', Object.keys(times).length);
if (times.sunrise) console.log('Sunrise:', times.sunrise);
if (times.sunset) console.log('Sunset:', times.sunset);

console.log('Import successful.');
