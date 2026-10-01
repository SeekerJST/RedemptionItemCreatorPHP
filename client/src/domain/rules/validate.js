// Validation (item_creation_rules.md §9), minus faction/tech-base checks: the rules are used
// for other settings too, so Shohan-only tech is a table discussion, not an app error.
//
// Errors are builds the rules forbid; warnings are legal but worth a look. Neither blocks
// anything: the player decides.

import { MULTIPLIER_IMPLEMENTATIONS, impliedLimitations } from './attacks.js';
import { ATTRIBUTE_RULES } from './registry.js';
import { GRADE_NAMES, SCALE_NAMES } from './common.js';
import { FORCE_FIELD } from './protection.js';
import {
    COMPUTER_TASK_LIMIT,
    DRIVE_IMPLEMENTATIONS,
    LIFE_SUPPORT_IMPLEMENTATIONS,
    POWER_SUPPLY_IMPLEMENTATIONS,
    computerTargetNumber,
    powerSupplyMinSize,
} from './systems.js';
import { SIZE, bodyPurchase, sizeName } from './sizes.js';

export const MAX_MODIFIER_PER_SKILL = 4;
export const LIMIT_CAPS = { 1: 3, 2: 2, 3: 1 };
const LIMIT_GRADE_NAMES = { 1: 'Minor', 2: 'Moderate', 3: 'Major' };

/**
 * @param {object} input
 * @param {Array<{row, parent, children}>} input.related attribute rule rows (withRelations)
 * @param {number|null} input.size item size ordinal
 * @param {{grades: Array, ok: boolean}} input.power from powerBudget()
 * @param {Array<{id, LimitDesc, LimitScale}>} input.limits
 * @param {Array<{rowId: number, skills: string[], rank: number}>} input.modifiers the skills each Modifier row
 *        adds to (a class like "Weapons" names no single skill, so it adds to none)
 * @param {(rowId: number) => string} input.nameOf display name for an attribute row
 * @returns {Array<{severity: 'error'|'warning', message: string, rows: Array<{section: string, id: number}>}>}
 *          rows: the grid rows the issue is about (to highlight), possibly none
 */
export function validateItem({ related, size, power, limits = [], modifiers = [], nameOf }) {
    const issues = [];
    /** rowIds: one id or an array; they're attribute rows unless another section is given. */
    const add = (severity) => (message, rowIds = [], section = 'attributes') =>
        issues.push({ severity, message, rows: [].concat(rowIds).filter((id) => id != null).map((id) => ({ section, id })) });
    const error = add('error');
    const warning = add('warning');

    const name = (row) => nameOf?.(row.id) ?? ATTRIBUTE_RULES[row.key]?.name ?? 'This attribute';
    const all = related.map((entry) => entry.row);
    const has = (predicate) => all.some(predicate);
    const hasResource = (...types) =>
        has((row) => row.key === 'resource' && types.includes(row.implementation ?? 'general'));

    if (size == null) {
        warning('Choose an item size: the budget, Cost Rating, and Body depend on it.');
    }

    for (const { row, parent, children } of related) {
        const rule = ATTRIBUTE_RULES[row.key];
        if (!rule) {
            error(`${name(row)}: this attribute isn't in the rules, so it's costed at 0.`, row.id);
            continue;
        }
        const implementation = row.implementation ?? rule.defaultImplementation ?? null;
        const gradeLabel = (grade) => (rule.gradeKind === 'scale' ? SCALE_NAMES : GRADE_NAMES)[grade] ?? '?';

        // ---- structure: grades, ranks, sub-rows ------------------------------------------
        if (rule.gradeKind !== 'none' && !rule.grades.includes(row.grade)) {
            error(`${name(row)} isn't available at ${gradeLabel(row.grade)}.`, row.id);
        }
        if (row.rank < rule.rank.min) {
            error(`${name(row)}: ${row.rank} is below the minimum of ${rule.rank.min}.`, row.id);
        }
        if (rule.rank.max != null && row.rank > rule.rank.max) {
            error(`${name(row)}: ${row.rank} is above the maximum of ${rule.rank.max}.`, row.id);
        }
        if (rule.subRowOnly && !parent) {
            error(`${name(row)} has to be a sub-row (e.g. of an Attack).`, row.id);
        }
        if (parent) {
            if (parent.parentId != null) {
                error(`${name(row)}: sub-rows can only be one level deep.`, row.id);
            } else if (!(ATTRIBUTE_RULES[parent.key]?.children ?? []).includes(row.key)) {
                error(`${name(row)} can't be a sub-row of ${name(parent)}.`, row.id);
            }
        }

        // ---- attribute-specific rules ------------------------------------------------------
        if (row.key === 'area' && parent?.key === 'attackMelee') {
            error('Melee attacks can never take Area.', row.id);
        }

        if (row.key === 'attackMultiplier' && implementation === 'tse' && parent && parent.key !== 'attackMelee') {
            error('Tse is melee only: put it under an Attack (Melee).', row.id);
        }

        const isKinetic =
            ['attack', 'attackMelee'].includes(row.key) &&
            children.some((c) => c.key === 'attackMultiplier' && MULTIPLIER_IMPLEMENTATIONS[c.implementation]?.needsAmmunition);
        // Resources can be shared: a weapon's modes, or a vehicle's guns, can draw on one Ammunition row.
        if (isKinetic && !hasResource('ammunition', 'general')) {
            const fed = children.find((c) => c.key === 'attackMultiplier' && MULTIPLIER_IMPLEMENTATIONS[c.implementation]?.needsAmmunition);
            error(`${name(row)} is ${MULTIPLIER_IMPLEMENTATIONS[fed.implementation].name}: it needs an Ammunition Resource.`, row.id);
        }

        if (row.key === 'body' && size != null && !bodyPurchase(size)) {
            error('Tiny items can\'t buy extra Body.', row.id);
        }

        if (row.key === 'forceField' && size != null && size > (FORCE_FIELD.maxItemSize[row.grade] ?? 0)) {
            error(
                `A ${GRADE_NAMES[row.grade]} Force Field only covers items up to ${sizeName(FORCE_FIELD.maxItemSize[row.grade])}.`,
                row.id
            );
        }

        const supplyMin = row.key === 'powerSupply' ? powerSupplyMinSize(row.grade, implementation) : 0;
        if (row.key === 'powerSupply' && size != null && size < supplyMin) {
            const kind = POWER_SUPPLY_IMPLEMENTATIONS[implementation]?.compactMajor ? `${GRADE_NAMES[row.grade]} ${POWER_SUPPLY_IMPLEMENTATIONS[implementation].name}` : `${GRADE_NAMES[row.grade]} Power Supply`;
            error(`A ${kind} needs at least a ${sizeName(supplyMin)} item.`, row.id);
        }

        const underForceField = row.key === 'regeneration' && parent?.key === 'forceField';
        if (row.key === 'regeneration' && implementation === 'forceField' && parent && !underForceField) {
            error('Force Field Regeneration goes under a Force Field.', row.id);
        }
        if (row.key === 'regeneration' && (underForceField || implementation === 'forceField') && row.grade !== 3) {
            error('Force Field Regeneration is always Major.', row.id);
        }

        const ecologyMin = LIFE_SUPPORT_IMPLEMENTATIONS.artificialEcology.minItemSize[row.grade];
        if (row.key === 'lifeSupport' && implementation === 'artificialEcology' && size != null && size < ecologyMin) {
            error(`${GRADE_NAMES[row.grade]} Artificial Ecology needs at least a ${sizeName(ecologyMin)} item.`, row.id);
        }

        if (row.key === 'shroudedHull' && parent?.key === 'armorRating' && parent.grade !== 3) {
            error('Shrouded Hull only goes on Space-scale Armor.', row.id);
        }

        if (row.key === 'maneuver') {
            const drives = all.filter((other) => other.key === 'drive');
            if (parent?.key === 'drive') {
                if (DRIVE_IMPLEMENTATIONS[parent.implementation]?.noManeuver) {
                    error('A Light Sail can\'t take Maneuver.', row.id);
                }
            } else if (drives.length === 0) {
                error('Maneuver applies to a Drive, and this item has none.', row.id);
            } else {
                const highest = Math.max(...drives.map((d) => d.grade ?? 0));
                if (row.grade !== highest) {
                    warning(`Maneuver should be bought at the grade of the largest Drive (${GRADE_NAMES[highest]}).`, row.id);
                }
            }
        }

        if (row.key === 'computer' && implementation === 'brain' && !has((other) => other.key === 'lifeSupport')) {
            warning('A Brain needs a biological item or Life Support.', row.id);
        }

        if (row.key === 'computer') {
            const tasks = children.filter((c) => c.key === 'task');
            const limit = COMPUTER_TASK_LIMIT[row.grade] ?? Infinity;
            if (tasks.length > limit) {
                error(`A ${GRADE_NAMES[row.grade]} Computer runs at most ${limit} Tasks; this one has ${tasks.length}.`, row.id);
            }
        }

        if (row.key === 'task') {
            const computers = parent?.key === 'computer' ? [parent] : all.filter((other) => other.key === 'computer');
            const bestTN = Math.max(0, ...computers.map((c) => computerTargetNumber(c.rank)));
            // Without a Computer of its own, the item is software (checked below, item-wide).
            if (computers.length > 0 && row.rank > bestTN) {
                error(`Task TN ${row.rank} is higher than its Computer's TN ${bestTN}.`, row.id);
            }
        }
    }

    // ---- software: Tasks and no Computer (§9 #23). It runs on another item's Computer, whose
    // grade the program's size sets; Tiny-Medium programs carry at most 2 Tasks. -----------------
    const tasks = all.filter((row) => row.key === 'task');
    if (tasks.length > 0 && !has((row) => row.key === 'computer')) {
        const grade = size == null ? null : size <= SIZE.MEDIUM ? 1 : size <= SIZE.HUGE ? 2 : 3;
        warning(grade ? `Requires a ${GRADE_NAMES[grade]} Computer to run.` : 'Requires a Computer to run.', tasks.map((t) => t.id));
        if (size != null && size <= SIZE.MEDIUM && tasks.length > 2) {
            error(`A Tiny, Small, or Medium program carries at most 2 Tasks; this one has ${tasks.length}.`, tasks.map((t) => t.id));
        }
    }

    // ---- item-level feeds (Resources can be shared, so any on the item counts) --------------
    const firstOf = (key) => all.find((row) => row.key === key);
    if (firstOf('launchers') && !hasResource('magazine', 'general')) {
        error('Launchers need a Magazine Resource.', firstOf('launchers').id);
    }
    const ansible = all.find((row) => row.key === 'communication' && row.implementation === 'ansible');
    if (ansible && !hasResource('tangle', 'general')) {
        error('An Ansible needs a Tangle Resource.', ansible.id);
    }
    // Fuel feeds Drives and Power Supplies of its own grade or lower (errata p217), so the best
    // Fuel on the item has to reach each consumer's grade.
    // A Drive needs no Fuel if it can run from a Power Supply that burns none (Coil, Environmental,
    // Hyperspace Tap), or if its type needs none (Light Sail, Jump, Biological).
    const drivesRunOnSupply = has((row) => row.key === 'powerSupply' && POWER_SUPPLY_IMPLEMENTATIONS[row.implementation]?.runsDrives);
    const needsFuel = (row) => row.key === 'drive' && !drivesRunOnSupply && !DRIVE_IMPLEMENTATIONS[row.implementation]?.noFuel;
    const fuelled = all.find(needsFuel);
    if (fuelled && !hasResource('fuel', 'general')) {
        error('Drives need a Fuel Resource (unless it\'s a Light Sail, Jump, or Biological drive, or runs from a Coil, Environmental, or Hyperspace Tap Power Supply).', fuelled.id);
    }
    const supplyFeed = (row) => (row.key === 'powerSupply' ? POWER_SUPPLY_IMPLEMENTATIONS[row.implementation]?.feed : null);
    for (const supply of all.filter((row) => supplyFeed(row))) {
        const feed = supplyFeed(supply);
        if (!hasResource(feed, 'general')) {
            const needs = feed === 'charge' ? 'a Charge Resource' : 'a Fuel Resource';
            error(`A ${POWER_SUPPLY_IMPLEMENTATIONS[supply.implementation].name} Power Supply needs ${needs}.`, supply.id);
        }
    }
    const fuelRows = all.filter((row) => row.key === 'resource' && row.implementation === 'fuel');
    if (fuelRows.length > 0) {
        const bestFuel = Math.max(...fuelRows.map((row) => row.grade ?? 0));
        const consumers = all.filter((row) => needsFuel(row) || supplyFeed(row) === 'fuel');
        for (const consumer of consumers.filter((row) => (row.grade ?? 0) > bestFuel)) {
            error(
                `${name(consumer)} is ${GRADE_NAMES[consumer.grade]}: its Fuel must be ${GRADE_NAMES[consumer.grade]} or higher, and the best Fuel here is ${GRADE_NAMES[bestFuel]}.`,
                [consumer.id, ...fuelRows.map((row) => row.id)]
            );
        }
    }

    // ---- power -----------------------------------------------------------------------------
    // An item with no Power Supply or Drive of its own (a gun module, a G3P) draws on its host:
    // its load is a note, not a shortfall (ruling 2026-09-30).
    const hostPowered = (power?.grades ?? []).every((g) => g.available === 0);
    for (const { grade, available, used, borrowed, short } of power?.grades ?? []) {
        if (hostPowered) {
            if (used > 0) {
                warning(`Draws ${used} ${GRADE_NAMES[grade]} Power Slot${used === 1 ? '' : 's'} from its host (it has no Power Supply or Drive of its own).`);
            }
            continue;
        }
        if (short > 0) {
            // Highlight the rows drawing on this grade, so it's clear what needs the power.
            const consumers = related
                .filter(({ row, parent, children }) => {
                    const rule = ATTRIBUTE_RULES[row.key];
                    if (!rule?.power) return false;
                    const implementation = row.implementation ?? rule.defaultImplementation ?? null;
                    const { uses = [] } = rule.power({ ...row, implementation }, { size, parent, children });
                    return uses.some((use) => use.grade === grade && use.slots > 0);
                })
                .map(({ row }) => row.id);
            error(`Not enough ${GRADE_NAMES[grade]} Power Slots: ${used} needed, ${available + borrowed} available.`, consumers);
        }
    }

    // ---- modifiers: at most +4 to any one Skill -------------------------------------------
    for (const { rowId, specialtyMissing } of modifiers) {
        if (specialtyMissing) {
            warning(`${specialtyMissing} needs a specialty, e.g. ${specialtyMissing} (Weapons).`, rowId);
        }
    }
    const bySkill = new Map();
    for (const { rowId, skills, rank } of modifiers) {
        for (const skill of skills) {
            const entry = bySkill.get(skill) ?? { total: 0, rowIds: [] };
            entry.total += rank;
            entry.rowIds.push(rowId);
            bySkill.set(skill, entry);
        }
    }
    for (const [skill, { total, rowIds }] of bySkill) {
        if (total > MAX_MODIFIER_PER_SKILL) {
            error(`Modifiers to ${skill} add up to +${total}; the most is +${MAX_MODIFIER_PER_SKILL}.`, rowIds);
        }
    }

    // ---- limitation caps (built-in limitations, e.g. self-powered Plasma, count too) ----------
    const implied = impliedLimitations(all);
    for (const grade of [1, 2, 3]) {
        const taken = limits.filter((l) => (l.LimitDesc ?? '').trim() !== '' && String(l.LimitScale) === String(grade));
        const builtIn = implied.filter((l) => l.grade === grade);
        const count = taken.length + builtIn.length;
        if (count > LIMIT_CAPS[grade]) {
            issues.push({
                severity: 'error',
                message:
                    `Too many ${LIMIT_GRADE_NAMES[grade]} limitations: ${count}, and at most ${LIMIT_CAPS[grade]} are allowed.` +
                    (builtIn.length ? ` (${builtIn.map((l) => l.name).join(', ')} counts as one.)` : ''),
                rows: [
                    ...taken.map((limit) => ({ section: 'limits', id: limit.id })),
                    ...builtIn.map((l) => ({ section: 'attributes', id: l.rowId })),
                ],
            });
        }
    }

    return issues;
}
