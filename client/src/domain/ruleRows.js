// Adapter between the item state (grid rows keyed by AttributeID) and the rules engine
// (rows keyed by rule name). The rules never see database IDs.

import { resolveAttributeName, withRelations } from './rules/index.js';

/**
 * @param {object} attribute an attribute row from the item state
 * @param {Array<{AttributeID: number, AttributeName: string}>} attributeLookup
 * @returns {{id, parentId, key: string|null, implementation: string|null, grade: number|null, rank: number}}
 *          key is null for an attribute the rules don't know
 */
export function toRuleRow(attribute, attributeLookup) {
    const name = attributeLookup.find((a) => a.AttributeID === attribute.AttributeName)?.AttributeName;
    const resolved = resolveAttributeName(name);
    return {
        id: attribute.id,
        parentId: attribute.parentId ?? null,
        key: resolved?.key ?? null,
        implementation: attribute.Implementation ?? resolved?.implementation ?? null,
        grade: Number(attribute.Scale) || null,
        rank: Number(attribute.Rank) || 0,
    };
}

/** Rule rows for all of an item's attributes, each with its parent and children. */
export function relatedRuleRows(attributes, attributeLookup) {
    return withRelations(attributes.map((attribute) => toRuleRow(attribute, attributeLookup)));
}
