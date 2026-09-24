// Size categories (item_creation_rules.md §3), as ordinals so rules can compare them.

export const SIZE = { TINY: 1, SMALL: 2, MEDIUM: 3, LARGE: 4, HUGE: 5, COLOSSAL: 6 };

const SIZE_NAMES = ['', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Colossal'];

/** 'SMALL' / 'Small' (as stored in itemsize.SizeName) -> 2; unknown or blank -> null. */
export function sizeOrdinal(sizeName) {
    return SIZE[String(sizeName ?? '').toUpperCase()] ?? null;
}

export function sizeName(ordinal) {
    return SIZE_NAMES[ordinal] ?? '';
}

/**
 * Body Track purchases (§5.5): what one purchase adds and costs depends on the item's
 * size, not on a grade. Tiny items can't buy Body (null).
 */
const BODY_PURCHASE = {
    [SIZE.TINY]: null,
    [SIZE.SMALL]: { body: 5, cost: 5 },
    [SIZE.MEDIUM]: { body: 5, cost: 5 },
    [SIZE.LARGE]: { body: 20, cost: 10 },
    [SIZE.HUGE]: { body: 50, cost: 20 },
    [SIZE.COLOSSAL]: { body: 50, cost: 20 },
};

/** @returns {{body: number, cost: number} | null} null for Tiny or no size chosen */
export function bodyPurchase(size) {
    return BODY_PURCHASE[size] ?? null;
}
