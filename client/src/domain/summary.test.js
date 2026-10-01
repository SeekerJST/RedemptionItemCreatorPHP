import { describe, expect, it } from 'vitest';
import { createInitialItem } from './item.js';
import { OTHER_SKILL, summarizeItem } from './summary.js';

const MODIFIER = 20;
const lookups = {
    sizes: [],
    attributes: [{ AttributeID: MODIFIER, AttributeName: 'Modifier' }],
    skills: ['Athletics', 'Engineering', 'Firearms', 'Heavy Weapons', 'Melee'].map((skillName, i) => ({ skillID: i + 1, skillName })),
};

/** An item with one Modifier row per [grade, rank, skill text]. */
function summarize(rows) {
    const item = {
        ...createInitialItem(),
        attributes: rows.map(([grade, rank], i) => ({
            id: i + 1, parentId: null, AttributeSystem: 'Modifiers', AttributeName: MODIFIER, Scale: String(grade), Rank: rank, Implementation: null,
        })),
        modifierSkills: Object.fromEntries(rows.map(([, , text], i) => [i + 1, text]).filter(([, text]) => text !== undefined)),
    };
    return summarizeItem(item, lookups);
}

describe('Modifiers', () => {
    it('cost 10 / 20 / 30 per rank by breadth', () => {
        const { attributeCosts } = summarize([[1, 2], [2, 2], [3, 2]]);
        expect([1, 2, 3].map((id) => attributeCosts.get(id).buildPoints)).toEqual([20, 40, 60]);
    });

    it('Minor: a listed skill (the first one until picked), a skill with a specialty or note, or Other', () => {
        const { modifiers, issues } = summarize([
            [1, 1], [1, 1, 'Melee'], [1, 1, 'Engineering (Starship)'], [1, 1, 'Melee (first response only)'],
            [1, 1, 'Design Software'], [1, 1, ''], [1, 1, 'Engineering'],
        ]);
        expect(modifiers.map((m) => [m.choice, m.detail, m.skills])).toEqual([
            ['Athletics', '', ['Athletics']],
            ['Melee', '', ['Melee']],
            ['Engineering', 'Starship', ['Engineering']],
            ['Melee', 'first response only', ['Melee']], // counts toward Melee's +4
            [OTHER_SKILL, 'Design Software', []],
            [OTHER_SKILL, '', []], // Other picked, nothing typed yet
            ['Engineering', '', ['Engineering']],
        ]);
        expect(issues.map((i) => i.message)).toContain('Engineering needs a specialty, e.g. Engineering (Weapons).');
    });

    it('Moderate/Major: free text, counting the listed skills it names', () => {
        const { modifiers } = summarize([[2, 2, 'melee, Heavy Weapons'], [3, 2, 'Weapons'], [2, 1]]);
        expect(modifiers.map((m) => [m.freeText, m.skill, m.skills])).toEqual([
            [true, 'melee, Heavy Weapons', ['Heavy Weapons', 'Melee']],
            [true, 'Weapons', []],
            [true, '', []],
        ]);
    });

    it('the +4 cap adds up skills named in free text too', () => {
        const { issues } = summarize([[2, 2, 'Melee / Heavy Weapons'], [1, 3, 'Melee']]);
        const messages = issues.filter((i) => i.severity === 'error').map((i) => i.message);
        expect(messages).toEqual(['Modifiers to Melee add up to +5; the most is +4.']);
    });
});

describe('the Plasma Carbine, as the app builds it', () => {
    const ids = { Attack: 1, 'Attack Multiplier': 2, Bleed: 3, Counter: 4, Resource: 5 };
    const carbineLookups = {
        sizes: [{ SizeName: 'SMALL', BasePoints: 50, IncrementPoints: 25, BaseCR: 0 }],
        attributes: Object.entries(ids).map(([AttributeName, AttributeID]) => ({ AttributeID, AttributeName })),
        skills: [],
    };
    const row = (id, name, grade, rank, parentId = null, Implementation = null) => ({
        id, parentId, AttributeSystem: 'Weapons', AttributeName: ids[name], Scale: String(grade), Rank: rank, Implementation,
    });
    const item = {
        ...createInitialItem(),
        size: 'SMALL',
        tags: [{ id: 1, TagDesc: "The Building's on Fire, and It's My Fault", TagRank: '1', TagFree: false }],
        limits: [],
        attributes: [
            row(1, 'Attack', 1, 1),
            row(2, 'Attack Multiplier', 1, 3, 1, 'plasmaSelfPowered'), // 5x
            row(3, 'Bleed', 1, 3, 1), // 2 free + 1 bought
            row(4, 'Counter', 1, 1, 1), // Armor
            row(5, 'Resource', 1, 2, 1, 'ammunition'),
        ],
    };
    const summary = summarizeItem(item, carbineLookups);

    it('costs 115 BP, CR 2, with the Bleed at 10 and no power drawn', () => {
        expect(summary.attributeCosts.get(3).buildPoints).toBe(10);
        expect(summary.totalBP).toBe(115);
        expect(summary.costRating).toBe(2);
        expect(summary.powerSlots).toEqual([]);
    });

    it('counts self-powered Plasma as one Moderate limitation', () => {
        expect(summary.limitCounts.find((c) => c.scaleName === 'Moderate').count).toBe(1);
    });
});
