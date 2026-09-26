// Every cost table in docs/item_creation_rules.md §5, checked against the rules.

import { describe, expect, it } from 'vitest';
import { curveA, curveB } from './curves.js';
import { rowCost } from './index.js';
import { SIZE } from './sizes.js';

const MINOR = 1, MODERATE = 2, MAJOR = 3;

/** Cost of a rule row built from the pieces the test cares about. */
const cost = (key, grade, rank, { implementation = null, parent = null, size = null } = {}) =>
    rowCost({ id: 1, key, grade, rank, implementation }, { parent, size });

/** Costs for ranks 1..n, to compare with a table row. */
const ranks = (key, grade, n, options) => Array.from({ length: n }, (_, i) => cost(key, grade, i + 1, options));

describe('shared curves (§5.0)', () => {
    it('Curve A grows by +10, +20, +30, ...', () => {
        expect([0, 1, 2, 3, 4].map((n) => curveA(20, n))).toEqual([20, 30, 50, 80, 120]);
    });
    it('Curve B grows by +5, +10, +15, ... and is always whole', () => {
        expect([1, 2, 3, 4, 5].map((n) => curveB(5, n))).toEqual([5, 10, 20, 35, 55]);
        for (let n = 1; n <= 50; n++) expect(Number.isInteger(curveB(15, n))).toBe(true);
    });
});

describe('Armor Rating (§5.2)', () => {
    it.each([
        [MINOR, [20, 30, 50, 80, 120]],
        [MODERATE, [50, 60, 80, 110, 150]],
        [MAJOR, [80, 90, 110, 140, 180]],
    ])('scale %i, ranks 1-5', (grade, expected) => {
        expect(ranks('armorRating', grade, 5)).toEqual(expected);
    });
    it('Space rank 6 = 230 (the Redemption example)', () => {
        expect(cost('armorRating', MAJOR, 6)).toBe(230);
    });
});

describe('Shrouded Hull (§5.2)', () => {
    it('on its own: 120 base plus the Armor curve', () => {
        expect(cost('shroudedHull', MAJOR, 1)).toBe(120);
        expect(cost('shroudedHull', MAJOR, 2)).toBe(130);
        expect(cost('shroudedHull', MAJOR, 6)).toBe(270);
    });
    it('under Space Armor: adds the 40 that replaces the 80 base with 120', () => {
        const armor = { key: 'armorRating', grade: MAJOR, rank: 6 };
        expect(cost('armorRating', MAJOR, 6) + cost('shroudedHull', MAJOR, 1, { parent: armor })).toBe(270);
    });
});

describe('Attack (§5.3, 2x at base; each Multiplier rank +1x)', () => {
    const attack = (grade) => ({ key: 'attack', grade, rank: 1 });
    const total = (grade, multiplier, implementation = 'energy', parentKey = 'attack') => {
        const parent = { key: parentKey, grade, rank: 1 };
        const base = cost(parentKey, grade, 1);
        return multiplier === 2 ? base : base + cost('attackMultiplier', grade, multiplier - 2, { implementation, parent });
    };

    it.each([
        [MINOR, [10, 20, 40, 70, 110]],
        [MODERATE, [20, 30, 50, 80, 120]],
        [MAJOR, [40, 50, 70, 100, 140]],
    ])('scale %i, 2x-6x', (grade, expected) => {
        expect([2, 3, 4, 5, 6].map((m) => total(grade, m))).toEqual(expected);
    });

    it('Space 8x = 250 (40 base + 210)', () => {
        expect(total(MAJOR, 8)).toBe(250);
        expect(cost('attackMultiplier', MAJOR, 6, { parent: attack(MAJOR) })).toBe(210);
    });

    it('Kinetic: multiplier upgrades cost 10% less, rounded up; the base is not discounted', () => {
        expect(total(MINOR, 2, 'kinetic')).toBe(10);
        expect(total(MINOR, 3, 'kinetic')).toBe(10 + 9);
        expect(total(MINOR, 4, 'kinetic')).toBe(10 + 27);
    });

    it('Melee: everything costs half', () => {
        expect([2, 3, 4, 5, 6].map((m) => total(MINOR, m, 'energy', 'attackMelee'))).toEqual([5, 10, 20, 35, 55]);
    });

    it.each([
        [MINOR, 2, 5],
        [MINOR, 3, 10],
        [MODERATE, 4, 24],
        [MAJOR, 6, 65],
    ])('Kinetic Melee, scale %i at %ix = %i (spec table)', (grade, m, expected) => {
        expect(total(grade, m, 'kinetic', 'attackMelee')).toBe(expected);
    });

    it('extra turrets (mounts) each cost the base again', () => {
        expect(cost('attack', MAJOR, 2)).toBe(80);
        expect(cost('attackMelee', MODERATE, 2)).toBe(20);
    });

    it('Anti-Missile: half the base, per mount', () => {
        expect([MINOR, MODERATE, MAJOR].map((g) => cost('antiMissile', g, 1))).toEqual([5, 10, 20]);
        expect(cost('antiMissile', MAJOR, 2)).toBe(40);
    });
});

describe('Bleed (§5.4)', () => {
    it.each([
        [MINOR, [5, 10, 20, 35]],
        [MODERATE, [10, 15, 25, 40]],
        [MAJOR, [20, 25, 35, 50]],
    ])('magnitude %i, 1-4 damage', (grade, expected) => {
        expect(ranks('bleed', grade, 4)).toEqual(expected);
    });
});

describe('Body Track (§5.5): priced by item size, not grade', () => {
    it.each([
        [SIZE.SMALL, 5],
        [SIZE.MEDIUM, 5],
        [SIZE.LARGE, 10],
        [SIZE.HUGE, 20],
        [SIZE.COLOSSAL, 20],
    ])('size %i costs %i per purchase', (size, each) => {
        expect(cost('body', MAJOR, 3, { size })).toBe(3 * each);
        expect(cost('body', MINOR, 3, { size })).toBe(3 * each); // the grade doesn't matter
    });
    it('Tiny items can\'t buy Body (costs nothing; validation reports it)', () => {
        expect(cost('body', MINOR, 1, { size: SIZE.TINY })).toBe(0);
    });
});

describe('flat per-unit prices', () => {
    it.each([
        ['cargo', [5, 15, 30]],
        ['drive', [10, 25, 50]],
        ['gravityControl', [10, 20, 40]],
        ['hangar', [15, 30, 60]],
        ['lifeSupport', [5, 20, 40]],
        ['link', [5, 15, 50]],
        ['manufacture', [25, 50, 100]],
        ['neuralInterface', [3, 5, 10]],
        ['forceField', [15, 20, 25]],
    ])('%s: Minor / Moderate / Major', (key, expected) => {
        expect([MINOR, MODERATE, MAJOR].map((g) => cost(key, g, 1))).toEqual(expected);
        expect(cost(key, MODERATE, 3)).toBe(3 * expected[1]); // repeatable
    });

    it('Area: 20 flat', () => expect(cost('area', MAJOR, 1)).toBe(20));
    it('Counter: 20 each', () => expect(cost('counter', MINOR, 2)).toBe(40));
    it('Far Ranged: 20 / 40, no Major', () => {
        expect([MINOR, MODERATE, MAJOR].map((g) => cost('farRanged', g, 1))).toEqual([20, 40, 0]);
    });
    it('Modifier: 10 per rank', () => expect(cost('modifier', MINOR, 4)).toBe(40));
    it('Artificial Ecology: 15 / 30 / 60', () => {
        expect([MINOR, MODERATE, MAJOR].map((g) => cost('lifeSupport', g, 1, { implementation: 'artificialEcology' }))).toEqual([15, 30, 60]);
    });
});

describe('Communication (§5.7)', () => {
    it('Radio and Laser Link: 3 / 13', () => {
        for (const implementation of ['radio', 'laserLink']) {
            expect([MINOR, MODERATE].map((g) => cost('communication', g, 1, { implementation }))).toEqual([3, 13]);
        }
    });
    it('Ansible 30, Hypercomms 25', () => {
        expect(cost('communication', MAJOR, 1, { implementation: 'ansible' })).toBe(30);
        expect(cost('communication', MAJOR, 1, { implementation: 'hypercomms' })).toBe(25);
    });
});

describe('Computer (§5.8): rank x price per rank', () => {
    it.each([
        ['standard', [3, 5, 20]],
        ['brain', [5, 10, 40]],
        ['quantum', [20, 40, 80]],
    ])('%s', (implementation, perRank) => {
        expect([MINOR, MODERATE, MAJOR].map((g) => cost('computer', g, 3, { implementation }))).toEqual(perRank.map((p) => 3 * p));
    });
    it('Major rank 3 = 60 (the Redemption example)', () => expect(cost('computer', MAJOR, 3)).toBe(60));
});

describe('Drive and Maneuver (§5.10-5.11, the combined table)', () => {
    it.each([
        [MINOR, [10, 15, 20, 25, 30]],
        [MODERATE, [25, 35, 45, 55, 65]],
        [MAJOR, [50, 70, 90, 110, 130]],
    ])('Drive grade %i with Maneuver 0-4', (grade, expected) => {
        const drive = { key: 'drive', grade, rank: 1 };
        const withManeuver = (r) => cost('drive', grade, 1) + (r ? cost('maneuver', MINOR, r, { parent: drive }) : 0);
        expect([0, 1, 2, 3, 4].map(withManeuver)).toEqual(expected);
    });
    it('Light Sail costs 15', () => expect(cost('drive', MODERATE, 1, { implementation: 'lightSail' })).toBe(15));
});

describe('Launchers (§5.16): bought in increments of 4', () => {
    it('Firefight 20 / Battlefield 40 / Space 60 per increment', () => {
        expect([MINOR, MODERATE, MAJOR].map((g) => cost('launchers', g, 1))).toEqual([20, 40, 60]);
        expect(cost('launchers', MAJOR, 2)).toBe(120);
    });
});

describe('Power Supply (§5.22): per rank', () => {
    it('5 / 10 / 40', () => {
        expect([MINOR, MODERATE, MAJOR].map((g) => cost('powerSupply', g, 2))).toEqual([10, 20, 80]);
    });
});

describe('Regeneration (§5.23)', () => {
    it.each([
        [MINOR, [5, 10, 20, 35, 55]],
        [MODERATE, [10, 15, 25, 40, 60]],
        [MAJOR, [15, 20, 30, 45, 65]],
    ])('grade %i, 1-5 points', (grade, expected) => {
        expect(ranks('regeneration', grade, 5)).toEqual(expected);
    });
});

describe('Resource (§5.24)', () => {
    it.each([
        ['general', [5, 10, 15]],
        ['ammunition', [5, 10, 15]],
        ['fuel', [5, 10, 15]],
        ['magazine', [5, 10, 15]],
        ['charge', [4, 8, 12]],
        ['tangle', [10, 10, 10]],
    ])('%s per rank', (implementation, expected) => {
        expect([MINOR, MODERATE, MAJOR].map((g) => cost('resource', g, 1, { implementation }))).toEqual(expected);
    });
});

describe('Task (§5.26): 2 x TN', () => {
    it('TN 18 = 36; half under a Brain', () => {
        expect(cost('task', MINOR, 18)).toBe(36);
        const brain = { key: 'computer', grade: MINOR, rank: 3, implementation: 'brain' };
        expect(cost('task', MINOR, 18, { parent: brain })).toBe(18);
    });
});
