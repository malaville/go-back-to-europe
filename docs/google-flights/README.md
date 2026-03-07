# Google Flights URL Generator

## Overview

Not an API integration — we generate Google Flights search URLs client-side by reverse-engineering the protobuf-encoded `tfs` parameter. These URLs appear as "Verify price" links on each flight leg card.

**Client file:** `src/lib/google-flights-url.ts`
**No credentials needed.**

## How it works

Google Flights uses a `tfs` query parameter that encodes the search as a base64url-encoded protobuf message. We build this message from scratch:

```
googleFlightsUrl("BKK", "CDG", "2026-03-19")
→ https://www.google.com/travel/flights/search?tfs=<base64url>&tfu=EgYIABAAGAA&curr=EUR
```

The protobuf message encodes:
- Field 1: search type (28 = flights)
- Field 2: trip type (2 = one-way)
- Field 3: flight segment with date, origin airport, destination airport
- Fields 8, 9, 14: filter flags
- Field 16: price filter (max int = no limit)
- Field 19: result sorting (2 = by price)

### Fallback

When no date is available, falls back to a simple query-string URL:
```
https://www.google.com/travel/flights?q=Flights+to+CDG+from+BKK+oneway&curr=EUR
```

## Usage in codebase

```tsx
// In RouteResults.tsx — per flight leg
<a href={googleFlightsUrl(leg.fromCode, leg.toCode, route.departureDate)}>
  Verify price
</a>

// In /api/query endpoint — per leg in JSON response
verifyUrl: googleFlightsUrl(leg.fromCode, leg.toCode, route.departureDate)
```

## Protobuf encoding details

The file implements minimal protobuf serialization helpers:
- `writeVarint()` — variable-length integer encoding
- `writeVarintField()` — field tag + varint value
- `writeStringField()` — field tag + length-delimited UTF-8 string
- `writeBytesField()` — field tag + length-delimited byte array (for nested messages)

The output is base64url-encoded (no padding, `+`→`-`, `/`→`_`).

## Limitations

- Airport codes must be IATA codes (BKK, CDG, etc.), not city codes (PAR, LON)
- Only generates one-way searches
- No multi-city/round-trip support
- Google may change the protobuf schema at any time (last verified: March 2026)
