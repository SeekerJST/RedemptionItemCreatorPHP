// Turns a hand-written catalog entry (names, not database IDs) into editor state, so catalog
// items go through exactly the same rules engine as items built in the UI.
// Used by dev/import-catalog.mjs; the format is documented in db/catalog/README.md.

import { createInitialItem } from './item.js';
import { ATTRIBUTE_RULES, GRADE_NAMES, SCALE_NAMES, resolveAttributeName } from './rules/index.js';

const norm = (value) => String(value ?? '').toLowerCase().replace(/[\s_-]+/g, '');

/** "Moderate", "Battlefield", "2" or 2 -> 2. Minor/Moderate/Major and Firefight/Battlefield/Space both map to 1-3. */
export function parseGrade(value) {
    if (value == null || value === '') {
        return null;
    }
    if (Number.isInteger(Number(value)) && [1, 2, 3].includes(Number(value))) {
        return Number(value);
    }
    for (const names of [GRADE_NAMES, SCALE_NAMES]) {
        const match = Object.entries(names).find(([, name]) => norm(name) === norm(value));
        if (match) {
            return Number(match[0]);
        }
    }
    return undefined; // not a grade
}

/**
 * The catalog file's items: either an array, or { category?, items: [...] } where
 * `category` is the default for items that don't give one.
 */
export function catalogEntries(json) {
    if (Array.isArray(json)) {
        return json;
    }
    if (json && Array.isArray(json.items)) {
        return json.items.map((entry) => ({ category: json.category, ...entry }));
    }
    throw new Error('A catalog file must be an array of items, or an object with an "items" array.');
}

/**
 * @param {object} entry one catalog item (see db/catalog/README.md)
 * @param {{sizes: object[], attributes: object[], skills: object[]}} lookups
 * @returns {{ state: object|null, problems: string[] }} problems: names that didn't resolve; state is null if there are any
 */
export function catalogItemToState(entry, lookups) {
    const problems = [];
    const problem = (message) => problems.push(message);

    const name = String(entry.name ?? '').trim();
    if (!name) problem('Every item needs a "name".');

    const size = lookups.sizes.find((s) => norm(s.SizeName) === norm(entry.size))?.SizeName;
    if (!size) problem(`Unknown size "${entry.size ?? ''}". Use one of: ${lookups.sizes.map((s) => s.SizeName).join(', ')}.`);

    const state = { ...createInitialItem(), name, size: size ?? '', category: String(entry.category ?? '').trim(), tags: [], attributes: [], limits: [] };
    let nextId = 1;

    const addAttribute = (spec, parent, where) => {
        const label = `${where} "${spec.attribute ?? '?'}"`;
        const implementationName = spec.implementation ?? spec.type ?? null;

        // "Communication" + implementation "Radio" is the attribute "Communication (Radio)".
        let dbAttribute = null;
        if (implementationName) {
            dbAttribute = lookups.attributes.find((a) => norm(a.AttributeName) === norm(`${spec.attribute}(${implementationName})`));
        }
        dbAttribute ??= lookups.attributes.find((a) => norm(a.AttributeName) === norm(spec.attribute));
        const resolved = dbAttribute ? resolveAttributeName(dbAttribute.AttributeName) : null;
        const rule = resolved ? ATTRIBUTE_RULES[resolved.key] : null;
        if (!rule) {
            problem(`${label}: unknown attribute.`);
            return;
        }

        let implementation = resolved.implementation;
        if (implementationName && !implementation) {
            const match = Object.entries(rule.implementations ?? {}).find(([id, impl]) => norm(id) === norm(implementationName) || norm(impl.name) === norm(implementationName));
            if (match) {
                implementation = match[0];
            } else {
                const options = Object.values(rule.implementations ?? {}).map((impl) => impl.name);
                problem(`${label}: unknown type "${implementationName}".` + (options.length ? ` Use one of: ${options.join(', ')}.` : ' It has no types.'));
            }
        }

        // Grade: required where it matters; attributes without one follow their parent (or Minor).
        let grade = parseGrade(spec.grade);
        if (grade === undefined) {
            problem(`${label}: "${spec.grade}" isn't a grade or combat scale.`);
            grade = null;
        }
        // Maneuver is priced at its Drive's grade, so it follows the parent too.
        if (rule.gradeKind === 'none' || resolved.key === 'maneuver') {
            grade ??= parent?.grade ?? 1;
        } else if (grade == null) {
            problem(`${label}: needs a "grade" (${rule.gradeKind === 'scale' ? 'Firefight, Battlefield, or Space' : 'Minor, Moderate, or Major'}).`);
            grade = 1;
        }

        const rank = spec.rank ?? 1;
        if (!Number.isInteger(rank) || rank < 0) {
            problem(`${label}: "rank" must be a whole number.`);
        }

        const id = nextId++;
        state.attributes.push({
            id,
            parentId: parent?.id ?? null,
            AttributeSystem: spec.system ?? null,
            AttributeName: dbAttribute.AttributeID,
            Scale: String(grade),
            Rank: Number.isInteger(rank) ? rank : 0,
            Implementation: resolved.key === 'communication' ? null : implementation,
        });

        if (resolved.key === 'modifier') {
            const skill = lookups.skills.find((s) => norm(s.skillName) === norm(spec.skill))?.skillName;
            if (!skill) problem(`${label}: needs a "skill" from the skills list (got "${spec.skill ?? ''}").`);
            else state.modifierSkills[id] = skill;
        }
        if (resolved.key === 'task') {
            state.taskNames[id] = String(spec.task ?? spec.name ?? '');
        }

        const subRows = spec.subRows ?? [];
        if (subRows.length > 0 && parent) {
            problem(`${label}: sub-rows can only be one level deep.`);
        }
        for (const [i, child] of subRows.entries()) {
            if (!parent) addAttribute(child, { id, grade }, `${where}.subRows[${i}]`);
        }
    };

    for (const [i, spec] of (entry.attributes ?? []).entries()) {
        addAttribute(spec, null, `attributes[${i}]`);
    }

    for (const [i, tag] of (entry.tags ?? []).entries()) {
        const rank = tag.rank ?? 1;
        if (!tag.name) problem(`tags[${i}]: needs a "name".`);
        if (![1, 2, 3].includes(rank)) problem(`tags[${i}] "${tag.name ?? '?'}": "rank" must be 1-3.`);
        state.tags.push({ id: i + 1, TagDesc: String(tag.name ?? ''), TagRank: String(rank), TagFree: Boolean(tag.free) });
    }

    for (const [i, limit] of (entry.limitations ?? []).entries()) {
        const grade = parseGrade(limit.grade);
        if (!limit.name) problem(`limitations[${i}]: needs a "name".`);
        if (grade == null || grade === undefined) problem(`limitations[${i}] "${limit.name ?? '?'}": needs a "grade" (Minor, Moderate, or Major).`);
        state.limits.push({ id: i + 1, LimitDesc: String(limit.name ?? ''), LimitScale: String(grade ?? 1) });
    }

    return { state: problems.length === 0 ? state : null, problems };
}
