import { describe, expect, it } from 'vitest';
import { createInitialItem } from './item.js';
import { summarizeItem } from './summary.js';

const MODIFIER = 20;
const lookups = {
    sizes: [],
    attributes: [{ AttributeID: MODIFIER, AttributeName: 'Modifier' }],
    skills: ['Athletics', 'Firearms', 'Heavy Weapons', 'Melee'].map((skillName, i) => ({ skillID: i + 1, skillName })),
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

    it('Minor: a listed skill, the first one until picked', () => {
        const { modifiers } = summarize([[1, 1], [1, 1, 'Melee'], [1, 1, 'Melee, Heavy Weapons']]);
        expect(modifiers.map((m) => [m.freeText, m.skill])).toEqual([
            [false, 'Athletics'],
            [false, 'Melee'],
            [false, 'Athletics'], // text left over from a Moderate grade isn't a skill
        ]);
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
