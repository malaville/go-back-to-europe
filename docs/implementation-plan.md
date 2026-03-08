# Implementation Plan — V1 Stabilization + V2

Reference: [v1-problems-and-v2-plan.md](v1-problems-and-v2-plan.md)

## Implementation checklist

### Phase 1: Immediate stabilization (no new APIs)

| # | Task | Doc ref | Files to touch |
|---|------|---------|----------------|
| ☐ | 1a. Add `RouteFlag` enum + `confidence` level to route types | §1a, §1b | `route-types.ts` |
| ☐ | 1a. Price floor table by route class + DTD multiplier | §1a L136-155 | `price-correction.ts` |
| ☐ | 1a. Clamp corrected prices to floor, add `PRICE_IMPLAUSIBLE` flag | §1a | `route-engine.ts` |
| ☐ | 1b. Flag `ROUTING_UNKNOWN` on legs >6h with missing airline | §1b L157-161 | `route-engine.ts` |
| ☐ | 1b. Sort UNVERIFIED routes last in results | §1b | `route-engine.ts` |
| ☐ | 1c. Switch K(d) to 75th percentile (K_high * 0.95) | §1c L163-171 | `price-correction.ts` |
| ☐ | 1d. Gulf confidence badges (green/yellow/red) on route cards | §1d L173-180 | `RouteResults.tsx` |
| ☐ | 1d. Warning badge for ROUTING_UNKNOWN routes | §1d | `RouteResults.tsx` |
| ☐ | 1e. Add `gulfPolicy` search param (block/warn/allow) | §1e L182-194 | `route-engine.ts`, `search/page.tsx` |
| ☐ | 1e. Gulf policy toggle on search form UI | §1e | `search/page.tsx` or form component |
| ☐ | 1e. Engine reads `ctx.gulfPolicy` instead of hard-filtering | §1e | `route-engine.ts` |

### Phase 2: Canary validation (Amadeus free tier)

| # | Task | Doc ref | Files to touch |
|---|------|---------|----------------|
| ☐ | 2. Amadeus API client (`/v2/shopping/flight-offers`) | §2 L196-208 | new: `src/lib/amadeus.ts` |
| ☐ | 2. Pick 10 canary routes, define in config | §2 | `src/data/canary-routes.ts` |
| ☐ | 2. Vercel cron job (daily 06:00 UTC) | §2 | `vercel.json`, new: `src/app/api/cron/canary/route.ts` |
| ☐ | 2. Store canary samples in DB | §2 | DB migration + cron handler |
| ☐ | 2. Build routing whitelist from canary data | §2 L204 | cron handler or separate script |
| ☐ | 2. K(d) auto-tuning: bayes-opt on canary samples (weekly) | §2 L210-219 | new: `scripts/tune-kd.ts` |

### Phase 3: Flight number resolution (Aviation Edge)

| # | Task | Doc ref | Files to touch |
|---|------|---------|----------------|
| ☐ | 3. Aviation Edge API client | §3 L221-230 | new: `src/lib/aviation-edge.ts` |
| ☐ | 3. DB table for flight number cache | §3 L229 | DB migration |
| ☐ | 3. Resolve unknown airlines in `fetchSegmentPrice` | §3 | `route-engine.ts` |
| ☐ | 3. GFAD fallback for unresolved flight numbers | §3 L230 | `route-engine.ts` |

### Phase 4: Heuristics engine refactor

| # | Task | Doc ref | Files to touch |
|---|------|---------|----------------|
| ☐ | 4. Define `HeuristicContext` with `now`, `gulfPolicy`, etc. | §4 L232-255 | new: `src/lib/heuristic-pipeline.ts` |
| ☐ | 4. Extract Transform/Filter/Score heuristic types | §4 L248-251 | `heuristic-pipeline.ts` |
| ☐ | 4. Migrate price correction to TransformHeuristic | §4 | `heuristic-pipeline.ts` |
| ☐ | 4. Migrate Gulf filtering to FilterHeuristic | §4 | `heuristic-pipeline.ts` |
| ☐ | 4. Migrate scoring to ScoreHeuristic | §4 | `heuristic-pipeline.ts` |
| ☐ | 4. Shadow-run: old + new pipeline, log disagreements | §4 L255 | `route-engine.ts` |

### Phase 5: Test redesign

| # | Task | Doc ref | Files to touch |
|---|------|---------|----------------|
| ☐ | 5. Install `fast-check` | §5 L268 | `package.json` |
| ☐ | 5. Curate 10-20 golden fixtures from existing 556 | §5 L277-284 | `__tests__/fixtures/golden/` |
| ☐ | 5. Property tests for price floors + Gulf flags | §5 L269-275 | new: `__tests__/property-*.test.ts` |
| ☐ | 5. Golden fixture tests with frozen `ctx.now` | §5 L277-283 | new: `__tests__/golden-*.test.ts` |
| ☐ | 5. MSW setup: `onUnhandledRequest: 'error'` | §5 L293 | test setup file |
| ☐ | 5. `server.resetHandlers()` in `afterEach` | §5 L294 | test setup file |
| ☐ | 5. Canary regression test (Tier 4, weekly CI) | §5 L286-289 | CI config + test script |

### Phase 6: V2 — GFAD live graph

| # | Task | Doc ref | Files to touch |
|---|------|---------|----------------|
| ☐ | 6. `searchRoutesV2()` with wave 1→2→3 propagation | v2-design §Phase 2 | new: `src/lib/route-engine-v2.ts` |
| ☐ | 6. Gulf filtering on GFAD results | v2-design | `route-engine-v2.ts` |
| ☐ | 6. Visa check at transit hubs | v2-design | `route-engine-v2.ts` |
| ☐ | 6. API: `engine=v2` param on `/api/query` | v2-design §Phase 3 | `api/query/route.ts` |
| ☐ | 6. Frontend: "Real-time prices" badge on V2 routes | v2-design §Phase 4 | `RouteResults.tsx` |
| ☐ | 6. V1 as fallback when GFAD is down | v2-design §Coexistence | `api/query/route.ts` |

---

## Slash commands

Run these to make progress. Each one is a focused session.

| Command | When | What it does |
|---------|------|-------------|
| `/improve-real-use-case` | Daily | Test app against a real stranded traveler post — find gaps, fix, report |
| `/stabilize` | Daily (Phase 1) | Pick next unchecked Phase 1 task, implement it, test, commit |
| `/canary-setup` | Once (Phase 2) | Set up Amadeus client, canary routes, cron job, DB table |
| `/canary-check` | Weekly (Phase 2+) | Review canary data, check K(d) drift, update whitelist |
| `/refactor-heuristics` | Weekly (Phase 4) | Extract one heuristic from route-engine into pipeline, shadow-run |
| `/test-golden` | Weekly (Phase 5) | Curate one golden fixture, write behavior test, run suite |
| `/v2-wave` | When Phase 1 done | Implement next V2 wave step, test against known routes |
