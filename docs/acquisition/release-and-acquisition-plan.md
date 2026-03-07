# SkipTheGulf.com — Release & Acquisition Plan

> Last updated: 2026-03-07

## Context

Gulf airspace shutdown since March 1, 2026. Tens of thousands of travelers stranded in Southeast Asia with cancelled Emirates, Qatar Airways, Etihad flights. SkipTheGulf.com finds alternative routes to Europe avoiding Gulf transit — a time-sensitive tool with a narrow but intense window of demand.

**Key constraint:** This is a crisis tool. The window is NOW. Every day without traffic is a day people are rebooking through travel agents or figuring it out themselves. Speed of acquisition matters more than perfection.

---

## Phase 0: Ship-Ready Fixes (Before any promotion) — 🟢 DONE

All blocking bugs fixed and verified 2026-03-07:

1. 🟢 **Gulf carrier filter** — XY, KU, OV now blocked
2. 🟢 **Nonstop + hidden stop contradiction** — fixed
3. 🟢 **CMB→LHR Delhi visa gap** — Indian e-visa warning now shown for GB nationals

---

## Phase 1: Organic Seeding (Day 1-3)

**Goal:** 500 unique visitors, 50 queries, first real feedback.

### 1.1 Reddit (highest ROI, do first)

Full post drafts ready to copy-paste: **[reddit-posts.md](reddit-posts.md)**

| Subreddit | Post angle | Timing |
|-----------|-----------|--------|
| r/flights | "I built a free tool to find routes avoiding Gulf airspace" | T+0h |
| r/travel | "PSA: routes that still work from SEA to Europe" | T+2h |
| r/digitalnomad | "Built a route finder for nomads stranded in SEA" | T+4h |
| r/Thailand | "Routes from Thailand to Europe — free tool" | T+6h |
| r/bali | "Getting home from Bali — route finder" | T+8h |
| r/solotravel | Short version, link-focused | T+24h |

**Rules:**
- Be genuinely helpful, not promotional. Answer questions in comments.
- Share the tool as "something I built" — Reddit rewards builders, punishes marketers.
- Link directly to skipthegulf.com, not a landing page.
- Respond to every comment for the first 48h.
- Don't crosspost — each post is written fresh for that subreddit's culture.

### 1.2 Facebook Groups

| Group | Angle |
|-------|-------|
| Expats in Bangkok / Chiang Mai / Bali / HCMC / etc. | "Anyone still trying to get home? Built a route finder" |
| Digital Nomads Around the World | Share as tool, ask for feedback |
| Backpacking Southeast Asia | "PSA for anyone stranded" |
| Country-specific: Brits in Thailand, French in Asia, etc. | Localized post in relevant language |

### 1.3 Twitter/X

- Thread: "Gulf airspace is closed. Here's what routes still work from Bangkok/Bali/Singapore to Europe" with screenshots of results
- Tag travel journalists, aviation accounts (@OneMileataTime, @ThePointsGuy, @taborfreedm)
- Use hashtags: #GulfShutdown #StrandedInAsia #FlightsToEurope

### 1.4 WhatsApp/Telegram

Travelers share info in group chats. Create a shareable one-liner:
> "skipthegulf.com — free tool to find flights from SEA to Europe avoiding Gulf airspace. Just tested it, found routes from BKK to Paris for ~270 EUR via Tbilisi."

---

## Phase 2: Amplification (Day 3-7)

**Goal:** 5,000 visitors, press mention, embassy/consulate awareness.

### 2.1 Press Outreach

Pitch to:
- **Travel press:** The Points Guy, One Mile at a Time, Skift, Simple Flying
- **Tech press:** Product Hunt (launch as "crisis tool"), Hacker News ("Show HN")
- **Local press:** Bangkok Post, Bali Times, Straits Times
- **Embassy networks:** Email press offices of EU embassies in Bangkok, KL, Singapore, Bali — they're fielding calls from stranded nationals

**Pitch angle:** "Open-source crisis tool helps stranded Europeans find routes home" — emphasize it's free, no booking fees, built in response to the crisis.

### 2.2 Hacker News

"Show HN: SkipTheGulf.com — Route finder for travelers stranded by Gulf airspace closure"

HN loves crisis-response tools built by individuals. Post on a weekday morning US time. Be ready to answer technical questions (Next.js, Travelpayouts API, route graph algorithm).

### 2.3 Product Hunt

Launch as a "Made in a weekend" crisis response tool. Category: Travel. Timing: coordinate with a weekday.

### 2.4 SEO Quick Wins

Create landing pages targeting search queries people are typing RIGHT NOW:
- `/flights-bangkok-to-paris-no-gulf`
- `/flights-bali-to-london-no-gulf`
- `/flights-singapore-to-amsterdam-no-gulf`
- `/alternative-routes-to-europe-gulf-shutdown`

These are zero-competition long-tail keywords with immediate intent.

---

## Phase 3: Partnerships & Monetization (Week 2+)

### 3.1 Affiliate Revenue

Already integrated: Travelpayouts affiliate marker `708661`. Every booking through Aviasales links earns commission. Current flow:
- User finds route on SkipTheGulf → clicks "Book on Aviasales" → affiliate cookie set → commission on booking

**To improve:** Add Google Flights "Verify price" links (already built) alongside booking links. Trust increases conversion.

### 3.2 Travel Agency Partnerships

Reach out to SEA-based travel agencies handling rebookings:
- Offer them a "powered by SkipTheGulf" widget or API access
- They handle the booking complexity (families, connections, baggage)
- Revenue share on bookings

### 3.3 Embassy/Consulate Tool

Offer the tool as a resource for consular staff helping stranded nationals. Embassies can link to it from their crisis pages. This is both acquisition and legitimacy.

---

## Metrics to Track

| Metric | Tool | Target (Week 1) |
|--------|------|-----------------|
| Unique visitors | Vercel Analytics | 5,000 |
| Queries/day | API logs | 500 |
| Queries/visitor | API logs | 3+ |
| Reddit upvotes | Manual | 100+ on main post |
| Press mentions | Google Alerts | 1+ |
| Affiliate clicks | Travelpayouts dashboard | Track from day 1 |
| API errors | Vercel logs | <2% |
| Avg response time | API logs | <600ms |

---

## Risk: Window Closing

If Gulf airspace reopens, demand drops to zero overnight. This means:
- **Don't over-invest in infrastructure** — Vercel free/hobby tier is fine
- **Don't build features that take weeks** — ship fast, iterate on feedback
- **Capture emails** — "Get notified when Gulf airspace reopens" is both useful and builds a list
- **Document the playbook** — if this works, the same pattern applies to future travel crises

---

## What NOT to Do

- Don't buy ads (the audience is in Reddit threads and WhatsApp groups, not Google)
- Don't build a blog (no time, crisis tool)
- Don't add user accounts or social features (friction kills crisis tools)
- Don't spend time on mobile app (responsive web is fine)
- Don't wait for perfect data to launch — ship with known limitations, be transparent about them
