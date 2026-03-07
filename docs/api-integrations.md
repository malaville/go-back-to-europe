# External API Integrations — Status & Usage Guide

> This file is kept for reference. The canonical docs are now:
> - **[STATS.md](STATS.md)** — integration status overview
> - **[travelpayouts/](travelpayouts/)** — Aviasales API client docs
> - **[google-flights/](google-flights/)** — Google Flights URL generator docs
> - **[qa-test-personas.md](qa-test-personas.md)** — QA testing methodology

## Pending APIs (no credentials yet — no subfolder)

### SerpAPI (Google Flights) — NEEDS PHONE VERIFICATION
- **API base:** `https://serpapi.com/search`
- **API key:** `d5371bc04f473ee914a8c0089a5f666ab0cdb6c56261e69cbd5fcbe322600088`
- **Docs:** https://serpapi.com/google-flights-api
- **Free tier:** 250 searches/month
- **Use for:** live price validation, fare surge detection, route existence verification
- **Example:**
  ```
  GET https://serpapi.com/search?engine=google_flights&departure_id=BKK&arrival_id=CDG&outbound_date=2026-03-25&currency=EUR&type=2&api_key=KEY
  ```

### AirLabs — WAITLISTED
- Airline/airport database, active route verification
- Would solve ghost route detection (e.g. "Lufthansa TBS→HEL" doesn't exist direct)
- No ETA

### Sherpa — UNDER REVIEW
- Authoritative visa/entry requirements by nationality x destination
- Would replace hand-maintained `src/data/visa-rules.ts`
- No ETA

## Skipped

| API | Why |
|-----|-----|
| Kiwi Tequila | Account creation broken/blocked |
| VisaDB.io | Appears defunct |
| AviationStack | Redundant with AirLabs, lower free tier |

## Known bugs from QA testing

See [qa-test-personas.md](qa-test-personas.md) for full test methodology and bug list.

**Critical:**
1. Hidden stop visa not flagged — CMB→LHR via Delhi, GB passport needs Indian e-visa
2. XY (flynas, Saudi) appearing in route results

**High:**
3. Milan returns 0 routes despite being a listed destination

See the QA doc for medium/low severity bugs.

## Env vars

```env
# Already configured
AVIASALES_API_TOKEN=...

# Add when verified
SERPAPI_KEY=d5371bc04f473ee914a8c0089a5f666ab0cdb6c56261e69cbd5fcbe322600088

# Add when access granted
AIRLABS_KEY=...
SHERPA_KEY=...
```
