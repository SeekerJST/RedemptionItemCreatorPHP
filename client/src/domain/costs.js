// Build Point costs for individual tag, attribute, and limitation rows.

import {
    FREE_TAG_COST_PER_RANK,
    LIMIT_COST_BY_SCALE,
    TAG_COST_PER_RANK,
    scaleById,
} from './constants.js';
import { rowCost } from './rules/index.js';

/** A row whose description is still blank is a placeholder and costs nothing. */
const isBlank = (text) => (text ?? '').trim() === '';

export function tagCost(tag) {
    if (isBlank(tag.TagDesc)) {
        return 0;
    }
    const perRank = tag.TagFree ? FREE_TAG_COST_PER_RANK : TAG_COST_PER_RANK;
    const cost = Number(tag.TagRank) * perRank;
    return Number.isInteger(cost) ? cost : 0;
}

export function limitCost(limit) {
    if (isBlank(limit.LimitDesc)) {
        return 0;
    }
    return LIMIT_COST_BY_SCALE[limit.LimitScale] ?? LIMIT_COST_BY_SCALE[1];
}

/**
 * Cost of an attribute row, from the rules engine (domain/rules).
 *
 * The Power Slots figure still comes from the row's attributescale entry until the
 * power rules are wired into the summary (implementation plan, Phase 2).
 *
 * @param {object} attribute the attribute row from the item state
 * @param {{row: object, parent: object|null, children: object[]}} related its rule row (ruleRows.js)
 * @param {number|null} size item size ordinal
 * @param {Array<object>} scaleRows rows from getattributescaleds
 * @returns {{buildPoints: number, powerSlots: number}}
 */
export function attributeCost(attribute, related, size, scaleRows) {
    // Costs round to the nearest whole number, halves up (2.5 -> 3), like a spreadsheet's ROUND.
    const buildPoints = Math.round(rowCost(related.row, { size, parent: related.parent, children: related.children }));

    const scaleType = scaleById(attribute.Scale)?.label;
    const scaleRow = scaleRows.find(
        (row) => row.AttributeID === Number(attribute.AttributeName) && row.ScaleType === scaleType
    );
    return { buildPoints, powerSlots: scaleRow?.PowerSlots ?? 0 };
}
