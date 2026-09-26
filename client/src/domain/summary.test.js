import { describe, expect, it } from 'vitest';
import { createInitialItem } from './item.js';
import { summarizeItem } from './summary.js';

// Just the lookups the summary reads, with the real attribute IDs and names.
const lookups = {
    sizes: [{ ItemSizeID: 4, SizeName: 'LARGE', BasePoints: 300, IncrementPoints: 100, BaseCR: 3, BaseBody: 50 }],
    attributes: [
        { AttributeID: 3, AttributeName: 'Attack' },
        { AttributeID: 40, AttributeName: 'Attack Multiplier' },
        { AttributeID: 41, AttributeName: 'Anti-Missile' },
        { AttributeID: 42, AttributeName: 'Attack (Melee)' },
        { AttributeID: 20, AttributeName: 'Modifier' },
        { AttributeID: 24, AttributeName: 'Resource' },
        { AttributeID: 1, AttributeName: 'Area' },
    ],
    skills: [{ skillName: 'Gunnery' }],
};

const attr = (id, AttributeName, Scale, Rank, extra = {}) =>
    ({ id, parentId: null, AttributeSystem: null, AttributeName, Scale: String(Scale), Rank, Implementation: null, ...extra });

function summarize(attributes, modifierSkills = {}) {
    return summarizeItem({ ...createInitialItem(), size: 'LARGE', attributes, modifierSkills }, lookups);
}

describe('attack summary', () => {
    it('shows a Space Plasma 8x with two mounts: power, free effects, and BP with its sub-rows', () => {
        const { attacks } = summarize(
            [
                attr(1, 3, 3, 2),
                attr(2, 40, 3, 6, { parentId: 1, Implementation: 'plasma' }),
                attr(3, 20, 1, 2, { parentId: 1 }),
            ],
            { 3: 'Gunnery' }
        );
        expect(attacks).toEqual([
            {
                id: 1,
                name: 'Attack',
                scale: 'Space',
                multiplier: 8,
                implementation: 'Plasma',
                mounts: 2,
                feed: '4 Major Power Slots', // Plasma: 2 slots per mount
                extras: ['+2 Gunnery'],
                free: ['Counter (Shields)', 'Bleed 4 (Major)'],
                buildPoints: 2 * 40 + 210 + 20, // two mounts, six multiplier steps, the Modifier
            },
        ]);
    });

    it('an ammo-fed Kinetic attack shows its shots instead of Power Slots', () => {
        const [attack] = summarize([
            attr(1, 3, 1, 1),
            attr(2, 40, 1, 2, { parentId: 1, Implementation: 'kinetic' }),
            attr(3, 24, 1, 3, { parentId: 1, Implementation: 'ammunition' }),
            attr(4, 1, 1, 1, { parentId: 1 }),
        ]).attacks;
        expect(attack).toMatchObject({ multiplier: 4, implementation: 'Kinetic', feed: 'Ammunition: 30 shots', extras: ['Area'] });
        expect(attack.buildPoints).toBe(10 + 27 + 15 + 20); // base, ceil(30 × 0.9), 3 ranks of ammo, Area
    });

    it('melee needs no feed, and Anti-Missile is 1x with no implementation', () => {
        const attacks = summarize([attr(1, 42, 2, 1), attr(2, 41, 3, 1)]).attacks;
        expect(attacks[0]).toMatchObject({ name: 'Attack (Melee)', multiplier: 2, feed: 'None needed (melee)', buildPoints: 10 });
        expect(attacks[1]).toMatchObject({ name: 'Anti-Missile', multiplier: 1, implementation: null, feed: '1 Major Power Slot', buildPoints: 20 });
    });

    it('lists nothing for an item without attacks', () => {
        expect(summarize([attr(1, 20, 1, 1)]).attacks).toEqual([]);
    });
});
