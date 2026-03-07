#!/bin/bash
# SkipTheGulf.com — 100 plausible user queries
# Run: bash docs/test-100.sh > docs/test-100-results.txt 2>&1
# Then give docs/test-100-results.txt to Claude for analysis.
#
# What this tests:
# - 15 origins × popular destinations
# - 12 nationalities (EU + GB)
# - Gulf airline detection (KU, OV, XY, EK, EY, QR, FZ, G9, WY, GF, SV, 5W)
# - Hidden stop visa gaps
# - "Nonstop" tag accuracy
# - "Fastest" tag accuracy
# - Milan bug (0 routes)
# - Route count per query
# - Absurd routing detection

API="https://skipthegulf.com/api/query"
DATE="2026-03-21"
GULF_CODES="EY|EK|QR|FZ|G9|WY|GF|SV|XY|OV|KU|NAS|F3|5W"

# Counter
N=0

run_test() {
  local FROM="$1" TO="$2" NAT="$3" FLEX="$4" LABEL="$5"
  N=$((N+1))
  printf "\n========== TEST %03d: %s ==========\n" "$N" "$LABEL"
  printf "Query: from=%s to=%s nat=%s flex=%s\n" "$FROM" "$TO" "$NAT" "$FLEX"

  sleep 0.3  # Rate limit: 3 requests/sec

  RESULT=$(curl -s "${API}?from=${FROM}&to=${TO}&nat=${NAT}&date=${DATE}&flex=${FLEX}" 2>&1)

  # Check for error
  if echo "$RESULT" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    if 'error' in d:
        print(f'ERROR: {d[\"error\"]}')
        sys.exit(1)
except:
    print('ERROR: Invalid JSON')
    sys.exit(1)
" 2>/dev/null; then
    return
  fi

  echo "$RESULT" | python3 -c "
import sys,json,re
d=json.load(sys.stdin)
count = d['count']
routes = d.get('routes',[])

# Basic stats
print(f'Routes: {count}')
if count == 0:
    print('*** BUG: Zero routes returned')
    sys.exit(0)

prices = []
for r in routes:
    p = r['price'].replace('€','').replace(',','')
    try: prices.append(int(p))
    except: pass

if prices:
    print(f'Price range: €{min(prices)} — €{max(prices)}')

# Gulf airline check
gulf = re.compile(r'\b(${GULF_CODES})\b')
for r in routes:
    for l in r['legs']:
        code = l.get('airlineCode','')
        if code and re.match(gulf, code):
            print(f'*** GULF AIRLINE: #{r[\"rank\"]} {l[\"fromCode\"]}→{l[\"toCode\"]} on {l[\"airline\"]} ({code})')

# Nonstop + hidden stop contradiction
for r in routes:
    if 'Nonstop' in r.get('tags',[]):
        for l in r['legs']:
            if l.get('hiddenStop'):
                print(f'*** NONSTOP+HIDDEN: #{r[\"rank\"]} tagged Nonstop but has hidden stop: {l[\"hiddenStop\"]}')
        if len(r['legs']) > 1:
            print(f'*** NONSTOP+MULTILEG: #{r[\"rank\"]} tagged Nonstop but has {len(r[\"legs\"])} legs')

# Fastest tag check
fastest_tag_time = None
actual_fastest_time = None
for r in routes:
    # Parse travel time to minutes (rough)
    tt = r.get('travelTime','')
    mins = 0
    hm = re.findall(r'(\d+)h', tt)
    mm = re.findall(r'(\d+)m', tt)
    if hm: mins += int(hm[0])*60
    if mm: mins += int(mm[0])
    if mins > 0:
        if actual_fastest_time is None or mins < actual_fastest_time:
            actual_fastest_time = mins
        if 'Fastest' in r.get('tags',[]):
            fastest_tag_time = mins
if fastest_tag_time and actual_fastest_time and fastest_tag_time > actual_fastest_time + 30:
    print(f'*** FASTEST TAG WRONG: Tagged route is {fastest_tag_time}min but fastest is {actual_fastest_time}min')

# Hidden stop visa gap
for r in routes:
    for l in r['legs']:
        hs = l.get('hiddenStop','')
        if hs and ('Delhi' in hs or 'Mumbai' in hs):
            if l.get('visa') in ('none', None):
                print(f'*** HIDDEN VISA GAP: #{r[\"rank\"]} {l[\"fromCode\"]}→{l[\"toCode\"]} hidden stop {hs} but visa={l.get(\"visa\")}')
        if hs and ('Jeddah' in hs or 'Dubai' in hs or 'Doha' in hs or 'Abu Dhabi' in hs or 'Muscat' in hs or 'Bahrain' in hs or 'Riyadh' in hs or 'Kuwait' in hs or 'Sharjah' in hs):
            print(f'*** GULF HIDDEN STOP: #{r[\"rank\"]} {l[\"fromCode\"]}→{l[\"toCode\"]} hidden stop through {hs}')

# Visa unknown check
for r in routes:
    for l in r['legs']:
        v = l.get('visa','')
        if v == 'unknown' or v == 'warning':
            print(f'*** VISA UNKNOWN: #{r[\"rank\"]} {l[\"fromCode\"]}→{l[\"toCode\"]} visa={v}')

# ticketType on single-leg
for r in routes:
    if len(r['legs']) == 1 and r.get('ticketType') == 'separate':
        print(f'*** SINGLE-LEG SEPARATE: #{r[\"rank\"]} single flight but ticketType=separate')

# Destination check
dest_code = routes[0]['legs'][-1]['toCode'] if routes else ''
for r in routes:
    last_code = r['legs'][-1]['toCode']
    if last_code != dest_code:
        print(f'*** WRONG DEST: #{r[\"rank\"]} ends at {last_code}, expected {dest_code}')

# Summary line for quick scan
issues = []
for r in routes:
    for l in r['legs']:
        code = l.get('airlineCode','')
        if code and re.match(gulf, code): issues.append('GULF')
        if l.get('hiddenStop') and 'Nonstop' in r.get('tags',[]): issues.append('NONSTOP')
        v = l.get('visa','')
        if v in ('unknown','warning'): issues.append('VISA')
if not issues:
    print('OK — no critical issues')
else:
    print(f'ISSUES: {\", \".join(set(issues))}')
" 2>/dev/null
}

echo "SkipTheGulf.com — 100-query test run"
echo "Date: $(date)"
echo "API: $API"
echo "============================================"

# ==============================================
# BLOCK 1: Core corridors (tests 1-20)
# Most common real user searches
# ==============================================
echo ""
echo ">>> BLOCK 1: Core corridors (20 tests)"

run_test "Bangkok"       "Paris"     "FR" "7" "French in BKK→Paris"
run_test "Bangkok"       "London"    "GB" "7" "British in BKK→London"
run_test "Bangkok"       "Berlin"    "DE" "7" "German in BKK→Berlin"
run_test "Bangkok"       "Amsterdam" "NL" "7" "Dutch in BKK→Amsterdam"
run_test "Bangkok"       "Helsinki"  "FI" "7" "Finnish in BKK→Helsinki"
run_test "Bangkok"       "Rome"      "IT" "7" "Italian in BKK→Rome"
run_test "Bangkok"       "Barcelona" "ES" "7" "Spanish in BKK→Barcelona"
run_test "Bangkok"       "Athens"    "GR" "7" "Greek in BKK→Athens"
run_test "Bangkok"       "Vienna"    "AT" "7" "Austrian in BKK→Vienna"
run_test "Bangkok"       "Warsaw"    "PL" "7" "Polish in BKK→Warsaw"
run_test "Bali"          "Amsterdam" "NL" "7" "Dutch in Bali→Amsterdam"
run_test "Bali"          "London"    "GB" "7" "British in Bali→London"
run_test "Bali"          "Paris"     "FR" "7" "French in Bali→Paris"
run_test "Bali"          "Berlin"    "DE" "7" "German in Bali→Berlin"
run_test "Ho Chi Minh City" "Paris"  "FR" "7" "French in HCMC→Paris"
run_test "Ho Chi Minh City" "London" "GB" "7" "British in HCMC→London"
run_test "Singapore"     "London"    "GB" "7" "British in SIN→London"
run_test "Singapore"     "Paris"     "FR" "7" "French in SIN→Paris"
run_test "Kuala Lumpur"  "London"    "GB" "7" "British in KL→London"
run_test "Kuala Lumpur"  "Amsterdam" "NL" "7" "Dutch in KL→Amsterdam"

# ==============================================
# BLOCK 2: Small origins (tests 21-35)
# Gateway routing must work
# ==============================================
echo ""
echo ">>> BLOCK 2: Small origins — gateway routing (15 tests)"

run_test "Vientiane"     "Paris"     "FR" "7" "French in VTE→Paris"
run_test "Vientiane"     "Helsinki"  "FI" "3" "Finnish in VTE→Helsinki (urgent)"
run_test "Vientiane"     "Berlin"    "DE" "7" "German in VTE→Berlin"
run_test "Phnom Penh"    "Paris"     "FR" "7" "French in PNH→Paris"
run_test "Phnom Penh"    "London"    "GB" "7" "British in PNH→London"
run_test "Phnom Penh"    "Amsterdam" "NL" "7" "Dutch in PNH→Amsterdam"
run_test "Chiang Mai"    "Paris"     "FR" "7" "French in CNX→Paris"
run_test "Chiang Mai"    "London"    "GB" "7" "British in CNX→London"
run_test "Yangon"        "London"    "GB" "7" "British in RGN→London"
run_test "Manila"        "London"    "GB" "7" "British in MNL→London"
run_test "Hanoi"         "Paris"     "FR" "7" "French in HAN→Paris"
run_test "Da Lat"        "Paris"     "FR" "7" "French in DLI→Paris"
run_test "Taipei"        "London"    "GB" "7" "Taiwanese origin→London"
run_test "Seoul"         "Paris"     "FR" "7" "French in ICN→Paris"
run_test "Tokyo"         "London"    "GB" "7" "British in NRT→London"

# ==============================================
# BLOCK 3: All destinations (tests 36-56)
# Every destination must return >0 routes
# ==============================================
echo ""
echo ">>> BLOCK 3: All destinations from Bangkok (21 tests)"

run_test "Bangkok" "Paris"      "FR" "7" "BKK→Paris"
run_test "Bangkok" "Amsterdam"  "NL" "7" "BKK→Amsterdam"
run_test "Bangkok" "London"     "GB" "7" "BKK→London"
run_test "Bangkok" "Brussels"   "BE" "7" "BKK→Brussels"
run_test "Bangkok" "Lyon"       "FR" "7" "BKK→Lyon"
run_test "Bangkok" "Berlin"     "DE" "7" "BKK→Berlin"
run_test "Bangkok" "Warsaw"     "PL" "7" "BKK→Warsaw"
run_test "Bangkok" "Budapest"   "HU" "7" "BKK→Budapest"
run_test "Bangkok" "Prague"     "CZ" "7" "BKK→Prague"
run_test "Bangkok" "Barcelona"  "ES" "7" "BKK→Barcelona"
run_test "Bangkok" "Madrid"     "ES" "7" "BKK→Madrid"
run_test "Bangkok" "Lisbon"     "PT" "7" "BKK→Lisbon"
run_test "Bangkok" "Rome"       "IT" "7" "BKK→Rome"
run_test "Bangkok" "Milan"      "IT" "7" "BKK→Milan"
run_test "Bangkok" "Vienna"     "AT" "7" "BKK→Vienna"
run_test "Bangkok" "Helsinki"   "FI" "7" "BKK→Helsinki"
run_test "Bangkok" "Athens"     "GR" "7" "BKK→Athens"
run_test "Bangkok" "Stockholm"  "SE" "7" "BKK→Stockholm"
run_test "Bangkok" "Copenhagen" "DK" "7" "BKK→Copenhagen"
run_test "Bangkok" "Dublin"     "IE" "7" "BKK→Dublin"
run_test "Bangkok" "Bucharest"  "RO" "7" "BKK→Bucharest"

# ==============================================
# BLOCK 4: Nationality sweep (tests 57-72)
# Same route, different passports
# ==============================================
echo ""
echo ">>> BLOCK 4: Nationality sweep — BKK→Paris (16 tests)"

run_test "Bangkok" "Paris" "FR" "7" "French passport"
run_test "Bangkok" "Paris" "DE" "7" "German passport"
run_test "Bangkok" "Paris" "NL" "7" "Dutch passport"
run_test "Bangkok" "Paris" "IT" "7" "Italian passport"
run_test "Bangkok" "Paris" "ES" "7" "Spanish passport"
run_test "Bangkok" "Paris" "GB" "7" "British passport"
run_test "Bangkok" "Paris" "FI" "7" "Finnish passport"
run_test "Bangkok" "Paris" "GR" "7" "Greek passport"
run_test "Bangkok" "Paris" "RO" "7" "Romanian passport"
run_test "Bangkok" "Paris" "SE" "7" "Swedish passport"
run_test "Bangkok" "Paris" "DK" "7" "Danish passport"
run_test "Bangkok" "Paris" "PL" "7" "Polish passport"
run_test "Bangkok" "Paris" "IE" "7" "Irish passport"
run_test "Bangkok" "Paris" "NO" "7" "Norwegian passport"
run_test "Bangkok" "Paris" "CH" "7" "Swiss passport"
run_test "Bangkok" "Paris" "HR" "7" "Croatian passport"

# ==============================================
# BLOCK 5: Flex comparison (tests 73-78)
# Same route, different urgency
# ==============================================
echo ""
echo ">>> BLOCK 5: Flex parameter comparison (6 tests)"

run_test "Bangkok" "Paris"     "FR" "1" "BKK→Paris flex=1"
run_test "Bangkok" "Paris"     "FR" "3" "BKK→Paris flex=3"
run_test "Bangkok" "Paris"     "FR" "14" "BKK→Paris flex=14"
run_test "Bali"    "Amsterdam" "NL" "1" "DPS→AMS flex=1"
run_test "Bali"    "Amsterdam" "NL" "3" "DPS→AMS flex=3"
run_test "Bali"    "Amsterdam" "NL" "14" "DPS→AMS flex=14"

# ==============================================
# BLOCK 6: Stress tests (tests 79-88)
# Edge cases and unusual combos
# ==============================================
echo ""
echo ">>> BLOCK 6: Stress tests (10 tests)"

run_test "Bali"          "Bucharest"  "RO" "7" "Romanian in Bali→Bucharest (small+small)"
run_test "Yangon"        "Dublin"     "IE" "7" "Irish in Yangon→Dublin (small+small)"
run_test "Da Lat"        "Helsinki"   "FI" "3" "Finnish in Da Lat→Helsinki (tiny+urgent)"
run_test "Manila"        "Athens"     "GR" "7" "Greek in Manila→Athens"
run_test "Phnom Penh"    "Stockholm"  "SE" "7" "Swedish in PNH→Stockholm"
run_test "Chiang Mai"    "Budapest"   "HU" "7" "Hungarian in CNX→Budapest"
run_test "Vientiane"     "Lisbon"     "PT" "7" "Portuguese in VTE→Lisbon"
run_test "Hanoi"         "Copenhagen" "DK" "7" "Danish in HAN→Copenhagen"
run_test "Tokyo"         "Athens"     "GR" "7" "Greek in NRT→Athens"
run_test "Seoul"         "Dublin"     "IE" "7" "Irish in ICN→Dublin"

# ==============================================
# BLOCK 7: Gateway comparison for Lea (tests 89-100)
# Same destination from different SEA origins
# ==============================================
echo ""
echo ">>> BLOCK 7: Gateway comparison — cheapest path to Paris (12 tests)"

run_test "Bangkok"          "Paris" "FR" "7" "BKK→Paris"
run_test "Kuala Lumpur"     "Paris" "FR" "7" "KUL→Paris"
run_test "Singapore"        "Paris" "FR" "7" "SIN→Paris"
run_test "Ho Chi Minh City" "Paris" "FR" "7" "SGN→Paris"
run_test "Hanoi"            "Paris" "FR" "7" "HAN→Paris"
run_test "Bali"             "Paris" "FR" "7" "DPS→Paris"
run_test "Bangkok"          "London" "GB" "7" "BKK→London"
run_test "Kuala Lumpur"     "London" "GB" "7" "KUL→London"
run_test "Singapore"        "London" "GB" "7" "SIN→London"
run_test "Ho Chi Minh City" "London" "GB" "7" "SGN→London"
run_test "Bali"             "London" "GB" "7" "DPS→London"
run_test "Manila"           "London" "GB" "7" "MNL→London"

# ==============================================
# SUMMARY
# ==============================================
echo ""
echo "============================================"
echo "TOTAL TESTS RUN: $N"
echo "============================================"
echo ""
echo "To analyze: grep for these patterns in the output:"
echo "  grep '*** GULF'        — Gulf airlines in results"
echo "  grep '*** NONSTOP'     — Nonstop tag contradictions"
echo "  grep '*** HIDDEN'      — Hidden stop visa gaps"
echo "  grep '*** VISA'        — Visa unknown issues"
echo "  grep '*** FASTEST'     — Fastest tag wrong"
echo "  grep '*** SINGLE-LEG'  — ticketType bug"
echo "  grep '*** WRONG DEST'  — Wrong destination"
echo "  grep '*** BUG'         — Zero routes"
echo "  grep 'ISSUES:'         — Any route with problems"
echo "  grep 'OK —'            — Clean routes"
