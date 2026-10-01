// All other attributes (item_creation_rules.md §5.1, §5.6–§5.12, §5.14–§5.22, §5.24, §5.26).

import { attackFreeEffects } from './attacks.js';
import { ALL_GRADES, GRADE, RANK, perUnit, priceFor } from './common.js';
import { SIZE } from './sizes.js';

/** Every Power Supply rank, and every Drive, provides this many slots of its grade. */
export const SLOTS_PER_SOURCE = 3;

export const LAUNCHERS_PER_INCREMENT = 4;
const LAUNCHER_PRICE = { 1: 5, 2: 10, 3: 15 }; // per launcher

export const COMMUNICATION_IMPLEMENTATIONS = {
    // The plain "Communication" row isn't in the book, which prices comms by implementation.
    // It stays, at the database's 5 / 15 / 30 (ruling 2026-09-23).
    general: { name: 'Communication', price: { 1: 5, 2: 15, 3: 30 } },
    radio: { name: 'Radio', price: { 1: 3, 2: 13 } },
    laserLink: { name: 'Laser Link', price: { 1: 3, 2: 13 } },
    ansible: { name: 'Ansible', price: { 3: 30 } },
    hypercomms: { name: 'Hypercomms', price: { 3: 25 } },
};

export const COMPUTER_IMPLEMENTATIONS = {
    standard: { name: 'Standard', perRank: { 1: 3, 2: 5, 3: 20 } },
    brain: { name: 'Brain', perRank: { 1: 5, 2: 10, 3: 40 } },
    quantum: { name: 'Quantum Processor', perRank: { 1: 20, 2: 40, 3: 80 } },
};
export const COMPUTER_TASK_LIMIT = { 1: 5, 2: 50, 3: Infinity };
export const computerTargetNumber = (rank) => 12 + 2 * rank;

// Spec §5.10. Air, Ground, and Sea are "usually Minor" and Reaction, Reactionless, and Gravitic
// usually a set grade, but the book builds exceptions (a Minor Reaction Drive is a jet pack), so
// only Light Sail and Jump restrict their grade.
export const DRIVE_IMPLEMENTATIONS = {
    standard: { name: 'Standard' },
    air: { name: 'Air' },
    ground: { name: 'Ground' },
    sea: { name: 'Sea' },
    reaction: { name: 'Reaction' },
    reactionless: { name: 'Reactionless' }, // Shohan; expels no reaction mass, still needs Fuel
    gravitic: { name: 'Gravitic' }, // only outside a system's grav shore
    biological: { name: 'Biological', noFuel: true }, // legs, wings, fins: a creature's own muscle (ruling 2026-09-30)
    lightSail: { name: 'Light Sail', price: 15, grades: [GRADE.MODERATE], noFuel: true, noManeuver: true },
    jump: { name: 'Jump', grades: [GRADE.MAJOR], noFuel: true },
};
const DRIVE_PRICE = { 1: 10, 2: 25, 3: 50 };

export const LIFE_SUPPORT_IMPLEMENTATIONS = {
    standard: { name: 'Standard', price: { 1: 5, 2: 20, 3: 40 }, people: { 1: 1, 2: 12, 3: 100 } },
    artificialEcology: {
        name: 'Artificial Ecology',
        price: { 1: 15, 2: 30, 3: 60 },
        people: { 1: 12, 2: 100, 3: 1000 },
        minItemSize: { 1: SIZE.LARGE, 2: SIZE.HUGE, 3: SIZE.COLOSSAL },
    },
};

/** Resource types. The plain Resource stays for anything the setting's types don't cover. */
export const RESOURCE_TYPES = {
    general: { name: 'Resource', perRank: { 1: 5, 2: 10, 3: 15 } },
    ammunition: { name: 'Ammunition', perRank: { 1: 5, 2: 10, 3: 15 } },
    fuel: { name: 'Fuel', perRank: { 1: 5, 2: 10, 3: 15 } },
    magazine: { name: 'Magazine', perRank: { 1: 5, 2: 10, 3: 15 } },
    charge: { name: 'Charge', perRank: { 1: 4, 2: 8, 3: 12 } },
    tangle: { name: 'Tangle', perRank: { 1: 10, 2: 10, 3: 10 } },
    // Timed effects such as drugs (errata): 1 Minor rank ≈ 10 combat rounds or 1 hour; 1 Moderate ≈ 1 day.
    duration: { name: 'Duration', perRank: { 1: 5, 2: 10, 3: 15 } },
};

/**
 * Spec §5.22. `feed`: the Resource type it runs on (item-level; Resources can be shared).
 * `compactMajor`: a Major one fits in a Medium item, one size below the usual minimum (errata p216).
 */
export const POWER_SUPPLY_IMPLEMENTATIONS = {
    general: { name: 'Power Supply' },
    fusion: { name: 'Fusion', feed: 'fuel' },
    antimatter: { name: 'Antimatter', feed: 'fuel' },
    // runsDrives: burns no Fuel, so the item's Drives can run from it instead (ruling 2026-09-30).
    coil: { name: 'Coil', feed: 'charge', compactMajor: true, runsDrives: true },
    environmental: { name: 'Environmental', runsDrives: true },
    hyperspaceTap: { name: 'Hyperspace Tap', compactMajor: true, runsDrives: true }, // Shohan
};

/** Smallest item a Power Supply fits in (errata p216): Moderate on Small, Major on Large (Medium if compact). */
export function powerSupplyMinSize(grade, implementation) {
    if (grade === GRADE.MAJOR) {
        return POWER_SUPPLY_IMPLEMENTATIONS[implementation]?.compactMajor ? SIZE.MEDIUM : SIZE.LARGE;
    }
    return grade === GRADE.MODERATE ? SIZE.SMALL : 0;
}

/** Spec §5.18. Refueling (errata p215) draws 1 Power Slot of its grade per Link while in use. */
export const LINK_IMPLEMENTATIONS = {
    general: { name: 'Link' },
    data: { name: 'Data' },
    psi: { name: 'Psi' },
    weapon: { name: 'Weapon' },
    refueling: { name: 'Refueling', drawsPower: true },
};

/**
 * Spec §5.9: Counters are open-ended; these are the named ones. Strain (errata p212) raises or
 * lowers the user's Psionic Strain by 5 per Counter; the direction doesn't change the cost.
 */
export const COUNTER_IMPLEMENTATIONS = {
    general: { name: 'Counter' },
    armor: { name: 'Armor' },
    shields: { name: 'Shields' },
    disabling: { name: 'Disabling' },
    strike: { name: 'Strike' },
    missiles: { name: 'Missiles' },
    detection: { name: 'Detection' },
    strainRaise: { name: 'Strain (raise)' },
    strainLower: { name: 'Strain (lower)' },
};

/**
 * True if this row is the one an Attack's implementation makes free (e.g. Plasma's Counter
 * (Shields)): `freeKey` names the implementation, and only the first matching sub-row (lowest id)
 * is free, so buying a second one costs in full.
 */
function isFreeSubRow(row, ctx, freeKey, matches) {
    if (!freeKey) {
        return false;
    }
    return matches(row) && !(ctx.siblings ?? []).some((other) => other.key === row.key && matches(other) && other.id < row.id);
}

/** One slot of the row's grade per unit bought (Gravity Control, Manufacture). */
const oneSlotAtGrade = (row) => ({ uses: [{ grade: row.grade, slots: row.rank }] });

export const systemRules = {
    area: {
        name: 'Area',
        gradeKind: 'none',
        grades: ALL_GRADES,
        rank: { min: 1, max: 1, meaning: RANK.QUANTITY },
        // Hyperspace Attacks include Area: Small Sudden free (errata p210).
        cost: (row, ctx) => (isFreeSubRow(row, ctx, attackFreeEffects(ctx.parent, ctx.siblings).area, () => true) ? 0 : 20),
        children: [],
    },

    cargo: {
        name: 'Cargo',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY }, // units
        cost: perUnit({ 1: 5, 2: 15, 3: 30 }),
        children: [],
    },

    communication: {
        name: 'Communication',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY },
        implementations: COMMUNICATION_IMPLEMENTATIONS,
        defaultImplementation: 'general',
        cost: (row) =>
            priceFor(COMMUNICATION_IMPLEMENTATIONS[row.implementation ?? 'general']?.price ?? {}, row.grade) * row.rank,
        children: ['resource'], // Tangle for an Ansible
    },

    computer: {
        name: 'Computer',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, max: 6, meaning: RANK.RANK },
        implementations: COMPUTER_IMPLEMENTATIONS,
        defaultImplementation: 'standard',
        cost: (row) =>
            priceFor(COMPUTER_IMPLEMENTATIONS[row.implementation ?? 'standard']?.perRank ?? {}, row.grade) * row.rank,
        children: ['task'],
    },

    /** Some Attack implementations include a Counter free: Plasma → Shields, Tse and Hyperspace → Armor. */
    counter: {
        name: 'Counter',
        gradeKind: 'none',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY },
        implementations: COUNTER_IMPLEMENTATIONS,
        defaultImplementation: 'general',
        cost: (row, ctx) => {
            const free = attackFreeEffects(ctx.parent, ctx.siblings).counter;
            const freeRanks = isFreeSubRow(row, ctx, free, (r) => r.implementation === free) ? 1 : 0;
            return 20 * Math.max(0, row.rank - freeRanks);
        },
        children: [],
    },

    drive: {
        name: 'Drive',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY },
        implementations: DRIVE_IMPLEMENTATIONS,
        defaultImplementation: 'standard',
        cost: (row) => (DRIVE_IMPLEMENTATIONS[row.implementation]?.price ?? priceFor(DRIVE_PRICE, row.grade)) * row.rank,
        // Every Drive also acts as a rank-1 Power Supply of its grade.
        power: (row) => ({ provides: [{ grade: row.grade, slots: SLOTS_PER_SOURCE * row.rank }] }),
        children: ['maneuver', 'resource'],
    },

    /** Priced at its Drive's grade when it's a sub-row of one; otherwise at its own grade. */
    maneuver: {
        name: 'Maneuver',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, max: 4, meaning: RANK.RANK },
        cost: (row, ctx) =>
            priceFor({ 1: 5, 2: 10, 3: 20 }, ctx.parent?.key === 'drive' ? ctx.parent.grade : row.grade) * row.rank,
        children: [],
    },

    farRanged: {
        name: 'Far Ranged',
        gradeKind: 'grade',
        grades: [GRADE.MINOR, GRADE.MODERATE],
        rank: { min: 1, max: 1, meaning: RANK.QUANTITY },
        cost: (row) => priceFor({ 1: 20, 2: 40 }, row.grade),
        children: [],
    },

    gravityControl: {
        name: 'Gravity Control',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY },
        cost: perUnit({ 1: 10, 2: 20, 3: 40 }),
        // Draws power like an Attack at its own scale: a Major Gravity Control needs a
        // Major Power Slot (ruling 2026-09-23).
        power: oneSlotAtGrade,
        children: [],
    },

    hangar: {
        name: 'Hangar',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY },
        cost: perUnit({ 1: 15, 2: 30, 3: 60 }),
        children: [],
    },

    /** Bought in increments of 4 launchers; each increment uses 1 Power Slot (ruling 2026-09-23). */
    launchers: {
        name: 'Launchers',
        gradeKind: 'scale',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.INCREMENTS },
        cost: (row) => LAUNCHERS_PER_INCREMENT * priceFor(LAUNCHER_PRICE, row.grade) * row.rank,
        power: (row) => ({ uses: [{ grade: row.grade, slots: row.rank }] }),
        children: ['resource'], // Magazine
    },

    lifeSupport: {
        name: 'Life Support',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY },
        implementations: LIFE_SUPPORT_IMPLEMENTATIONS,
        defaultImplementation: 'standard',
        cost: (row) =>
            priceFor(LIFE_SUPPORT_IMPLEMENTATIONS[row.implementation ?? 'standard']?.price ?? {}, row.grade) * row.rank,
        children: [],
    },

    link: {
        name: 'Link',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY },
        implementations: LINK_IMPLEMENTATIONS,
        defaultImplementation: 'general',
        cost: perUnit({ 1: 5, 2: 15, 3: 50 }),
        power: (row) => (LINK_IMPLEMENTATIONS[row.implementation]?.drawsPower ? oneSlotAtGrade(row) : {}),
        children: [],
    },

    manufacture: {
        name: 'Manufacture',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY },
        cost: perUnit({ 1: 25, 2: 50, 3: 100 }),
        power: oneSlotAtGrade, // ruling: one slot of its grade
        children: ['resource'], // supply
    },

    /**
     * The grade is how many skills it covers (ruling 2026-09-28): Minor 1, Moderate 2,
     * Major 3+ or a class of skills ("Weapons"). 10 / 20 / 30 BP per rank.
     */
    modifier: {
        name: 'Modifier',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, max: 4, meaning: RANK.RANK },
        cost: (row) => 10 * (row.grade ?? GRADE.MINOR) * row.rank,
        children: [],
    },

    neuralInterface: {
        name: 'Neural Interface',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY },
        cost: perUnit({ 1: 3, 2: 5, 3: 10 }),
        children: [],
    },

    powerSupply: {
        name: 'Power Supply',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.RANK },
        implementations: POWER_SUPPLY_IMPLEMENTATIONS,
        defaultImplementation: 'general',
        cost: (row) => priceFor({ 1: 5, 2: 10, 3: 40 }, row.grade) * row.rank,
        power: (row) => ({ provides: [{ grade: row.grade, slots: SLOTS_PER_SOURCE * row.rank }] }),
        children: ['resource'], // Fuel or Charge
    },

    resource: {
        name: 'Resource',
        gradeKind: 'grade',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.RANK },
        implementations: RESOURCE_TYPES,
        defaultImplementation: 'general',
        cost: (row) => priceFor(RESOURCE_TYPES[row.implementation ?? 'general']?.perRank ?? {}, row.grade) * row.rank,
        children: [],
    },

    /** Rank is the Task's TN. Tasks on an item whose Computer is a Brain cost half. */
    task: {
        name: 'Task',
        gradeKind: 'none',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.TARGET_NUMBER },
        cost: (row, ctx) => {
            const cost = 2 * row.rank;
            return ctx.parent?.key === 'computer' && ctx.parent.implementation === 'brain' ? cost / 2 : cost;
        },
        children: [],
    },
};
