# SkipTheGulf.com — QA Test Personas & Test Plan

> Updated: 2026-03-07
> API: `GET /api/query?from=&to=&nat=&date=&flex=&land=`

## How the search actually works

```
date  = DEADLINE — "I need to be there by this date"
flex  = ground transport budget = flex × 2h (capped at 16h, or 30h with land=1)
land  = 0 (default, max 16h ground) or 1 (max 30h ground)
to    = European city, or empty = "Anywhere in Europe" (searches all 19 airports)
```

Routes should arrive BEFORE the deadline. A route departing after `date` is always wrong.

---

## Scoring Rubric (6 axes)

| Axis | Weight | 10 means | 1 means |
|---|---|---|---|
| **Route Safety** | 25% | Gulf-free, all hidden stops detected | Gulf carriers/hubs undetected |
| **Visa Accuracy** | 20% | Correct visa info for every transit point | Missing/wrong visa that could strand someone |
| **Pricing Accuracy** | 20% | Prices within 15% of Aviasales click-through | 50%+ gap, stale prices, wrong booking links |
| **Date Accuracy** | 15% | All routes arrive before deadline, no future-month departures | Routes arriving months after deadline |
| **Destination Accuracy** | 10% | Correct airports, accurate tags | Wrong destinations, misleading tags |
| **Route Quality** | 10% | Diverse hubs, realistic connections, good count | Few routes, all same corridor |

---

## Persona 1 — Joris, Dutch backpacker in Bali

28yo, NL passport, budget-conscious. Emirates cancelled. Must be in Amsterdam by March 17 for job start. In Bali (DPS) — needs gateway (SIN/KUL).

### Tests

| # | Query | Tests what |
|---|-------|-----------|
| 1a | `?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=7` | Core: gateway routing, date deadline, prices |
| 1b | `?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=3` | Flex effect: flex=3 (6h ground) vs flex=7 (14h ground) — should change gateway options |
| 1c | `?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=7&land=1` | Land toggle: enables 30h ground — does it add new overland legs? |
| 1d | `?from=Bali&to=&nat=NL&date=2026-03-17&flex=7` | Anywhere in Europe: empty `to` — should return routes to multiple EU cities |

### Check

- [ ] **DEADLINE:** Every route must depart so it arrives BY March 17. Nothing departing after ~March 16 (unless same-day arrival). Nothing in April/May/June/July.
- [ ] **GATEWAY:** All routes start DPS→SIN, DPS→KUL, or DPS→BKK. No phantom direct DPS→Europe.
- [ ] **FLEX DIFF (1a vs 1b):** Different flex values must produce different results. If identical, flex is cosmetic.
- [ ] **LAND DIFF (1a vs 1c):** land=1 should unlock longer ground segments (e.g., bus Bali→Surabaya→Jakarta).
- [ ] **ANYWHERE (1d):** Routes should go to multiple European cities (Paris, London, Amsterdam, Milan, etc.), not just Amsterdam.
- [ ] **PRICES:** Click top 3 Aviasales links. Gap <20%? Does Aviasales page show Gulf carriers?
- [ ] **BOOKING LINKS:** All routes use same link `DPS1503AMS1`? Should be per-leg for separate tickets.
- [ ] **GULF FILTER:** No EY, EK, QR, FZ, G9, WY, GF, SV, XY, OV, KU.
- [ ] **VISA:** Singapore (free), China (144h TWOV), India (e-visa needed). No "visa unknown."

---

## Persona 2 — Sanna, Finnish remote worker in Vientiane

34yo, FI passport, father's health emergency. Must reach Helsinki ASAP. In Vientiane (VTE) — tiny airport, needs BKK or HAN gateway.

### Tests

| # | Query | Tests what |
|---|-------|-----------|
| 2a | `?from=Vientiane&to=Helsinki&nat=FI&date=2026-03-12&flex=3` | Urgent: tight deadline, minimal ground transport |
| 2b | `?from=Vientiane&to=Helsinki&nat=FI&date=2026-03-12&flex=7` | More flex: does 14h ground open new gateways? |
| 2c | `?from=Vientiane&to=Helsinki&nat=FI&date=2026-03-12&flex=7&land=1` | Land toggle: could enable VTE→BKK by bus (10h) instead of flight |
| 2d | `?from=Vientiane&to=&nat=FI&date=2026-03-12&flex=7` | Anywhere: maybe easier to reach Stockholm/Copenhagen than Helsinki? |

### Check

- [ ] **DEADLINE:** Every route arrives in Helsinki by March 12. Nothing departing after ~March 11.
- [ ] **GATEWAY:** Routes through BKK or HAN. VTE has no direct Europe flights.
- [ ] **FLEX DIFF (2a vs 2b):** Flex=3 (6h ground) may limit to VTE→BKK flight only. Flex=7 (14h) might add VTE→HAN overland.
- [ ] **LAND DIFF (2b vs 2c):** land=1 (30h ground) could add VTE→BKK bus option.
- [ ] **ANYWHERE (2d):** Are there cheaper/faster routes to other Nordic cities?
- [ ] **PRICES:** Prior test showed €326 vs Aviasales $713 — 100% gap. Is this fixed?
- [ ] **DESTINATION:** All routes must end in HEL. Not Paris, not London.
- [ ] **HIDDEN STOPS:** TBS→HEL on Lufthansa has hidden stop via FRA/MUC — must be flagged.
- [ ] **VISA:** FI is EU_SCHENGEN. Vietnam should show "free" (45-day exemption), not "evisa."
- [ ] **GULF FILTER:** No Gulf carriers in any route.

---

## Persona 3 — James & family, British in Bangkok

42yo, GB passport, wife + 2 kids. Prefers single-ticket for connection protection. Must reach London by March 20. In Bangkok (BKK) — best hub, most options.

### Tests

| # | Query | Tests what |
|---|-------|-----------|
| 3a | `?from=Bangkok&to=London&nat=GB&date=2026-03-20&flex=7` | Core: major hub, GB visa rules, family-friendly ranking |
| 3b | `?from=Bangkok&to=London&nat=GB&date=2026-03-20&flex=3` | Flex diff |
| 3c | `?from=Bangkok&to=&nat=GB&date=2026-03-20&flex=7` | Anywhere: GB passport has different visa rules from EU — does "anywhere" handle this? |

### Check

- [ ] **DEADLINE:** All routes arrive by March 20. Nothing departing after ~March 19.
- [ ] **GB VISA RULES:** GB is NOT EU_SCHENGEN. China 144h TWOV eligible. India requires e-visa. Verify different treatment from EU passports.
- [ ] **HIDDEN STOPS:** CMB→LHR via Delhi — must flag Indian e-visa for GB. (Was fixed, verify still works.)
- [ ] **PRICES:** Prior test showed €328 vs Aviasales $368 — close (4%). Verify still OK.
- [ ] **BOOKING LINKS:** Aviasales page showed Etihad as cheapest for BKK→LHR — Gulf carrier on the booking page contradicts our promise.
- [ ] **SINGLE-TICKET PRIORITY:** "Recommended" should favor single-carrier routes for family safety.
- [ ] **NONSTOP TAG:** BKK→LHR Hainan Airlines has hidden stop via PEK — must NOT be tagged Nonstop. (Was fixed, verify.)
- [ ] **ANYWHERE (3c):** GB passport means no Schengen-free transit — does the tool handle this differently from EU in "anywhere" mode?
- [ ] **FLEX DIFF (3a vs 3b):** BKK is already a major hub, flex shouldn't matter much. But verify they're not identical.
- [ ] **GULF FILTER:** No Gulf carriers.

---

## Persona 4 — Lea, French backpacker in Da Lat

25yo, FR passport, very flexible. Currently in Da Lat (DLI, tiny airport). Comfortable with long overland travel. No rush — deadline March 25.

### Tests

| # | Query | Tests what |
|---|-------|-----------|
| 4a | `?from=Da+Lat&to=Paris&nat=FR&date=2026-03-25&flex=7` | Small origin, gateway routing, overland |
| 4b | `?from=Da+Lat&to=Paris&nat=FR&date=2026-03-25&flex=7&land=1` | Land=1: enables 30h ground — DLI→SGN bus (7h) + maybe SGN→BKK bus? |
| 4c | `?from=Da+Lat&to=Paris&nat=FR&date=2026-03-25&flex=3` | Tight flex: 6h ground — may not even reach SGN by bus (7h). What happens? |
| 4d | `?from=Da+Lat&to=&nat=FR&date=2026-03-25&flex=7&land=1` | Anywhere + land: most flexible possible search |
| 4e | `?from=Bangkok&to=Paris&nat=FR&date=2026-03-25&flex=7` | Gateway comparison: what if she buses to BKK first? |
| 4f | `?from=Singapore&to=Paris&nat=FR&date=2026-03-25&flex=7` | Gateway comparison: what about SIN? |

### Check

- [ ] **DEADLINE:** All routes arrive by March 25. NOTHING in April/May/June/July. Prior test found July 4 departure — this was the critical bug.
- [ ] **FLEX=3 vs BUS (4c):** Da Lat→HCMC bus is 7h. Flex=3 = 6h ground max. The bus shouldn't be available. Does the tool handle this correctly, or does it still show the 7h bus with flex=3?
- [ ] **LAND TOGGLE (4a vs 4b):** land=1 should unlock more/different ground legs. If results are identical, land is cosmetic.
- [ ] **PRICES:** Prior test showed €238 (BKK→CDG) vs Aviasales $414 — 61% gap. Caused by summing segment prices. Is this fixed?
- [ ] **BOOKING LINKS:** Separate-ticket routes need per-leg links. All routes currently use same `DLI1503CDG1` link.
- [ ] **GATEWAY COMPARISON (4a vs 4e vs 4f):** Price difference should help Lea decide: bus to BKK (~20 EUR) or to SIN (~40 EUR)?
- [ ] **ANYWHERE (4d):** With max flexibility, what's the cheapest city to reach? This is Lea's real question.
- [ ] **GULF FILTER:** No Gulf carriers.
- [ ] **VISA:** FR is EU_SCHENGEN. All transit points should have visa info.

---

## Coverage Matrix

Every parameter combination that a real user would use:

| Test | from (small) | from (hub) | to (city) | to (anywhere) | nat (EU) | nat (GB) | flex low | flex high | land=0 | land=1 | date tight | date relaxed |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1a | x | | x | | x | | | x | x | | | x |
| 1b | x | | x | | x | | x | | x | | | x |
| 1c | x | | x | | x | | | x | | x | | x |
| 1d | x | | | x | x | | | x | x | | | x |
| 2a | x | | x | | x | | x | | x | | x | |
| 2b | x | | x | | x | | | x | x | | x | |
| 2c | x | | x | | x | | | x | | x | x | |
| 2d | x | | | x | x | | | x | x | | x | |
| 3a | | x | x | | | x | | x | x | | | x |
| 3b | | x | x | | | x | x | | x | | | x |
| 3c | | x | | x | | x | | x | x | | | x |
| 4a | x | | x | | x | | | x | x | | | x |
| 4b | x | | x | | x | | | x | | x | | x |
| 4c | x | | x | | x | | x | | x | | | x |
| 4d | x | | | x | x | | | x | | x | | x |
| 4e | | x | x | | x | | | x | x | | | x |
| 4f | | x | x | | x | | | x | x | | | x |

**17 tests covering:**
- Small origins (4) + hub origins (3)
- Specific destination (13) + anywhere (4)
- EU passport (14) + GB passport (3)
- Low flex (4) + high flex (13)
- land=0 (13) + land=1 (4)
- Tight deadline (4) + relaxed deadline (13)

---

## Systemic checks (run on ALL results)

Every single route returned, across all 17 queries:

1. **Departure ≤ deadline date.** No exceptions.
2. **No Gulf airline codes:** EY, EK, QR, FZ, G9, WY, GF, SV, XY, OV, KU, NAS, F3, 5W
3. **No Gulf transit cities:** AUH, DXB, DOH, SHJ, MCT, BAH, JED, RUH
4. **Booking link matches route:** Separate-ticket routes need per-leg links, not full origin→destination
5. **Price ≤ 20% of Aviasales click-through** (check top 3 per persona)
6. **Aviasales page doesn't show Gulf carriers as cheapest** (click and verify)
7. **Tags are factual:** "Nonstop" = single flight, "Fastest" = actually shortest, "Recommended" = sensible pick
8. **Hidden stops have visa warnings** for the passenger's nationality
9. **"Anywhere" returns multiple cities** — not just one destination repeated 25 times

---

## Known bugs to verify

| # | Bug | Expected | Status |
|---|-----|----------|--------|
| 1 | Gulf carriers in results | All filtered | 🟢 FIXED |
| 2 | Nonstop tag on multi-leg routes | Only on single flights | 🟢 FIXED |
| 3 | Delhi hidden stop visa for GB | Indian e-visa flagged | 🟢 FIXED |
| 4 | Routes months after deadline | All arrive before deadline | 🔴 BROKEN |
| 5 | flex parameter cosmetic | Different flex = different results | 🔴 UNKNOWN |
| 6 | land parameter cosmetic | land=1 adds longer ground legs | 🔴 UNKNOWN |
| 7 | Booking links all identical | Per-leg links for separate tickets | 🔴 BROKEN |
| 8 | Prices 50%+ off from Aviasales | Within 20% | 🔴 BROKEN |
| 9 | Aviasales page shows Gulf carriers | Non-Gulf results shown | 🔴 BROKEN |
| 10 | "Anywhere" not tested | Returns multiple EU cities | 🔴 UNKNOWN |
| 11 | Fastest tag misassigned | On actual fastest route | 🔴 BROKEN |
| 12 | Vietnam visa "evisa" for FI | Should be "free" | 🔴 BROKEN |
| 13 | flex=3 allows 7h bus (Da Lat→HCMC) | Should block it (6h max) | 🔴 UNKNOWN |
