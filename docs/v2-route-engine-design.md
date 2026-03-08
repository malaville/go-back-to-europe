# V2 Route Engine — GFAD-Powered Graph Propagation

## Problem with V1

The current engine uses:
- **Static graph** from hardcoded `SEGMENT_DURATIONS` (458 entries, manually maintained)
- **Aviasales cached prices** (cheapest-of-month, wrong dates, stale airlines)
- **3-layer BFS** on the static graph, then prices fetched after

Result: we only find routes we've pre-configured, and prices are often wrong.

## V2 Vision: Live Graph Discovery

Instead of a static graph, V2 **discovers the graph in real-time** using GFAD:

```
           Phase 1 (~1s)              Phase 2 (~1s)              Phase 3 (~1s)
         ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
  MNL ──→│ GFAD(MNL,d)  │──→ HKG ─│ GFAD(HKG,d+1)│──→ LHR ─│   DONE       │
         │ 50 dests     │   BKK ──│ GFAD(BKK,d+1)│──→ CDG  │   2-hop      │
         │ real prices  │   SIN ──│ GFAD(SIN,d+1)│──→ AMS  │   routes     │
         │ date-specific│   NRT ──│ GFAD(NRT,d+1)│──→ MUC  │   found!     │
         └──────────────┘   DEL ──│ GFAD(DEL,d+1)│──→ FCO  │              │
                            IST ──│ GFAD(IST,d+1)│──→ ...  │              │
                                  └──────────────┘          └──────────────┘
```

Each GFAD call returns ~50 destinations with real prices, airlines, stops, duration.

## Algorithm

### Input
```
origin: string      // IATA code (MNL, BKK, etc.)
target?: string     // IATA code or empty (= anywhere in EU)
date: string        // departure date (ISO)
flexDays: number    // try date, date+1, ..., date+flexDays
maxPrice: number    // EUR budget cap
nationality: string // for visa checks
```

### Step 1: Wave 1 — Origin expansion

```
wave1 = await gfadExplore(origin, date)
```

Filter candidates:
- Price ≤ `maxPrice * 0.6` (leave budget for hop 2)
- Stops ≤ 1
- Not in excluded regions (Gulf airports)
- Has GFAD support (we need its entity ID for wave 2)

Separate into:
- **EU hits**: Direct routes to Europe found! (rare from SEA, but possible: BKK→LHR, SIN→LHR)
- **Hub candidates**: Non-EU airports to explore in wave 2

### Step 2: Wave 2 — Hub expansion (parallel)

```
wave2 = await gfadExploreMulti(hubCandidates, date + 1)  // ~1s parallel
```

For each hub result, find EU destinations:
- Price of hop1 + hop2 ≤ `maxPrice`
- Stops ≤ 1 (per leg)
- Not transiting through Gulf
- Visa-free transit at hub (check visa rules)

Produces 2-hop routes: `origin → hub → EU`

### Step 3: Wave 3 — Deep hubs (optional, for 3-hop)

If wave 2 found no EU destinations from some hubs, expand one more level:

```
wave3 hubs = wave2 results that are close to EU but not there yet
           (IST, TBS, GYD, ALA, ADD — gateway cities)
wave3 = await gfadExploreMulti(wave3hubs, date + 2)
```

Produces 3-hop routes: `origin → hub1 → hub2 → EU`

### Step 4: Route assembly

For each complete route (origin → ... → EU):
- Sum prices from GFAD (already date-specific!)
- Sum durations
- Check visa at each transit
- Apply Gulf airline filter (MIDDLE_EAST_HUB_AIRLINES)
- Generate Google Flights verification URLs

### Step 5: Scoring & sort

Same multi-factor scoring as V1 (price, time, stops, visa, safety).

## Key Advantages Over V1

| | V1 (Aviasales + static graph) | V2 (GFAD + live graph) |
|---|---|---|
| **Prices** | Cheapest-of-month (often wrong) | Date-specific, real-time |
| **Graph** | 458 hardcoded segments | ~50 destinations per node, discovered live |
| **Airlines** | Often wrong carrier returned | Actual airline + code |
| **Stops** | Unknown (hidden stops heuristic) | Exact stop count from Google |
| **Duration** | Hardcoded estimates | Real flight duration |
| **Speed** | ~3s (API calls dominate) | ~2-3s (1s per wave, parallel) |
| **Coverage** | Only pre-configured routes | Any route Google Flights knows |
| **Maintenance** | Manual: add segments, prices | Zero: all discovered live |

## Coexistence Strategy

V2 doesn't replace V1 immediately. They coexist:

1. **V1 stays as fallback** — when GFAD is down or rate-limited
2. **V2 runs in parallel** — results merged, deduplicated
3. **Gradual migration** — once V2 is proven, V1 becomes the fallback only
4. **Tests run against both** — V1 tests are the baseline

## API Budget

Each search uses:
- Wave 1: 1 GFAD call
- Wave 2: 5-10 GFAD calls (parallel)
- Wave 3: 0-5 GFAD calls (parallel)
- **Total: 6-16 calls per search, ~2-3s wall time**

No API key needed. No rate limit observed (tested up to 10 parallel).
Risk: Google could add rate limiting or change the API format.

## Implementation Plan

### Phase 1: GFAD client ✅
- [x] `src/lib/gfad.ts` — `gfadExplore()`, `gfadExploreMulti()`
- [x] Date-specific pricing (flag `[3][17]=1`)
- [x] Parse both response formats (single-line and chunked)
- [x] Entity ID mapping for 60+ airports

### Phase 2: V2 search function
- [ ] `src/lib/route-engine-v2.ts` — `searchRoutesV2()`
- [ ] Wave 1→2→3 propagation with candidate filtering
- [ ] Gulf airline/airport filtering
- [ ] Visa checking at transit hubs
- [ ] Route assembly with real GFAD prices
- [ ] Scoring (reuse V1 scoring logic)

### Phase 3: API integration
- [ ] `/api/query` and `/api/explain` — add `engine=v2` param
- [ ] Return both V1 and V2 results, let frontend show best
- [ ] Add GFAD metadata to explain output (wave timings, candidates explored)

### Phase 4: Frontend
- [ ] Show "Real-time prices" badge on V2 routes
- [ ] Show airline logos (we have IATA codes from GFAD)
- [ ] Remove "prices are estimates" warning for V2 routes

### Phase 5: Deprecate V1
- [ ] Once V2 covers all test cases, make V1 fallback-only
- [ ] Remove SEGMENT_DURATIONS maintenance burden
- [ ] Remove Aviasales dependency (or keep as supplementary)

## Candidate Filtering Heuristics

### Wave 1 → Wave 2 hub selection

From GFAD results, select hubs that are:
1. **Under price cap**: price ≤ 60% of total budget
2. **Low stops**: 0 or 1 stop
3. **Known connectors**: airports that historically connect to EU
   - Tier A (always explore): IST, DEL, BOM, ADD, SIN, HKG, ICN, NRT, PEK, PVG
   - Tier B (explore if cheap): CTU, XIY, CAN, BKK, KUL, ALA, TAS, CMB
   - Tier C (explore only if very cheap): CCU, GYD, TBS, URC
4. **Not Gulf**: exclude DXB, AUH, DOH, BAH, RUH, MCT, KWI, SHJ, AMM
5. **GFAD-supported**: must have entity ID for wave 2

### Wave 2 → EU matching

Match destinations to EU airports. GFAD returns IATA codes directly,
so just check against EU_AIRPORTS set.

### Date propagation

- Wave 1: user's departure date
- Wave 2: wave 1 date + 1 day (minimum connection)
- Wave 3: wave 2 date + 1 day
- With flexDays: try multiple starting dates in parallel

## Example: MNL → London, March 14

**Wave 1** (MNL, 2026-03-14): 50 destinations
```
HKG €53, SIN €106, TPE €84, BKK €114, NRT €210, ICN €171,
DEL €125, PEK €108, CTU €133, PVG €101, ...
```

Hub candidates (under €200, not Gulf): HKG, SIN, TPE, BKK, ICN, DEL, PEK, CTU, PVG

**Wave 2** (parallel, 2026-03-15): 9 calls, ~1s
```
HKG→: LHR €380, CDG €350, AMS €390, MUC €360, ...
SIN→: LHR €320, CDG €340, AMS €350, ...
DEL→: LHR €280, CDG €310, ...
IST→: LHR €120, CDG €90, AMS €95, ...  (if IST was in wave 1)
PEK→: LHR €450, CDG €420, ...
```

**Assembled routes** (sorted by total price):
```
MNL→HKG→LHR  €53+€380 = €433  (2 legs, 1 stop each, 2h20+12h)
MNL→DEL→LHR  €125+€280 = €405  (2 legs, visa check!)
MNL→SIN→LHR  €106+€320 = €426  (2 legs, 4h+13h)
MNL→PVG→CDG  €101+€420 = €521  (2 legs, TWOV check)
...
```

All with real, date-specific prices. No guessing.
