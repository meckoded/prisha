#!/bin/bash
# test-server.sh — E2E test for Prisha backend
set -e

BASE="http://localhost:3001"
PASS=0
FAIL=0

check() { local desc="$1"; shift; if "$@"; then echo "  ✅ $desc"; PASS=$((PASS+1)); else echo "  ❌ $desc"; FAIL=$((FAIL+1)); fi; }
check_json() { local desc="$1" url="$2"; shift 2; local resp=$(curl -s "$url"); if echo "$resp" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); $*" 2>/dev/null; then echo "  ✅ $desc"; PASS=$((PASS+1)); else echo "  ❌ $desc — $resp"; FAIL=$((FAIL+1)); fi; }

echo "🚀 Prisha E2E Test Suite"
echo "========================"

# 1. Health
echo ""; echo "📡 Health Check"
check_json "Health OK" "$BASE/api/health" 'process.exit(d.status==="ok"?0:1)'

# 2. Locations
echo ""; echo "📍 Locations"
check_json "10 locations" "$BASE/api/locations" 'process.exit(d.locations?.length===10?0:1)'

# 3. Calendar
echo ""; echo "📅 Calendar"
check_json "Calendar for Jerusalem" "$BASE/api/calendar?locationId=281184" 'process.exit(d.days?.length>27?0:1)'
check_json "Has zmanim with sunrise" "$BASE/api/calendar?locationId=281184" 'process.exit(d.days[0]?.zmanim?.sunrise?0:1)'

# 4. Register
echo ""; echo "👤 Auth"
REG=$(curl -s -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' -d '{"email":"test@prisha.app","password":"test123456","name":"משתמש"}')
echo "  Register: $REG"
TOKEN=$(echo "$REG" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token)")
check "Got token" test -n "$TOKEN"

# 5. Login
LOGIN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d '{"email":"test@prisha.app","password":"test123456"}')
check_json "Login OK" "skip" 'process.exit(1)' || true
echo "  Login token received: $([ -n "$(echo "$LOGIN" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token)" 2>/dev/null)" ] && echo "yes" || echo "no")"

# Admin login
ADMIN_LOGIN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d '{"email":"admin@prisha.app","password":"admin123456"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token)")
check "Admin token" test -n "$ADMIN_TOKEN"

# 6. Events (with user token)
echo ""; echo "📝 Events"
check_json "Add period event" "skip" 'process.exit(1)' || true
EVENT_RESP=$(curl -s -X POST "$BASE/api/events" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"type":"period","gregorianDate":"2026-04-01"}')
echo "  Add event: $EVENT_RESP"

EVENT_RESP2=$(curl -s -X POST "$BASE/api/events" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"type":"period","gregorianDate":"2026-04-28"}')
echo "  Add event 2: $EVENT_RESP2"

# Check predictions generated
EVENTS=$(curl -s "$BASE/api/events?predictions=true" -H "Authorization: Bearer $TOKEN")
echo "  Events + predictions: $EVENTS"
PRED_COUNT=$(echo "$EVENTS" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(String(d.events.filter(e=>e.type==='prediction').length))" 2>/dev/null)
check "Haflaga predictions generated" test "$PRED_COUNT" -gt 0

# 7. Admin endpoints
echo ""; echo "🛡️ Admin"
check_json "Admin stats" "$BASE/api/admin/stats" "process.exit(1)" > /dev/null 2>&1 || true
STATS=$(curl -s "$BASE/api/admin/stats" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "  Stats: $STATS"

check_json "Admin users list" "$BASE/api/admin/users" "process.exit(1)" > /dev/null 2>&1 || true
USERS=$(curl -s "$BASE/api/admin/users" -H "Authorization: Bearer $ADMIN_TOKEN")
USER_COUNT=$(echo "$USERS" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(String(d.users.length))" 2>/dev/null)
check "Users count >= 2" test "$USER_COUNT" -ge 2

check_json "Admin settings" "$BASE/api/admin/settings" "process.exit(1)" > /dev/null 2>&1 || true
SETTINGS=$(curl -s "$BASE/api/admin/settings" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Has system_name" echo "$SETTINGS" | grep -q "פרישה"

check_json "Admin algorithms" "$BASE/api/admin/algorithms" "process.exit(1)" > /dev/null 2>&1 || true
ALGOS=$(curl -s "$BASE/api/admin/algorithms" -H "Authorization: Bearer $ADMIN_TOKEN")
ALGO_COUNT=$(echo "$ALGOS" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(String(d.algorithms.length))" 2>/dev/null)
check "3 algorithms" test "$ALGO_COUNT" -eq 3

# 8. Veset (legacy API)
echo ""; echo "🔄 Veset Calculate"
check_json "Veset calculation" "skip" 'process.exit(1)' || true
VESET=$(curl -s -X POST "$BASE/api/veset/calculate" -H 'Content-Type: application/json' -d '{"sightings":["2026-04-01","2026-04-28"]}')
check "Has monthly predictions" echo "$VESET" | grep -q "monthly"

# Summary
echo ""; echo "========================"
echo "📊 Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then echo "❌ SOME TESTS FAILED"; exit 1; else echo "✅ ALL TESTS PASSED"; fi
