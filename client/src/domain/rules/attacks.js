// Attack, Attack (Melee), Attack Multiplier, Anti-Missile (item_creation_rules.md §5.3,
// with the 2026-09-23 rulings in implementation_plan.md "Attack model").
//
//   Attack             2x at the base cost; Rank = mounts (1 + extra turrets)
//   └ Attack Multiplier  Rank k = (2 + k)x; costs the Curve A upgrade above 2x
//   Attack (Melee)     everything costs half; never takes Area
//   Anti-Missile       the only 1x attack; half the base; no multiplier

import { ALL_GRADES, RANK, priceFor } from './common.js';
import { curveAUpgrade } from './curves.js';

/** Cost of a 2x Attack mount by combat scale (Firefight / Battlefield / Space). */
export const ATTACK_BASE = { 1: 10, 2: 20, 3: 40 };

export const MULTIPLIER_IMPLEMENTATIONS = {
    energy: { name: 'Energy' },
    kinetic: { name: 'Kinetic', upgradeFactor: 0.9, needsAmmunition: true },
    plasma: { name: 'Plasma', slotsPerMount: 2 },
    flare: { name: 'Flare' },
    hyperspace: { name: 'Hyperspace' },
    tse: { name: 'Tse', meleeOnly: true },
};

const ATTACK_CHILDREN = ['attackMultiplier', 'farRanged', 'counter', 'bleed', 'resource', 'modifier'];

/** The implementation chosen on an Attack's Multiplier sub-row, if it has one. */
export function attackImplementation(children = []) {
    return children.find((child) => child.key === 'attackMultiplier')?.implementation ?? 'energy';
}

/** An Attack with an Ammunition Resource under it is fed by ammo instead of Power Slots. */
export function isAmmoFed(children = []) {
    return children.some((child) => child.key === 'resource' && child.implementation === 'ammunition');
}

/** Power for an Attack: 1 slot per mount at its scale (Plasma: 2), unless it's ammo-fed. */
function attackPower(row, ctx) {
    if (isAmmoFed(ctx.children)) {
        return {};
    }
    const perMount = MULTIPLIER_IMPLEMENTATIONS[attackImplementation(ctx.children)]?.slotsPerMount ?? 1;
    return { uses: [{ grade: row.grade, slots: perMount * row.rank }] };
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
        // [Assumption, to confirm] Melee attacks need no feed (a knife has no power or ammo).
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

    /**
     * The pre-split attributes still in the database until Phase 3 ("Attack",
     * "Attack (Kinetic)", ...): Rank is the final Weapon Multiplier (2x, 3x, ...), and the
     * implementation comes from the name. Costed the same way as Attack + Multiplier.
     */
    legacyAttack: {
        name: 'Attack (legacy)',
        gradeKind: 'scale',
        grades: ALL_GRADES,
        rank: { min: 2, meaning: RANK.RANK },
        cost: (row) => {
            const base = priceFor(ATTACK_BASE, row.grade);
            if (row.implementation === 'antiMissile') {
                return base / 2;
            }
            const melee = row.implementation === 'melee' || row.implementation === 'tse';
            const steps = Math.max(0, row.rank - 2);
            return (melee ? base / 2 : base) + multiplierCost(steps, row.implementation, melee);
        },
        power: (row) => {
            const perMount = { kinetic: 0, melee: 0, tse: 0, plasma: 2 }[row.implementation] ?? 1;
            return perMount ? { uses: [{ grade: row.grade, slots: perMount }] } : {};
        },
        children: [...ATTACK_CHILDREN, 'area'],
    },
};
