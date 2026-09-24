// Game rules and reference values used by the item creator.
//
// Attribute IDs are the AttributeID values in the `attribute` table. They're
// hard-coded here because specific attributes drive specific summary lines
// (Body, Armor, Force Fields, power slots, modifiers, tasks).

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

export const ATTRIBUTE_IDS = {
    ARMOR_RATING: 2,
    BODY: 5,
    FORCE_FIELD: 13,
    MODIFIER: 20,
    TASK: 26,
};

/** Drive and Power Supply provide power slots: 3 per rank, at their scale. */
export const POWER_SOURCE_IDS = [10, 22];
export const POWER_SLOTS_PER_RANK = 3;

export const MAX_MODIFIER_RANK = 4;

export const ARMOR_TYPE_BY_SCALE = { 1: 'Firefight', 2: 'Battlefield', 3: 'Hull' };
export const FORCE_FIELD_PER_RANK_BY_SCALE = { 1: 10, 2: 20, 3: 50 };

/**
 * Tag cost per rank. A Free tag (the "Free" switch) costs double: in the rules,
 * using a Free tag doesn't require the player to spend Action Points.
 */
export const TAG_COST_PER_RANK = 5;
export const FREE_TAG_COST_PER_RANK = 10;

export const LIMIT_COST_BY_SCALE = { 1: -10, 2: -20, 3: -50 };
/** How many limitations of each scale an item may take. */
export const LIMIT_CAPS_BY_SCALE = { 1: 3, 2: 2, 3: 1 };

export function scaleById(scaleId) {
    return SCALES.find((scale) => scale.id === String(scaleId));
}
