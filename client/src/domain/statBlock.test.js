import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { catalogItem, catalogLookups } from './catalog.js';
import { buildStatBlock, characterCreationCost } from './statBlock.js';
import { summarizeItem } from './summary.js';

const catalog = JSON.parse(readFileSync(new URL('../../../db/seed/catalog.json', import.meta.url), 'utf-8'));

/** The stat block of a catalog item, as { section: { label: [values] } } plus the header. */
function statBlockOf(name) {
    const item = catalogItem(catalog.items.find((entry) => entry.itemName === name));
    const block = buildStatBlock(item, summarizeItem(item, catalogLookups), catalogLookups);
    const sections = Object.fromEntries(block.sections.map((s) => [s.title, s.entries.reduce((all, { label, value }) => ({ ...all, [label]: [...(all[label] ?? []), value] }), {})]));
    return { ...block, sections };
}

describe('stat blocks, as the book prints them', () => {
    it('Plasma Carbine: one attack line with its sub-rows; the free Counter (Shields) and default Body unprinted', () => {
        const block = statBlockOf('Plasma Carbine');
        expect(block).toMatchObject({ name: 'Plasma Carbine', category: 'Weapons: Firearms', size: 'Small', cr: 2, cc: 3 });
        expect(block.description).toContain('anti-Shohan plasma arms');
        expect(block.sections.COMBAT).toEqual({
            Attack: ['Plasma Ranged (Firefight) 5x, Bleed: Minor 3, Counter: Armor, Resource: 2 Minor Ammunition (20 shots)'],
        });
        expect(block.sections.EFFECTS).toEqual({ Tag: ["[The Building's on Fire, and It's My Fault]"] });
    });

    it('Redemption-class Frigate: every section, worded like p259', () => {
        const { sections } = statBlockOf('Redemption-class Frigate');
        expect(sections.COMBAT).toEqual({
            Attacks: [
                '2 Plasma Ranged (Space, Heavy plasma cannon) 8x, Bleed: Major 4',
                '2 Anti-Missile (Space) 1x',
                '4 Launchers (Space), Resource: 6 Major Magazine (60 missiles)',
            ],
            'Armor Rating': ['6 (Space)'],
            'Body Track': ['350'],
        });
        expect(sections.POWER).toEqual({
            Drives: ['Moderate Reaction, Major Gravitic'],
            Maneuver: ['3'],
            'Power Supply': ['Major Fusion 2'],
            Resource: ['7 Major Fuel (70 days/combat rounds)'],
            'Total Power Slots': ['9 Major (7 used), 3 Moderate (0 used)'],
        });
        expect(sections.CAPABILITIES).toMatchObject({
            Communications: ['Moderate (Radio, Laser Link), Major (Ansible; Resource: 5 Major Tangle (50 days))'],
            Computer: ['Major 3 (18 target, unlimited tasks)'],
            Cargo: ['1 Major'],
            Hangar: ['1 Major'],
            'Life Support': ['1 Major (100 people)'],
        });
        expect(sections.EFFECTS.Modifiers).toEqual(['Detection +2, Gunnery +2']);
        expect(sections.EFFECTS.Tags[0]).toContain('[Security: High Alert 3]');
    });

    it('programs get a SOFTWARE section: the Computer they need, and their Tasks', () => {
        const { sections } = statBlockOf('Basic Security Software');
        expect(sections.SOFTWARE).toEqual({ 'Required Computer': ['Minor'], Task: ['Intrusion Detection 15'] });
        expect(sections.COMBAT).toBeUndefined();
    });

    it('host-powered gear lists its Power Requirement; psionic gear its Strain Threshold', () => {
        expect(statBlockOf('Light Plasma Cannon').sections.POWER).toMatchObject({ 'Power Requirement': ['2 Moderate'] });
        expect(statBlockOf('Psionic Light Armor').sections.CAPABILITIES).toMatchObject({ Link: ['Minor Psi'], 'Strain Threshold': ['5'] });
    });

    it('every catalog item builds, and only into the book\'s sections', () => {
        for (const entry of catalog.items) {
            const block = statBlockOf(entry.itemName);
            for (const title of Object.keys(block.sections)) {
                expect(['COMBAT', 'POWER', 'CAPABILITIES', 'EFFECTS', 'SOFTWARE']).toContain(title);
            }
            expect(block.name).toBe(entry.itemName);
        }
    });

    it('CC follows CR as the catalog does: 0 at CR 0 or less, else CR × (CR + 1) / 2', () => {
        expect([-1, 0, 1, 4, 10].map(characterCreationCost)).toEqual([0, 0, 1, 10, 55]);
    });
});
