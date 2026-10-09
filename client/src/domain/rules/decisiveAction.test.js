// The rulings added with Decisive Action (2026-10-04 to 10-08): Area by size, 1x attacks, Gravitic
// and Pyre attacks, Grav Blades, Psi-Resonant Materials, Regeneration power, and the optional-source
// switch. The catalog parity test covers the supplement's items; these pin the rules themselves.

import { describe, expect, it } from 'vitest';
import { multiplierCost } from './attacks.js';
import { ATTRIBUTE_RULES, powerBudget, rowCost, sourceEnabled, validateItem, withRelations } from './index.js';
import { regenerationSlotGrade } from './protection.js';

const MINOR = 1, MODERATE = 2, MAJOR = 3;
const FIREFIGHT = 1, BATTLEFIELD = 2, SPACE = 3;

let nextId = 1;
const row = (key, grade, rank = 1, extra = {}) => ({ id: nextId++, parentId: null, key, grade, rank, implementation: null, ...extra });
const under = (parent, key, grade, rank, extra = {}) => row(key, grade, rank, { parentId: parent.id, ...extra });
const costIn = (rows, target) => {
    const entry = withRelations(rows).find((e) => e.row.id === target.id);
    return rowCost(entry.row, { parent: entry.parent, children: entry.children, siblings: entry.siblings });
};
const errorsOf = (rows, extra = {}) =>
    validateItem({ related: withRelations(rows), size: 3, power: powerBudget(withRelations(rows)), ...extra })
        .filter((issue) => issue.severity === 'error')
        .map((issue) => issue.message);

describe('Area: 20 BP per size step (ruling 2026-10-04)', () => {
    it.each([[1, 20], [2, 40], [3, 60], [4, 80], [5, 100]])('%i step(s) cost %i', (steps, bp) => {
        expect(rowCost({ id: 1, key: 'area', grade: 1, rank: steps })).toBe(bp);
    });

    it('a Hyperspace Attack includes the first step free, so Medium costs one step', () => {
        const attack = row('attack', FIREFIGHT, 1);
        const multiplier = under(attack, 'attackMultiplier', FIREFIGHT, 3, { implementation: 'hyperspace' });
        const area = under(attack, 'area', 1, 2);
        expect(costIn([attack, multiplier, area], area)).toBe(20);
    });
});

describe('Attack (1x): no damage, half the Attack base (ruling 2026-10-04)', () => {
    it.each([[FIREFIGHT, 5], [BATTLEFIELD, 10], [SPACE, 20]])('scale %i costs %i', (scale, bp) => {
        expect(rowCost({ id: 1, key: 'attack1x', grade: scale, rank: 1 })).toBe(bp);
    });
});

describe('Gravitic and Pyre attacks (Decisive Action)', () => {
    it('Gravitic is the Attack cost + 5, not halved under Melee', () => {
        expect(multiplierCost(5, 'gravitic', false)).toBe(multiplierCost(5, 'energy', false) + 5);
        expect(multiplierCost(2, 'gravitic', true)).toBe(multiplierCost(2, 'energy', true) + 5);
    });

    it('Pyre is the Attack cost + 70 (Battlefield 5x: 80 + 70)', () => {
        const attack = row('attack', BATTLEFIELD, 1);
        const multiplier = under(attack, 'attackMultiplier', BATTLEFIELD, 3, { implementation: 'pyre' });
        expect(costIn([attack, multiplier], attack) + costIn([attack, multiplier], multiplier)).toBe(80 + 70);
    });

    it('a Gravitic attack must buy Area', () => {
        const attack = row('attack', SPACE, 1);
        const multiplier = under(attack, 'attackMultiplier', SPACE, 5, { implementation: 'gravitic' });
        const supply = row('powerSupply', MAJOR, 1);
        expect(errorsOf([attack, multiplier, supply])).toContain('A Gravitic attack must buy Area.');
        expect(errorsOf([attack, multiplier, under(attack, 'area', 1, 1), supply])).not.toContain('A Gravitic attack must buy Area.');
    });

    it('Pyre is Battlefield only', () => {
        const attack = row('attack', SPACE, 1);
        const multiplier = under(attack, 'attackMultiplier', SPACE, 3, { implementation: 'pyre' });
        expect(errorsOf([attack, multiplier, row('powerSupply', MAJOR, 1)])).toContain('Pyre attacks are Battlefield only.');
    });
});

describe('Grav Blades (Decisive Action p83)', () => {
    it('cost 75 BP, Major only', () => {
        expect(rowCost({ id: 1, key: 'gravBlades', grade: MAJOR, rank: 1 })).toBe(75);
        expect(ATTRIBUTE_RULES.gravBlades.grades).toEqual([MAJOR]);
    });

    it('work as the Gravitic Drive they replace: 3 Major slots, 1 used by their attack', () => {
        const result = powerBudget(withRelations([row('gravBlades', MAJOR, 1)]));
        expect(result.grades.find((g) => g.grade === MAJOR)).toMatchObject({ available: 3, used: 1 });
    });
});

describe('Psi-Resonant Materials (§5.27)', () => {
    it('cost 75 / 150 / 300 and use 2 slots of their grade', () => {
        expect([MINOR, MODERATE, MAJOR].map((g) => rowCost({ id: 1, key: 'psiResonantMaterials', grade: g, rank: 1 }))).toEqual([75, 150, 300]);
        const result = powerBudget(withRelations([row('psiResonantMaterials', MODERATE, 1), row('powerSupply', MODERATE, 1)]));
        expect(result.grades.find((g) => g.grade === MODERATE).used).toBe(2);
    });

    it('need the item to buy Area and a Major Bleed', () => {
        const resonant = row('psiResonantMaterials', MINOR, 1);
        expect(errorsOf([resonant, row('powerSupply', MINOR, 1)])).toContain('Psi-Resonant Materials need the item to buy Area and a Major Bleed.');
    });
});

describe('Regeneration power (rulings 2026-10-05, 2026-10-08)', () => {
    it('Force Field and Mechanical Regeneration use 1 slot each; Biological none', () => {
        const field = row('forceField', MODERATE, 3);
        const rows = [
            field,
            under(field, 'regeneration', MAJOR, 3, { implementation: 'forceField' }),
            row('regeneration', MODERATE, 1, { implementation: 'mechanical' }),
            row('regeneration', MODERATE, 5, { implementation: 'biological' }),
            row('powerSupply', MODERATE, 1),
        ];
        expect(powerBudget(withRelations(rows)).grades.find((g) => g.grade === MODERATE).used).toBe(3); // field 1 + 2 regenerations
    });

    it("the slot's grade: the Force Field's, else the top Attack scale, else the Armor Rating's scale", () => {
        expect(regenerationSlotGrade([row('forceField', MINOR, 1), row('attack', SPACE, 1)])).toBe(MINOR);
        expect(regenerationSlotGrade([row('attack', SPACE, 1), row('armorRating', BATTLEFIELD, 3)])).toBe(MAJOR);
        expect(regenerationSlotGrade([row('armorRating', BATTLEFIELD, 3)])).toBe(MODERATE);
    });

    it('a Weapon Link carrying a self-powered weapon uses no slot', () => {
        const result = powerBudget(withRelations([row('link', MODERATE, 2, { implementation: 'weaponSelfPowered' })]));
        expect(result.grades.every((g) => g.used === 0)).toBe(true);
    });
});

describe('optional sources', () => {
    it('core content is always on; Decisive Action only when switched on', () => {
        expect(sourceEnabled(undefined, {})).toBe(true);
        expect(sourceEnabled('decisiveAction', {})).toBe(false);
        expect(sourceEnabled('decisiveAction', { decisiveAction: true })).toBe(true);
    });

    it('marks the Decisive Action attributes and implementations', () => {
        expect(ATTRIBUTE_RULES.gravBlades.source).toBe('decisiveAction');
        expect(ATTRIBUTE_RULES.attackMultiplier.implementations.gravitic.source).toBe('decisiveAction');
        expect(ATTRIBUTE_RULES.drive.implementations.arboreal.source).toBe('decisiveAction');
        expect(ATTRIBUTE_RULES.attack1x.source).toBeUndefined(); // a core ruling, not the supplement's
    });
});
