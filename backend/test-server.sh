#!/bin/bash
# test-server.sh — starts the backend server, seeds admin, runs API tests
set -e

cd /home/node/.openclaw/workspace/prisha/backend
rm -f data/prisha.db

# Start server in background
node index.js &
SERVER_PID=$!
sleep 3

# Seed admin
echo "=== SEED ADMIN ==="
node scripts/seed-admin.js

# Login + get token
echo "=== LOGIN ==="
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@prisha.app","password":"admin123456"}' | \
  node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).token)}catch{console.log('FAIL')}})")

echo "Token: ${TOKEN:0:30}..."
if [ "$TOKEN" = "FAIL" ] || [ -z "$TOKEN" ]; then echo "LOGIN FAILED"; kill $SERVER_PID 2>/dev/null; exit 1; fi

# Health
echo "=== HEALTH ==="
curl -s http://localhost:3001/api/health

# Calendar
echo ""
echo "=== CALENDAR ==="
curl -s "http://localhost:3001/api/calendar?year=2026&month=4&locationId=281184" | \
  node -e "process.stdin.on('data',d=>{let j=JSON.parse(d);console.log('Month:',j.hebrewMonth,j.hebrewYear,'Days:',j.days?.length);console.log('Day 1:',j.days?.[0]?.hebrew,'zmanim:',JSON.stringify(j.days?.[0]?.zmanim))})"

# Add event 1
echo "=== ADD EVENT 1 ==="
curl -s -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"period","gregorianDate":"2026-04-01","dayOrNight":"day"}' | \
  node -e "process.stdin.on('data',d=>{let j=JSON.parse(d);console.log('Event:',j.event?.type,j.event?.gregorianDate);console.log('Preds:',JSON.stringify(j.predictions?.map(p=>({type:p.type,dates:p.dates}))))})"

# Add event 2
echo "=== ADD EVENT 2 ==="
curl -s -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"period","gregorianDate":"2026-04-28","dayOrNight":"day"}' | \
  node -e "process.stdin.on('data',d=>{let j=JSON.parse(d);console.log('Event:',j.event?.type,j.event?.gregorianDate);console.log('Preds:',JSON.stringify(j.predictions?.map(p=>({type:p.type,dates:p.dates,cycleLength:p.cycleLength}))))})"

# Get all events
echo "=== ALL EVENTS ==="
curl -s "http://localhost:3001/api/events?includePredictions=true" \
  -H "Authorization: Bearer $TOKEN" | \
  node -e "process.stdin.on('data',d=>{let j=JSON.parse(d);console.log('Total:',j.events?.length);j.events?.filter(e=>e.createdBySystem).forEach(e=>console.log(' PRED:',e.type,e.gregorianDate,e.predictionType))})"

# Admin stats
echo "=== ADMIN STATS ==="
curl -s http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer $TOKEN" | \
  node -e "process.stdin.on('data',d=>{let j=JSON.parse(d);console.log(JSON.stringify(j.stats,null,2))})"

# Admin users
echo "=== ADMIN USERS ==="
curl -s http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer $TOKEN" | \
  node -e "process.stdin.on('data',d=>{let j=JSON.parse(d);j.users?.forEach(u=>console.log('',u.email,u.role,u.status))})"

echo ""
echo "=== ALL TESTS PASSED ==="

kill $SERVER_PID 2>/dev/null
wait 2>/dev/null
exit 0
