import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { catalogEntries, catalogItemToState, parseGrade } from './catalog.js';
import { summarizeItem } from './summary.js';

// The real reference data, read from the seed file the database is built from.
const seed = readFileSync(new URL('../../../db/seed.sql', import.meta.url), 'utf8');
function seedRows(table) {
    const block = new RegExp('INSERT INTO `' + table + '` \\(([^)]*)\\) VALUES\\n([\\s\\S]*?);\\n').exec(seed);
    const columns = block[1].split(',').map((c) => c.trim().replace(/`/g, ''));
    return [...block[2].matchAll(/^\s*\((.*)\),?$/gm)].map(([, values]) => {
        const cells = [...values.matchAll(/'((?:[^'\\]|\\.)*)'|(-?\d+)|NULL/g)].map(([, text, number]) =>
            text !== undefined ? text : number !== undefined ? Number(number) : null
        );
        return Object.fromEntries(columns.map((column, i) => [column, cells[i]]));
    });
}
const lookups = { sizes: seedRows('itemsize'), attributes: seedRows('attribute'), skills: seedRows('skills') };

const examples = catalogEntries(JSON.parse(readFileSync(new URL('../../../db/catalog/examples.json', import.meta.url), 'utf8')));
const example = (name) => examples.find((entry) => entry.name === name);

function build(entry) {
    const { state, problems } = catalogItemToState(entry, lookups);
    expect(problems).toEqual([]);
    return { state, summary: summarizeItem(state, lookups) };
}
const errorsOf = (summary) => summary.issues.filter((i) => i.severity === 'error').map((i) => i.message);

describe('catalog entries', () => {
    it('the Powered Armor test build comes out at 280 BP, CR 4, with no rule errors', () => {
        const { state, summary } = build(example('Powered Armor (test build)'));
        expect(summary.totalBP).toBe(280);
        expect(summary.costRating).toBe(4);
        expect(errorsOf(summary)).toEqual([]);
        expect(state.category).toBe('Armor');
        const fuel = state.attributes.find((a) => a.Implementation === 'fuel');
        expect(fuel.parentId).toBe(state.attributes.find((a) => a.Implementation === 'fusion').id);
    });

    it('the Frigate matches the book less its +2 Detection: 1,451 BP, CR 10, no rule errors', () => {
        const { summary } = build(example('Redemption-class Frigate'));
        expect(summary.totalBP).toBe(1471 - 20);
        expect(summary.costRating).toBe(10);
        expect(summary.body).toBe(350);
        expect(errorsOf(summary)).toEqual([]);
        expect(summary.attacks[0]).toMatchObject({ multiplier: 8, implementation: 'Plasma', feed: '4 Major Power Slots' });
    });

    it('takes the file-level category as a default', () => {
        expect(catalogEntries({ category: 'Gear', items: [{ name: 'A' }, { name: 'B', category: 'Armor' }] }).map((e) => e.category))
            .toEqual(['Gear', 'Armor']);
    });

    it('reads grades and combat scales by name or number', () => {
        expect([parseGrade('Moderate'), parseGrade('battlefield'), parseGrade(3), parseGrade('1'), parseGrade(null)]).toEqual([2, 2, 3, 1, null]);
        expect(parseGrade('Huge')).toBeUndefined();
    });

    it('reports every name that doesn\'t resolve, instead of guessing', () => {
        const { state, problems } = catalogItemToState(
            {
                name: 'Broken',
                size: 'Gigantic',
                attributes: [
                    { attribute: 'Lazer', grade: 'Minor' },
                    { attribute: 'Power Supply', grade: 'Minor', implementation: 'Steam' },
                    { attribute: 'Armor Rating', rank: 2 },
                    { attribute: 'Modifier', skill: 'Juggling', rank: 1 },
                    { attribute: 'Drive', grade: 'Minor', subRows: [{ attribute: 'Resource', type: 'Fuel', grade: 'Minor', subRows: [{ attribute: 'Body' }] }] },
                ],
                limitations: [{ name: 'Loud' }],
            },
            lookups
        );
        expect(state).toBeNull();
        expect(problems.join('\n')).toContain('Unknown size "Gigantic"');
        expect(problems.join('\n')).toContain('"Lazer": unknown attribute');
        expect(problems.join('\n')).toContain('unknown type "Steam". Use one of: Fusion, Antimatter, Coil, Environmental, Hyperspace Tap');
        expect(problems.join('\n')).toContain('"Armor Rating": needs a "grade" (Firefight, Battlefield, or Space)');
        expect(problems.join('\n')).toContain('needs a "skill" from the skills list (got "Juggling")');
        expect(problems.join('\n')).toContain('sub-rows can only be one level deep');
        expect(problems.join('\n')).toContain('limitations[0] "Loud": needs a "grade"');
    });
});
