// Attack, Attack (Melee), Attack Multiplier, Anti-Missile (item_creation_rules.md §5.3,
// with the 2026-09-23 rulings in implementation_plan.md "Attack model").
//
//   Attack             2x at the base cost; Rank = mounts (1 + extra turrets)
//   └ Attack Multiplier  Rank k = (2 + k)x; costs the Curve A upgrade above 2x
//   Attack (Melee)     everything costs half; never takes Area
//   Anti-Missile       the only 1x attack; half the base; no multiplier

import { ALL_GRADES, GRADE, RANK, priceFor } from './common.js';
import { curveAUpgrade } from './curves.js';

/** Cost of a 2x Attack mount by combat scale (Firefight / Battlefield / Space). */
export const ATTACK_BASE = { 1: 10, 2: 20, 3: 40 };

export const MULTIPLIER_IMPLEMENTATIONS = {
    energy: { name: 'Energy' },
    // Rail weapons (errata p210). Built into or slaved to a host (ship and vehicle guns, suit or
    // Weapon Link mounts): Ammunition plus a Power Slot. Self-powered (hand weapons such as gauss
    // pistols and rifles): Ammunition only; the power is built into each round's casing.
    kinetic: { name: 'Kinetic', upgradeFactor: 0.9, needsAmmunition: true, needsPower: true },
    kineticSelfPowered: { name: 'Kinetic (self-powered)', upgradeFactor: 0.9, needsAmmunition: true },
    // Plasma draws 2 Power Slots per mount, even with Ammunition (the Light Plasma Cannon uses both).
    // Self-powered plasma (the Plasma Carbine) needs special Ammunition instead of the slots. That
    // requirement is built in as a Moderate limitation: it takes one of the two Moderate limitation
    // slots but gives no BP back (ruling 2026-09-29).
    plasma: { name: 'Plasma', slotsPerMount: 2, needsPower: true },
    plasmaSelfPowered: { name: 'Plasma (self-powered)', needsAmmunition: true, impliedLimitation: GRADE.MODERATE },
    flare: { name: 'Flare' },
    hyperspace: { name: 'Hyperspace' },
    tse: { name: 'Tse', meleeOnly: true },
};

const ATTACK_CHILDREN = ['attackMultiplier', 'farRanged', 'counter', 'bleed', 'resource', 'modifier'];

/** The implementation chosen on an Attack's Multiplier sub-row, if it has one. */
export function attackImplementation(children = []) {
    return children.find((child) => child.key === 'attackMultiplier')?.implementation ?? 'energy';
}

/**
 * An Attack with an Ammunition Resource (or a plain Resource, i.e. a clip) under it is fed
 * by ammo instead of Power Slots.
 */
export function isAmmoFed(children = []) {
    return children.some((child) => child.key === 'resource' && ['ammunition', 'general', null, undefined].includes(child.implementation));
}

/**
 * Power for an Attack: 1 slot per mount at its scale (Plasma: 2). An ammo-fed Attack draws none,
 * except a built-in Kinetic (rail) weapon, which needs both; a self-powered Kinetic one never does.
 */
function attackPower(row, ctx) {
    const implementation = MULTIPLIER_IMPLEMENTATIONS[attackImplementation(ctx.children)];
    if (implementation?.needsAmmunition && !implementation.needsPower) {
        return {};
    }
    if (!implementation?.needsPower && isAmmoFed(ctx.children)) {
        return {};
    }
    const perMount = implementation?.slotsPerMount ?? 1;
    return { uses: [{ grade: row.grade, slots: perMount * row.rank }] };
}

/**
 * Limitations an implementation carries built in: they count toward the limitation caps but
 * refund nothing. `rows`: rule rows (the Multiplier sub-row holds the implementation).
 * @returns {Array<{rowId: number, grade: number, name: string}>}
 */
export function impliedLimitations(rows) {
    return rows
        .filter((row) => row.key === 'attackMultiplier' && MULTIPLIER_IMPLEMENTATIONS[row.implementation]?.impliedLimitation)
        .map((row) => {
            const implementation = MULTIPLIER_IMPLEMENTATIONS[row.implementation];
            return { rowId: row.id, grade: implementation.impliedLimitation, name: implementation.name };
        });
}

/**
 * The upgrade cost for k multiplier steps above 2x.
 * Kinetic takes 10% off, rounded up; under a Melee Attack everything is halved;
 * Kinetic + Melee is ceil(upgrade × 0.45) (spec §5.3 ruling).
 */
export function multiplierCost(steps, implementation, underMelee) {
    const upgrade = curveAUpgrade(steps);
    const factor = (MULTIPLIER_IMPLEMENTATIONS[implementation]?.upgradeFactor ?? 1) * (underMelee ? 0.5 : 1);
    return Math.ceil(upgrade * factor);
}

export const attackRules = {
    attack: {
        name: 'Attack',
        gradeKind: 'scale',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.MOUNTS },
        cost: (row) => priceFor(ATTACK_BASE, row.grade) * row.rank,
        power: attackPower,
        children: [...ATTACK_CHILDREN, 'area'],
    },

    attackMelee: {
        name: 'Attack (Melee)',
        gradeKind: 'scale',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.MOUNTS },
        cost: (row) => (priceFor(ATTACK_BASE, row.grade) / 2) * row.rank,
        // Melee attacks need no feed: no Power Slot and no ammunition (ruling 2026-09-23; a knife has neither).
        power: () => ({}),
        children: ATTACK_CHILDREN, // never Area [Errata p210]
    },

    attackMultiplier: {
        name: 'Attack Multiplier',
        gradeKind: 'none', // the parent Attack's scale
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.MULTIPLIER_STEPS },
        implementations: MULTIPLIER_IMPLEMENTATIONS,
        defaultImplementation: 'energy',
        subRowOnly: true, // only ever under an Attack or Attack (Melee)
        cost: (row, ctx) => multiplierCost(row.rank, row.implementation, ctx.parent?.key === 'attackMelee'),
        children: [],
    },

    antiMissile: {
        name: 'Anti-Missile',
        gradeKind: 'scale',
        grades: ALL_GRADES,
        rank: { min: 1, meaning: RANK.MOUNTS },
        cost: (row) => (priceFor(ATTACK_BASE, row.grade) / 2) * row.rank,
        power: (row) => ({ uses: [{ grade: row.grade, slots: row.rank }] }),
        children: [],
    },

};
