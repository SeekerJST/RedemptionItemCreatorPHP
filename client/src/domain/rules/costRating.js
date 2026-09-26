// Cost Rating (item_creation_rules.md §4, rulings 2026-09-23).

/** The lowest Cost Rating (and Wealth) the game tracks. */
export const MIN_COST_RATING = -2;

/**
 * CR moves by 1 for every full Budget Increment over (or under) the size's budget.
 * Partial increments don't count, in either direction. Never below -2.
 *
 * @param {number} totalBP
 * @param {{BasePoints: number, IncrementPoints: number, BaseCR: number} | null} size
 *        an itemsize row; null when no size is chosen yet
 * @returns {number|null} null without a size
 */
export function costRating(totalBP, size) {
    if (!size || !(size.IncrementPoints > 0)) {
        return null;
    }
    const delta = totalBP - size.BasePoints;
    const steps = Math.trunc(delta / size.IncrementPoints); // toward zero: floor of |delta| either way
    return Math.max(size.BaseCR + steps, MIN_COST_RATING);
}
