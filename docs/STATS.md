# Third-Party API Integrations — Status

Overview of all external APIs used or planned for Go Back to Europe.

## Integration Status

| API | Status | Credentials | Client | Subfolder |
|-----|--------|-------------|--------|-----------|
| **Travelpayouts** (Aviasales) | Integrated | `AVIASALES_API_TOKEN` in `.env.local` | `src/lib/aviasales.ts` | [`docs/travelpayouts/`](travelpayouts/) |
| **Google Flights** | URL generation only | None needed (no API) | `src/lib/google-flights-url.ts` | [`docs/google-flights/`](google-flights/) |
| **SerpAPI** | Pending phone verification | Key exists, not verified | — | — |
| **AirLabs** | Waitlisted | None | — | — |
| **Sherpa** | Under review | None | — | — |

## What each API does for us

### Travelpayouts — Price engine backbone
Powers all flight pricing in the route engine. Two endpoints used:
- `/v1/prices/cheap` — cheapest cached monthly prices (primary)
- `/v2/prices/latest` — latest one-way prices (fallback)

Rate limit: **200 queries/hour**. The graph engine uses ~150 unique edge queries per search.

Affiliate marker `708661` earns commission on bookings through Aviasales links.

### Google Flights — Verify links
No API access. We reverse-engineer the protobuf-encoded `tfs` URL parameter to generate date-aware Google Flights search links. These appear as "Verify price" links on each flight leg.

### SerpAPI — Live price validation (planned)
Would provide structured Google Flights search results (250/month free tier). Use cases:
- Fare surge detection (compare cached vs live)
- Route existence verification
- Price calendar data

Blocked on phone verification. Key: see `docs/api-integrations.md`.

### AirLabs — Route verification (planned)
Would verify whether a given airline actually operates a given route (ghost route detection). Waitlisted, no ETA.

### Sherpa — Visa data (planned)
Authoritative visa/entry requirements API. Would replace hand-maintained visa JSON. Under review, no ETA.

## Usage in the codebase

```
src/lib/aviasales.ts          → Travelpayouts API client
src/lib/google-flights-url.ts → Google Flights URL builder
src/lib/route-engine.ts       → Calls aviasales.ts for pricing, uses fallback tables when API misses
src/data/visa-rules.ts        → Hand-maintained visa data (Sherpa would replace this)
```

## Pending integrations — priority order

1. **SerpAPI** — verify phone, build `src/lib/serpapi.ts`, use for fare context indicator
2. **AirLabs** — when access granted, build route existence verification
3. **Sherpa** — when access granted, replace `visa-rules.ts` with live lookups
