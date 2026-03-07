# Travelpayouts (Aviasales) API Client

## Overview

Travelpayouts is an affiliate platform powered by Aviasales. It provides cached flight price data and earns commission through booking links. This is the **primary pricing source** for the route engine.

**Client file:** `src/lib/aviasales.ts`
**API base:** `https://api.travelpayouts.com`
**Auth:** `AVIASALES_API_TOKEN` env var, passed as `?token=` query param
**Rate limit:** 200 requests/hour
**Affiliate marker:** `708661`
**Docs:** https://support.travelpayouts.com/hc/en-us/articles/203956163

## Endpoints Used

### `GET /v1/prices/cheap` — Cheapest monthly prices

Returns the cheapest cached tickets for a city pair in a given month.

```
GET /v1/prices/cheap?origin=BKK&destination=CDG&depart_date=2026-03&currency=EUR&token=TOKEN
```

**Response:** keyed by destination city code, then ticket index.
```json
{
  "success": true,
  "data": {
    "CDG": {
      "0": { "price": 271, "airline": "VN", "departure_at": "2026-03-15T..." }
    }
  }
}
```

**Client function:** `getCheapestFlight(origin, destination, departMonth?, excludeAirlines?)`
**Returns:** `CheapestFlightResult | null` — includes `price`, `airline`, `airlineName`, `departureAt`

**Used by:** `fetchSegmentPrice()` in route-engine.ts (primary pricing path)

### `GET /v2/prices/latest` — Latest one-way prices

Returns the latest discovered one-way prices, sorted by price. Supports filtering by number of stops.

```
GET /v2/prices/latest?origin=BKK&destination=CDG&currency=EUR&one_way=true&sorting=price&limit=30&token=TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "value": 285, "airline": "TG", "depart_date": "2026-03-18", "number_of_changes": 0 }
  ]
}
```

**Client function:** `getLatestOneWayPrice(origin, destination, excludeAirlines?, maxChanges?)`
**Returns:** `LatestPriceResult | null` — includes `price`, `airline`, `airlineName`, `departDate`, `numberOfChanges`

**Used by:**
- `fetchSegmentPrice()` — fallback when `/v1/prices/cheap` returns nothing
- `fetchNonstopPrice()` — with `maxChanges=0` to get nonstop-only prices

## Airline Filtering

Both client functions accept an `excludeAirlines?: Set<string>` parameter. The route engine passes `MIDDLE_EAST_HUB_AIRLINES` (EY, EK, QR, FZ, G9, GF, WY, SV, RJ, ME) to exclude Gulf-hub carriers from results.

## Airline Name Resolution

`airlineName(iataCode)` maps IATA codes to display names using a hardcoded table of ~60 airlines. Unknown codes fall through as-is.

## City Code Mapping

The API expects **city codes** (SEL, TYO, PAR, LON, ROM, MIL, BRU), not airport codes (ICN, NRT, CDG, LHR, FCO, MXP, CRL). The `cityCode()` function in `aviasales.ts` handles this mapping.

## Caching

Both endpoints use Next.js `fetch` with `{ next: { revalidate: 21600 } }` (6-hour ISR cache). This means the same origin-destination pair only hits the Travelpayouts API once every 6 hours per Vercel edge region.

## How the route engine uses it

```
searchRoutes()
  → fetchPriceWithFallback(from, to, month)
      → fetchSegmentPrice(from, to, month)        // tries /v1/prices/cheap then /v2/prices/latest
      → FIFTH_FREEDOM_ROUTES fallback              // EVA Air BKK→VIE etc.
      → FALLBACK_FLIGHT_PRICES fallback            // VTE→BKK $60 etc.
```

The engine collects all unique flight edges across candidate paths (~150 edges), fetches them in parallel via `Promise.all`, and builds a shared `priceMap` for route assembly.

## Endpoints NOT Yet Used (Available)

```
GET /v1/prices/calendar  — monthly price calendar (cheapest per day)
GET /v1/city-directions  — popular routes from an origin
GET /v1/airline-directions — routes operated by an airline
```

These would power:
- Fare context indicator (normal/elevated pricing)
- Route discovery (find corridors missing from SEGMENT_DURATIONS)
- Airline audit (verify carrier names, detect Gulf airlines)
