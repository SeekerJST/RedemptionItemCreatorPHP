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
    // Until Phase 3 splits Attack, the database's attack attributes use the pre-split
    // meaning (Rank = final multiplier). Phase 3 points these at attack / attackMelee /
    // attackMultiplier / antiMissile.
    'Attack': 'legacyAttack',
};

const IMPLEMENTATIONS_BY_NAME = {
    'Anti-Missile': 'antiMissile',
    'Kinetic': 'kinetic',
    'Flare': 'flare',
    'Melee': 'melee',
    'Plasma': 'plasma',
    'Tse': 'tse',
    'Hyperspace': 'hyperspace',
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
    const match = /^(.*?)\s*(?:\((.+)\))?$/.exec(String(name ?? '').trim());
    const key = KEYS_BY_NAME[match[1]];
    if (!key) {
        return null;
    }
    const implementation = match[2] ? IMPLEMENTATIONS_BY_NAME[match[2]] ?? null : null;
    if (match[2] && !implementation) {
        return null;
    }
    return { key, implementation: implementation ?? (key === 'legacyAttack' ? 'energy' : null) };
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
    return rule.cost({ ...row, implementation }, { size: null, parent: null, children: [], ...ctx });
}

/** Rule rows with each one's parent and children, for costing or power. */
export function withRelations(rows) {
    const byId = new Map(rows.map((row) => [row.id, row]));
    return rows.map((row) => ({
        row,
        parent: row.parentId != null ? byId.get(row.parentId) ?? null : null,
        children: rows.filter((other) => other.parentId === row.id),
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
