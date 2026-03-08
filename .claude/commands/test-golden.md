You are curating golden fixtures and writing behavior tests.

## Context

Read `docs/v1-problems-and-v2-plan.md` §Phase 5 (L257-296) and `docs/implementation-plan.md` Phase 5 tasks.

## Workflow

1. Check `docs/implementation-plan.md` for the next unchecked Phase 5 task
2. If curating a golden fixture:
   - Browse `src/__tests__/fixtures/` for a known-bad scenario (EUR 84, empty airline, wrong dates)
   - Copy it to `src/__tests__/fixtures/golden/` with a descriptive name
   - Write a test that asserts downstream behavior (flagged, sorted last, price corrected)
   - Use explicit `now: new Date('2026-03-07')` in the test context
3. If writing property tests:
   - Use `fast-check` to generate random route inputs
   - Assert invariants: price floors hold, confidence levels match airline presence, dates in window
4. Run full test suite: `npx jest --no-coverage`
5. Mark task done, commit

## Rules

- Golden fixtures test behavior, not structure — "flagged ROUTING_UNKNOWN" not "has property X"
- Property tests need no fixtures — they generate synthetic routes
- Never use `Date.now()` in tests — always frozen `ctx.now`
- Keep golden fixture count to 10-20 max — quality over quantity
