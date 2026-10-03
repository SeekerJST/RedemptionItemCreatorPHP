// An item as the corebook prints it (Chapter 11's stat blocks): a name, its description, a box
// with Size / CR / CC, and sections - COMBAT, POWER, CAPABILITIES, EFFECTS, and SOFTWARE for
// programs - of "Label: value" entries. The PDF export (the API's exportitemtopdf) lays this out;
// keeping the wording here keeps the rules in one place.

import { relatedRuleRows } from './ruleRows.js';
import { MULTIPLIER_IMPLEMENTATIONS } from './rules/attacks.js';
import { GRADE_NAMES, SCALE_NAMES } from './rules/common.js';
import { REGENERATION_IMPLEMENTATIONS } from './rules/protection.js';
import {
    COMMUNICATION_IMPLEMENTATIONS,
    COMPUTER_IMPLEMENTATIONS,
    COMPUTER_TASK_LIMIT,
    COUNTER_IMPLEMENTATIONS,
    DRIVE_IMPLEMENTATIONS,
    LAUNCHERS_PER_INCREMENT,
    LIFE_SUPPORT_IMPLEMENTATIONS,
    LINK_IMPLEMENTATIONS,
    POWER_SUPPLY_IMPLEMENTATIONS,
    RESOURCE_TYPES,
    computerTargetNumber,
} from './rules/systems.js';

export const SECTIONS = ['COMBAT', 'POWER', 'CAPABILITIES', 'EFFECTS', 'SOFTWARE'];

const grade = (row) => GRADE_NAMES[row.grade] ?? '';
const scale = (row) => SCALE_NAMES[row.grade] ?? '';
const name = (table, key, fallback = '') => table[key]?.name ?? fallback;
const plural = (word, count) => (count === 1 ? word : `${word}s`);
const list = (items) => items.filter(Boolean).join(', ');

/** A Character Creation cost from a CR (the catalog's rule; implants can differ). */
export const characterCreationCost = (cr) => (cr == null ? null : cr <= 0 ? 0 : (cr * (cr + 1)) / 2);

/** "Strain Threshold" per Power Supply rank, by grade (spec §5.22). */
const STRAIN_PER_RANK = { 1: 5, 2: 10, 3: 20 };

/**
 * Power Slots as the book counts them: per grade the item provides, how many are in use, counting
 * a lower-grade load against the higher-grade slot that powers it ("3 Moderate (1 used)" for a
 * Minor Psi Link on a Moderate Coil). Each load borrows from the nearest higher grade with spare.
 * @param {Array<{grade: number, available: number, used: number}>} grades from powerBudget()
 * @returns {Array<{grade: number, available: number, used: number}>} highest grade first; only grades that provide slots
 */
export function slotsAsPrinted(grades) {
    const byGrade = new Map(grades.map((g) => [g.grade, { ...g }]));
    const shown = new Map([3, 2, 1].filter((g) => (byGrade.get(g)?.available ?? 0) > 0).map((g) => [g, { grade: g, available: byGrade.get(g).available, used: 0 }]));
    for (const g of [3, 2, 1]) {
        let load = byGrade.get(g)?.used ?? 0;
        for (const source of [g, 1 + g, 2 + g].filter((s) => shown.has(s))) {
            const slot = shown.get(source);
            const take = Math.min(load, slot.available - slot.used);
            slot.used += take;
            load -= take;
        }
        if (load > 0 && shown.has(g)) shown.get(g).used += load; // short: shown as over-used
    }
    return [...shown.values()];
}

/** A Resource as the book writes it: "2 Minor Ammunition (20 shots)". */
function resourceText(row) {
    const type = row.implementation ?? 'general';
    const typeName = type === 'general' ? 'Resource' : name(RESOURCE_TYPES, type, 'Resource');
    const amount = {
        ammunition: `${row.rank * 10} shots`,
        magazine: `${row.rank * 10} missiles`,
        fuel: `${row.rank * 10} days/combat rounds`,
        charge: `${row.rank * 10} days/combat rounds`,
        tangle: `${row.rank * 10} days`,
    }[type];
    return `${row.rank} ${grade(row)} ${typeName}${amount ? ` (${amount})` : ''}`;
}

/**
 * An Attack and its sub-rows: "2 Plasma Ranged (Space, Heavy plasma cannon) 8x, Bleed: Major 4".
 * A Counter the implementation includes free (Plasma's Shields) isn't printed, as in the book.
 */
function attackText(entry, systemOf, costOf) {
    const { row, children } = entry;
    const multiplier = children.find((c) => c.key === 'attackMultiplier');
    const kind = multiplier ? name(MULTIPLIER_IMPLEMENTATIONS, multiplier.implementation, 'Energy').replace(' (self-powered)', '') : 'Energy';
    const range = row.key === 'attackMelee' ? 'Melee' : 'Ranged';
    const times = 2 + (multiplier?.rank ?? 0);
    const label = systemOf(row.id);
    const where = label && label !== 'Weapons' ? `${scale(row)}, ${label}` : scale(row);
    const parts = [`${row.rank > 1 ? `${row.rank} ` : ''}${kind} ${range} (${where}) ${times}x`];
    for (const child of children) {
        if (child.key === 'bleed') parts.push(`Bleed: ${grade(child)} ${child.rank}`);
        if (child.key === 'area') parts.push('Area');
        if (child.key === 'farRanged') parts.push(`Far Ranged (${grade(child)})`);
        if (child.key === 'counter' && costOf(child.id) > 0) parts.push(`Counter: ${name(COUNTER_IMPLEMENTATIONS, child.implementation, 'Counter')}`);
        if (child.key === 'resource') parts.push(`Resource: ${resourceText(child)}`);
        if (child.key === 'modifier') parts.push('Modifier');
    }
    return parts.join(', ');
}

/**
 * @param {object} item state from itemReducer
 * @param {object} summary from summarizeItem
 * @param {{attributes: Array}} lookups the reference data (attribute names)
 * @returns {{name, description, category, size, cr, cc, sections: Array<{title, entries: Array<{label, value}>}>}}
 */
export function buildStatBlock(item, summary, lookups) {
    const related = relatedRuleRows(item.attributes, lookups.attributes);
    const top = related.filter((entry) => entry.row.parentId == null);
    const ofKey = (...keys) => top.filter((entry) => keys.includes(entry.row.key));
    const systemOf = (id) => summary.attributeSystems.get(id);
    const costOf = (id) => summary.attributeCosts.get(id)?.buildPoints ?? 0;
    const sections = Object.fromEntries(SECTIONS.map((title) => [title, []]));
    const add = (section, label, value) => {
        if (value != null && value !== '') sections[section].push({ label, value: String(value) });
    };

    // ---- COMBAT ----
    const attacks = ofKey('attack', 'attackMelee');
    const antiMissiles = ofKey('antiMissile');
    const launchers = ofKey('launchers');
    const attackLines = [
        ...attacks.map((entry) => attackText(entry, systemOf, costOf)),
        ...antiMissiles.map(({ row }) => `${row.rank > 1 ? `${row.rank} ` : ''}Anti-Missile (${scale(row)}) 1x`),
        ...launchers.map(({ row, children }) => {
            const magazine = children.find((c) => c.key === 'resource');
            return `${row.rank * LAUNCHERS_PER_INCREMENT} Launchers (${scale(row)})${magazine ? `, Resource: ${resourceText(magazine)}` : ''}`;
        }),
    ];
    if (attackLines.length === 1) add('COMBAT', 'Attack', attackLines[0]);
    for (const line of attackLines.length > 1 ? attackLines : []) add('COMBAT', 'Attacks', line);

    for (const { row, children } of ofKey('armorRating')) {
        const shrouded = children.some((c) => c.key === 'shroudedHull');
        add('COMBAT', 'Armor Rating', `${row.rank} (${scale(row)}${shrouded ? ', Shrouded Hull' : ''})`);
    }
    // Body Track only when bought: the book leaves an item's default Body unprinted.
    if (ofKey('body').length > 0) add('COMBAT', 'Body Track', summary.body);
    const fields = ofKey('forceField');
    if (fields.length > 0) add('COMBAT', plural('Force Field', fields.length), list(fields.map(({ row }) => `${grade(row)} ${row.rank}`)) + ` (track ${summary.forceField})`);
    const regenerations = related.filter(({ row, parent }) => row.key === 'regeneration' && row.implementation !== 'strain' && (parent == null || ['body', 'forceField', 'armorRating'].includes(parent.key)));
    if (regenerations.length > 0) {
        add('COMBAT', 'Regeneration', list(regenerations.map(({ row }) => {
            const kind = row.implementation && row.implementation !== 'general' ? `${name(REGENERATION_IMPLEMENTATIONS, row.implementation)} ` : '';
            return `${kind}${row.rank} (${grade(row)})`;
        })));
    }
    const armorCounters = related.filter(({ row, parent }) => row.key === 'counter' && parent?.key === 'armorRating');
    if (armorCounters.length > 0) add('COMBAT', 'Counter', list(armorCounters.map(({ row }) => name(COUNTER_IMPLEMENTATIONS, row.implementation, 'Counter'))));

    // ---- POWER ----
    const drives = ofKey('drive');
    if (drives.length > 0) {
        add('POWER', plural('Drive', drives.length), list(drives.map(({ row }) => {
            const kind = row.implementation && row.implementation !== 'standard' ? ` ${name(DRIVE_IMPLEMENTATIONS, row.implementation)}` : '';
            return `${row.rank > 1 ? `${row.rank} ` : ''}${grade(row)}${kind}`;
        })));
        const maneuver = related.find(({ row }) => row.key === 'maneuver');
        if (maneuver) add('POWER', 'Maneuver', maneuver.row.rank);
    }
    const supplies = ofKey('powerSupply');
    if (supplies.length > 0) {
        add('POWER', plural('Power Supply', supplies.length).replace('Supplys', 'Supplies'), list(supplies.map(({ row }) => {
            const kind = row.implementation && row.implementation !== 'general' ? ` ${name(POWER_SUPPLY_IMPLEMENTATIONS, row.implementation)}` : '';
            return `${grade(row)}${kind} ${row.rank}`;
        })));
    }
    // Fuel and Charge, wherever they sit (under a Drive or Power Supply, or on their own).
    const feeds = related.filter(({ row, parent }) => row.key === 'resource' && ['fuel', 'charge'].includes(row.implementation) && parent?.key !== 'attack');
    for (const { row } of feeds) add('POWER', 'Resource', resourceText(row));
    const slots = summary.powerSlots.filter((g) => g.available > 0 || g.used > 0);
    const hostPowered = slots.length > 0 && slots.every((g) => g.available === 0);
    if (hostPowered) {
        add('POWER', 'Power Requirement', list(slots.map((g) => `${g.used} ${g.gradeName}`)));
    } else if (slots.length > 0) {
        add('POWER', 'Total Power Slots', list(slotsAsPrinted(slots).map((g) => `${g.available} ${GRADE_NAMES[g.grade]} (${g.used} used)`)));
    }

    // ---- CAPABILITIES ----
    const comms = ofKey('communication');
    if (comms.length > 0) {
        const byGrade = new Map();
        for (const { row, children } of comms) {
            const kind = row.implementation && row.implementation !== 'general' ? name(COMMUNICATION_IMPLEMENTATIONS, row.implementation) : null;
            const tangle = children.find((c) => c.key === 'resource');
            const text = [kind, tangle ? `Resource: ${resourceText(tangle)}` : null].filter(Boolean).join('; ');
            byGrade.set(row.grade, [...(byGrade.get(row.grade) ?? []), text]);
        }
        add('CAPABILITIES', 'Communications', list([...byGrade].map(([g, kinds]) => {
            const named = kinds.filter(Boolean);
            return named.length ? `${GRADE_NAMES[g]} (${named.join(', ')})` : GRADE_NAMES[g];
        })));
    }
    const computers = ofKey('computer');
    for (const { row } of computers) {
        const limit = COMPUTER_TASK_LIMIT[row.grade];
        const kind = row.implementation && row.implementation !== 'standard' ? ` ${name(COMPUTER_IMPLEMENTATIONS, row.implementation)}` : '';
        add('CAPABILITIES', 'Computer', `${grade(row)}${kind} ${row.rank} (${computerTargetNumber(row.rank)} target, ${limit === Infinity ? 'unlimited' : limit} tasks)`);
    }
    const tasks = related.filter(({ row }) => row.key === 'task');
    const taskText = list(tasks.map(({ row }) => `${item.taskNames[row.id] || 'Task'} ${row.rank}`));
    const software = tasks.length > 0 && computers.length === 0;
    if (tasks.length > 0 && !software) add('CAPABILITIES', plural('Task', tasks.length), taskText);
    for (const { row } of ofKey('lifeSupport')) {
        const people = LIFE_SUPPORT_IMPLEMENTATIONS[row.implementation ?? 'standard']?.people?.[row.grade];
        const kind = row.implementation === 'artificialEcology' ? ' Artificial Ecology' : '';
        add('CAPABILITIES', 'Life Support', `${row.rank} ${grade(row)}${kind}${people ? ` (${people * row.rank} ${people * row.rank === 1 ? 'person' : 'people'})` : ''}`);
    }
    const simple = (key, label) => {
        const rows = ofKey(key);
        if (rows.length > 0) add('CAPABILITIES', rows.length > 1 ? `${label}s` : label, list(rows.map(({ row }) => `${row.rank} ${grade(row)}`)));
    };
    simple('cargo', 'Cargo');
    simple('hangar', 'Hangar');
    const links = ofKey('link');
    if (links.length > 0) {
        add('CAPABILITIES', plural('Link', links.length), list(links.map(({ row }) => {
            const kind = row.implementation && row.implementation !== 'general' ? ` ${name(LINK_IMPLEMENTATIONS, row.implementation)}` : '';
            return `${grade(row)}${kind}${row.rank > 1 ? ` ×${row.rank}` : ''}`;
        })));
    }
    simple('manufacture', 'Manufacture');
    simple('neuralInterface', 'Neural Interface');
    simple('gravityControl', 'Gravity Control');
    if (links.some(({ row }) => row.implementation === 'psi')) {
        const threshold = supplies.reduce((sum, { row }) => sum + (STRAIN_PER_RANK[row.grade] ?? 0) * row.rank, 0);
        if (threshold > 0) add('CAPABILITIES', 'Strain Threshold', threshold);
    }

    // ---- SOFTWARE ----
    if (software) {
        const required = { 1: 'Minor', 2: 'Minor', 3: 'Minor', 4: 'Moderate', 5: 'Moderate', 6: 'Major' }[sizeOrdinal(item.size)];
        if (required) add('SOFTWARE', 'Required Computer', required);
        add('SOFTWARE', plural('Task', tasks.length), taskText);
    }

    // ---- EFFECTS ----
    if (summary.modifiers.length > 0) {
        add('EFFECTS', plural('Modifier', summary.modifiers.length), list(summary.modifiers.map((m) => `${m.skill} +${m.Rank}`)));
    }
    const counters = related.filter(({ row, parent }) => row.key === 'counter' && parent == null);
    if (counters.length > 0) add('EFFECTS', plural('Counter', counters.length), list(counters.map(({ row }) => `${name(COUNTER_IMPLEMENTATIONS, row.implementation, 'Counter')}${row.rank > 1 ? ` ×${row.rank}` : ''}`)));
    const strain = related.filter(({ row }) => row.key === 'regeneration' && row.implementation === 'strain');
    if (strain.length > 0) add('EFFECTS', 'Regeneration', list(strain.map(({ row }) => `Strain ${row.rank} (${grade(row)})`)));
    const durations = related.filter(({ row }) => row.key === 'resource' && row.implementation === 'duration');
    for (const { row } of durations) add('EFFECTS', 'Duration', `${row.rank} ${grade(row)}`);
    const tags = item.tags.filter((t) => (t.TagDesc ?? '').trim());
    if (tags.length > 0) {
        add('EFFECTS', plural('Tag', tags.length), list(tags.map((t) => `[${t.TagDesc.trim()}${Number(t.TagRank) > 1 ? ` ${t.TagRank}` : ''}]${t.TagFree ? ' (Free)' : ''}`)));
    }
    const limits = item.limits.filter((l) => (l.LimitDesc ?? '').trim());
    if (limits.length > 0) add('EFFECTS', plural('Limitation', limits.length), list(limits.map((l) => l.LimitDesc.trim())));

    return {
        name: item.name,
        description: item.description,
        category: item.category,
        size: item.size ? item.size[0] + item.size.slice(1).toLowerCase() : '',
        cr: summary.costRating,
        cc: characterCreationCost(summary.costRating),
        sections: SECTIONS.map((title) => ({ title, entries: sections[title] })).filter((s) => s.entries.length > 0),
    };
}

/** 'SMALL' -> 2 (as in rules/sizes.js; kept local so this module stays a leaf). */
function sizeOrdinal(size) {
    return ['', 'TINY', 'SMALL', 'MEDIUM', 'LARGE', 'HUGE', 'COLOSSAL'].indexOf(String(size ?? '').toUpperCase());
}
