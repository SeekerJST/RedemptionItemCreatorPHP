import { describe, expect, it } from 'vitest';
import { powerBudget, withRelations } from './index.js';

const MINOR = 1, MODERATE = 2, MAJOR = 3;

let nextId = 1;
const row = (key, grade, rank = 1, extra = {}) => ({ id: nextId++, parentId: null, key, grade, rank, implementation: null, ...extra });
const budget = (rows) => powerBudget(withRelations(rows));
const grade = (result, g) => result.grades.find((entry) => entry.grade === g);

describe('Power Slots (§5.22)', () => {
    it('a Force Field with no power is short (the "1/0 Moderate" case)', () => {
        const result = budget([row('forceField', MODERATE, 3)]);
        expect(grade(result, MODERATE)).toMatchObject({ available: 0, used: 1, short: 1 });
        expect(result.ok).toBe(false);
    });

    it('a Moderate Power Supply then covers it: 1 of 3 used', () => {
        const result = budget([row('forceField', MODERATE, 3), row('powerSupply', MODERATE, 1)]);
        expect(grade(result, MODERATE)).toMatchObject({ available: 3, used: 1, short: 0 });
        expect(result.ok).toBe(true);
    });

    it('a Major Power Supply can power a Moderate Force Field', () => {
        const result = budget([row('forceField', MODERATE, 3), row('powerSupply', MAJOR, 1)]);
        expect(grade(result, MODERATE)).toMatchObject({ available: 0, used: 1, borrowed: 1, short: 0 });
        expect(result.ok).toBe(true);
    });

    it('never the reverse: Minor slots can\'t power a Moderate load', () => {
        const result = budget([row('forceField', MODERATE, 1), row('powerSupply', MINOR, 5)]);
        expect(grade(result, MODERATE).short).toBe(1);
        expect(result.ok).toBe(false);
    });

    it('one slot powers the whole Force Field track, even across rows of the same grade', () => {
        const result = budget([row('forceField', MINOR, 2), row('forceField', MINOR, 4)]);
        expect(grade(result, MINOR).used).toBe(1);
    });

    it('every Drive also provides 3 slots of its grade', () => {
        expect(grade(budget([row('drive', MAJOR, 1)]), MAJOR).available).toBe(3);
        expect(grade(budget([row('drive', MINOR, 2)]), MINOR).available).toBe(6);
    });

    it('Attacks: 1 slot per mount; Plasma 2; ammo-fed none', () => {
        const attack = row('attack', MAJOR, 2);
        expect(grade(budget([attack]), MAJOR).used).toBe(2);

        const plasma = row('attack', MAJOR, 2);
        const multiplier = row('attackMultiplier', MAJOR, 6, { parentId: plasma.id, implementation: 'plasma' });
        expect(grade(budget([plasma, multiplier]), MAJOR).used).toBe(4);

        const clip = row('attack', MINOR, 1);
        const ammo = row('resource', MINOR, 3, { parentId: clip.id, implementation: 'ammunition' });
        expect(grade(budget([clip, ammo]), MINOR).used).toBe(0);
    });

    it('Kinetic (rail, errata p210): built in needs ammo and a slot; self-powered needs ammo only', () => {
        const kineticAttack = (implementation) => {
            const attack = row('attack', MODERATE, 1);
            return [
                attack,
                row('attackMultiplier', MODERATE, 2, { parentId: attack.id, implementation }),
                row('resource', MODERATE, 4, { parentId: attack.id, implementation: 'ammunition' }),
            ];
        };
        expect(grade(budget(kineticAttack('kinetic')), MODERATE).used).toBe(1); // Tactical Railgun
        expect(grade(budget(kineticAttack('kineticSelfPowered')), MODERATE).used).toBe(0); // gauss rifle
    });

    it('Launchers use 1 slot per increment of 4; Anti-Missile 1 per mount', () => {
        expect(grade(budget([row('launchers', MAJOR, 2)]), MAJOR).used).toBe(2);
        expect(grade(budget([row('antiMissile', MAJOR, 2)]), MAJOR).used).toBe(2);
    });

    it('spare higher-grade slots cascade down through the grades', () => {
        const result = budget([row('powerSupply', MAJOR, 1), row('forceField', MODERATE, 1), row('manufacture', MINOR, 2)]);
        expect(result.ok).toBe(true);
        expect(grade(result, MODERATE).borrowed).toBe(1);
        expect(grade(result, MINOR).borrowed).toBe(2);
    });
});
