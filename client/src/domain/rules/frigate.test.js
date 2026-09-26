// The Redemption-class Frigate (item_creation_rules.md §10, book pp. 219-221), built with the
// app's attribute model and sub-rows. Launchers are bought in increments of 4 (ruling
// 2026-09-23), so the book's 6 launchers are 2 increments and the total is 1,471 BP
// (the book: 1,441), still CR 10.

import { describe, expect, it } from 'vitest';
import { limitCost, tagCost } from '../costs.js';
import { costRating, powerBudget, rowCost, withRelations } from './index.js';
import { SIZE } from './sizes.js';
import { validateItem } from './validate.js';

const MINOR = 1, MODERATE = 2, MAJOR = 3;
const HUGE = { BasePoints: 600, IncrementPoints: 200, BaseCR: 6 };

// [id, key, grade, rank, implementation, parentId, BP the book gives for it]
const ATTRIBUTES = [
    [1, 'armorRating', MAJOR, 6, null, null, 230],
    [2, 'body', null, 3, null, null, 60], // Huge: +150 Body
    [3, 'lifeSupport', MAJOR, 1, null, null, 40],
    [4, 'hangar', MAJOR, 1, null, null, 60],
    [5, 'cargo', MAJOR, 1, null, null, 30],
    [6, 'communication', MODERATE, 1, 'radio', null, 13],
    [7, 'communication', MODERATE, 1, 'laserLink', null, 13],
    [8, 'communication', MAJOR, 1, 'ansible', null, 30],
    [9, 'resource', MAJOR, 5, 'tangle', 8, 50],
    [10, 'drive', MODERATE, 1, null, null, 25], // Reaction
    [11, 'drive', MAJOR, 1, null, null, 50], // Gravitic
    [12, 'maneuver', MAJOR, 3, null, 11, 60],
    [13, 'resource', MODERATE, 7, 'fuel', 10, 70],
    [14, 'powerSupply', MAJOR, 2, null, null, 80],
    [15, 'attack', MAJOR, 2, null, null, 80], // 2 mounts: the turret + a 2nd gunner
    [16, 'attackMultiplier', MAJOR, 6, 'plasma', 15, 210], // 8x
    [17, 'launchers', MAJOR, 2, null, null, 120], // 2 increments of 4 (book: 6 launchers, 90)
    [18, 'resource', MAJOR, 6, 'magazine', 17, 90],
    [19, 'antiMissile', MAJOR, 2, null, null, 40],
    [20, 'modifier', null, 2, null, null, 20], // +2 Gunnery
    [21, 'modifier', null, 2, null, null, 20], // +2 Detection
    [22, 'computer', MAJOR, 3, null, null, 60],
].map(([id, key, grade, rank, implementation, parentId, bookBP]) => ({ id, key, grade, rank, implementation, parentId, bookBP }));

const TAGS = [3, 3, 3, 2, 1].map((rank, i) => ({ id: i + 1, TagDesc: `Tag ${i + 1}`, TagRank: String(rank), TagFree: false }));
const LIMITS = [
    { id: 1, LimitDesc: 'Property of the Terran Sphere', LimitScale: '2' },
    { id: 2, LimitDesc: 'Crew Complement', LimitScale: '2' },
];

const related = withRelations(ATTRIBUTES);
const costOf = ({ row, parent, children }) => rowCost(row, { size: SIZE.HUGE, parent, children });
const sum = (values) => values.reduce((a, b) => a + b, 0);

describe('Redemption-class Frigate', () => {
    it.each(related.map((entry) => [entry.row.id, entry.row.key, entry]))('row %i (%s) costs what the book says', (_, __, entry) => {
        expect(costOf(entry)).toBe(entry.row.bookBP);
    });

    it('tags 60, limitations -40', () => {
        expect(sum(TAGS.map(tagCost))).toBe(60);
        expect(sum(LIMITS.map(limitCost))).toBe(-40);
    });

    const total = sum(related.map(costOf)) + sum(TAGS.map(tagCost)) + sum(LIMITS.map(limitCost));

    it('totals 1,471 BP and CR 10', () => {
        expect(total).toBe(1471);
        expect(costRating(total, HUGE)).toBe(10);
    });

    it('reaches the book\'s first checkpoint: 811 BP (CR 7) after the Power Supply', () => {
        const upToPowerSupply = sum(related.filter(({ row }) => row.id <= 14).map(costOf));
        expect(upToPowerSupply).toBe(811);
        expect(costRating(upToPowerSupply, HUGE)).toBe(7);
    });

    it('power: Major 8 used of 9, Moderate 0 of 3', () => {
        const power = powerBudget(related, SIZE.HUGE);
        expect(power.grades.find((g) => g.grade === MAJOR)).toMatchObject({ available: 9, used: 8, short: 0 });
        expect(power.grades.find((g) => g.grade === MODERATE)).toMatchObject({ available: 3, used: 0 });
        expect(power.ok).toBe(true);
    });

    it('passes validation with no errors or warnings', () => {
        const issues = validateItem({
            related,
            size: SIZE.HUGE,
            power: powerBudget(related, SIZE.HUGE),
            limits: LIMITS,
            modifiers: [{ rowId: 20, skill: 'Gunnery', rank: 2 }, { rowId: 21, skill: 'Detection', rank: 2 }],
        });
        expect(issues).toEqual([]);
    });
});
