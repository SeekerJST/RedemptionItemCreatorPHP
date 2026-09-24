// Build Point costs for individual tag, attribute, and limitation rows.

import {
    FREE_TAG_COST_PER_RANK,
    LIMIT_COST_BY_SCALE,
    TAG_COST_PER_RANK,
    scaleById,
} from './constants.js';
import { evaluateFormula } from './formula.js';

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
 * Cost of an attribute row, from its attributescale entry (matched by attribute
 * and scale): AttributeFormula with [N] = rank if there is one, otherwise
 * AttributeCost x rank. Attributes with no entry for that scale cost nothing.
 *
 * @param {{AttributeName: number, Scale: string, Rank: number}} attribute
 * @param {Array<object>} scaleRows rows from getattributescaleds
 * @returns {{buildPoints: number, powerSlots: number, error?: string}}
 */
export function attributeCost(attribute, scaleRows) {
    const scaleType = scaleById(attribute.Scale)?.label;
    const scaleRow = scaleRows.find(
        (row) => row.AttributeID === Number(attribute.AttributeName) && row.ScaleType === scaleType
    );
    if (!scaleRow) {
        return { buildPoints: 0, powerSlots: 0 };
    }

    const rank = Number(attribute.Rank) || 0;
    const powerSlots = scaleRow.PowerSlots ?? 0;

    if (!scaleRow.AttributeFormula) {
        return { buildPoints: scaleRow.AttributeCost * rank, powerSlots };
    }
    try {
        // Some formulas halve (e.g. Regeneration's (5+...)/2), giving x.5 costs.
        // Costs round to the nearest whole number, halves up (2.5 -> 3), like a spreadsheet's ROUND.
        return { buildPoints: Math.round(evaluateFormula(scaleRow.AttributeFormula, rank)), powerSlots };
    } catch (e) {
        return { buildPoints: 0, powerSlots, error: e.message };
    }
}
