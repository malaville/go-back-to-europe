# Price Discrepancy Report — For the Building AI

> Generated: 2026-03-07
> Context: QA tester compared SkipTheGulf tool prices with actual Aviasales booking page prices.
> Severity: **HIGH** — 2 of 4 test cases show 50-100% price gaps.

---

## CRITICAL: Routes returning dates months in the future

**Test case:** `Da Lat → Paris, nat=FR, date=2026-03-07, flex=7`
**Expected:** Routes departing March 7-14, 2026
**Got:** Recommended route departs **July 4, 2026** — 4 months away

URL: `https://skipthegulf.com/?from=Da+Lat&to=Paris&nat=FR&date=2026-03-07&flex=7&land=1`

This is a crisis tool. Users are stranded NOW. Showing a July departure as "Recommended" is worse than showing nothing — it implies there are no options this week when there might be.

**For the building AI:** The flex parameter is supposed to mean "departure date +/- N days". Either:
1. The Travelpayouts API cache contains stale data from a different date window
2. The route engine is not filtering results by date window after receiving them
3. The flex window is not being applied at all (this was previously flagged as "flex parameter cosmetic")

Check `src/lib/route-engine.ts` and `src/lib/aviasales.ts` for how `flex` and `date` parameters are used in API calls and result filtering.

---

## The Price Problem

Users click "Book on Aviasales" expecting the price shown on SkipTheGulf. What they see on Aviasales is often much higher — and sometimes shows completely different routes (including Gulf carriers we're supposed to filter out).

## Test Results

| Persona | Route | Tool price | Aviasales page price | Delta | Airlines on Aviasales page |
|---------|-------|-----------|---------------------|-------|---------------------------|
| Joris | DPS→AMS | €392 (~$423) | $462 cheapest | +9% | AirAsia + **Qatar Airways** |
| Sanna | VTE→HEL | €326 (~$352) | $713 cheapest | +102% | Scoot + **Emirates** |
| James | BKK→LHR | €328 (~$354) | $368 cheapest | +4% | IndiGo + **Etihad Airways** |
| Lea | BKK→CDG | €238 (~$257) | $414 cheapest | +61% | **Oman Air + Qatar Airways** |

## Root Cause Analysis

### Finding 1: Aviasales booking page includes Gulf carriers

The Aviasales search page at `aviasales.com/search/BKK1503LHR1` returns ALL airlines — including Emirates, Qatar, Etihad, Oman Air. These are the cheapest results on Aviasales. Our tool correctly filters them out, but **the booking link sends users to a page dominated by Gulf carrier results**.

This is confusing UX: we tell users "no Gulf carriers" then send them to a page full of Gulf carriers.

Airlines found on Aviasales result pages:
- **Etihad Airways** (EY) — cheapest for BKK→LHR
- **Qatar Airways** (QR) — cheapest for DPS→AMS, BKK→CDG
- **Emirates** (EK) — cheapest for VTE→HEL, also appears in DPS→AMS and BKK→CDG
- **Oman Air** (WY) — cheapest for BKK→CDG

### Finding 2: Tool builds composite prices from segments, booking link searches full route

The tool's pricing algorithm likely works like this:
1. Query Travelpayouts API for segment prices: BKK→TBS ($150), TBS→CDG ($88)
2. Sum them: €238 total
3. Generate booking URL: `aviasales.com/search/BKK1503CDG1` (full origin→destination)

But this booking URL searches for **the full BKK→CDG journey** on Aviasales, which returns completely different routes (nonstop Thai Airways at $1,878, Gulf carrier connections at $414+). The segment-level prices the tool used to calculate €238 are not available as a single booking on Aviasales.

**This is the core bug: the tool shows the price of a route it constructed from individual segments, but the booking link goes to a search that doesn't match those segments.**

### Finding 3: Separate-ticket routes need separate booking links

For routes like BKK→TBS + TBS→CDG (separate tickets), the booking link should be TWO separate Aviasales searches:
- `aviasales.com/search/BKK1503TBS1` (leg 1)
- `aviasales.com/search/TBS1603CDG1` (leg 2)

Not one combined `BKK1503CDG1` search.

### Finding 4: EUR/USD mismatch may contribute

Tool shows prices in EUR (€), Aviasales page shows USD ($). If the tool is converting at a stale or incorrect rate, this adds to the discrepancy. But this is a minor factor compared to the segment vs. full-route issue.

---

## Questions for the Building AI to Investigate

1. **How does `src/lib/aviasales.ts` fetch prices?** Does it query per-segment or per-full-route? Check the Travelpayouts API endpoint being used — is it the `prices/latest` endpoint (historical/cached) or `flight_search` (live)?

2. **How are composite route prices calculated?** Is it summing individual segment cached prices? If so, those prices may be from different dates/availability windows and don't represent a bookable fare.

3. **Can we generate per-leg booking links?** For separate-ticket routes, generate one Aviasales link per leg instead of one link for the full route. This would match the price the user sees.

4. **Can we filter Gulf carriers in the Aviasales URL?** The Aviasales search URL may support airline exclusion parameters. Check if `?exclude_airlines=EY,EK,QR,WY,GF` or similar is supported.

5. **Should we switch to "Google Flights verify" as the primary CTA?** Google Flights already has per-leg search capability and doesn't show misleading combined results. The Aviasales affiliate link could be secondary.

6. **How stale are cached prices?** Check `flightCache.expiresAt` — if prices are cached for days, they may be severely outdated during a crisis with surging demand.

---

## Recommended Fixes (Priority Order)

### 1. Per-leg booking links for separate-ticket routes
Instead of `aviasales.com/search/BKK1503CDG1`, generate:
- Leg 1: `aviasales.com/search/BKK1503TBS1`
- Leg 2: `aviasales.com/search/TBS1603CDG1`

This alone would fix most of the price mismatch.

### 2. Add "prices are estimates" language
Change from showing `€238` to showing `~€238` or `from €238` with a note: "Price based on individual legs — final price may vary."

### 3. Make Google Flights "verify" link more prominent
The verifyUrl (Google Flights) shows real-time prices. Make it the primary action, with Aviasales as secondary.

### 4. Investigate Travelpayouts API for airline filtering
The API may support `exclude_airlines` or `airlines` parameters that would return only non-Gulf prices, making the displayed price match what users see when they click through.

### 5. Reduce cache TTL during crisis
Prices are volatile right now. If cache TTL is >6 hours, reduce to 1-2 hours.

---

## Files to Check

- `src/lib/aviasales.ts` — how prices are fetched and cached
- `src/lib/route-engine.ts` — how composite prices are calculated from segments
- `src/components/RouteResults.tsx` — how booking URLs are generated
- `src/db/schema.ts` → `flightCache` table — cache TTL configuration
