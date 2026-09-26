// Power Slots (item_creation_rules.md §5.22, rulings 2026-09-23).

import { ATTRIBUTE_RULES } from './registry.js';

const GRADES_HIGH_TO_LOW = [3, 2, 1];

/**
 * One row's own power figures, for display: slots it provides and slots it uses.
 * (Shared load like a Force Field track shows on every row; the budget counts it once.)
 * @param {{row, parent, children}} entry from withRelations()
 */
export function rowPower({ row, parent, children }, size = null) {
    const rule = ATTRIBUTE_RULES[row.key];
    if (!rule?.power) {
        return { provides: 0, uses: 0 };
    }
    const implementation = row.implementation ?? rule.defaultImplementation ?? null;
    const { provides = [], uses = [] } = rule.power({ ...row, implementation }, { size, parent, children });
    const total = (list) => list.reduce((sum, { slots }) => sum + slots, 0);
    return { provides: total(provides), uses: total(uses) };
}

/**
 * What the item's Power Supplies and Drives provide, what its attributes use, and whether
 * it all fits. A slot can power its own grade or lower, never higher. Load of the same
 * `shareKey` (e.g. one Force Field track) only counts once.
 *
 * @param {Array<{row: object, parent: object|null, children: object[]}>} related from withRelations()
 * @param {number|null} size item size ordinal
 * @returns {{
 *   grades: Array<{grade: number, available: number, used: number, borrowed: number, short: number}>,
 *   ok: boolean
 * }} per grade: `borrowed` = load covered by spare higher-grade slots; `short` = load nothing covers
 */
export function powerBudget(related, size = null) {
    const available = { 1: 0, 2: 0, 3: 0 };
    const used = { 1: 0, 2: 0, 3: 0 };
    const shared = new Set();

    for (const { row, parent, children } of related) {
        const rule = ATTRIBUTE_RULES[row.key];
        if (!rule?.power) {
            continue;
        }
        const implementation = row.implementation ?? rule.defaultImplementation ?? null;
        const { provides = [], uses = [] } = rule.power({ ...row, implementation }, { size, parent, children });

        for (const { grade, slots } of provides) {
            if (grade in available) available[grade] += slots;
        }
        for (const { grade, slots, shareKey } of uses) {
            if (!(grade in used) || (shareKey && shared.has(shareKey))) continue;
            if (shareKey) shared.add(shareKey);
            used[grade] += slots;
        }
    }

    // Top down: each grade uses its own slots first, then spare slots from higher grades.
    let spare = 0;
    const grades = [];
    for (const grade of GRADES_HIGH_TO_LOW) {
        const own = Math.min(available[grade], used[grade]);
        const borrowed = Math.min(spare, used[grade] - own);
        const short = used[grade] - own - borrowed;
        spare = spare - borrowed + (available[grade] - own);
        grades.push({ grade, available: available[grade], used: used[grade], borrowed, short });
    }

    return { grades: grades.reverse(), ok: grades.every((g) => g.short === 0) };
}
