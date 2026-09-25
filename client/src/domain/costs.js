// Build Point costs for tag and limitation rows. Attribute costs come from the rules
// engine (domain/rules), applied in summary.js.

import {
    FREE_TAG_COST_PER_RANK,
    LIMIT_COST_BY_SCALE,
    TAG_COST_PER_RANK,
} from './constants.js';

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
