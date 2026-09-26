// The two "parabolic" cost curves from item_creation_rules.md §5.0.

/**
 * Curve A: each step costs 10 more than the one before (+10, +20, +30, ...).
 * Used by Armor Rating and the Attack multiplier.
 * @param {number} base cost at the first step
 * @param {number} steps steps above the first (0 = just the base)
 */
export function curveA(base, steps) {
    return base + 5 * steps * (steps + 1);
}

/** Curve A without the base: what `steps` upgrades add (+10, +30, +60, +100, ...). */
export function curveAUpgrade(steps) {
    return curveA(0, steps);
}

/**
 * Curve B: each rank costs 5 more than the one before (+5, +10, +15, ...).
 * Used by Bleed and Regeneration. Always a whole number.
 * @param {number} base cost at rank 1
 * @param {number} rank 1-based
 */
export function curveB(base, rank) {
    return base + (5 * rank * (rank - 1)) / 2;
}
