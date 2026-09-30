// Armor Rating, Shrouded Hull, Body, Force Field, Regeneration, Bleed
// (item_creation_rules.md §5.2, §5.4, §5.5, §5.13, §5.23).

import { ALL_GRADES, GRADE, RANK, priceFor } from './common.js';
import { freePlasmaBleed } from './attacks.js';
import { curveA, curveB } from './curves.js';
import { SIZE, bodyPurchase } from './sizes.js';

export const ARMOR_BASE = { 1: 20, 2: 50, 3: 80 };
const SHROUDED_HULL_BASE = 120;

export const FORCE_FIELD = {
    cost: { 1: 15, 2: 20, 3: 25 },
    track: { 1: 10, 2: 20, 3: 50 },
    maxItemSize: { 1: SIZE.MEDIUM, 2: SIZE.LARGE, 3: SIZE.COLOSSAL },
};

export const protectionRules = {
    armorRating: {
        name: 'Armor Rating',
        gradeKind: 'scale',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.RANK },
        cost: (row) => curveA(priceFor(ARMOR_BASE, row.grade), row.rank - 1),
        children: ['regeneration', 'shroudedHull', 'counter'],
    },

    /**
     * Space-scale armor only. Its 120 BP replaces the Space armor base of 80, and higher
     * ranks follow the normal Armor curve (ruling 2026-09-23). As a sub-row of the Armor
     * it therefore adds a flat +40; on its own, Rank is the armor rank.
     */
    shroudedHull: {
        name: 'Shrouded Hull',
        gradeKind: 'none',
        grades: [GRADE.MAJOR],
        rank: { min: 1, meaning: RANK.RANK },
        cost: (row, ctx) =>
            ctx.parent?.key === 'armorRating'
                ? SHROUDED_HULL_BASE - ARMOR_BASE[GRADE.MAJOR]
                : curveA(SHROUDED_HULL_BASE, row.rank - 1),
        children: [],
    },

    /** Extra Body, bought in purchases whose size and price depend on the item's size. */
    body: {
        name: 'Body',
        gradeKind: 'none',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.PURCHASES },
        cost: (row, ctx) => (bodyPurchase(ctx.size)?.cost ?? 0) * row.rank,
        children: ['regeneration'],
    },

    forceField: {
        name: 'Force Field',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.PURCHASES },
        cost: (row) => priceFor(FORCE_FIELD.cost, row.grade) * row.rank,
        // One slot of the Force Field's grade powers the item's whole track (ruling 2026-09-23).
        power: (row) => ({ uses: [{ grade: row.grade, slots: 1, shareKey: `forceField:${row.grade}` }] }),
        children: ['regeneration'],
    },

    regeneration: {
        name: 'Regeneration',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.RANK },
        cost: (row) => curveB(priceFor({ 1: 5, 2: 10, 3: 15 }, row.grade), row.rank),
        children: [],
    },

    bleed: {
        name: 'Bleed',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.RANK }, // damage per round
        // Under a Plasma Attack, Bleed at the Attack's scale is free up to floor(m / 2); ranks above
        // that cost the difference between the full Bleed and the free Bleed (ruling 2026-09-27).
        cost: (row, ctx) => {
            const base = priceFor({ 1: 5, 2: 10, 3: 20 }, row.grade);
            const free = freePlasmaBleed(ctx.parent, ctx.siblings);
            if (free && free.grade === row.grade) {
                return row.rank <= free.rank ? 0 : curveB(base, row.rank) - curveB(base, free.rank);
            }
            return curveB(base, row.rank);
        },
        children: [],
    },
};
