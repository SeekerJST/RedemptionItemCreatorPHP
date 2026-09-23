// Everything the Build Point Summary panel shows, derived from the item state.
// Pure: same item + lookups in, same summary out. Nothing is stored twice.

import {
    ARMOR_TYPE_BY_SCALE,
    ATTRIBUTE_IDS,
    BODY_PER_RANK_BY_SCALE,
    FORCE_FIELD_PER_RANK_BY_SCALE,
    LIMIT_CAPS_BY_SCALE,
    POWER_SLOTS_PER_RANK,
    POWER_SOURCE_IDS,
    SCALES,
    UNASSIGNED_SYSTEM,
    scaleById,
} from './constants.js';
import { attributeCost, limitCost, tagCost } from './costs.js';

const sum = (values) => values.reduce((total, value) => total + value, 0);

/**
 * @param {object} item state from itemReducer
 * @param {object} lookups from useLookups
 */
export function summarizeItem(item, lookups) {
    const size = lookups.sizes.find((s) => s.SizeName === item.size);
    const basePoints = size?.BasePoints ?? 0;
    const incrementPoints = size?.IncrementPoints ?? 0;
    const baseCR = size?.BaseCR ?? 0;
    const baseBody = size?.BaseBody ?? 0;

    const attributeSystems = effectiveSystems(item.attributes);
    const attributeCosts = new Map(
        item.attributes.map((attribute) => [attribute.id, attributeCost(attribute, lookups.scales)])
    );

    const tagCosts = new Map(item.tags.map((tag) => [tag.id, tagCost(tag)]));
    const limitCosts = new Map(item.limits.map((limit) => [limit.id, limitCost(limit)]));

    const tagBP = sum([...tagCosts.values()]);
    const limitBP = sum([...limitCosts.values()]);
    // Each row's cost is truncated to a whole number before adding it up. Some
    // formulas halve (/2) or discount (*0.9), which can give fractions.
    const attributeBP = sum([...attributeCosts.values()].map((cost) => Math.trunc(cost.buildPoints)));
    const totalBP = tagBP + attributeBP + limitBP;

    return {
        basePoints,
        incrementPoints,
        baseCR,
        tagBP,
        attributeBP,
        limitBP,
        totalBP,
        costRating: costRating(baseCR, totalBP, basePoints, incrementPoints),
        tagCosts,
        attributeCosts,
        limitCosts,
        ...structure(item.attributes, baseBody),
        powerSlots: powerSlots(item.attributes, attributeCosts),
        attributeSystems,
        systems: systemBreakdown(item.attributes, attributeCosts, attributeSystems, lookups.attributes),
        modifiers: item.attributes.filter((a) => a.AttributeName === ATTRIBUTE_IDS.MODIFIER),
        tasks: item.attributes.filter((a) => a.AttributeName === ATTRIBUTE_IDS.TASK),
        limitCounts: limitCounts(item.limits),
    };
}

/** Base CR plus one per full increment of BP over the size's base points; never below 0. */
function costRating(baseCR, totalBP, basePoints, incrementPoints) {
    const rating = baseCR + Math.round((totalBP - basePoints) / incrementPoints);
    return Number.isFinite(rating) && rating > 0 ? rating : 0;
}

/** Body, Armor, and Force Fields. If an attribute appears more than once, the last row wins. */
function structure(attributes, baseBody) {
    let attributeBody = 0;
    let armor = { rank: 0, type: null };
    let forceField = 0;

    for (const attribute of attributes) {
        const rank = Number(attribute.Rank) || 0;
        switch (attribute.AttributeName) {
            case ATTRIBUTE_IDS.BODY:
                attributeBody = rank * (BODY_PER_RANK_BY_SCALE[attribute.Scale] ?? BODY_PER_RANK_BY_SCALE[1]);
                break;
            case ATTRIBUTE_IDS.ARMOR_RATING:
                armor = { rank, type: ARMOR_TYPE_BY_SCALE[attribute.Scale] ?? ARMOR_TYPE_BY_SCALE[1] };
                break;
            case ATTRIBUTE_IDS.FORCE_FIELD:
                forceField = rank * (FORCE_FIELD_PER_RANK_BY_SCALE[attribute.Scale] ?? FORCE_FIELD_PER_RANK_BY_SCALE[1]);
                break;
        }
    }

    return { body: baseBody + attributeBody, armor, forceField };
}

const isPowerSource = (attribute) => POWER_SOURCE_IDS.includes(attribute.AttributeName);

/** Power slots per scale: provided by power sources (3 per rank), used by attributes that need them. */
function powerSlots(attributes, attributeCosts) {
    const byScale = new Map();
    for (const attribute of attributes) {
        const used = attributeCosts.get(attribute.id).powerSlots;
        if (!isPowerSource(attribute) && !(used > 0)) {
            continue;
        }
        const entry = byScale.get(attribute.Scale) ?? { total: 0, used: 0 };
        if (isPowerSource(attribute)) {
            entry.total += POWER_SLOTS_PER_RANK * (Number(attribute.Rank) || 0);
        }
        entry.used += used;
        byScale.set(attribute.Scale, entry);
    }

    return SCALES
        .filter((scale) => byScale.has(scale.id))
        .map((scale) => ({ scaleId: scale.id, scaleName: scale.name, ...byScale.get(scale.id) }));
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

/** How deep each row sits in the attribute tree: 0 for top-level rows. */
function depths(attributes) {
    const byId = new Map(attributes.map((a) => [a.id, a]));
    const depthOf = (attribute, seen = new Set()) => {
        const parent = byId.get(attribute.parentId);
        if (!parent || seen.has(attribute.id)) {
            return 0;
        }
        seen.add(attribute.id);
        return 1 + depthOf(parent, seen);
    };
    return new Map(attributes.map((a) => [a.id, depthOf(a)]));
}

/**
 * Attributes grouped by system, alphabetically, with sub-rows indented under
 * their parent. Attributes already shown elsewhere in the summary (structure,
 * power, modifiers, tasks) are left out.
 */
function systemBreakdown(attributes, attributeCosts, systemsById, attributeLookup) {
    const depthById = depths(attributes);
    const shownElsewhere = new Set([
        ATTRIBUTE_IDS.ARMOR_RATING,
        ATTRIBUTE_IDS.BODY,
        ATTRIBUTE_IDS.FORCE_FIELD,
        ATTRIBUTE_IDS.MODIFIER,
        ATTRIBUTE_IDS.TASK,
    ]);

    const systems = new Map();
    for (const attribute of attributes) {
        if (
            shownElsewhere.has(attribute.AttributeName) ||
            isPowerSource(attribute) ||
            attributeCosts.get(attribute.id).powerSlots > 0
        ) {
            continue;
        }
        const name = attributeLookup.find((a) => a.AttributeID === attribute.AttributeName)?.AttributeName ?? '?';
        const scale = scaleById(attribute.Scale)?.label ?? '?';
        const systemName = systemsById.get(attribute.id) || UNASSIGNED_SYSTEM;

        const rows = systems.get(systemName) ?? [];
        rows.push({ id: attribute.id, label: `${name} (${scale})`, rank: attribute.Rank, depth: depthById.get(attribute.id) });
        systems.set(systemName, rows);
    }

    return [...systems.entries()]
        .map(([name, rows]) => ({ name, attributes: rows }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/** Limitations taken at each scale, against the allowed maximum. */
function limitCounts(limits) {
    return SCALES.map((scale) => ({
        scaleName: scale.name,
        count: limits.filter((limit) => limitCost(limit) !== 0 && String(limit.LimitScale) === scale.id).length,
        cap: LIMIT_CAPS_BY_SCALE[scale.id],
    }));
}
