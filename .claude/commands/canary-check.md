You are reviewing canary data and checking for K(d) drift.

## Context

Read `docs/v1-problems-and-v2-plan.md` §Phase 2, §K(d) auto-tuning (L210-219).

## Workflow

1. Query the canary samples DB for recent data (last 7 days)
2. Compute actual `real/cached` ratios grouped by `dtd` bucket (0-3, 4-7, 8-14, 14+)
3. Compare against current K(d) multiplier ranges in `price-correction.ts`
4. If drift >15% on any bucket, flag it and propose updated params
5. Check routing whitelist — any new non-Gulf routings discovered? Update whitelist.
6. Summarize: samples collected, K(d) accuracy, whitelist changes, budget usage (calls this month vs 2,000 limit)

## Rules

- Don't auto-update K(d) params — propose changes for user approval
- Log findings to `docs/canary-reports/YYYY-MM-DD.md`
- If <50 samples total, note that auto-tuning isn't reliable yet
