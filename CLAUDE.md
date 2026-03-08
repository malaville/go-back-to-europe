<!-- ooo:START -->
<!-- ooo:VERSION:0.14.0 -->
# Ouroboros — Specification-First AI Development

> Before telling AI what to build, define what should be built.
> As Socrates asked 2,500 years ago — "What do you truly know?"
> Ouroboros turns that question into an evolutionary AI workflow engine.

Most AI coding fails at the input, not the output. Ouroboros fixes this by
**exposing hidden assumptions before any code is written**.

1. **Socratic Clarity** — Question until ambiguity ≤ 0.2
2. **Ontological Precision** — Solve the root problem, not symptoms
3. **Evolutionary Loops** — Each evaluation cycle feeds back into better specs

```
Interview → Seed → Execute → Evaluate
    ↑                           ↓
    └─── Evolutionary Loop ─────┘
```

## ooo Commands

Each command loads its agent/MCP on-demand. Details in each skill file.

| Command | Loads |
|---------|-------|
| `ooo` | — |
| `ooo interview` | `ouroboros:socratic-interviewer` |
| `ooo seed` | `ouroboros:seed-architect` |
| `ooo run` | MCP required |
| `ooo evolve` | MCP: `evolve_step` |
| `ooo evaluate` | `ouroboros:evaluator` |
| `ooo unstuck` | `ouroboros:{persona}` |
| `ooo status` | MCP: `session_status` |
| `ooo setup` | — |
| `ooo help` | — |

## Agents

Loaded on-demand — not preloaded.

**Core**: socratic-interviewer, ontologist, seed-architect, evaluator,
wonder, reflect, advocate, contrarian, judge
**Support**: hacker, simplifier, researcher, architect
<!-- ooo:END -->

## Project Notes

- **No need to run `npm run build` before pushing** — it runs automatically via a pre-push git hook.

## Community Communication Rules

- **NEVER draft a public message (Reddit, forum, social) without first knowing the community's rules and tone.** Check subreddit rules/wiki, or ask the user for them before proposing any message.
- Each community has different norms for self-promo, tone, AI content, and engagement. Violating them causes downvotes, bans, and credibility damage.
- When corrected by a community member: accept gracefully, never snark. Snarky replies to corrections get pile-on downvotes.
- If a comment is getting downvoted, stop replying in that sub-thread. Do not dig deeper.
- **Extreme caution with humor.** Jokes, sarcasm, and memes land differently per community and can be read as dismissive or hostile by strangers. Default to sincere. If humor is included, explicitly warn the user: "this line could be read as snarky, here's a safer version: [alternative]".
- **Flag anything on the fringe.** If a proposed message is close to breaking a tacit rule (self-promo that could be seen as spam, humor that could backfire, claims that might be wrong), ALWAYS: (1) warn the user explicitly, (2) explain what rule it's close to breaking, (3) propose a safer alternative, (4) estimate how much safer the alternative is (e.g., "80% less likely to trigger mod action").
- **When in doubt, be boring.** A safe, helpful, factual comment beats a clever one that risks backlash. Cleverness is high-risk on communities where you're not a regular.
- **Always verify legal claims before including them in a message.** If citing a regulation (EU261, visa rules, airline obligations, consumer rights), research it first and tell the user your certainty level (e.g., "90% sure EU261 applies here" or "50% sure, you should double-check"). Never state legal claims as fact without verification.
- **When the user pastes a conversation or screenshot** (mod mail, Reddit thread, DM, comment chain), ALWAYS update the corresponding community file in `docs/acquisition/communities/` and any relevant real use case doc with what happened (outcome, lesson learned, status change). Do this before responding to the user.
