# Reddit Communication — Live Status

> Started: 2026-03-07 (posted evening)
> Strategy: Post → Measure (Datadog) → Adapt hourly

---

## Progress

| # | Time | Subreddit | Status | Upvotes | Comments | Unique users |
|---|------|-----------|--------|---------|----------|--------------|
| 1 | 11:44 | r/flights | 🟡 Posted in megathread (no promo, advice only) | — | — | — |
| 2 | 17:00 | r/travel | 🟢 Performing (stickied + locked by mod) | 25 | 40 | 18 |
| 3 | — | r/digitalnomad | ⬜ Pending | — | — | — |
| 4 | — | r/Thailand | ⬜ Pending | — | — | — |
| 5 | — | r/bali | ⬜ Pending | — | — | — |
| 6 | — | r/solotravel | ⬜ Pending | — | — | — |

Status key: ⬜ Pending · 🟡 Posted · 🟢 Performing · 🔴 Flopped · 🚀 Viral

---

## r/travel Post Analysis (snapshot 17:56)

**Post:** "for people stuck in SEA trying to get back to Europe — what routes actually work right now"
**Post ID:** t3_1rn51hu
**Score:** 25 upvotes, 40 comments, 18 unique users, 43K views
**Status:** Stickied + Locked + Archived by mod (Forgotten_Dog1954)

### Sentiment Breakdown

**Positive / Engaged (majority):**
- "You are an angel. Useful info!" — u/nasansia1
- "This is helpful advice. Feel free to post it in the megathread in r/flights" — u/DeltaFoxtrotZero (mod?)
- User shared LOT + Eva Air Budapest→Warsaw→Seoul route (real stranded story)
- Multiple users sharing actionable route intel (HK→London €250, Vietnam Airlines over Russia)
- u/DEUTSCHLANDDD: "Finding a different route is not the hard part. Finding one under 1.5k is the hard part" — price is the real pain

**Skeptical / Pushback:**
- u/pliumbum: "You can literally filter countries out on Google Flights. I feel like you've massively overcomplicated this"
- u/Wetrapordie: "Just look for non-arab airlines? They all work"
- Response to skeptics: "Have you checked the price and availability for the next week?" — community self-defending

**Actionable intel from comments:**
1. **HK→London/Budapest under €250** on Chinese airlines (u/alkhdaniel) — need to add HKG as origin
2. **Kutaisi vs Tbilisi** — Wizz flies Kutaisi only, Tbilisi flights aren't cheap. Need Kutaisi ground connection
3. **DPS→IST nonstop** on Turkish Airlines — need to verify this route exists in our data
4. **Vietnam Airlines over Russia** — confirmed working, need to ensure VN is in our airline data
5. **China 144h visa-free transit** — multiple confirmations this works for EU passports
6. **Price is the #1 concern**, not route-finding. People know alternatives exist but can't afford them

### Key Quotes for Product Direction

> "the problem is that every single person stuck in SEA is booking those exact flights and the demand is just way bigger than the supply right now"

> "Finding a different route is not the hard part. Finding a route that's not charging more than 1.5k is the hard part"

> "HK to London/Budapest under €250... Chinese airlines aka fly over Russia"

---

## Winning Angle

**"PSA: here are routes"** is working better than "I built a tool". The thread is organically becoming a route-sharing hub. Tool mention is secondary — credibility comes from knowing the routes.

**Price sensitivity is the #1 concern.** Route discovery is solved for savvy travelers. The real value add is: cheapest option that avoids the Gulf.

---

## Learnings → Actions

| # | What we learned | Action |
|---|----------------|--------|
| 1 | HK→Europe is cheapest corridor right now (€250 Chinese airlines) | Add HKG as a starting point, not just transit hub |
| 2 | Kutaisi ≠ Tbilisi — Wizz only flies Kutaisi | Add Kutaisi airport, ground connection TBS→KUT |
| 3 | DPS has daily nonstop to IST (Turkish) | Verify DPS→IST in SEGMENT_DURATIONS |
| 4 | Price matters more than route discovery | Highlight cheapest routes more prominently |
| 5 | "Just use Google Flights" is the main objection | Need clear differentiation (visa checks, hidden stops, Gulf filter) |
| 6 | Invited to post in r/flights megathread | Do it — free distribution with mod blessing |
| 7 | Vietnam Airlines over Russia confirmed working | Ensure VN carrier routes are in data |

---

## Voice & Story

See [marcantow-story.md](marcantow-story.md) for real backstory and per-subreddit angles.

## r/flights Megathread Post (posted 2026-03-07 11:44)

Posted in megathread with personal story angle (Saudi routing anxiety, France Travail call from Bangkok hostel, need Da Lat→Paris under €400). Shared route intel (HK corridor, BKK→IST, Vietnam Airlines over Russia), visa traps, and open invite: "drop your location + passport, happy to look it up." No link to skipthegulf.com — waiting for someone to ask.

## Next Steps (Priority Order)

1. ~~Post in r/flights megathread~~ — DONE
2. **Post r/digitalnomad** — different angle (budget tips, bus hack, Tbilisi)
3. **Reply to every comment** in r/travel thread — especially price concerns
4. **Add HKG as origin airport** — cheapest corridor per community intel
5. **Post r/Thailand** at peak hours
6. **Monitor Datadog** for query spikes from Reddit referrers
