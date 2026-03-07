You are improving skipthegulf.com results for a real stranded traveler. The user will paste a real situation (from Reddit, DMs, etc). Your job is to make the app give the BEST possible answer, then produce a report.

## Input

The user provides:
- The traveler's situation (origin city, destination, urgency, constraints)
- Optionally: what the app currently returns and why it's bad

## Workflow

### Step 0: Record the case and ask for source

**Before doing anything else:**

1. **Ask for the URL or source** if not already provided. Ask: "Where did this come from? (Reddit URL, DM screenshot, email, etc.)" — you need this for the report.
2. **Create the report file immediately** at `/docs/improvement-real-use-cases/YYYYMMDD-HHmm-origin-dest.md` with the situation section filled in. This ensures the case is documented even if work is interrupted. Use the template from Step 7 and fill in what you know so far (Situation, source URL). Leave other sections as TODO placeholders.

This step is mandatory — do NOT skip to research or querying before the case file exists.

### Step 1: Parse the situation

Extract:
- **Origin**: city + airport code
- **Destination**: city + airport code
- **Nationality**: infer from destination country if not stated
- **Deadline**: when they MUST arrive
- **Constraints**: kids, budget, cancelled flights, visa issues
- **What they actually need**: the core problem to solve
- **Source**: URL or description of where this request came from (Reddit thread, DM, email, etc.)

### Step 2: Research the real-world best solution

Spawn a background agent to research actual available flights:
```
Agent(subagent_type="general-purpose", run_in_background=true):
  "Research the best actual flights from [origin] to [destination] avoiding Gulf carriers
   (Emirates, Etihad, Qatar, etc.) and Gulf transit airports (DXB, AUH, DOH).
   Search for: direct flights, 1-stop via non-Gulf hubs (IST, DEL, SIN, HKG, NRT, etc.),
   budget options. The traveler needs to arrive by [deadline].
   Use WebSearch to find current flight options and prices.
   Return a ranked list of the 3-5 best realistic options with estimated prices."
```

### Step 3: Query our app (localhost + prod)

Query both environments to compare. Use the /api/explain endpoint for debugging detail.

**Prod:**
```bash
curl -s "https://skipthegulf.com/api/explain?from=CITY&to=CITY&nat=XX&date=YYYY-MM-DD&flex=7" | jq '.routeCount, .routes[:3]'
```

**Localhost (if running):**
```bash
curl -s "http://localhost:3000/api/explain?from=CITY&to=CITY&nat=XX&date=YYYY-MM-DD&flex=7" | jq '.routeCount, .routes[:3]'
```

Also try with different parameters:
- `flex=3` vs `flex=7` (urgent vs flexible)
- `land=0` vs `land=1` (with/without long ground transport)
- Different destination cities if the person is flexible

**Frontend URL for the user to check:**
```
https://skipthegulf.com/?from=CITY&to=CITY&nat=XX&date=YYYY-MM-DD&flex=7
```

### Step 4: Diagnose gaps

Compare our app's output with the real-world best solution from Step 2. Identify:
- Missing cities/airports in our data
- Missing segment durations
- Missing EU_SEARCH_AIRPORTS entries
- Bad pricing (fallback vs real)
- Date coherence issues
- Routes that should exist but don't

### Step 5: Fix the engine

Make code changes to improve results. Common fixes:
- Add cities to `src/data/cities.ts`
- Add airports to `EU_SEARCH_AIRPORTS` in `src/lib/route-engine.ts`
- Add segment durations to `SEGMENT_DURATIONS`
- Add hub connections
- Fix pricing/fallback issues

After each fix, re-query localhost to verify improvement.

### Step 6: Verify in prod

1. Run tests: `npx jest --no-coverage`
2. Commit and push (build runs via pre-push hook)
3. Wait ~60s for Vercel deploy
4. Re-query prod to confirm the fix is live
5. Have the user double-check the results

### Step 7: Write the report

Create `/docs/improvement-real-use-cases/YYYYMMDD-HHmm-summary.md`.

When generating Google Flights verification links, use `src/lib/google-flights-url.ts`:
```ts
import { googleFlightsUrl } from "@/lib/google-flights-url";
// googleFlightsUrl("BKK", "MUC", "2026-03-09") → proper protobuf-encoded Google Flights URL
```

Write a small inline script to generate the URLs:
```bash
npx tsx -e "
import { googleFlightsUrl } from './src/lib/google-flights-url';
console.log('BKK→MUC Mar 9:', googleFlightsUrl('BKK', 'MUC', '2026-03-09'));
console.log('BKK→MUC Mar 10:', googleFlightsUrl('BKK', 'MUC', '2026-03-10'));
// etc.
"
```

Use these proper URLs in the report markdown instead of plain Google search links.

Report template:
```markdown
# Real Use Case: [Origin]→[Destination] — [date]

## Source
[URL or description: Reddit thread link, DM screenshot path, email, etc.]

## Situation
[Paste the original request]

## 1. Before fix
[App results BEFORE any code changes — routes, prices, issues, or "0 routes" if broken]

## 2. After fix
[App results AFTER code changes — routes, prices, should match or beat researched solution]

## 3. Crawl discovery
[Results from /crawl-discover on key booking sites for this route — actual prices, airlines, availability found by automated scraping. Leave as TODO until crawl is run.]

## 4. Crawl discovery + human
[Results after human reviews crawl output and manually checks links — confirmed bookable options, corrected prices, notes on what's actually available vs what scrapers found. Leave as TODO until human review.]

## Real-world best solution (researched)
[What we found via web search]

## Gaps identified
- [ ] Gap 1
- [ ] Gap 2

## Changes made
- `file:line` — description

## Frontend URL
`https://skipthegulf.com/?from=...`

## Google Flights verification
[Generated via googleFlightsUrl() — proper protobuf-encoded links]

## Rules learned
[Any new rules or contradictions discovered — these feed back into the engine]

## Contradictions with existing rules
[If a fix for this case breaks assumptions from previous cases, document it here.
These must be reconciled before closing.]
```

## Important rules

- NEVER send the user a link to the app until results are GOOD
- The goal is for the app to give results AS GOOD as what a human travel agent would suggest
- Price accuracy matters — if our cached prices are wildly wrong, note it
- Date coherence matters — multi-leg routes must have plausible dates
- For families with kids: prefer fewer stops, avoid long layovers, avoid visa-required transits
- The report's "Rules learned" and "Contradictions" sections are critical — they prevent regression
- Work sequentially: understand → research → diagnose → fix → verify → report
