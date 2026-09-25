import { describe, expect, it } from 'vitest';
import { ATTRIBUTE_RULES, resolveAttributeName } from './index.js';

// Every attribute name in the database (the `attribute` table, after migration 003).
const DATABASE_NAMES = [
    'Area', 'Armor Rating', 'Attack', 'Bleed', 'Body', 'Cargo', 'Communication', 'Computer',
    'Counter', 'Drive', 'Maneuver', 'Far Ranged', 'Force Field', 'Gravity Control', 'Hangar',
    'Launchers', 'Life Support', 'Link', 'Manufacture', 'Modifier', 'Neural Interface',
    'Power Supply', 'Regeneration', 'Resource', 'Task', 'Shrouded Hull',
    'Attack (Melee)', 'Attack Multiplier', 'Anti-Missile', // migration 003
    'Communication (Laser Link)', 'Communication (Radio)', 'Communication (Ansible)',
    'Communication (Hypercomms)',
];

describe('database attribute names -> rules', () => {
    it.each(DATABASE_NAMES)('"%s" has a rule', (name) => {
        const resolved = resolveAttributeName(name);
        expect(resolved).not.toBeNull();
        expect(ATTRIBUTE_RULES[resolved.key]).toBeDefined();
    });

    it('reads the implementation from the name', () => {
        expect(resolveAttributeName('Communication (Laser Link)')).toEqual({ key: 'communication', implementation: 'laserLink' });
        expect(resolveAttributeName('Attack')).toEqual({ key: 'attack', implementation: null });
        expect(resolveAttributeName('Attack (Melee)')).toEqual({ key: 'attackMelee', implementation: null });
        expect(resolveAttributeName('Anti-Missile')).toEqual({ key: 'antiMissile', implementation: null });
        expect(resolveAttributeName('Armor Rating')).toEqual({ key: 'armorRating', implementation: null });
    });

    it('returns null for names it doesn\'t know', () => {
        expect(resolveAttributeName('Warp Core')).toBeNull();
        expect(resolveAttributeName('Attack (Photon)')).toBeNull();
        expect(resolveAttributeName('Attack (Kinetic)')).toBeNull(); // removed by migration 003
    });

    it('every rule\'s allowed sub-rows are real rules', () => {
        for (const [key, rule] of Object.entries(ATTRIBUTE_RULES)) {
            for (const child of rule.children) {
                expect(ATTRIBUTE_RULES[child], `${key} -> ${child}`).toBeDefined();
            }
        }
    });
});
