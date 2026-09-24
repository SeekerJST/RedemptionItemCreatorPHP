// Shared vocabulary for the attribute rules.
//
// Every attribute rule is an object:
//   name         display name (matches the `attribute` table)
//   gradeKind    'grade' (Minor/Moderate/Major), 'scale' (Firefight/Battlefield/Space),
//                or 'none' (the grade doesn't matter, or comes from the parent / item size)
//   grades       grades the attribute can be bought at (1 = Minor/Firefight ... 3 = Major/Space)
//   rank         { min, max, meaning }: what the row's Rank number means for this attribute
//   implementations  optional { id: { name, ... } }
//   cost(row, ctx)   BP for the row
//   power(row, ctx)  optional: { provides?: [{grade, slots}], uses?: [{grade, slots, shareKey?}] }
//   children     keys of the attributes allowed as sub-rows (one level deep)
//
// A rule row is { id, key, grade, rank, implementation, parentId }, and ctx is
// { size, parent, children } (size: 1 = Tiny ... 6 = Colossal; parent/children: rule rows).

export const GRADE = { MINOR: 1, MODERATE: 2, MAJOR: 3 };
export const ALL_GRADES = [GRADE.MINOR, GRADE.MODERATE, GRADE.MAJOR];

export const GRADE_NAMES = { 1: 'Minor', 2: 'Moderate', 3: 'Major' };
export const SCALE_NAMES = { 1: 'Firefight', 2: 'Battlefield', 3: 'Space' };

/** What the Rank column means for an attribute; drives labels and validation. */
export const RANK = {
    RANK: 'rank',
    QUANTITY: 'quantity', // how many are bought (repeatable features)
    PURCHASES: 'purchases', // increments of a track (Body, Force Field)
    MOUNTS: 'mounts', // Attack mounts: 1 + extra turrets
    MULTIPLIER_STEPS: 'multiplierSteps', // Attack Multiplier: +1x per rank
    INCREMENTS: 'increments', // Launchers, bought 4 at a time
    TARGET_NUMBER: 'targetNumber', // Tasks
};

/** Per-grade price table lookup; an unavailable grade costs 0 (validation reports it). */
export const priceFor = (table, grade) => table[grade] ?? 0;

/** Flat price per grade, times the row's quantity. */
export const perUnit = (table) => (row) => priceFor(table, row.grade) * row.rank;
