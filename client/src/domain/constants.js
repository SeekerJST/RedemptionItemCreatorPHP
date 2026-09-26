// UI-level constants: option lists for the grids, and the tag/limitation prices.
// The attribute rules themselves live in domain/rules.

/** Scale IDs as the grids store them ("1".."3"), with the DB ScaleType and display name. */
export const SCALES = [
    { id: '1', label: 'MINOR', name: 'Minor' },
    { id: '2', label: 'MODERATE', name: 'Moderate' },
    { id: '3', label: 'MAJOR', name: 'Major' },
];

export const TAG_RANKS = [
    { id: '1', label: '1' },
    { id: '2', label: '2' },
    { id: '3', label: '3' },
];

/** Systems an attribute can belong to. The grid stores the name itself. */
export const SYSTEMS = [
    'Communications',
    'Electronics',
    'Power',
    'Main Attack',
    'Secondary Attack',
    'Main Drive',
    'Secondary Drive',
    'Missiles',
    'Modifiers',
    'Structure',
    'Tasks',
];

export const UNASSIGNED_SYSTEM = 'Unassigned';

/**
 * Tag cost per rank. A Free tag (the "Free" switch) costs double: in the rules,
 * using a Free tag doesn't require the player to spend Action Points.
 */
export const TAG_COST_PER_RANK = 5;
export const FREE_TAG_COST_PER_RANK = 10;

export const LIMIT_COST_BY_SCALE = { 1: -10, 2: -20, 3: -50 };
