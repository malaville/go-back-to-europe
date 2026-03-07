# SkipTheGulf.com — QA Test Personas

Four test personas for validating route safety, visa accuracy, destination correctness, and usability. Each persona represents a real user archetype stranded in Southeast Asia during the Gulf airspace shutdown (March 2026).

API endpoint: `https://skipthegulf.com/api/query`
Query format: `?from={city}&to={city}&nat={ISO2}&date={YYYY-MM-DD}&flex={days}`

---

## Scoring Rubric (5 axes, 1-10 each)

| Axis | What it measures | 10 means | 1 means |
|---|---|---|---|
| **Route Safety** | No Gulf transit (Abu Dhabi, Dubai, Doha, Sharjah, Muscat, Bahrain, Jeddah, Riyadh). No undetected hidden stops through conflict zones. Airline hubs checked (EY, EK, QR, FZ, G9, WY, GF, SV, XY). | Every route verifiably Gulf-free, all hidden stops detected | Routes transit Gulf hubs undetected |
| **Visa Accuracy** | Transit visa info correct for persona's nationality. All intermediate stops (including hidden ones) have visa requirements flagged. No "visa unknown" on known corridors. | Every transit point has correct, specific visa info | Missing or wrong visa info that could strand someone |
| **Route Quality** | Diverse options (not all via same hub). Realistic pricing. Correct airline names. Connection times feasible (>2h international). Route count comparable to similar origin/destination pairs. | 10+ diverse, realistic, bookable-looking routes | Few routes, unrealistic prices, duplicate corridors |
| **Destination Accuracy** | All routes end at correct destination. Airport codes map correctly. No ghost routes. Tags ("Nonstop", "Fastest", "Recommended") are factually correct. | Every route goes where it says, tags are accurate | Wrong destination, misleading tags, phantom routes |
| **Usability** | Ranking makes sense. Recommended badge on a genuinely good option. Warnings clear. A stressed, non-expert traveler could scan results and decide in 2 minutes. | Clear, trustworthy, actionable at a glance | Confusing ranking, misleading badges, unclear warnings |

**Weighting:** Safety 30%, Visa 25%, Route Quality 15%, Destination Accuracy 15%, Usability 15%

**Bug vs Feature Gap:** Keep them separate. A bug is something wrong in the current app (incorrect data, mislabeled tags, missing visa info). A feature gap is something absent but desirable (fare context, family multipliers, overland alternatives). Don't penalize the current score for feature gaps.

---

## Persona 1 — Joris, Dutch backpacker in Bali

**Profile:** 28yo solo traveler, Dutch passport (NL), budget-conscious, flexible on routing.
**Situation:** Emirates flight via Dubai cancelled March 5. Needs to reach Amsterdam by March 17 for job start.
**Origin:** Bali (DPS) — island with limited long-haul connectivity, must route through a gateway (SIN or KUL).

### Test queries

```
Primary:    ?from=Bali&to=Amsterdam&nat=NL&flex=7
Tight:      ?from=Bali&to=Amsterdam&nat=NL&flex=3
Comparison: ?from=Bangkok&to=Amsterdam&nat=NL&flex=7
```

### What to probe

- **Gateway routing:** Bali has no direct long-haul. Every route should start with DPS→SIN or DPS→KUL. If 0 results, that's a critical failure.
- **Route count parity:** Compare Bali route count against Bangkok→Amsterdam. Bali should get comparable options via its SIN gateway — same hub→Europe corridors (Tbilisi, Istanbul, Seoul, Tokyo, etc.) should be reachable.
- **flex parameter effect:** Does flex=3 vs flex=7 produce different results, or identical output? If identical, the parameter is cosmetic.
- **NL visa rules:** Singapore visa-free 90 days, China 144h TWOV eligible, India requires e-visa, Sri Lanka requires ETA. No "visa unknown" acceptable.
- **Hidden stop detection:** China Southern, Hainan Airlines, Air China routings likely transit a Chinese city — verify detection.
- **"Nonstop" tag:** Must only appear on single-leg, single-flight segments. DPS→SIN→AMS is 2 flights — tagging it "Nonstop" is factually wrong.
- **Gulf airline filter:** Check every airline code against banned list (EY, EK, QR, FZ, G9, WY, GF, SV, XY, OV).

### Known bugs from prior testing (verify if fixed)

- "Nonstop" tag on DPS→SIN→AMS (2 flights) — **High severity**
- "Fastest" tag on ~24h route when ~20h route exists — **Medium**
- Only 7 routes vs Bangkok's 15 for same destination — **Medium**
- flex=3 and flex=7 produce identical results — **Medium**

---

## Persona 2 — Sanna, Finnish remote worker in Vientiane

**Profile:** 34yo digital nomad, Finnish passport (FI), father's health emergency in Helsinki — needs to leave ASAP.
**Situation:** Based in Laos 3 months. Vientiane (VTE) has almost no international connectivity.
**Origin:** Vientiane (VTE) — tiny airport, must route through Bangkok (BKK) or Hanoi (HAN).

### Test queries

```
Primary:    ?from=Vientiane&to=Helsinki&nat=FI&flex=3
Comparison: ?from=Bangkok&to=Helsinki&nat=FI&flex=5
```

### What to probe

- **VTE gateway routing:** Must route through BKK or HAN. If 0 results, critical failure.
- **Destination accuracy:** ALL routes must end in HEL (Helsinki), not Paris or London. There was a historical Helsinki routing bug.
- **FI passport:** Part of EU_SCHENGEN group — same transit rights as NL, FR, DE. Must have zero "visa unknown."
- **Tbilisi/Istanbul/Almaty corridors:** These exist for BKK origins — verify they appear for VTE too.
- **Lufthansa TBS→HEL:** Lufthansa does not fly Tbilisi→Helsinki direct. If this route appears, the hidden stop (Frankfurt or Munich) MUST be flagged. This was a confirmed miss in prior testing.
- **"Fastest" tag:** Must be on the route with shortest total travel time. Prior testing found it misassigned to a 21h route when a 17h route existed.
- **Urgency signal:** With flex=3 and an emergency, are results any different from flex=5? Any speed prioritization?
- **Istanbul ranking:** IST routes tend to be cheap with single-carrier protection but ranked last due to conflict proximity demotion. Verify whether this burial is justified or harmful.

### Known bugs from prior testing (verify if fixed)

- "Nonstop" tag on VTE→BKK→HEL (2 flights) — **High**
- "Fastest" tag misassigned — **Medium**
- TBS→HEL on Lufthansa: undetected hidden stop via FRA/MUC — **Medium**

---

## Persona 3 — James & family, British in Bangkok

**Profile:** 42yo with wife and 2 kids (ages 6 and 10), UK passport (GB). Prefers fewer stops, willing to pay more for protected connections.
**Situation:** Qatar Airways via Doha cancelled. 4 passengers needing single-ticket bookings for EU261 protection.
**Origin:** Bangkok (BKK) — major hub, best route diversity expected.

### Test queries

```
Primary:    ?from=Bangkok&to=London&nat=GB&flex=7
Tight:      ?from=Bangkok&to=London&nat=GB&flex=3
```

### What to probe

- **GB passport:** NOT EU_SCHENGEN — different visa group. But GB IS eligible for China 144h TWOV. Verify the app knows this and shows it correctly (not just copy-paste from EU rules).
- **"London" resolution:** Should map to LHR. Check if LGW/STN options are missing (many budget carriers use those).
- **Colombo hidden stop visa bug:** If a route goes CMB→LHR on Air India, the hidden stop through Delhi requires an Indian e-visa for GB nationals. Prior testing found the hidden stop IS detected ("Likely connects via Delhi") but the visa requirement is NOT flagged. Only the Sri Lankan ETA is shown. This is a **critical safety bug** — a family could be denied boarding or stranded in Delhi.
- **Single-leg nonstop ticket type:** If BKK→LHR nonstop appears with `ticketType: "separate"`, that's a data bug — a single flight is inherently one ticket.
- **"Recommended" badge:** For a family, single-ticket routes with connection protection matter more than cheapest-but-separate. Does ranking reflect this?
- **Price realism:** Normal BKK→LHR is ~300 EUR. If nonstop shows 185 EUR during a crisis, that's likely a stale cached price. No fare context makes it impossible for users to calibrate.
- **Gulf airline audit:** Check every airline code. Prior testing found XY (flynas, Saudi Arabia) in BKK→Rome results — verify it doesn't appear in London routes. Also check W9, QP, OV against Gulf carrier lists.
- **flex effect:** Does flex=3 change anything vs flex=7?

### Known bugs from prior testing (verify if fixed)

- CMB→LHR hidden stop via Delhi: Indian e-visa not flagged for GB — **Critical**
- ticketType "separate" on single-leg nonstop — **Low**
- "Fastest" tag on ~16h route when nonstop is 11h30m — **Medium**
- XY (flynas) in other destination results — **High** (audit all routes)

---

## Persona 4 — Lea, French backpacker on Koh Lanta

**Profile:** 25yo solo traveler, French passport (FR), flexible on timing and routing. Comfortable with 24h+ overland travel to reach a cheaper departure airport.
**Situation:** Island-hopping southern Thailand when Gulf shutdown hit. Currently on Koh Lanta (no airport). Has 37 days left on her Thai visa exemption. Would happily bus to whichever gateway has the cheapest flight to Paris.
**Origin:** No airport — nearest gateways are Krabi (KBV, 2h), Bangkok (BKK, 15h bus), Kuala Lumpur (KUL, 14h bus via Hat Yai), Singapore (SIN, 24h bus).

### Test queries

Run all three gateways and compare total cost (overland + flight):

```
Gateway BKK: ?from=Bangkok&to=Paris&nat=FR&flex=7
Gateway KUL: ?from=KualaLumpur&to=Paris&nat=FR&flex=7
Gateway SIN: ?from=Singapore&to=Paris&nat=FR&flex=7
```

Overland costs to add (static estimates):

| Gateway | Overland method | Time | Cost |
|---------|----------------|------|------|
| BKK | Bus/train from Krabi | 12-15h | ~20 EUR |
| KUL | Bus from Hat Yai via Penang | 10-14h | ~25 EUR |
| SIN | Bus from Hat Yai via KUL | 20-26h | ~40 EUR |

### What to probe

- **Gateway comparison:** Which origin produces the cheapest total (overland + flight)? Lea's real question is "should I bus north or south?"
- **KualaLumpur as origin:** Does it work? What route count and price range vs BKK and SIN?
- **FR passport:** Should be identical visa treatment to NL (EU_SCHENGEN group). Verify no differences.
- **Route diversity across gateways:** Do BKK, KUL, and SIN surface different hub→Europe corridors, or are they identical?
- **Price spread:** If BKK→Paris cheapest is 271 EUR and SIN→Paris is 380 EUR, the overland cost difference (20 vs 40 EUR) doesn't close the gap. BKK wins. But if SIN has a route KUL doesn't, that matters.
- **Thailand visa context:** Lea has 37 days left. If the app eventually shows visa extension info ("Thailand offers 30-day extensions for 1,900 THB"), she'd know she can wait for prices to drop.
- **"Nonstop" tag accuracy:** BKK→CDG nonstop should be genuinely nonstop (single leg). SIN→CDG may also exist direct. KUL→CDG probably routes via a hub.
- **Gulf airline filter across all 3 origins:** Same audit — no EY, EK, QR, FZ, G9, WY, GF, SV, XY in any result.

### What this persona uniquely tests

This persona doesn't test a single query — she tests whether a user can **compare gateways** by running 3 queries manually and adding overland costs. Today the app forces this manual comparison. The V4 "Cheapest Gateway" feature (Feature 1, Card 2) would automate it. Scoring this persona reveals:

1. Whether all 3 SEA mega-hubs (BKK, KUL, SIN) work as origins
2. Whether the cheapest gateway is obvious or requires spreadsheet math
3. Whether route quality varies significantly by origin (it shouldn't for shared corridors)

### Expected outcome

The optimal advice for Lea is likely: "Bus to Bangkok (15h, 20 EUR), then fly BKK→Paris nonstop for ~271 EUR. Total: ~291 EUR." But she can only discover this by running 3 queries herself and comparing. The app doesn't do this for her — yet.

---

## Running the tests

For each persona:

1. Run the listed API queries
2. For every route returned, verify:
   - No Gulf airline codes (EY, EK, QR, FZ, G9, WY, GF, SV, XY, OV, NAS, F3, 5W)
   - No Gulf transit cities (AUH, DXB, DOH, SHJ, MCT, BAH, JED, RUH)
   - Hidden stops detected and visa requirements flagged for hidden stop cities
   - All routes end at the correct destination airport
   - Tags ("Nonstop", "Fastest", "Recommended") are factually accurate
   - Airline names are real carriers that operate the stated segment
3. Score each axis 1-10, compute weighted total
4. List bugs (things wrong) separately from feature gaps (things missing)

### Output format per persona

```
### Persona [N] — [Name] ([Origin] -> [Destination])

**Queries run:** [list]
**Routes returned:** [count per query]

**Scores:**
- Route Safety: X/10 — [one-line justification]
- Visa Accuracy: X/10 — [one-line justification]
- Route Quality: X/10 — [one-line justification]
- Destination Accuracy: X/10 — [one-line justification]
- Usability: X/10 — [one-line justification]

**Weighted total: X.X/10**

**Bugs found:**
1. [BUG] description — severity: Critical/High/Medium/Low

**Feature gaps (V4, not counted against score):**
1. [GAP] description
```

### Cross-persona summary

```
**Systemic bugs** (across multiple personas):
- ...

**Overall weighted score: X.X/10**

**Top 3 bugs to fix next (by impact):**
1. ...
2. ...
3. ...
```
