// The item creation rules: one entry per attribute, keyed by a stable name.
// See common.js for the shape of an entry, and docs/item_creation_rules.md for the rules.

import { GRADE_NAMES, SCALE_NAMES } from './common.js';
import { ATTRIBUTE_RULES } from './registry.js';

export { ATTRIBUTE_RULES, GRADE_NAMES, SCALE_NAMES };

// Database attribute names -> rule key, and the implementation a "Name (Implementation)"
// name implies. Matching by name, not AttributeID, keeps this independent of row IDs.
const KEYS_BY_NAME = {
    'Area': 'area',
    'Armor Rating': 'armorRating',
    'Bleed': 'bleed',
    'Body': 'body',
    'Cargo': 'cargo',
    'Communication': 'communication',
    'Computer': 'computer',
    'Counter': 'counter',
    'Drive': 'drive',
    'Far Ranged': 'farRanged',
    'Force Field': 'forceField',
    'Gravity Control': 'gravityControl',
    'Hangar': 'hangar',
    'Launchers': 'launchers',
    'Life Support': 'lifeSupport',
    'Link': 'link',
    'Maneuver': 'maneuver',
    'Manufacture': 'manufacture',
    'Modifier': 'modifier',
    'Neural Interface': 'neuralInterface',
    'Power Supply': 'powerSupply',
    'Regeneration': 'regeneration',
    'Resource': 'resource',
    'Shrouded Hull': 'shroudedHull',
    'Task': 'task',
    'Attack': 'attack',
    'Attack (Melee)': 'attackMelee', // a separate attribute, not an implementation of Attack
    'Attack Multiplier': 'attackMultiplier',
    'Anti-Missile': 'antiMissile',
};

const IMPLEMENTATIONS_BY_NAME = {
    'Laser Link': 'laserLink',
    'Radio': 'radio',
    'Ansible': 'ansible',
    'Hypercomms': 'hypercomms',
};

/**
 * "Communication (Radio)" -> { key: 'communication', implementation: 'radio' }.
 * @returns {{key: string, implementation: string|null} | null} null for an unknown attribute
 */
export function resolveAttributeName(name) {
    const trimmed = String(name ?? '').trim();
    if (KEYS_BY_NAME[trimmed]) {
        return { key: KEYS_BY_NAME[trimmed], implementation: null }; // e.g. "Attack (Melee)" is its own attribute
    }
    const match = /^(.*?)\s*(?:\((.+)\))?$/.exec(trimmed);
    const key = KEYS_BY_NAME[match[1]];
    if (!key) {
        return null;
    }
    const implementation = match[2] ? IMPLEMENTATIONS_BY_NAME[match[2]] ?? null : null;
    if (match[2] && !implementation) {
        return null;
    }
    return { key, implementation };
}

/**
 * BP for one rule row.
 * @param {{key: string, grade: number, rank: number, implementation?: string|null}} row
 * @param {{size?: number|null, parent?: object|null, children?: object[]}} ctx
 */
export function rowCost(row, ctx = {}) {
    const rule = ATTRIBUTE_RULES[row.key];
    if (!rule) {
        return 0;
    }
    const implementation = row.implementation ?? rule.defaultImplementation ?? null;
    return rule.cost({ ...row, implementation }, { size: null, parent: null, children: [], siblings: [], ...ctx });
}

/**
 * Rule rows with each one's parent, children, and siblings (the parent's other sub-rows),
 * for costing or power.
 */
export function withRelations(rows) {
    const byId = new Map(rows.map((row) => [row.id, row]));
    return rows.map((row) => ({
        row,
        parent: row.parentId != null ? byId.get(row.parentId) ?? null : null,
        children: rows.filter((other) => other.parentId === row.id),
        siblings: row.parentId != null ? rows.filter((other) => other.parentId === row.parentId && other.id !== row.id) : [],
    }));
}

export { costRating } from './costRating.js';
export { powerBudget, rowPower } from './power.js';
export { validateItem } from './validate.js';

/** How an attribute's grade reads: "Battlefield" for scale attributes, "Moderate" for graded ones, "" if none. */
export function gradeLabel(key, grade) {
    const kind = ATTRIBUTE_RULES[key]?.gradeKind ?? 'grade';
    if (kind === 'none') {
        return '';
    }
    return (kind === 'scale' ? SCALE_NAMES : GRADE_NAMES)[grade] ?? '';
}
