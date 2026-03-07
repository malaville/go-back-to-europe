// ---------------------------------------------------------------------------
// K(d) price correction model — U-shaped curve
// ---------------------------------------------------------------------------
//
// Academic research (EUR thesis, ScienceDirect) shows flight prices follow a
// U-shaped "bathtub" curve vs days-before-departure:
//
//   P(d) = P_base + α·e^(-β·d) + γ·e^(-δ·(d - d₀)²)
//
//   - P_base:          floor price (the 14-30 day plateau)
//   - α·e^(-β·d):      early-booking premium decay (high far out, fades)
//   - γ·e^(-δ·(d-d₀)²): Gaussian last-minute spike, peaks around d₀ ≈ 3 days
//
// Aviasales cached prices ≈ P_base (cheapest-of-month, typically at d=14-30).
// Our users are stranded travelers needing flights in 1-14 days. We only care
// about the right-side spike: how much more expensive is d_user vs d_cached?
//
// K(d) = P(d) / P_base = 1 + (α/P_base)·e^(-β·d) + (γ/P_base)·e^(-δ·(d-d₀)²)
//
// For d < 30 (our range), the early-booking term is negligible, so:
//   K(d) ≈ 1 + A·e^(-δ·(d - d₀)²)
//
// Calibration from real data (BKK→MUC 2026-03-07):
//   Cached price: €270 (d_cached ≈ 11-18 days out)
//   Real price at d=2-5: €3,268-5,371 → ratio 12-20x
//   This means K(3) ≈ 12, K(1) ≈ 15-20
//   Thesis says K(1-3) ≈ 1.3-1.5x *average* — but we're comparing to the
//   *minimum*, not the average, so our ratios are higher.
//
// Parameters (initial estimates — will fit against collected data):
//   A  = 14.0  (spike amplitude: K(d₀) = 1 + A = 15x at peak)
//   δ  = 0.08  (spike width: broader = more gradual, narrower = sharper)
//   d₀ = 1.5   (spike center: shifted slightly below 0 for max at d=1)
// ---------------------------------------------------------------------------

// Gaussian spike parameters
const A = 14.0;      // amplitude of last-minute spike
const DELTA = 0.08;  // width parameter (lower = broader spike)
const D0 = 1.5;      // center of spike in days

/**
 * K(d) — price multiplier relative to cached baseline.
 * Returns 1.0 for d >= ~21 (plateau zone), spikes for d < 7.
 *
 * K(d) = 1 + A · e^(-δ · (d - d₀)²)
 */
function K(d: number): number {
  if (d <= 0) d = 0.5; // clamp: same-day ≈ half-day out
  const exponent = -DELTA * (d - D0) * (d - D0);
  return 1 + A * Math.exp(exponent);
}

/**
 * Correct a cached Aviasales price based on days-to-departure.
 *
 * Formula: corrected = cached × K(d_user) / K(d_cached)
 *
 * @param cachedPrice - Price from Aviasales (cheapest-ever for month)
 * @param cachedDate  - Departure date Aviasales returned (ISO)
 * @param userDate    - Date the user wants to depart (ISO)
 * @param todayStr    - Today's date (ISO)
 */
export function correctPrice(
  cachedPrice: number,
  cachedDate: string | undefined,
  userDate: string,
  todayStr: string,
): { correctedPrice: number; correctionApplied: boolean; kUser: number; kCached: number } {
  if (!cachedDate) {
    return { correctedPrice: cachedPrice, correctionApplied: false, kUser: 1, kCached: 1 };
  }

  const todayMs = new Date(todayStr).getTime();
  const cachedMs = new Date(cachedDate).getTime();
  const userMs = new Date(userDate).getTime();

  const dCached = Math.max(0, (cachedMs - todayMs) / (1000 * 60 * 60 * 24));
  const dUser = Math.max(0, (userMs - todayMs) / (1000 * 60 * 60 * 24));

  const kUser = K(dUser);
  const kCached = K(dCached);

  // If both multipliers are close (< 5% difference), skip correction
  if (Math.abs(kUser - kCached) / kCached < 0.05) {
    return { correctedPrice: cachedPrice, correctionApplied: false, kUser, kCached };
  }

  const correctedPrice = Math.round(cachedPrice * kUser / kCached);
  return { correctedPrice, correctionApplied: true, kUser, kCached };
}

/** Human-readable label for the correction magnitude */
export function correctionLabel(kUser: number, kCached: number): string {
  const ratio = kUser / kCached;
  if (ratio > 1.1) return `~${ratio.toFixed(1)}x above cached`;
  if (ratio < 0.9) return `~${(1 / ratio).toFixed(1)}x below cached`;
  return "near cached price";
}
