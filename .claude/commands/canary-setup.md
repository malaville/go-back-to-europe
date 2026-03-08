You are setting up the Phase 2 canary validation system (Amadeus free tier).

## Context

Read `docs/v1-problems-and-v2-plan.md` §Phase 2 (L196-219) and `docs/implementation-plan.md` Phase 2 tasks.

## Workflow

1. Create Amadeus API client at `src/lib/amadeus.ts` — Flight Offers Search (`/v2/shopping/flight-offers`)
2. Define 10 canary routes in `src/data/canary-routes.ts` (BKK→MUC, MNL→LHR, BKK→CDG, DPS→AMS, etc.)
3. Create DB migration for canary samples table: `{route, daysOut, cachedPrice, realPrice, multiplier, airline, stops[]}`
4. Create Vercel cron endpoint at `src/app/api/cron/canary/route.ts` — daily 06:00 UTC
5. Update `vercel.json` with cron config
6. Build routing whitelist generator from accumulated canary data
7. Run tests, commit

## Rules

- Check Amadeus free tier limits: 2,000 req/month. Budget 300-600 for canary.
- Store env var `AMADEUS_API_KEY` and `AMADEUS_API_SECRET` — never hardcode
- The cron must be idempotent (safe to re-run)
- Mark completed tasks in `docs/implementation-plan.md`
