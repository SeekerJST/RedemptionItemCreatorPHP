// All other attributes (item_creation_rules.md §5.1, §5.6–§5.12, §5.14–§5.22, §5.24, §5.26).

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

export const DRIVE_IMPLEMENTATIONS = {
    standard: { name: 'Standard' },
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
};

export const POWER_SUPPLY_MIN_ITEM_SIZE = { 2: SIZE.MEDIUM, 3: SIZE.LARGE };

/** One slot of the row's grade per unit bought (Gravity Control, Manufacture). */
const oneSlotAtGrade = (row) => ({ uses: [{ grade: row.grade, slots: row.rank }] });

export const systemRules = {
    area: {
        name: 'Area',
        gradeKind: 'none',
        grades: ALL_GRADES,
        rank: { min: 1, max: 1, meaning: RANK.QUANTITY },
        cost: () => 20,
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

    counter: {
        name: 'Counter',
        gradeKind: 'none',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.QUANTITY },
        cost: (row) => 20 * row.rank,
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
        cost: perUnit({ 1: 5, 2: 15, 3: 50 }),
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

    modifier: {
        name: 'Modifier',
        gradeKind: 'none',
        grades: ALL_GRADES,
        rank: { min: 1, max: 4, meaning: RANK.RANK },
        cost: (row) => 10 * row.rank,
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
