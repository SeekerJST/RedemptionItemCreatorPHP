import { describe, expect, it } from 'vitest';
import { powerBudget, withRelations } from './index.js';
import { SIZE } from './sizes.js';
import { validateItem } from './validate.js';

const MINOR = 1, MODERATE = 2, MAJOR = 3;

let nextId = 100;
const row = (key, grade = MINOR, rank = 1, extra = {}) =>
    ({ id: nextId++, parentId: null, key, grade, rank, implementation: null, ...extra });
const under = (parent, key, grade = MINOR, rank = 1, extra = {}) => row(key, grade, rank, { parentId: parent.id, ...extra });

/** Validate a list of rule rows (plus optional limits/modifiers) on an item of `size`. */
function check(rows, { size = SIZE.MEDIUM, limits, modifiers } = {}) {
    const related = withRelations(rows);
    return validateItem({ related, size, power: powerBudget(related, size), limits, modifiers });
}
const errors = (issues) => issues.filter((i) => i.severity === 'error').map((i) => i.message);
const warnings = (issues) => issues.filter((i) => i.severity === 'warning').map((i) => i.message);
const expectError = (issues, text) => expect(errors(issues).join('\n')).toContain(text);

describe('validation (§9)', () => {
    it('a clean build has no errors', () => {
        const ps = row('powerSupply', MINOR, 1);
        expect(errors(check([ps, row('forceField', MINOR, 2), row('armorRating', MINOR, 3)]))).toEqual([]);
    });

    it('warns until a size is chosen', () => {
        expect(warnings(check([], { size: null })).join()).toContain('Choose an item size');
    });

    it('rejects a grade the attribute doesn\'t come in', () => {
        expectError(check([row('farRanged', MAJOR)]), "isn't available at Major");
        expectError(check([row('powerSupply', MAJOR), row('launchers', MAJOR)], { size: SIZE.HUGE }), 'Magazine'); // unrelated
    });

    it('checks rank limits', () => {
        expectError(check([row('drive', MINOR), under(row('drive'), 'maneuver', MINOR, 5)]), 'above the maximum of 4');
        expectError(check([row('computer', MINOR, 7)]), 'above the maximum of 6');
    });

    it('an Attack Multiplier has to be a sub-row', () => {
        expectError(check([row('attackMultiplier', MINOR, 2)]), 'has to be a sub-row');
        const attack = row('attack');
        expect(errors(check([attack, under(attack, 'attackMultiplier', MINOR, 2)])).join()).not.toContain('has to be a sub-row');
    });

    it('checks allowed sub-rows and depth', () => {
        const attack = row('attack', MINOR, 1);
        expectError(check([attack, under(attack, 'body')]), "can't be a sub-row of");
        const armor = row('armorRating', MINOR);
        const regen = under(armor, 'regeneration');
        expectError(check([armor, regen, under(regen, 'regeneration')]), 'one level deep');
    });

    it('Melee attacks can never take Area', () => {
        const melee = row('attackMelee');
        expectError(check([melee, under(melee, 'area')]), 'never take Area');
    });

    it('Tse only under Attack (Melee)', () => {
        const attack = row('attack');
        expectError(check([attack, under(attack, 'attackMultiplier', MINOR, 1, { implementation: 'tse' })]), 'Tse is melee only');
        const melee = row('attackMelee');
        expect(errors(check([melee, under(melee, 'attackMultiplier', MINOR, 1, { implementation: 'tse' })]))).toEqual([]);
    });

    it('Kinetic attacks need an ammunition sub-row', () => {
        const attack = row('attack');
        const kinetic = under(attack, 'attackMultiplier', MINOR, 1, { implementation: 'kinetic' });
        expectError(check([attack, kinetic]), 'needs an Ammunition Resource');
        expect(errors(check([attack, kinetic, under(attack, 'resource', MINOR, 2, { implementation: 'ammunition' })]))).toEqual([]);
    });

    it('an energy Attack with no power is flagged, and the rows drawing that power are highlighted', () => {
        const attack = row('attack', MODERATE);
        const issue = check([attack, row('cargo', MODERATE)]).find((i) => i.message.includes('Power Slots'));
        expect(issue.message).toContain('Not enough Moderate Power Slots: 1 needed, 0 available');
        expect(issue.rows).toEqual([{ section: 'attributes', id: attack.id }]);
    });

    it('Tiny items can\'t buy Body', () => {
        expectError(check([row('body')], { size: SIZE.TINY }), "Tiny items can't buy extra Body");
    });

    it('Force Field grade must cover the item\'s size', () => {
        expectError(check([row('forceField', MINOR), row('powerSupply', MINOR)], { size: SIZE.LARGE }), 'only covers items up to Medium');
    });

    it('Power Supply minimum sizes', () => {
        expectError(check([row('powerSupply', MODERATE)], { size: SIZE.SMALL }), 'needs at least a Medium item');
        expectError(check([row('powerSupply', MAJOR)], { size: SIZE.MEDIUM }), 'needs at least a Large item');
    });

    it('Artificial Ecology minimum size', () => {
        expectError(check([row('lifeSupport', MINOR, 1, { implementation: 'artificialEcology' })], { size: SIZE.MEDIUM }), 'needs at least a Large item');
    });

    it('Shrouded Hull only on Space Armor', () => {
        const armor = row('armorRating', MODERATE, 2);
        expectError(check([armor, under(armor, 'shroudedHull', MAJOR)]), 'Space-scale Armor');
    });

    it('Maneuver: needs a Drive, not a Light Sail; warns if not at the largest Drive\'s grade', () => {
        expectError(check([row('maneuver')]), 'has none');
        const sail = row('drive', MODERATE, 1, { implementation: 'lightSail' });
        expectError(check([sail, under(sail, 'maneuver')]), "Light Sail can't take Maneuver");
        const issues = check([row('drive', MAJOR), row('resource', MAJOR, 1, { implementation: 'fuel' }), row('maneuver', MINOR)]);
        expect(warnings(issues).join()).toContain('largest Drive (Major)');
    });

    it('feeds: Launchers need a Magazine, an Ansible needs Tangle, Drives need Fuel', () => {
        expectError(check([row('launchers'), row('powerSupply')]), 'Magazine');
        expectError(check([row('communication', MAJOR, 1, { implementation: 'ansible' })]), 'Tangle');
        expectError(check([row('drive')]), 'Fuel');
        expect(errors(check([row('drive', MODERATE, 1, { implementation: 'lightSail' })], { size: SIZE.LARGE }))).toEqual([]);
    });

    it('Computers: Task TN and the task limit', () => {
        const computer = row('computer', MINOR, 1); // TN 14
        expectError(check([computer, under(computer, 'task', MINOR, 16)]), 'higher than its Computer');
        expectError(check([row('task', MINOR, 14)]), 'need a Computer');
        const small = row('computer', MINOR, 3);
        const tasks = Array.from({ length: 6 }, () => under(small, 'task', MINOR, 14));
        expectError(check([small, ...tasks]), 'at most 5 Tasks');
    });

    it('a Brain warns without Life Support', () => {
        expect(warnings(check([row('computer', MINOR, 1, { implementation: 'brain' })])).join()).toContain('Life Support');
    });

    it('Modifiers: at most +4 to one Skill, added up across rows (one message for all the rows)', () => {
        const a = row('modifier', MINOR, 3);
        const b = row('modifier', MINOR, 2);
        const issues = check([a, b], {
            modifiers: [{ rowId: a.id, skill: 'Gunnery', rank: 3 }, { rowId: b.id, skill: 'Gunnery', rank: 2 }],
        });
        const issue = issues.find((i) => i.message.includes('Gunnery'));
        expect(issue.message).toContain('+5');
        expect(issue.rows.map((r) => r.id)).toEqual([a.id, b.id]);
    });

    it('limitation caps (blank placeholders don\'t count)', () => {
        const limits = [1, 2, 3].map((id) => ({ id, LimitDesc: `L${id}`, LimitScale: '2' }));
        const issue = check([], { limits }).find((i) => i.message.includes('Moderate limitations'));
        expect(issue.rows).toEqual([1, 2, 3].map((id) => ({ section: 'limits', id })));
        expect(check([], { limits: [...limits.slice(0, 2), { id: 9, LimitDesc: '', LimitScale: '2' }] })
            .some((i) => i.message.includes('limitations'))).toBe(false);
    });
});
