# Skip the Gulf V1 — Problems, Research, and V2 Plan

## What Skip the Gulf does

A mobile-first web app for travelers stranded in Southeast Asia who need to reach Europe without using Gulf carriers or Gulf hub airports. The March 2026 Gulf airspace disruptions grounded or rerouted Emirates, Qatar, Etihad, and others — our app finds creative multi-hop routes avoiding them entirely.

**Stack:** Next.js 16, Vercel Hobby, Aviasales/Travelpayouts cached price API, MSW test fixtures.

**Core engine:** `route-engine.ts` (2,060 lines). Builds a 3-layer graph: Origin -> Hub -> Hub -> EU. Explores ~50 hub airports across China, India, Caucasus, Central Asia, East Asia. Prices each edge via Aviasales cached API. Returns scored, sorted `RouteOption[]`.

---

## The three fundamental V1 problems

### Problem 1: Price lies

Aviasales returns the **cheapest price ever seen for a given month** — a historical minimum, typically bookable 14-30 days out. For our users (stranded, need flights in 1-5 days), these prices are **5-20x too low**.

| Route | Cached price | Real price (d=3) | Ratio |
|---|---|---|---|
| BKK -> MUC | EUR 270 | EUR 3,268-5,371 | 12-20x |
| PVG -> LHR | EUR 84 | EUR 800+ | 10x+ |

**Current mitigation:** K(d) Gaussian correction model in `price-correction.ts`. Formula: `K(d) = 1 + 14 * e^(-0.08 * (d - 1.5)^2)`. Calibrated from a single data point. Displays both `totalPrice` (corrected estimate) and `veryUnderestimatedPrice` (raw cached) with the cached price struck through.

**What's still wrong:** Single-point calibration. No price floors to catch absurd values (EUR 84 for a 12-hour intercontinental flight). No confidence signal — user sees "~EUR 509" with no indication of how uncertain that number is.

### Problem 2: Gulf routes slip through

Our core product promise is "no Gulf carriers, no Gulf hub connections." But the filtering has gaps:

1. **Empty airline codes:** `/v2/prices/latest` sometimes returns flights with no airline. Our `MIDDLE_EAST_HUB_AIRLINES` filter can't block what it can't see. A PVG -> LHR at EUR 84 with no airline code appears as a "recommended" route — likely connecting via DOH or DXB.

2. **Filtering is scattered across 3 places:**
   - Airline code filtering in `fetchSegmentPrice` (API level)
   - Airport code filtering in candidate path generation (graph level)
   - Hidden stop detection in `buildRouteFromEdges` (assembly level)
   - A route can pass all three and still transit through the Gulf

3. **No positive verification:** We only check for known-bad signals. We never confirm that a routing is actually clean.

### Problem 3: Tests validate structure, not correctness

All 107 tests pass while the app shows routes through the Middle East with wrong-month dates and fairy-tale prices.

**Tests that passed while the app was broken:**
- `"every route has a price above zero"` — EUR 84 is above zero
- `"first flight leg has a departure date"` — "Aug 23" is a defined date
- `"no Gulf carriers"` — empty airline code is not in the Gulf set
- `"returns routes"` — yes, 25 routes, most of them misleading

**The gap:** Tests check engine contract (returns RouteOption[] with correct types), not user outcomes (would a stranded traveler trust this card?).

---

## Research findings

We consulted two AI systems (referred to as AI1 perplexity sonnet and AI2 perplexity deep research) with our specific problems. Here's what we learned, validated against published research.

### Price dynamics: U-shaped curve, not monotone

Academic research (EUR thesis, ScienceDirect) confirms flight prices follow a U-shaped "bathtub" curve vs days-before-departure:

```
P(d) = P_base + alpha * e^(-beta*d) + gamma * e^(-delta*(d - d0)^2)
```

- **45-90+ days out:** Moderately high (early fare buckets)
- **14-45 days:** Lowest plateau — this is what Aviasales returns
- **Last 14 days:** Sharp spike — last-minute business travelers
- **Final 2-3 days:** Peak, 1.3-1.5x average (but vs *minimum*, ratios are 10-20x)

**Key data point:** Bookings within 21 days cost ~40% more than optimal-window prices on average. Within 7 days, intercontinental prices spike non-linearly.

**K(d) multiplier ranges for SEA -> Europe (defensible from research):**

| d (days out) | Low multiplier | High multiplier | Example (cached EUR 270) |
|---|---|---|---|
| d=1 | x10 | x22 | EUR 2,700-5,940 |
| d=3 | x8 | x15 | EUR 2,160-4,050 |
| d=5 | x5 | x10 | EUR 1,350-2,700 |
| d=7 | x3 | x7 | EUR 810-1,890 |
| d=14+ | x1 | x1.3 | EUR 270-351 |

Our single observation (BKK -> MUC: x12 at d=3) falls within the d=3 range.

### PVG -> LHR at EUR 84: confirmed Gulf flag

The cheapest non-Gulf 1-stop PVG -> LHR is ~$215-243 on Chinese carriers (Hainan Airlines, China Southern) for advance bookings. EUR 84 is below the floor of any legitimate cached minimum. Known non-Gulf carriers on this route:

| Airline | Code | Via | Cheapest advance price |
|---|---|---|---|
| China Eastern | MU | Direct or via Chinese hubs | ~$270-320 |
| Hainan Airlines | HU | Chinese hubs | ~$243 |
| China Southern | CZ | Amsterdam or Helsinki | ~$234 |
| Finnair | AY | Helsinki | ~$326 |
| British Airways | BA | Direct | ~$400+ |

**Rule:** Any intercontinental segment below EUR 150 with no airline code -> automatic `GULF_SUSPECTED`.

### Amadeus: real prices but limited free tier

- **Flight Offers Search** (`/v2/shopping/flight-offers`): Returns actual bookable prices with real-time availability AND full segment routing (intermediate stops, operating carrier). This is the gold standard for Gulf transit detection.
- **Free tier:** 2,000 requests/month. At our volume (50-100 searches/day x 5-10 segments), we'd burn through in 2-4 days.
- **Sweet spot:** Use as a daily canary system (10 routes x 1-2 calls/day = 300-600/month), not for every search. Build a static routing whitelist from canary data.

### SerpAPI: legal GFAD alternative

- Supports Google Flights "explore from origin" mode (critical for V2 wave discovery)
- $250-500/month for our projected volume (9k-48k calls/month)
- Legally cleaner than raw GFAD scraping (Google ToS prohibits automated access; Ryanair v. PR Aviation precedent in EU creates civil liability risk)

### Flight number -> airline resolution

Aviation Edge's Airline Routes API (1,000 free calls/month) can resolve flight numbers to operating airlines and full routing. This would turn 20-30% of our `UNVERIFIED` legs into definitively verified ones.

### Confidence propagation

The `(value, confidence, warnings[])` tuple pattern is formally studied as Uncertainty Propagation (Microsoft Research). For our use case, a simple 4-level enum is sufficient:

- **HIGH:** Amadeus real-time confirmed, or all airline codes known + non-Gulf
- **MEDIUM:** K(d) corrected price, airline known but routing inferred
- **LOW:** Raw cached price, or heuristic-only Gulf detection
- **UNVERIFIED:** Missing airline code, unknown routing

Rule: the pipeline takes the MIN confidence of all its inputs. An `UNVERIFIED` airline leg degrades the whole route.

---

## What to build: the plan

### Phase 1: Immediate stabilization (no new APIs, no infra changes)

**Goal:** Stop showing misleading data. Pure code changes to existing engine.

#### 1a. Price floors by route class

Check BEFORE K(d) correction. Catches absurd cached values.

```
Floor table (one-way, d>=14):
  Intra-SEA (<=6h):     EUR 50
  SEA -> China (4-8h):  EUR 80
  China -> EU (10-13h): EUR 260
  SEA -> EU (12-18h):   EUR 300
  Hub -> Hub (2-5h):    EUR 70

DTD multiplier for floors:
  d >= 21:  x1.0
  d 8-20:   x1.3
  d 4-7:    x1.7
  d 0-3:    x2.2
```

If corrected price < floor: clamp to floor, add flag `PRICE_IMPLAUSIBLE`.

#### 1b. Unknown airline quarantine

Any flight leg with missing airline code on a segment > 6 hours -> flag `ROUTING_UNKNOWN`. Route gets `confidence: UNVERIFIED`. Shown last in results with warning badge: "Airline routing unverified — may connect via Gulf hubs."

Do NOT hide these routes — our users need options. But sort them below verified routes and mark them clearly.

#### 1c. Pessimistic display price

Use 75th percentile of K(d) range instead of midpoint. Crisis travelers need a safe upper bound to budget against, not a bargain-hunting number. Single number, not a range (ranges cause decision paralysis in crisis).

```
display_price = cached * K_high(d) * 0.95
```

Where K_high is the high end of the multiplier range.

#### 1d. Gulf confidence badges on route cards

Three visual tiers:
- Green: "Verified no Gulf" — all legs have known non-Gulf airline + no Gulf airports
- Yellow: "Likely no Gulf" — no Gulf airports, known airlines on long-haul legs, but some short-haul legs may have missing codes
- Red: "Routing unknown" — at least one long-haul leg has missing airline code

Default: show all three, sorted green -> yellow -> red.

#### 1e. User-configurable Gulf policy

The hard Gulf block was a V1 crisis default. As situations evolve, users should control their own risk tolerance.

**Search param:** `gulfPolicy: 'block' | 'warn' | 'allow'` (default: `'block'` — current behavior)

- **`block`** (default): Current behavior. Gulf carriers and airports filtered out entirely.
- **`warn`**: Gulf routes included but sorted last with prominent warning badge. Uses the same green/yellow/red confidence badges from 1d — Gulf routes show as red "Gulf transit" instead of being hidden.
- **`allow`**: No Gulf filtering. All routes treated equally. For users who just want the cheapest flight regardless of routing.

**UI:** Toggle or dropdown on search form — "Avoid Gulf carriers: Always / Warn me / No preference". Default stays safe (block). Per-carrier granularity is a future option (e.g. trust Turkish Airlines via IST but not Emirates via DXB) but not needed for V1 — the three-level policy covers the main use cases.

**Engine change:** `MIDDLE_EAST_HUB_AIRLINES` and Gulf airport lists stay as constants, but `fetchSegmentPrice` and path generation check `ctx.gulfPolicy` instead of hard-filtering. When `gulfPolicy === 'warn'`, Gulf routes pass through the pipeline but get flagged and scored down.

### Phase 2: Canary validation system (Amadeus free tier)

**Goal:** Build a calibration dataset and routing whitelist.

- Pick 10 canary routes (BKK -> MUC, MNL -> LHR, BKK -> CDG, DPS -> AMS, etc.)
- Vercel cron job, daily at 06:00 UTC
- Query Amadeus Flight Offers Search for each route
- Store: `{route, daysOut, cachedPrice, realPrice, multiplier, airline, stops[]}`
- Build static routing whitelist: `"PVG-LHR": {nonGulfRoutings: [{airlines: ["MU","BA"], stops: []}, {airlines: ["AY"], stops: ["HEL"]}]}`
- Use whitelist in Phase 1b: if a route's airline matches the whitelist, upgrade from `UNVERIFIED` to `HIGH`
- Use price pairs to auto-tune K(d) parameters (see below)

Budget: ~300-600 Amadeus calls/month out of 2,000 free.

#### K(d) auto-tuning from canary data

The current K(d) Gaussian is hand-tuned from a single data point. As canary samples accumulate (100-500 `(cached, real, dtd, route_class)` pairs/month), use Bayesian optimization to auto-fit the parameters — no ML expertise needed:

- **Objective:** minimize MAPE across held-out samples
- **Tunable params:** Gaussian center (μ), spread (σ), crisis floor multiplier
- **Tooling:** `bayes-opt` npm package, ~5 lines, runs weekly in cron, evaluates 20-50 samples in <1s
- **Manual cross-check:** Plot `real/cached` vs `dtd` in Datadog notebooks. If d=3 multiplier drifts from x12 to x10, bump it until next auto-tune.

This gets 80% of ML precision gains with zero infra. Full ML (LightGBM on tabular features) makes sense later if we hit 500+ samples and want another 20-50% precision — but it's overkill for V1.

### Phase 3: Flight number resolution (Aviation Edge)

**Goal:** Resolve unknown airlines for legs that have flight numbers.

- When Aviasales returns `flight_number` but no `airline`, query Aviation Edge Airline Routes API
- Map flight number -> operating airline + intermediate stops
- Turns `UNVERIFIED` -> `HIGH` or `GULF_SUSPECTED`
- Budget: 1,000 free calls/month, easily covers our volume
- **Caching:** Store resolved flight numbers in DB (`flight_number → airline, route, stops`). Flight numbers are highly stable (CZ 3010 = China Southern regardless of date), so cache entries only need seasonal refresh. Cold start ~500 calls, steady state ~150-600/month.
- **GFAD as last resort:** If Aviation Edge can't resolve a flight number (or budget is tight), fall back to GFAD — query the origin→destination pair and match by price/duration to infer the airline. Less reliable but free and unlimited.

### Phase 4: Heuristics engine refactor

**Goal:** Replace scattered ad-hoc checks with a composable pipeline.

Current state: Gulf detection happens in 3 places. Price correction happens in `buildRouteFromEdges`. Visa warnings are inline. Hidden stop detection is a separate function called mid-assembly. All interleaved in a 250-line function.

Target architecture:

```
RawRoute (from graph assembly)
  -> Transform[] (K(d) correction, price floor clamping, date inference)
  -> Filter[] (hard Gulf drop, off-window dates)
  -> Score[] (Gulf risk scoring, price reliability, completeness)
  -> EvaluatedRoute (with safetyScore, reliabilityScore, flags[], confidence)
```

Three heuristic types:
- **TransformHeuristic:** `(route, ctx) -> route` — modifies data (price correction, fill missing fields)
- **FilterHeuristic:** `(route, ctx) -> {keep: true} | {keep: false, reason}` — hard drops
- **ScoreHeuristic:** `(route, ctx) -> {safetyDelta, reliabilityDelta, flags[]}` — adjusts scores

All heuristics receive a `HeuristicContext` with `now: Date` (never call `new Date()` inside a heuristic). This makes everything deterministic and testable.

Shadow-run approach: compute both old and new scores in the same request, return old results, log disagreements to Datadog. Flip when stable.

### Phase 5: Test redesign

**Goal:** Tests that catch the EUR 84 PVG -> LHR bug and the Aug 23 date bug.

**Key principle:** All heuristic tests use `ctx.now` from Phase 4's `HeuristicContext` — never `Date.now()`. This makes every test deterministic regardless of when it runs.

Four test tiers:

**Tier 1: Contract tests (keep existing, ~20%)**
- Returns RouteOption[], prices are numbers, correct airport codes

**Tier 2: Plausibility / property-based tests (new, ~50 tests)**
- Use `fast-check` to generate 1000s of random routes — no fixtures needed
- "No intercontinental leg has corrected price below EUR 400 when d <= 7"
- "No route with missing airline code on a >6h leg has confidence above MEDIUM"
- "All displayed dates fall within user's travel window"
- "At least one route is visible without clicking Show More" (the highlighted bug)
- Property: `fc.property(fc.integer({min:0,max:30}), dtd => if dtd<=5 && longhaul, correctedPrice >= cachedPrice * 5)`
- Property: generate routes with/without airline codes, assert confidence levels match

**Tier 3: Golden fixture tests (new, 10-20 curated fixtures)**
- Curate 10-20 "golden" fixtures from the existing 556 — known-bad scenarios only
- All tests pass explicit `now: new Date('2026-03-07')` so `daysToDeparture` is stable forever
- Assert downstream behavior, not just structure:
  - "PVG -> LHR EUR 84 with no airline -> flagged ROUTING_UNKNOWN, shown last"
  - "BKK -> MUC cached EUR 270 at d=3 -> corrected to EUR 2,500+"
  - "Aug 23 departure date for March search -> date shows as estimated, not raw"
- Remaining ~540 fixture files are regenerable via `npm run record-fixtures` — not golden

**Tier 4: Canary regression (weekly CI)**
- Replay recent prod payloads through old vs new pipeline
- Fail if >5% of routes change `safetyScore` by >20 points
- Ties into Phase 2's Amadeus canary data

#### Fixture management

- **MSW setup:** `onUnhandledRequest: 'error'` — catches any API call escaping mocks
- **Isolation:** `server.resetHandlers()` in `afterEach` — prevents cross-test pollution
- **Refresh:** Monthly `npm run record-fixtures` against live Aviasales, commit diff, review for regressions
- **Schema validation:** Zod schemas ensure all fixtures match `RawRoute` shape (catches API format drift without re-recording)

### Phase 6: V2 — GFAD/SerpAPI live graph discovery

**Goal:** Replace static graph + cached prices with real-time date-specific data.

Already designed in `docs/v2-route-engine-design.md`. Key dependency decision:
- **GFAD (undocumented Google API):** Free, fast, 50 destinations per call. Legal risk: medium-high.
- **SerpAPI Google Flights:** $250-500/month. Supports explore mode. Legally defensible.
- **Recommendation:** Start with GFAD for development/testing, budget SerpAPI for production.

V2 solves Problems 1-3 at the source: real prices, real airlines, real routing. But V1 stabilization (Phases 1-4) is needed regardless — V2 will take weeks, and users are stranded now.

---

## Current codebase reference

| File | Lines | Role |
|---|---|---|
| `src/lib/route-engine.ts` | 2,060 | Core engine: graph, pricing, assembly, scoring |
| `src/lib/price-correction.ts` | 99 | K(d) Gaussian model |
| `src/lib/aviasales.ts` | 318 | API client + call tracking |
| `src/data/route-types.ts` | 38 | RouteOption, RouteLeg types |
| `src/components/RouteResults.tsx` | 417 | Route card UI |
| `src/app/search/page.tsx` | 311 | Search results page |
| `src/__tests__/*.test.ts` | 7 files | 107 tests (structural, not behavioral) |
| `src/__tests__/fixtures/*.json` | 556 files | MSW recorded API responses |
| `docs/v2-route-engine-design.md` | 216 | V2 GFAD architecture |

Key constants in route-engine.ts:
- `MIDDLE_EAST_HUB_AIRLINES`: 13 carriers (EY, EK, FZ, G9, QR, GF, WY, SV, RJ, ME, KU, OV, XY)
- `AIRLINE_HUBS`: 12 carriers with known hub airports
- `EU_SEARCH_AIRPORTS`: 21 European destination airports
- `SEGMENT_DURATIONS`: ~458 hardcoded flight time entries
- `GROUND_CONNECTIONS`: Bus/train/HSR links between nearby airports

---

## Sources

- EUR thesis on flight price dynamics: https://thesis.eur.nl/pub/63169/524371KaiyingZhang_BachelorThesis.pdf
- ScienceDirect on optimal booking windows: https://www.sciencedirect.com/science/article/abs/pii/S0969699714000842
- Amadeus Flight Offers Search API: https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/flights/
- Amadeus free tier limits: https://www.oreateai.com/blog/navigating-amadeus-selfservice-apis-understanding-pricing-and-quotas-for-2025/
- SerpAPI Google Flights: https://serpapi.com/google-flights-api
- Aviation Edge Routes API: https://aviation-edge.com/premium-api/
- AirLabs Flight Data: https://airlabs.co/docs/flight
- Microsoft Research on Uncertainty Propagation: https://www.microsoft.com/en-us/research/wp-content/uploads/2019/02/socc18-final153-5c70f790d04bd.pdf
- Web scraping legality: https://www.scrapingbee.com/blog/is-web-scraping-legal/
- Skyscanner PVG -> LHR pricing: https://www.skyscanner.com/routes/pvg/lhr/
- MightyTravels on advance booking data: https://www.mightytravels.com/2025/01/data-driven-why-70-90-days-before-departure-consistently-yields-lower-airfares-in-2024/
