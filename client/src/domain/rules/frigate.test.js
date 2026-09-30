// The Redemption-class Frigate as the catalog builds it (docs/equipment_catalog.md, p. 259 with its
// errata): 4 Launchers (one increment), Major Fuel (errata p217: Fuel must reach the Major drive and
// Fusion supply), and Crew Requirement + Restricted Technology. 1,416 BP, CR 10, Major 7 of 9 slots.
// It differs from the book's Workbench exercise (spec §10, pp. 219-221), which the catalog notes.

import { describe, expect, it } from 'vitest';
import { limitCost, tagCost } from '../costs.js';
import { costRating, powerBudget, rowCost, withRelations } from './index.js';
import { SIZE } from './sizes.js';
import { validateItem } from './validate.js';

const MINOR = 1, MODERATE = 2, MAJOR = 3;
const HUGE = { BasePoints: 600, IncrementPoints: 200, BaseCR: 6 };

// [id, key, grade, rank, implementation, parentId, BP the catalog gives for it]
const ATTRIBUTES = [
    [1, 'attack', MAJOR, 2, null, null, 80], // heavy plasma cannon: 2 mounts (+40 for the second)
    [2, 'attackMultiplier', MAJOR, 6, 'plasma', 1, 210], // 8x
    [3, 'counter', null, 1, 'shields', 1, 0], // free with Plasma
    [4, 'bleed', MAJOR, 4, null, 1, 0], // free with Plasma: floor(8 / 2) at Space → Major
    [5, 'antiMissile', MAJOR, 2, null, null, 40],
    [6, 'launchers', MAJOR, 1, null, null, 60], // 4 launchers, one increment
    [7, 'resource', MAJOR, 6, 'magazine', 6, 90],
    [8, 'armorRating', MAJOR, 6, null, null, 230],
    [9, 'body', null, 3, null, null, 60], // Huge: +150 Body → 350
    [10, 'drive', MODERATE, 1, 'reaction', null, 25],
    [11, 'drive', MAJOR, 1, 'gravitic', null, 50],
    [12, 'maneuver', MAJOR, 3, null, 11, 60],
    [13, 'powerSupply', MAJOR, 2, 'fusion', null, 80],
    [14, 'resource', MAJOR, 7, 'fuel', 13, 105], // feeds both drives and the Fusion supply
    [15, 'communication', MODERATE, 1, 'radio', null, 13],
    [16, 'communication', MODERATE, 1, 'laserLink', null, 13],
    [17, 'communication', MAJOR, 1, 'ansible', null, 30],
    [18, 'resource', MAJOR, 5, 'tangle', 17, 50],
    [19, 'computer', MAJOR, 3, null, null, 60],
    [20, 'cargo', MAJOR, 1, null, null, 30],
    [21, 'hangar', MAJOR, 1, null, null, 60],
    [22, 'lifeSupport', MAJOR, 1, null, null, 40],
    [23, 'modifier', MINOR, 2, null, null, 20], // Detection +2
    [24, 'modifier', MINOR, 2, null, null, 20], // Gunnery +2
].map(([id, key, grade, rank, implementation, parentId, catalogBP]) => ({ id, key, grade, rank, implementation, parentId, catalogBP }));

// [Security: High Alert] 3, [All Ahead Full] 3, [Pride of the Fleet] 3, [The One-Two Punch] 2, [Shohan Killer]
const TAGS = [3, 3, 3, 2, 1].map((rank, i) => ({ id: i + 1, TagDesc: `Tag ${i + 1}`, TagRank: String(rank), TagFree: false }));
const LIMITS = [
    { id: 1, LimitDesc: 'Crew Requirement (10 skeleton, 20 full)', LimitScale: '2' },
    { id: 2, LimitDesc: 'Restricted Technology (Property of the Terran Sphere Navy)', LimitScale: '3' },
];

const related = withRelations(ATTRIBUTES);
const costOf = ({ row, parent, children, siblings }) => rowCost(row, { size: SIZE.HUGE, parent, children, siblings });
const sum = (values) => values.reduce((a, b) => a + b, 0);

describe('Redemption-class Frigate', () => {
    it.each(related.map((entry) => [entry.row.id, entry.row.key, entry]))('row %i (%s) costs what the catalog says', (_, __, entry) => {
        expect(costOf(entry)).toBe(entry.row.catalogBP);
    });

    it('tags 60, limitations -70', () => {
        expect(sum(TAGS.map(tagCost))).toBe(60);
        expect(sum(LIMITS.map(limitCost))).toBe(-70);
    });

    const total = sum(related.map(costOf)) + sum(TAGS.map(tagCost)) + sum(LIMITS.map(limitCost));

    it('totals 1,416 BP and CR 10', () => {
        expect(total).toBe(1416);
        expect(costRating(total, HUGE)).toBe(10);
    });

    it('power: Major 7 used of 9 (Plasma 2 × 2, Anti-Missile 2, Launchers 1), Moderate 0 of 3', () => {
        const power = powerBudget(related, SIZE.HUGE);
        expect(power.grades.find((g) => g.grade === MAJOR)).toMatchObject({ available: 9, used: 7, short: 0 });
        expect(power.grades.find((g) => g.grade === MODERATE)).toMatchObject({ available: 3, used: 0 });
        expect(power.ok).toBe(true);
    });

    it('passes validation with no errors or warnings', () => {
        const issues = validateItem({
            related,
            size: SIZE.HUGE,
            power: powerBudget(related, SIZE.HUGE),
            limits: LIMITS,
            modifiers: [{ rowId: 23, skills: ['Detection'], rank: 2 }, { rowId: 24, skills: ['Gunnery'], rank: 2 }],
        });
        expect(issues).toEqual([]);
    });

    it('with Moderate Fuel (as in the book\'s Workbench exercise), the Major drive and supply are flagged', () => {
        const moderateFuel = withRelations(ATTRIBUTES.map((row) => (row.id === 14 ? { ...row, grade: MODERATE } : row)));
        const issues = validateItem({ related: moderateFuel, size: SIZE.HUGE, power: powerBudget(moderateFuel, SIZE.HUGE), limits: LIMITS });
        expect(issues.filter((i) => i.message.includes('its Fuel must be Major')).length).toBe(2);
    });
});
