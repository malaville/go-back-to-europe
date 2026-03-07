# SkipTheGulf.com — Status Tracker

> Last updated: 2026-03-07 18:00

## Current State: LIVE — r/travel post performing (21 upvotes, 38 comments)

---

## BLOCKING — Fix Before Further Promotion

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 1 | XY (flynas) and Gulf carriers filtered from results | Critical | 🟢 FIXED |
| 2 | "Nonstop" tag on routes with hidden stops | Critical | 🟢 FIXED |
| 3 | CMB→LHR hidden stop via Delhi — Indian e-visa warning now shown for GB | Critical | 🟢 FIXED |
| 14 | Routes arriving after user's deadline | Critical | 🟢 FIXED (departureDate > deadline → filtered out) |
| 15 | Aviasales booking links — dead code after frontend removal | Critical | 🟢 FIXED (searchUrl fully removed) |
| 16 | Aviasales page shows Gulf carriers | Critical | 🟢 FIXED (Aviasales removed entirely, Google Flights verifyUrl only) |
| 17 | flex parameter cosmetic — flex=3 and flex=7 identical | Critical | 🟢 FIXED (flex controls ground transport budget + desperate case retry) |
| 18 | flex=3 + Da Lat = 0 routes with no explanation | High | 🟢 FIXED (desperate case retry expands ground budget for isolated origins) |

## HIGH PRIORITY — Fix This Week

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 5 | W9 airline code unverified on IST→LHR route | High | 🔴 TODO |
| 6 | "Fastest" tag misassigned (assigned to slower route) | Medium | 🔴 TODO |
| 7 | TBS→HEL on Lufthansa — hidden stop via FRA/MUC not detected | Medium | 🔴 TODO |
| 8 | Absurd detour routes (BKK→Bali→SIN→LHR) | Medium | 🔴 TODO |
| 9 | Vietnam visa for FI passport shows "evisa" — should be "free" | Medium | 🔴 TODO |
| 19 | Only 11 SEA starting cities — missing Phuket, Koh Samui, Da Nang, Siem Reap, 100+ spots | High | 🟡 IN PROGRESS (checklist at docs/sea-tourist-spots.md, 3 added so far) |
| 20 | HKG not available as origin (cheapest corridor per Reddit intel) | High | 🔴 TODO |
| 21 | DPS→IST nonstop (Turkish Airlines) not in route data | Medium | 🔴 TODO |
| 22 | Kutaisi (KUT) missing — Wizz Air hub, not same as Tbilisi | Medium | 🔴 TODO |

## LOW PRIORITY

| # | Item | Status |
|---|------|--------|
| 11 | Frankfurt not available as destination | 🔴 TODO |
| 12 | ticketType "separate" on single-leg nonstop flights | 🔴 TODO |
| 13 | test-100.sh Python analysis broken | 🔴 TODO |

---

## DONE (Recent)

- 🟢 **Aviasales fully removed** — searchUrl artifact cleaned from engine, types, API routes
- 🟢 **Deadline enforcement** — routes departing after deadline filtered out
- 🟢 **`today` parameter** — injectable for deterministic tests, filters past departures
- 🟢 **Bus/boat heuristic** — replaced land-only with haversine-based ground transport (Indonesia, Philippines now supported)
- 🟢 **Desperate case retry** — isolated origins (0 ground + few flights) auto-expand ground budget
- 🟢 **Island ferry detection** — USM, HKT, DPS routes labeled as ferry transport
- 🟢 **Koh Tao/Koh Samui/Phuket** added as starting cities with USM/HKT airport data
- 🟢 **5 persona test suites** — 70 tests passing, covering Bali, Vientiane, Bangkok, Da Lat, Koh Tao
- 🟢 **Ground reachability test suite** — haversine accuracy verified against 11 real-world SEA distances
- 🟢 Milan, Nonstop tag, route count, Istanbul ranking, gateway routing, speed — all previously fixed

---

## Reddit Acquisition

| Subreddit | Status | Score | Comments |
|-----------|--------|-------|----------|
| r/travel | 🟢 Performing | 21 | 38 |
| r/flights | 🟡 Invited to megathread | — | — |
| r/digitalnomad | ⬜ Ready to post | — | — |
| r/Thailand | ⬜ Ready to post | — | — |
| r/bali | ⬜ Ready to post | — | — |
| r/solotravel | ⬜ Ready to post | — | — |

See `REDDIT-COMMUNICATION-STATUS.md` for full analysis.

---

## External API Integrations

| API | Status | Next Action |
|-----|--------|-------------|
| Travelpayouts | 🟢 Integrated, working | — |
| Google Flights URL | 🟢 Integrated, working | — |
| SerpAPI | 🟢 Account active, API key received | Build `src/lib/serpapi.ts` for fare context |
| AirLabs | 🔴 Waitlisted | Wait for access |
| Sherpa (visa) | 🟡 Affiliate program offered | Apply via link |
| 12Go Asia (ground transport) | 🟢 Affiliate account active | Generate referral links |

---

## Next Top Tasks (Priority Order)

### 1. Reply to all r/travel comments + post in r/flights megathread
Mod invited us. Prioritize answering price concerns (that's the #1 pain point).

### 2. Add missing SEA cities (Phuket, Da Nang, Siem Reap, etc.)
Checklist at `docs/sea-tourist-spots.md`. ~120 spots identified, 14 currently in cities.ts.

### 3. Post r/digitalnomad + r/Thailand
Use budget angle for digitalnomad, local angle for Thailand.

### 4. Add HKG as origin + DPS→IST route
Reddit intel: HK→Europe is cheapest corridor right now (€250 on Chinese airlines).

### 5. Fix high-priority bugs (#5-9, #20-22)
W9 verification, tag accuracy, detour routes, visa data, Kutaisi.

### 6. Create SEO landing pages
`/flights-bangkok-to-paris-no-gulf` etc. Zero-competition keywords with crisis intent.

### 7. Hacker News "Show HN" post
Prepare technical writeup about the route graph engine.
