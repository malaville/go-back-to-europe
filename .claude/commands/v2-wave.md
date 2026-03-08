You are implementing the next V2 route engine step (GFAD-powered graph propagation).

## Context

Read `docs/v2-route-engine-design.md` for the full V2 architecture and `docs/implementation-plan.md` Phase 6 tasks.

## Workflow

1. Check `docs/implementation-plan.md` for the next unchecked Phase 6 task
2. Read `src/lib/gfad.ts` (already built) for the GFAD client
3. Implement the next step in `src/lib/route-engine-v2.ts`
4. Test against known routes (MNL→LHR, BKK→MUC) — compare V2 output with V1
5. Run tests: `npx jest --no-coverage`
6. Mark task done, commit

## Rules

- V2 coexists with V1 — never break the V1 path
- Gulf filtering applies to GFAD results too (use same constants)
- Visa checks at transit hubs are mandatory
- Date propagation: wave N+1 uses wave N date + 1 day minimum
- Log wave timings and candidate counts for debugging
