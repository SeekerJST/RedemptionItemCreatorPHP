// Everything the Build Point Summary panel shows, derived from the item state.
// Pure: same item + lookups in, same summary out. Nothing is stored twice.
// The rules themselves live in domain/rules; this module applies them to the item.

import { UNASSIGNED_SYSTEM } from './constants.js';
import { limitCost, tagCost } from './costs.js';
import { relatedRuleRows } from './ruleRows.js';
import {
    ATTRIBUTE_RULES,
    GRADE_NAMES,
    costRating,
    gradeLabel,
    powerBudget,
    rowCost,
    rowPower,
    validateItem,
} from './rules/index.js';
import { FORCE_FIELD } from './rules/protection.js';
import { bodyPurchase, sizeOrdinal } from './rules/sizes.js';
import { LIMIT_CAPS } from './rules/validate.js';

const sum = (values) => values.reduce((total, value) => total + value, 0);

/**
 * @param {object} item state from itemReducer
 * @param {object} lookups from useLookups
 */
export function summarizeItem(item, lookups) {
    const sizeRow = lookups.sizes.find((s) => s.SizeName === item.size) ?? null;
    const size = sizeOrdinal(item.size);
    const related = relatedRuleRows(item.attributes, lookups.attributes);
    const relatedById = new Map(related.map((entry) => [entry.row.id, entry]));

    const nameById = new Map(
        item.attributes.map((a) => [a.id, lookups.attributes.find((l) => l.AttributeID === a.AttributeName)?.AttributeName ?? '?'])
    );

    // Per-row cost and power. Costs round to the nearest whole number, halves up.
    const attributeCosts = new Map(
        related.map((entry) => [
            entry.row.id,
            {
                buildPoints: Math.round(rowCost(entry.row, { size, parent: entry.parent, children: entry.children })),
                power: rowPower(entry, size),
            },
        ])
    );
    const tagCosts = new Map(item.tags.map((tag) => [tag.id, tagCost(tag)]));
    const limitCosts = new Map(item.limits.map((limit) => [limit.id, limitCost(limit)]));

    const tagBP = sum([...tagCosts.values()]);
    const limitBP = sum([...limitCosts.values()]);
    const attributeBP = sum([...attributeCosts.values()].map((cost) => cost.buildPoints));
    const totalBP = tagBP + attributeBP + limitBP;

    const power = powerBudget(related, size);
    const byKey = (key) => item.attributes.filter((a) => relatedById.get(a.id)?.row.key === key);
    const modifiers = byKey('modifier');
    const defaultSkill = lookups.skills[0]?.skillName ?? '';

    const issues = validateItem({
        related,
        size,
        power,
        limits: item.limits,
        modifiers: modifiers.map((row) => ({
            rowId: row.id,
            skill: item.modifierSkills[row.id] ?? defaultSkill,
            rank: Number(row.Rank) || 0,
        })),
        nameOf: (id) => nameById.get(id),
    });

    const attributeSystems = effectiveSystems(item.attributes);

    return {
        basePoints: sizeRow?.BasePoints ?? 0,
        incrementPoints: sizeRow?.IncrementPoints ?? 0,
        baseCR: sizeRow?.BaseCR ?? 0,
        tagBP,
        attributeBP,
        limitBP,
        totalBP,
        costRating: costRating(totalBP, sizeRow), // null until a size is chosen
        tagCosts,
        attributeCosts,
        limitCosts,
        /** Each attribute row's rule key (null if the rules don't know it), e.g. for the editor. */
        ruleKeys: new Map(related.map(({ row }) => [row.id, row.key])),
        ...structure(related, sizeRow, size),
        powerSlots: power.grades
            .filter((g) => g.available > 0 || g.used > 0)
            .map((g) => ({ ...g, gradeName: GRADE_NAMES[g.grade] })),
        attributeSystems,
        systems: systemBreakdown(item.attributes, relatedById, attributeSystems, nameById),
        modifiers,
        tasks: byKey('task'),
        limitCounts: [1, 2, 3].map((grade) => ({
            scaleName: GRADE_NAMES[grade],
            count: item.limits.filter((l) => limitCost(l) !== 0 && String(l.LimitScale) === String(grade)).length,
            cap: LIMIT_CAPS[grade],
        })),
        issues,
        rowStatus: rowStatus(issues),
        defaultSkill,
    };
}

/**
 * Body, Armor, and Force Fields.
 * Body and Force Field purchases add up across rows; for Armor, the last row wins.
 */
function structure(related, sizeRow, size) {
    let body = sizeRow?.BaseBody ?? 0;
    let armor = { rank: 0, type: null };
    let forceField = 0;

    for (const { row } of related) {
        switch (row.key) {
            case 'body':
                body += (bodyPurchase(size)?.body ?? 0) * row.rank;
                break;
            case 'armorRating':
                armor = { rank: row.rank, type: gradeLabel('armorRating', row.grade) };
                break;
            case 'shroudedHull':
                if (row.parentId == null) {
                    armor = { rank: row.rank, type: 'Space, Shrouded' };
                }
                break;
            case 'forceField':
                forceField += (FORCE_FIELD.track[row.grade] ?? 0) * row.rank;
                break;
        }
    }
    return { body, armor, forceField };
}

/** The most serious issue on each grid row, keyed "section:id" (e.g. "attributes:3"). */
function rowStatus(issues) {
    const status = new Map();
    for (const issue of issues) {
        for (const { section, id } of issue.rows) {
            const key = `${section}:${id}`;
            if (status.get(key) !== 'error') {
                status.set(key, issue.severity);
            }
        }
    }
    return status;
}

/**
 * Each attribute's system. A sub-row with no system of its own belongs to its
 * parent's system (an Ammo resource under a Main Attack is part of the Main Attack).
 * @returns {Map<number, string|null>} row id => system name
 */
function effectiveSystems(attributes) {
    const byId = new Map(attributes.map((a) => [a.id, a]));
    const systemOf = (attribute, seen = new Set()) => {
        if (attribute.AttributeSystem || attribute.parentId == null || seen.has(attribute.id)) {
            return attribute.AttributeSystem || null;
        }
        seen.add(attribute.id);
        const parent = byId.get(attribute.parentId);
        return parent ? systemOf(parent, seen) : null;
    };
    return new Map(attributes.map((a) => [a.id, systemOf(a)]));
}

/** Attributes shown in their own part of the summary rather than under a system. */
const SHOWN_ELSEWHERE = new Set(['armorRating', 'body', 'forceField', 'modifier', 'task']);

/**
 * Attributes grouped by system, alphabetically, with sub-rows indented under their parent.
 * Label: "Attack (Space)" or "Attack Multiplier (Plasma)" for scale/implementation attributes, "Cargo (Minor)" for graded ones.
 */
function systemBreakdown(attributes, relatedById, systemsById, nameById) {
    const systems = new Map();
    for (const attribute of attributes) {
        const { row } = relatedById.get(attribute.id);
        if (SHOWN_ELSEWHERE.has(row.key)) {
            continue;
        }
        const grade = gradeLabel(row.key, row.grade);
        const rule = ATTRIBUTE_RULES[row.key];
        // e.g. "Attack Multiplier (Plasma)"; the default implementation isn't spelled out.
        const implementation =
            row.implementation && row.implementation !== rule?.defaultImplementation && row.key !== 'communication'
                ? rule?.implementations?.[row.implementation]?.name
                : null;
        const name = implementation ? `${nameById.get(attribute.id)} (${implementation})` : nameById.get(attribute.id);
        const label = grade ? `${name} (${grade})` : name;
        const systemName = systemsById.get(attribute.id) || UNASSIGNED_SYSTEM;

        const rows = systems.get(systemName) ?? [];
        rows.push({ id: attribute.id, label, rank: attribute.Rank, depth: attribute.parentId == null ? 0 : 1 });
        systems.set(systemName, rows);
    }

    return [...systems.entries()]
        .map(([name, rows]) => ({ name, attributes: rows }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
