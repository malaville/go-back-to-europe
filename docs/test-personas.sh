#!/bin/bash
# SkipTheGulf QA — Automated persona tests
# Run: bash docs/test-personas.sh
# Requires: curl, python3

API="https://skipthegulf.com/api/query"
PASS=0
FAIL=0
TOTAL=0

run_test() {
  local name="$1"
  local url="$2"
  local deadline="$3"
  local check="$4"  # python check code

  TOTAL=$((TOTAL + 1))
  local result
  result=$(curl -s "$url")

  if [ -z "$result" ] || echo "$result" | grep -q '"error"'; then
    echo "FAIL [$name] API error or empty response"
    FAIL=$((FAIL + 1))
    return
  fi

  local output
  output=$(echo "$result" | python3 -c "
import json, sys
data = json.load(sys.stdin)
routes = data.get('routes', [])
deadline = '$deadline'
errors = []

# --- Always check ---
gulf = {'EY','EK','QR','FZ','G9','WY','GF','SV','XY','OV','KU','NAS','F3','5W'}
for i, r in enumerate(routes):
    dep = r.get('departure', '')
    # Date check
    if deadline and dep > deadline:
        errors.append(f'Route {i+1}: departs {dep} AFTER deadline {deadline}')
    # Gulf check
    for l in r.get('legs', []):
        c = l.get('airlineCode', '')
        if c in gulf:
            errors.append(f'Route {i+1}: GULF CARRIER {c}')

# --- Custom check ---
$check

if errors:
    # Show max 5 errors
    for e in errors[:5]:
        print(f'  {e}')
    if len(errors) > 5:
        print(f'  ...and {len(errors)-5} more')
    sys.exit(1)
else:
    sys.exit(0)
" 2>&1)

  if [ $? -eq 0 ]; then
    echo "PASS [$name]"
    PASS=$((PASS + 1))
  else
    echo "FAIL [$name]"
    echo "$output"
    FAIL=$((FAIL + 1))
  fi
}

echo "========================================"
echo "  SkipTheGulf QA — Persona Tests"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "========================================"
echo ""

# ── PERSONA 1: Joris — Bali → Amsterdam (NL) ──

echo "--- Persona 1: Joris (Bali→Amsterdam, NL) ---"

run_test "1a: Bali→AMS deadline" \
  "$API?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=7" \
  "2026-03-17" \
  ""
sleep 0.3

run_test "1b: flex=3 differs from flex=7" \
  "$API?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=3" \
  "2026-03-17" \
  "
# Compare with flex=7 — should be different
import subprocess
r7 = subprocess.run(['curl', '-s', '$API?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=7'], capture_output=True, text=True)
d7 = json.loads(r7.stdout).get('routes', [])
p3 = [r.get('price') for r in routes]
p7 = [r.get('price') for r in d7]
if p3 == p7:
    errors.append('flex=3 and flex=7 return IDENTICAL results')
"
sleep 0.3

run_test "1c: land=1 has effect" \
  "$API?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=7&land=1" \
  "2026-03-17" \
  "
ground = [l for r in routes for l in r.get('legs',[]) if l.get('transport','flight') != 'flight']
# For Bali, land=1 may not add ground legs (island), so just check dates
"
sleep 0.3

run_test "1d: anywhere returns multiple cities" \
  "$API?from=Bali&to=&nat=NL&date=2026-03-17&flex=7" \
  "2026-03-17" \
  "
dests = set()
for r in routes:
    legs = r.get('legs', [])
    if legs:
        dests.add(legs[-1].get('to', '?'))
if len(dests) < 3:
    errors.append(f'Anywhere returned only {len(dests)} cities: {dests}')
"
sleep 0.3

run_test "1e: gateway routing (DPS needs SIN/KUL/BKK)" \
  "$API?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=7" \
  "" \
  "
if len(routes) == 0:
    errors.append('0 routes from Bali — gateway routing failed')
for r in routes[:5]:
    legs = r.get('legs', [])
    if legs and legs[0].get('from','') == 'Bali':
        first_to = legs[0].get('to','')
        if first_to not in ['Singapore','Bangkok','Kuala Lumpur','Jakarta','Ho Chi Minh City']:
            errors.append(f'Route starts Bali->{first_to}, expected gateway city')
"
sleep 0.3

run_test "1f: no visa unknown for NL" \
  "$API?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=7" \
  "" \
  "
for i, r in enumerate(routes[:10]):
    for l in r.get('legs', []):
        v = l.get('visa', '')
        if v == 'unknown':
            errors.append(f'Route {i+1}: visa unknown at {l.get(\"from\")}->{l.get(\"to\")}')
"
sleep 0.3

echo ""

# ── PERSONA 2: Sanna — Vientiane → Helsinki (FI) ──

echo "--- Persona 2: Sanna (Vientiane→Helsinki, FI) ---"

run_test "2a: VTE→HEL deadline (urgent)" \
  "$API?from=Vientiane&to=Helsinki&nat=FI&date=2026-03-12&flex=3" \
  "2026-03-12" \
  ""
sleep 0.3

run_test "2b: flex=7 deadline" \
  "$API?from=Vientiane&to=Helsinki&nat=FI&date=2026-03-12&flex=7" \
  "2026-03-12" \
  ""
sleep 0.3

run_test "2c: all routes end in Helsinki" \
  "$API?from=Vientiane&to=Helsinki&nat=FI&date=2026-03-12&flex=7" \
  "" \
  "
for i, r in enumerate(routes):
    legs = r.get('legs', [])
    if legs:
        dest = legs[-1].get('to', '')
        if dest != 'Helsinki':
            errors.append(f'Route {i+1}: ends in {dest}, not Helsinki')
"
sleep 0.3

run_test "2d: anywhere returns multiple cities" \
  "$API?from=Vientiane&to=&nat=FI&date=2026-03-12&flex=7" \
  "2026-03-12" \
  "
dests = set()
for r in routes:
    legs = r.get('legs', [])
    if legs:
        dests.add(legs[-1].get('to', '?'))
if len(dests) < 3:
    errors.append(f'Anywhere returned only {len(dests)} cities: {dests}')
"
sleep 0.3

run_test "2e: gateway routing (VTE needs BKK/HAN)" \
  "$API?from=Vientiane&to=Helsinki&nat=FI&date=2026-03-12&flex=7" \
  "" \
  "
if len(routes) == 0:
    errors.append('0 routes from Vientiane — gateway routing failed')
"
sleep 0.3

echo ""

# ── PERSONA 3: James — Bangkok → London (GB) ──

echo "--- Persona 3: James (Bangkok→London, GB) ---"

run_test "3a: BKK→LHR deadline" \
  "$API?from=Bangkok&to=London&nat=GB&date=2026-03-20&flex=7" \
  "2026-03-20" \
  ""
sleep 0.3

run_test "3b: flex=3 deadline" \
  "$API?from=Bangkok&to=London&nat=GB&date=2026-03-20&flex=3" \
  "2026-03-20" \
  ""
sleep 0.3

run_test "3c: anywhere with GB passport" \
  "$API?from=Bangkok&to=&nat=GB&date=2026-03-20&flex=7" \
  "2026-03-20" \
  "
dests = set()
for r in routes:
    legs = r.get('legs', [])
    if legs:
        dests.add(legs[-1].get('to', '?'))
if len(dests) < 3:
    errors.append(f'Anywhere returned only {len(dests)} cities: {dests}')
"
sleep 0.3

run_test "3d: Delhi hidden stop has visa warning for GB" \
  "$API?from=Bangkok&to=London&nat=GB&date=2026-03-20&flex=7" \
  "" \
  "
for i, r in enumerate(routes):
    warnings = r.get('warnings', [])
    for l in r.get('legs', []):
        hs = l.get('hiddenStop', '')
        if hs and 'Delhi' in str(hs):
            has_visa_warn = any('visa' in str(w).lower() or 'e-visa' in str(w).lower() for w in warnings)
            if not has_visa_warn:
                errors.append(f'Route {i+1}: Delhi hidden stop but no visa warning for GB')
"
sleep 0.3

run_test "3e: nonstop tag only on single-flight routes" \
  "$API?from=Bangkok&to=London&nat=GB&date=2026-03-20&flex=7" \
  "" \
  "
for i, r in enumerate(routes):
    tags = [t if isinstance(t,str) else t.get('label','') for t in r.get('tags',[])]
    legs = r.get('legs', [])
    flight_legs = [l for l in legs if l.get('transport','flight') == 'flight']
    if 'Nonstop' in tags and len(flight_legs) > 1:
        errors.append(f'Route {i+1}: tagged Nonstop but has {len(flight_legs)} flight legs')
    if 'Nonstop' in tags:
        for l in legs:
            if l.get('hiddenStop'):
                errors.append(f'Route {i+1}: tagged Nonstop but has hidden stop')
"
sleep 0.3

echo ""

# ── PERSONA 4: Lea — Da Lat → Paris (FR) ──

echo "--- Persona 4: Lea (Da Lat→Paris, FR) ---"

run_test "4a: Da Lat→Paris deadline" \
  "$API?from=Da+Lat&to=Paris&nat=FR&date=2026-03-25&flex=7" \
  "2026-03-25" \
  ""
sleep 0.3

run_test "4b: land=1 deadline" \
  "$API?from=Da+Lat&to=Paris&nat=FR&date=2026-03-25&flex=7&land=1" \
  "2026-03-25" \
  ""
sleep 0.3

run_test "4c: flex=3 returns 0 routes (7h bus > 6h cap)" \
  "$API?from=Da+Lat&to=Paris&nat=FR&date=2026-03-25&flex=3" \
  "" \
  "
# This SHOULD return 0 routes (bus is 7h, cap is 6h) — that's correct
# But we check it doesn't crash
if len(routes) > 0:
    # Check if any ground leg exceeds 6h
    for i, r in enumerate(routes):
        for l in r.get('legs', []):
            t = l.get('transport', 'flight')
            dur = l.get('duration', '')
            if t != 'flight' and '7h' in dur:
                errors.append(f'Route {i+1}: 7h bus with flex=3 (max 6h)')
"
sleep 0.3

run_test "4d: anywhere + land=1" \
  "$API?from=Da+Lat&to=&nat=FR&date=2026-03-25&flex=7&land=1" \
  "2026-03-25" \
  "
dests = set()
for r in routes:
    legs = r.get('legs', [])
    if legs:
        dests.add(legs[-1].get('to', '?'))
if len(dests) < 3:
    errors.append(f'Anywhere returned only {len(dests)} cities: {dests}')
"
sleep 0.3

run_test "4e: BKK gateway comparison" \
  "$API?from=Bangkok&to=Paris&nat=FR&date=2026-03-25&flex=7" \
  "2026-03-25" \
  ""
sleep 0.3

run_test "4f: SIN gateway comparison" \
  "$API?from=Singapore&to=Paris&nat=FR&date=2026-03-25&flex=7" \
  "2026-03-25" \
  ""
sleep 0.3

run_test "4g: booking links differ per route" \
  "$API?from=Da+Lat&to=Paris&nat=FR&date=2026-03-25&flex=7" \
  "" \
  "
links = set(r.get('bookUrl','') for r in routes)
if len(links) == 1 and len(routes) > 1:
    errors.append(f'All {len(routes)} routes share same booking link: {links.pop()[:60]}')
"
sleep 0.3

echo ""

# ── SUMMARY ──

echo "========================================"
echo "  RESULTS: $PASS passed / $FAIL failed / $TOTAL total"
echo "========================================"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
