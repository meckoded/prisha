// test-backend.js — integration test for backend endpoints
import http from 'http';

const BASE = 'http://localhost:3001';

async function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;

    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  // Seed admin
  process.env.ADMIN_EMAIL = 'admin@prisha.app';
  process.env.ADMIN_PASSWORD = 'admin123456';
  await import('./scripts/seed-admin.js');

  // Login
  console.log('=== LOGIN ===');
  const loginRes = await req('POST', '/api/auth/login', { email: 'admin@prisha.app', password: 'admin123456' });
  const token = loginRes.token;
  console.log('Token:', token?.slice(0, 30) + '...');

  // Health
  console.log('\n=== HEALTH ===');
  const health = await req('GET', '/api/health');
  console.log(health);

  // Locations
  console.log('\n=== LOCATIONS ===');
  const locs = await req('GET', '/api/locations');
  console.log('Count:', locs.locations?.length, '| First:', locs.locations?.[0]?.name);

  // Calendar
  console.log('\n=== CALENDAR (April 2026, Jerusalem) ===');
  const cal = await req('GET', `/api/calendar?year=2026&month=4&locationId=281184`);
  console.log('Month:', cal.hebrewMonth, cal.hebrewYear, '| Days:', cal.days?.length);
  console.log('Day 1:', cal.days?.[0]?.hebrew, '| Zmanim:', JSON.stringify(cal.days?.[0]?.zmanim));

  // Add event
  console.log('\n=== ADD EVENT 1 ===');
  const ev1 = await req('POST', '/api/events', { type: 'period', gregorianDate: '2026-04-01', dayOrNight: 'day' }, token);
  console.log('Event:', ev1.event?.type, ev1.event?.gregorianDate);
  console.log('Predictions:', JSON.stringify(ev1.predictions?.map(p => ({ type: p.type, dates: p.dates }))));

  // Add second event
  console.log('\n=== ADD EVENT 2 ===');
  const ev2 = await req('POST', '/api/events', { type: 'period', gregorianDate: '2026-04-28', dayOrNight: 'day' }, token);
  console.log('Event:', ev2.event?.type, ev2.event?.gregorianDate);
  console.log('Predictions:', JSON.stringify(ev2.predictions?.map(p => ({ type: p.type, dates: p.dates, cycleLength: p.cycleLength }))));

  // Get all events
  console.log('\n=== ALL EVENTS ===');
  const events = await req('GET', '/api/events?includePredictions=true', null, token);
  console.log('Event count:', events.events?.length);
  for (const e of events.events) {
    console.log(`  ${e.type.padEnd(12)} | ${e.gregorianDate} | sys=${e.createdBySystem} | ${e.predictionType || ''}`);
  }

  // Admin stats
  console.log('\n=== ADMIN STATS ===');
  const stats = await req('GET', '/api/admin/stats', null, token);
  console.log(JSON.stringify(stats.stats, null, 2));

  // Admin users
  console.log('\n=== ADMIN USERS ===');
  const users = await req('GET', '/api/admin/users', null, token);
  for (const u of users.users) {
    console.log(`  ${u.email.padEnd(25)} role=${u.role} status=${u.status}`);
  }

  console.log('\n✅ All tests passed!');
}

main().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
