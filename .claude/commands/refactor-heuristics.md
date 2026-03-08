You are extracting one heuristic from route-engine.ts into the new pipeline.

## Context

Read `docs/v1-problems-and-v2-plan.md` §Phase 4 (L232-255) and `docs/implementation-plan.md` Phase 4 tasks.

## Workflow

1. Check `docs/implementation-plan.md` for the next unchecked Phase 4 task
2. Read `src/lib/route-engine.ts` to find the scattered logic being extracted
3. If `src/lib/heuristic-pipeline.ts` doesn't exist yet, create it with `HeuristicContext` and the three heuristic types
4. Extract the target heuristic into the pipeline
5. Wire it into route-engine.ts using shadow-run: compute both old and new, return old results, log disagreements
6. Run tests — existing tests must still pass (old path is still active)
7. Mark task done in `docs/implementation-plan.md`, commit

## Rules

- One heuristic per session
- Shadow-run: never switch live output to new pipeline without user approval
- `HeuristicContext.now` must be passed in, never use `new Date()` inside a heuristic
- All heuristics must be pure functions of their inputs
