# SkipTheGulf.com — Status Tracker

> Last updated: 2026-03-07

## Current State: READY TO LAUNCH

QA score: **8.3/10** (up from 7.6 after improvements). All critical bugs fixed. Ready for promotion.

---

## BLOCKING — Fix Before Any Promotion

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 1 | XY (flynas) and Gulf carriers filtered from results | Critical | 🟢 FIXED |
| 2 | "Nonstop" tag on routes with hidden stops | Critical | 🟢 FIXED |
| 3 | CMB→LHR hidden stop via Delhi — Indian e-visa warning now shown for GB | Critical | 🟢 FIXED |

## HIGH PRIORITY — Fix This Week

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 4 | ~~Multi-word city URL encoding~~ — not a bug, works with proper encoding | n/a | 🟢 NOT A BUG |
| 5 | W9 airline code unverified on IST→LHR route, tagged "Cheapest" | High | 🔴 TODO |
| 6 | "Fastest" tag misassigned across multiple queries (assigned to slower route) | Medium | 🔴 TODO |
| 7 | TBS→HEL on Lufthansa — hidden stop via FRA/MUC not detected | Medium | 🔴 TODO |
| 8 | Absurd detour routes (e.g. BKK→Bali→SIN→LHR) appearing in results | Medium | 🔴 TODO |
| 9 | Vietnam visa for FI passport shows "evisa" — should be "free" (45-day exemption) | Medium | 🔴 TODO |
| 10 | flex parameter cosmetic — flex=3 produces identical results to flex=7 | Medium | 🔴 TODO |

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
