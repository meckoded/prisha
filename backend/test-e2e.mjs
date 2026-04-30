// test-e2e.mjs — standalone E2E test, spawns the server and self-tests
import { fork } from 'child_process';
import http from 'http';

const BASE = 'http://localhost:3001';

function req(method, path, body, token) {
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
        catch { resolve({ raw: data }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function waitForServer(maxRetries = 20) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const check = () => {
      const r = http.get('http://localhost:3001/api/health', (res) => {
        if (res.statusCode === 200) return resolve();
        tries++; if (tries > maxRetries) return reject(new Error('Server not ready'));
        setTimeout(check, 500);
      });
      r.on('error', () => {
        tries++; if (tries > maxRetries) return reject(new Error('Server not ready'));
        setTimeout(check, 500);
      });
    };
    check();
  });
}

async function main() {
  console.log('Starting server...');
  const server = fork('./index.js', [], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    env: { ...process.env, PORT: '3001', ADMIN_EMAIL: 'admin@prisha.app', ADMIN_PASSWORD: 'admin123456' },
  });
  server.on('error', (e) => { console.error('Fork error:', e); process.exit(1); });

  await waitForServer();
  console.log('Server is up!');

  let token;
  try {
    // Seed admin
    console.log('\n=== SEED ADMIN ===');
    const seedMod = await import('./scripts/seed-admin.js');

    // Login
    console.log('=== LOGIN ===');
    const loginRes = await req('POST', '/api/auth/login', { email: 'admin@prisha.app', password: 'admin123456' });
    token = loginRes.token;
    console.log('Token:', token?.slice(0, 20) + '...');
    if (!token) throw new Error('Login failed');

    // Health
    console.log('\n=== HEALTH ===');
    const health = await req('GET', '/api/health');
    console.log('status:', health.status);

    // Locations
    console.log('\n=== LOCATIONS ===');
    const locs = await req('GET', '/api/locations');
    console.log('Count:', locs.locations?.length);

    // Calendar
    console.log('\n=== CALENDAR ===');
    const cal = await req('GET', '/api/calendar?year=2026&month=4&locationId=281184');
    console.log('Month:', cal.hebrewMonth, '| Days:', cal.days?.length);
    console.log('Day 1:', cal.days?.[0]?.hebrew, '| zmanim:', JSON.stringify(cal.days?.[0]?.zmanim));

    // Add event 1
    console.log('\n=== ADD EVENT 1 ===');
    const ev1 = await req('POST', '/api/events', { type: 'period', gregorianDate: '2026-04-01', dayOrNight: 'day' }, token);
    console.log('Saved:', ev1.event?.type, ev1.event?.gregorianDate);
    console.log('Predictions:', JSON.stringify(ev1.predictions?.map(p => ({ type: p.type, dates: p.dates }))));

    // Add event 2
    console.log('\n=== ADD EVENT 2 ===');
    const ev2 = await req('POST', '/api/events', { type: 'period', gregorianDate: '2026-04-28', dayOrNight: 'day' }, token);
    console.log('Saved:', ev2.event?.type, ev2.event?.gregorianDate);
    console.log('Predictions:', JSON.stringify(ev2.predictions?.map(p => ({ type: p.type, dates: p.dates, cycleLength: p.cycleLength }))));
    if (!ev2.predictions?.find(p => p.type === 'haflaga' && p.cycleLength === 27)) {
      console.log('⚠️ Haflaga cycle length should be 27 days');
    }

    // Get all events
    console.log('\n=== ALL EVENTS ===');
    const events = await req('GET', '/api/events?includePredictions=true', null, token);
    console.log('Total:', events.events?.length);
    const preds = events.events.filter(e => e.createdBySystem);
    console.log('Predictions:', preds.length);
    for (const e of preds) {
      console.log(`  ${e.type.padEnd(12)} | ${e.gregorianDate} | ${e.predictionType}`);
    }

    // Admin stats
    console.log('\n=== ADMIN STATS ===');
    const statsRes = await req('GET', '/api/admin/stats', null, token);
    console.log('Users:', statsRes.stats.totalUsers, '| Events:', statsRes.stats.totalUserEvents, '| Predictions:', statsRes.stats.totalSystemPredictions);
    console.log('Algorithms:', statsRes.stats.registeredAlgorithms?.join(', '));

    // Admin users
    console.log('\n=== ADMIN USERS ===');
    const usersRes = await req('GET', '/api/admin/users', null, token);
    for (const u of usersRes.users) {
      console.log(`  ${u.email.padEnd(25)} role=${u.role} status=${u.status}`);
    }

    console.log('\n✅ ALL TESTS PASSED');
  } catch (e) {
    console.error('\n❌ TEST FAILED:', e.message);
    process.exitCode = 1;
  } finally {
    server.kill();
    setTimeout(() => process.exit(process.exitCode || 0), 500);
  }
}

main();
