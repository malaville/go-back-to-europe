# Google Flights Anywhere Data (GFAD) — Discovery Report

**Date:** 2026-03-08
**URL:** `https://www.google.com/travel/explore?...`
**Origin tested:** Seoul (ICN) → Anywhere, date 2026-03-11
**Method:** Puppeteer (headless=false) + browser-server.js on port 3099

## Summary

Two viable extraction methods. DOM is simpler, XHR is richer.

## Method 1: DOM scraping (recommended for MVP)

**Selector:** `div[jsname="rDXRdb"]`

```js
const markers = document.querySelectorAll('div[jsname="rDXRdb"]');
const results = [];
for (const m of markers) {
  const name = m.querySelector('.cCO9qc')?.textContent?.trim();
  const price = m.querySelector('span[aria-label]')
    ?.getAttribute('aria-label')?.match(/\d+/)?.[0];
  if (name && price) results.push({ name, price: parseInt(price) });
}
return results;
```

**Returns:** 55 destinations with EUR prices.
**Pros:** 5 lines of JS, dead simple, always matches what user sees.
**Cons:** No airline, no stops count, no duration, no airport code. City names only (need mapping).

## Method 2: XHR interception (richer data)

**Endpoint:** `POST /_/FlightsFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetExploreDestinations`

**Response:** ~85KB, 11 chunks. Chunk 0 = destinations (cities, coords). Chunk 1 = prices.

**Price entry structure (chunk 1, `payload[4][0][n]`):**
```
[0] = "/m/city_id"          — Google entity ID
[1] = [[null, PRICE], "..."] — price in EUR + encoded booking ref
[6] = [
  airline_code,    — "7C", "VJ", "multi"
  airline_name,    — "Jeju Air", "Vietjet"
  stops,           — 0=nonstop, 1=1stop, 2=2stops
  duration_min,    — total flight time in minutes
  null,
  dest_airport,    — "SIN", "HKG", "BKK"
  origin_id,       — "/m/0hsqf"
  null,
  ?                — sometimes 0, sometimes 60/90
]
```

**Returns:** 76 entries (54 priced, 22 unpriced).
**Pros:** Airport codes, airline, stops, duration — everything needed.
**Cons:** Requires HAR parsing, protobuf-ish chunked format, needs `/m/` → airport code mapping.

## URL construction

The explore URL encodes origin + date in the `tfs` parameter. Key POST body structure:

```
f.req=[null,"[
  [],                           -- filters
  null, null,
  [null,null,2,null,[],1,
    [1,0,0,0],                  -- one-way
    [null,650],                 -- max price? (EUR)
    null,null,null,null,null,
    [[[[["/m/0hsqf",5]]]],      -- origin: /m/0hsqf = Seoul
     [],                        -- destination: empty = anywhere
     null, 0, null, null,
     "2026-03-11",              -- date
     null,null,null,null,null,null,null,
     3                          -- stops? cabin class?
    ]
  ],
  null,null,null,1,null,null,null,null,null,null,1,1
]"]
```

**Key params to vary:**
- `/m/XXXXX` — origin city entity ID
- `"2026-03-11"` — departure date
- `[null,650]` — likely max price filter (EUR)
- `3` at end — possibly max stops

## City entity IDs (from this crawl)

| City | /m/ ID | Airport |
|------|--------|---------|
| Manila | /m/0195pd | MNL |
| Seoul | /m/0hsqf | ICN |
| Tokyo | /m/07dfk | NRT/HND |
| Bangkok | /m/0fn2g | BKK |
| Hong Kong | /m/03h64 | HKG |
| Singapore | /m/06t2t | SIN |
| Hanoi | /m/0fnff | HAN |
| Ho Chi Minh | /m/0hn4h | SGN |
| Taipei | /m/0ftkx | TPE |
| Chiang Mai | /m/01hr58 | CNX |
| Kuala Lumpur | /m/049d1 | KUL |
| Shanghai | /m/06wjf | PVG |
| Beijing | /m/01914 | PEK |
| Chengdu | /m/016v46 | CTU |
| Delhi | /m/0dlv0 | DEL |
| Mumbai | /m/04vmp | BOM |
| Istanbul | — | IST |
| Almaty | /m/0151s1 | ALA |
| Tashkent | /m/0fsmy | TAS |
| Colombo | /m/0fn7r | CMB |
| London | /m/04jpl | LHR |
| Paris | /m/05qtj | CDG |

## Recommended plan for GFAD integration

### Phase 1: DOM scraper (today)

Build `scripts/gfad-scout.js`:
1. Navigate to Google Flights Explore with origin + date
2. Wait for markers to render
3. Extract via `div[jsname="rDXRdb"]` selector
4. Map city names to airport codes via our `cities.ts`
5. Return `{ airport, price, city }[]`

**Hop chain:**
```
MNL, Mar 10 → [SIN €45, HKG €61, BKK €65, TPE €56, DEL €156, ...]
    ↓ for each candidate under €200
SIN, Mar 11 → [LON €?, IST €?, ...]
    ↓ if London found → done (2-hop route with real prices)
```

**Cost:** 1 browser page load per hop. ~3 hops × ~5 candidates = ~15 page loads per search.

### Phase 2: XHR direct call (later)

Reverse-engineer the POST body to call `GetExploreDestinations` directly without a browser:
- Construct the `f.req` payload with origin ID + date
- POST to the endpoint with proper cookies/headers
- Parse chunked response → get airport codes, prices, airlines, stops, duration

**Advantage:** No browser needed, 10x faster, richer data.
**Risk:** Google may require session cookies, rate-limit, or change the API.

### Phase 3: Replace Aviasales cached prices

Once GFAD works reliably, use it as the primary price source:
- Real-time, date-specific prices
- Actual airline + stops info
- No more "cheapest of month" date mismatch problem

## Sample data: Manila → Anywhere, Mar 11

| Price | City | Airport | Airline | Stops | Duration |
|-------|------|---------|---------|-------|----------|
| €45 | Singapore | SIN | Jeju Air | 0 | 6h50 |
| €47 | Sapporo | CTS | Jin Air | 0 | 2h40 |
| €54 | Hanoi | HAN | Vietjet | 0 | 5h05 |
| €56 | Taipei | TPE | Tigerair | 0 | 2h45 |
| €57 | Ho Chi Minh | SGN | Vietjet | 0 | 5h30 |
| €61 | Hong Kong | HKG | HK Express | 0 | 4h05 |
| €63 | Chengdu | CTU | Shandong | 1 | 7h35 |
| €65 | Bangkok | BKK | — | — | — |
| €76 | Kuala Lumpur | KUL | — | — | — |
| €82 | Beijing | PEK | — | — | — |
| €117 | Tokyo | NRT | — | — | — |
| €135 | Urumqi | URC | Shandong | 2 | 24h50 |
| €156 | Delhi | DEL | — | — | — |
| €259 | Tashkent | TAS | — | — | — |
| €380 | Almaty | ALA | Air Astana | 0 | 7h10 |
