# SkipTheGulf.com — Status Tracker

> Last updated: 2026-03-07

## Current State: BLOCKED — 3 new critical bugs found

QA score: **5.5/10** (down from 8.3 — date/price bugs found). See `docs/PRICE-DISCREPANCY-REPORT.md` and `docs/qa-test-personas.md`.

---

## BLOCKING — Fix Before Any Promotion

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 1 | XY (flynas) and Gulf carriers filtered from results | Critical | 🟢 FIXED |
| 2 | "Nonstop" tag on routes with hidden stops | Critical | 🟢 FIXED |
| 3 | CMB→LHR hidden stop via Delhi — Indian e-visa warning now shown for GB | Critical | 🟢 FIXED |
| 14 | **60-100% of routes arrive AFTER user's deadline.** Sanna (Mar 12 deadline): 17/17 routes late. James anywhere (Mar 20): 23/25 late. Dates range up to Nov 2026. | Critical | 🔴 TODO |
| 15 | Booking link goes to full-route Aviasales search — every route uses same link regardless of actual route | Critical | 🔴 TODO |
| 16 | Aviasales page shows Gulf carriers (EK, QR, EY, WY) as cheapest results | Critical | 🔴 TODO |
| 17 | flex parameter is 100% cosmetic — flex=3 and flex=7 return identical results (confirmed) | Critical | 🔴 TODO |
| 18 | flex=3 + Da Lat = 0 routes (7h bus exceeds 6h cap) but user gets no explanation why | High | 🔴 TODO |

See `docs/PRICE-DISCREPANCY-REPORT.md` for full analysis.

## HIGH PRIORITY — Fix This Week

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 4 | ~~Multi-word city URL encoding~~ — not a bug, works with proper encoding | n/a | 🟢 NOT A BUG |
| 5 | W9 airline code unverified on IST→LHR route, tagged "Cheapest" | High | 🔴 TODO |
| 6 | "Fastest" tag misassigned across multiple queries (assigned to slower route) | Medium | 🔴 TODO |
| 7 | TBS→HEL on Lufthansa — hidden stop via FRA/MUC not detected | Medium | 🔴 TODO |
| 8 | Absurd detour routes (e.g. BKK→Bali→SIN→LHR) appearing in results | Medium | 🔴 TODO |
| 9 | Vietnam visa for FI passport shows "evisa" — should be "free" (45-day exemption) | Medium | 🔴 TODO |
| 10 | flex parameter cosmetic — promoted to blocking bug #17 | n/a | See #17 |

## LOW PRIORITY

| # | Item | Status |
|---|------|--------|
| 11 | Frankfurt not available as destination | 🔴 TODO |
| 12 | ticketType "separate" on single-leg nonstop flights | 🔴 TODO |
| 13 | test-100.sh Python analysis broken (shell var interpolation, URL encoding) | 🔴 TODO |

---

## DONE (Recent)

- 🟢 Milan destination fixed (was 0 routes, now 25+)
- 🟢 "Nonstop" tag fixed for gateway routes (DPS→SIN→AMS no longer tagged Nonstop)
- 🟢 Route count improved dramatically (Bali: 7→25 routes)
- 🟢 Istanbul ranking improved (no longer buried last)
- 🟢 Gateway routing working for Vientiane, Yangon, Manila, Hanoi
- 🟢 Speed acceptable: avg 533ms, warms to ~497ms with caching
- 🟢 QA test personas documented in `docs/qa-test-personas.md`
- 🟢 100-query test plan built in `docs/test-100.sh`
- 🟢 API integration docs in `docs/STATS.md` and `docs/api-integrations.md`

---

## External API Integrations

| API | Status | Next Action |
|-----|--------|-------------|
| Travelpayouts | 🟢 Integrated, working | — |
| Google Flights URL | 🟢 Integrated, working | — |
| SerpAPI | 🟢 Account active, API key received | Build `src/lib/serpapi.ts` for fare context |
| AirLabs | 🔴 Waitlisted | Wait for access |
| Sherpa (visa) | 🟡 Affiliate program offered | Apply via link, get personalized affiliate URL. 30% commission/visa, quarterly payouts ($500 min). |
| 12Go Asia (ground transport) | 🟢 Affiliate account active | Set password, generate referral links. Payout threshold: 300 THB. Stats at agent.12go.asia |

---

## Next Top Tasks (Priority Order)

### 1. ~~Fix 3 blocking bugs (#1-3 above)~~ 🟢 DONE

### 2. Post on Reddit — READY
6 posts drafted in `reddit-posts.md`. Copy-paste and post in order, 2h apart. r/flights first.

### 3. Create SEO landing pages
`/flights-bangkok-to-paris-no-gulf` etc. — zero-competition keywords with crisis intent.

### 4. Fix high-priority bugs (#5-10)
W9 airline verification, Fastest tag, detour routes, visa data, flex parameter.

### 5. Submit to Hacker News & Product Hunt
"Show HN" post. Prepare to answer technical questions about the route graph engine.

### 6. SerpAPI integration
Verify phone, build client, use for fare context ("price is typical / unusually low / surge pricing").

### 7. ~~Email capture~~ 🟢 DONE
Community page at `/community` with 3 signup hooks (route alerts, beta tester, connect with travelers).
CTA card appears after search results. Data stored in `signups` table (PostgreSQL).
