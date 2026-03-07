# SkipTheGulf.com — QA Test Personas & Test Plan

> Updated: 2026-03-07
> API: `GET /api/query?from=&to=&nat=&date=&flex=&land=`
> Frontend: `https://skipthegulf.com/?from=&to=&nat=&date=&flex=&land=`

## How the search actually works

```
date  = DEADLINE — "I need to be there by this date"
flex  = ground transport budget = flex × 2h (capped at 16h, or 30h with land=1)
land  = 0 (default, max 16h ground) or 1 (max 30h ground)
to    = European city, or empty = "Anywhere in Europe" (searches all 19 airports)
```

Routes should arrive BEFORE the deadline. A route departing after `date` is always wrong.

### Hard vs Soft constraints (new)

**Hard constraints** (never relaxed):
- No Gulf carriers (MIDDLE_EAST_HUB_AIRLINES)
- No Gulf transit cities
- Depart before deadline
- Depart on or after today

**Soft preferences** (relaxed into "extended" tier):
- flex (ground transport budget) — preferred pass uses user's budget, extended pass uses full cap
- land (long ground toggle) — same two-pass logic

Routes matching user's flex/land get `tier: "preferred"`. Routes found only with relaxed budget get `tier: "extended"` and are labeled "Longer ground travel than requested" in the UI.

### Response format (new)

```json
{
  "highlighted": [ route1, route2 ],  // top 2: cheapest + simplest
  "count": 25,
  "routes": [ ... all routes ... ],
  "metadata": {
    "wallTimeMs": 1234,
    "uniqueEdges": 57,
    "edgesPriced": 42,
    "edgesMissing": 15,
    "apiCalls": 84,
    "cheapCalls": 42,
    "latestCalls": 42,
    "fallbackHits": 10,
    "preferredCount": 20,
    "extendedCount": 5,
    ...
  }
}
```

### Scoring & Tags

| Tag | Meaning |
|-----|---------|
| Recommended | Best overall score (price × time × safety × visa × stops) |
| Cheapest | Lowest total price |
| Fastest | Shortest estimated total time |
| Simplest | Fewest total legs (flights + ground) |
| Nonstop | Single flight, no stops |

Preferred-tier routes get +0.15 scoring bonus so they sort before extended-tier routes.

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

| # | URL | Tests what |
|---|-----|-----------|
| 1a | [flex=7](https://skipthegulf.com/?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=7) | Core: gateway routing, date deadline, prices |
| 1b | [flex=3](https://skipthegulf.com/?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=3) | Flex effect: flex=3 (6h ground) vs flex=7 (14h ground) — should change gateway options |
| 1c | [land=1](https://skipthegulf.com/?from=Bali&to=Amsterdam&nat=NL&date=2026-03-17&flex=7&land=1) | Land toggle: enables 30h ground — does it add new overland legs? |
| 1d | [Anywhere](https://skipthegulf.com/?from=Bali&to=&nat=NL&date=2026-03-17&flex=7) | Anywhere in Europe: empty `to` — should return routes to multiple EU cities |

### Check

- [ ] **DEADLINE:** Every route must depart so it arrives BY March 17. Nothing departing after ~March 16 (unless same-day arrival). Nothing in April/May/June/July.
- [ ] **GATEWAY:** All routes start DPS→SIN, DPS→KUL, or DPS→BKK. No phantom direct DPS→Europe.
- [ ] **FLEX DIFF (1a vs 1b):** Different flex values must produce different results. If identical, flex is cosmetic.
- [ ] **LAND DIFF (1a vs 1c):** land=1 should unlock longer ground segments (e.g., bus Bali→Surabaya→Jakarta).
- [ ] **TIER (new):** Routes matching flex budget should be `tier: "preferred"`. Extended routes labeled in UI.
- [ ] **HIGHLIGHTED (new):** Top 2 routes shown prominently. "Show N more" button for rest.
- [ ] **ANYWHERE (1d):** Routes should go to multiple European cities (Paris, London, Amsterdam, Milan, etc.), not just Amsterdam.
- [ ] **PRICES:** Click top 3 Aviasales links. Gap <20%? Does Aviasales page show Gulf carriers?
- [ ] **GULF FILTER:** No EY, EK, QR, FZ, G9, WY, GF, SV, XY, OV, KU.
- [ ] **VISA:** Singapore (free), China (144h TWOV), India (e-visa needed). No "visa unknown."

---

## Persona 2 — Sanna, Finnish remote worker in Vientiane

34yo, FI passport, father's health emergency. Must reach Helsinki ASAP. In Vientiane (VTE) — tiny airport, needs BKK or HAN gateway.

### Tests

| # | URL | Tests what |
|---|-----|-----------|
| 2a | [flex=3 urgent](https://skipthegulf.com/?from=Vientiane&to=Helsinki&nat=FI&date=2026-03-12&flex=3) | Urgent: tight deadline, minimal ground transport |
| 2b | [flex=7](https://skipthegulf.com/?from=Vientiane&to=Helsinki&nat=FI&date=2026-03-12&flex=7) | More flex: does 14h ground open new gateways? |
| 2c | [land=1](https://skipthegulf.com/?from=Vientiane&to=Helsinki&nat=FI&date=2026-03-12&flex=7&land=1) | Land toggle: could enable VTE→BKK by bus (10h) instead of flight |
| 2d | [Anywhere](https://skipthegulf.com/?from=Vientiane&to=&nat=FI&date=2026-03-12&flex=7) | Anywhere: maybe easier to reach Stockholm/Copenhagen than Helsinki? |

### Check

- [ ] **DEADLINE:** Every route arrives in Helsinki by March 12. Nothing departing after ~March 11.
- [ ] **GATEWAY:** Routes through BKK or HAN. VTE has no direct Europe flights.
- [ ] **TIER (new):** flex=3 means 6h ground. VTE→BKK bus is 10h → should be `extended` tier. VTE→BKK flight should be `preferred` tier.
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

| # | URL | Tests what |
|---|-----|-----------|
| 3a | [flex=7](https://skipthegulf.com/?from=Bangkok&to=London&nat=GB&date=2026-03-20&flex=7) | Core: major hub, GB visa rules, family-friendly ranking |
| 3b | [flex=3](https://skipthegulf.com/?from=Bangkok&to=London&nat=GB&date=2026-03-20&flex=3) | Flex diff |
| 3c | [Anywhere](https://skipthegulf.com/?from=Bangkok&to=&nat=GB&date=2026-03-20&flex=7) | Anywhere: GB passport has different visa rules from EU — does "anywhere" handle this? |

### Check

- [ ] **DEADLINE:** All routes arrive by March 20. Nothing departing after ~March 19.
- [ ] **GB VISA RULES:** GB is NOT EU_SCHENGEN. China 144h TWOV eligible. India requires e-visa. Verify different treatment from EU passports.
- [ ] **HIDDEN STOPS:** CMB→LHR via Delhi — must flag Indian e-visa for GB. (Was fixed, verify still works.)
- [ ] **PRICES:** Prior test showed €328 vs Aviasales $368 — close (4%). Verify still OK.
- [ ] **SINGLE-TICKET PRIORITY:** "Recommended" should favor single-carrier routes for family safety.
- [ ] **NONSTOP TAG:** BKK→LHR Hainan Airlines has hidden stop via PEK — must NOT be tagged Nonstop. (Was fixed, verify.)
- [ ] **ANYWHERE (3c):** GB passport means no Schengen-free transit — does the tool handle this differently from EU in "anywhere" mode?
- [ ] **FLEX DIFF (3a vs 3b):** BKK is already a major hub, flex shouldn't matter much. But verify they're not identical.
- [ ] **GULF FILTER:** No Gulf carriers.

---

## Persona 4 — Lea, French backpacker in Da Lat

25yo, FR passport, very flexible. Currently in Da Lat (DLI, tiny airport). Comfortable with long overland travel. No rush — deadline March 25.

### Tests

| # | URL | Tests what |
|---|-----|-----------|
| 4a | [flex=7](https://skipthegulf.com/?from=Da+Lat&to=Paris&nat=FR&date=2026-03-25&flex=7) | Small origin, gateway routing, overland |
| 4b | [land=1](https://skipthegulf.com/?from=Da+Lat&to=Paris&nat=FR&date=2026-03-25&flex=7&land=1) | Land=1: enables 30h ground — DLI→SGN bus (7h) + maybe SGN→BKK bus? |
| 4c | [flex=3](https://skipthegulf.com/?from=Da+Lat&to=Paris&nat=FR&date=2026-03-25&flex=3) | Tight flex: 6h ground — may not even reach SGN by bus (7h). Engine should still find routes (extended tier). |
| 4d | [Anywhere land=1](https://skipthegulf.com/?from=Da+Lat&to=&nat=FR&date=2026-03-25&flex=7&land=1) | Anywhere + land: most flexible possible search |
| 4e | [BKK→Paris](https://skipthegulf.com/?from=Bangkok&to=Paris&nat=FR&date=2026-03-25&flex=7) | Gateway comparison: what if she buses to BKK first? |
| 4f | [SIN→Paris](https://skipthegulf.com/?from=Singapore&to=Paris&nat=FR&date=2026-03-25&flex=7) | Gateway comparison: what about SIN? |

### Check

- [ ] **DEADLINE:** All routes arrive by March 25. NOTHING in April/May/June/July. Prior test found July 4 departure — this was the critical bug.
- [ ] **FLEX=3 vs BUS (4c):** Da Lat→HCMC bus is 7h. Flex=3 = 6h ground max. The bus should be `extended` tier, not blocked entirely.
- [ ] **LAND TOGGLE (4a vs 4b):** land=1 should unlock more/different ground legs. If results are identical, land is cosmetic.
- [ ] **PRICES:** Prior test showed €238 (BKK→CDG) vs Aviasales $414 — 61% gap. Caused by summing segment prices. Is this fixed?
- [ ] **GATEWAY COMPARISON (4a vs 4e vs 4f):** Price difference should help Lea decide: bus to BKK (~20 EUR) or to SIN (~40 EUR)?
- [ ] **ANYWHERE (4d):** With max flexibility, what's the cheapest city to reach? This is Lea's real question.
- [ ] **GULF FILTER:** No Gulf carriers.
- [ ] **VISA:** FR is EU_SCHENGEN. All transit points should have visa info.

---

## Persona 5 — Expanded test matrix (new)

Additional queries covering more origins, destinations, passports, and parameter combos.

### Tests

| # | URL | Tests what |
|---|-----|-----------|
| 5a | [Bali→London GB flex=3 ASAP](https://skipthegulf.com/?from=Bali&to=London&nat=GB&date=2026-03-10&flex=3) | Delhi hidden stop visa trap, tight deadline |
| 5b | [Koh Tao→Berlin DE flex=7 +14d](https://skipthegulf.com/?from=Koh+Tao&to=Berlin&nat=DE&date=2026-03-21&flex=7) | Island → ferry → gateway |
| 5c | [CNX→Barcelona ES flex=5 +14d](https://skipthegulf.com/?from=Chiang+Mai&to=Barcelona&nat=ES&date=2026-03-21&flex=5) | Smaller airport, needs BKK gateway |
| 5d | [SIN→Rome IT flex=7 +7d](https://skipthegulf.com/?from=Singapore&to=Rome&nat=IT&date=2026-03-14&flex=7) | Easy hub, many routes |
| 5e | [HKT→Warsaw PL flex=3 +30d](https://skipthegulf.com/?from=Phuket&to=Warsaw&nat=PL&date=2026-04-06&flex=3) | Island airport, Eastern Europe dest |
| 5f | [PNH→Brussels BE flex=7 ASAP](https://skipthegulf.com/?from=Phnom+Penh&to=Brussels&nat=BE&date=2026-03-10&flex=7) | Cambodia → gateway |
| 5g | [MNL→Dublin IE flex=5 +14d](https://skipthegulf.com/?from=Manila&to=Dublin&nat=IE&date=2026-03-21&flex=5) | Philippines, non-Schengen dest |
| 5h | [HCMC→Budapest HU flex=7 +7d](https://skipthegulf.com/?from=Ho+Chi+Minh+City&to=Budapest&nat=HU&date=2026-03-14&flex=7) | Vietnam Airlines over Russia concern |
| 5i | [HAN→Stockholm SE flex=3 +14d](https://skipthegulf.com/?from=Hanoi&to=Stockholm&nat=SE&date=2026-03-21&flex=3) | Scandinavia, fewer direct options |
| 5j | [USM→Prague CZ flex=7 +7d](https://skipthegulf.com/?from=Koh+Samui&to=Prague&nat=CZ&date=2026-03-14&flex=7) | Island, small EU destination |
| 5k | [KUL→Lisbon PT flex=5 +30d](https://skipthegulf.com/?from=Kuala+Lumpur&to=Lisbon&nat=PT&date=2026-04-06&flex=5) | MY hub, far-west Europe |
| 5l | [BKK→Anywhere FR flex=7 +14d](https://skipthegulf.com/?from=Bangkok&to=Anywhere&nat=FR&date=2026-03-21&flex=7) | Open search, max results |
| 5m | [RGN→Vienna AT flex=7 +14d](https://skipthegulf.com/?from=Yangon&to=Vienna&nat=AT&date=2026-03-21&flex=7) | Myanmar, limited connections |
| 5n | [DPS→Anywhere DE flex=3 +7d](https://skipthegulf.com/?from=Bali&to=Anywhere&nat=DE&date=2026-03-14&flex=3) | Island + open search |
| 5o | [VTE→Copenhagen DK flex=7 land=1 +30d](https://skipthegulf.com/?from=Vientiane&to=Copenhagen&nat=DK&date=2026-04-06&flex=7&land=1) | Isolated + Scandinavia + land |
| 5p | [ICN→Lyon FR flex=5 +14d](https://skipthegulf.com/?from=Seoul&to=Lyon&nat=FR&date=2026-03-21&flex=5) | East Asia hub, small EU city |
| 5q | [TPE→Athens GR flex=7 +30d](https://skipthegulf.com/?from=Taipei&to=Athens&nat=GR&date=2026-04-06&flex=7) | Taiwan, Southern Europe |

### Check (all 5a-5q)

- [ ] **DEADLINE:** No route departs after deadline. No legs with dates months in the future.
- [ ] **GULF FILTER:** No Gulf carriers or transit cities in any route.
- [ ] **TIER:** Preferred routes before extended. Extended routes labeled correctly.
- [ ] **HIGHLIGHTED:** Top 2 routes shown prominently with "Show N more" for rest.
- [ ] **METADATA:** Response includes `metadata.apiCalls`, `cheapCalls`, `latestCalls`, `fallbackHits`.
- [ ] **TAGS:** Recommended, Cheapest, Fastest, Simplest assigned correctly. No "Adventure route" tag.

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
| 5a | x | | x | | | x | x | | x | | x | |
| 5b | x | | x | | x | | | x | x | | | x |
| 5c | x | | x | | x | | x | | x | | | x |
| 5d | | x | x | | x | | | x | x | | x | |
| 5e | x | | x | | x | | x | | x | | | x |
| 5f | x | | x | | x | | | x | x | | x | |
| 5g | x | | x | | x | | x | | x | | | x |
| 5h | | x | x | | x | | | x | x | | x | |
| 5i | x | | x | | x | | x | | x | | | x |
| 5j | x | | x | | x | | | x | x | | x | |
| 5k | | x | x | | x | | x | | x | | | x |
| 5l | | x | | x | x | | | x | x | | | x |
| 5m | x | | x | | x | | | x | x | | | x |
| 5n | x | | | x | x | | x | | x | | x | |
| 5o | x | | x | | x | | | x | | x | | x |
| 5p | | x | x | | x | | x | | x | | | x |
| 5q | | x | x | | x | | | x | x | | | x |

**34 tests covering:**
- Small origins (19) + hub origins (15)
- Specific destination (26) + anywhere (8)
- EU passport (30) + GB passport (4)
- Low flex (12) + high flex (22)
- land=0 (30) + land=1 (4)
- Tight deadline (10) + relaxed deadline (24)

---

## Systemic checks (run on ALL results)

Every single route returned, across all 34 queries:

1. **Departure ≤ deadline date.** No exceptions.
2. **No Gulf airline codes:** EY, EK, QR, FZ, G9, WY, GF, SV, XY, OV, KU, NAS, F3, 5W
3. **No Gulf transit cities:** AUH, DXB, DOH, SHJ, MCT, BAH, JED, RUH
4. **Price ≤ 20% of Aviasales click-through** (check top 3 per persona)
5. **Tags are factual:** "Nonstop" = single flight, "Fastest" = actually shortest, "Simplest" = fewest legs, "Recommended" = sensible pick. No "Adventure route."
6. **Hidden stops have visa warnings** for the passenger's nationality
7. **"Anywhere" returns multiple cities** — not just one destination repeated 25 times
8. **Tier ordering:** Preferred routes appear before extended routes
9. **Highlighted routes:** Top 2 shown prominently, rest behind "Show N more"
10. **No leg departs months after the route's departure date** (e.g., first leg Mar 9, second leg Jul 20 = bug)

---

## Known bugs to verify

| # | Bug | Expected | Status |
|---|-----|----------|--------|
| 1 | Gulf carriers in results | All filtered | 🟢 FIXED |
| 2 | Nonstop tag on multi-leg routes | Only on single flights | 🟢 FIXED |
| 3 | Delhi hidden stop visa for GB | Indian e-visa flagged | 🟢 FIXED |
| 4 | Routes months after deadline | All arrive before deadline | 🔴 BROKEN — second leg can have cached date months away |
| 5 | flex parameter cosmetic | Different flex = different results | 🟢 FIXED — two-pass tier system |
| 6 | land parameter cosmetic | land=1 adds longer ground legs | 🔴 UNKNOWN |
| 7 | Prices 50%+ off from Aviasales | Within 20% | 🔴 BROKEN |
| 8 | Aviasales page shows Gulf carriers | Non-Gulf results shown | 🔴 BROKEN |
| 9 | "Anywhere" not tested | Returns multiple EU cities | 🔴 UNKNOWN |
| 10 | Fastest tag misassigned | On actual fastest route | 🔴 BROKEN |
| 11 | Vietnam visa "evisa" for FI | Should be "free" | 🔴 BROKEN |
| 12 | flex=3 allows 7h bus (Da Lat→HCMC) | Should be extended tier, not preferred | 🟢 FIXED — two-pass tier |
| 13 | Second leg departure date months after first | All legs should depart near each other | 🔴 NEW — DPS→SIN Mar 9, SIN→LHR Jul 20 |
