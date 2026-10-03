// The JSON export: one item, self-describing, so it can be read without this app's database and
// imported back later (by this app, or the planned character creator).
//
//   format, version   what the file is ("redemption-item", 1)
//   item              the item as the API saves it (toApiItem), plus each attribute row's name
//                     (`attribute`), since AttributeName is a database ID
//   summary           the totals the app computed: BP, Cost Rating, Power Slots, rule checks

import { toApiItem } from './item.js';

export const EXPORT_FORMAT = 'redemption-item';
export const EXPORT_VERSION = 1;

/**
 * @param {object} item state from itemReducer
 * @param {object} summary from summarizeItem
 * @param {Array<{AttributeID: number, AttributeName: string}>} attributes the `attribute` lookup
 * @param {Date} [now]
 */
export function itemExport(item, summary, attributes, now = new Date()) {
    const nameOf = new Map(attributes.map((a) => [a.AttributeID, a.AttributeName]));
    const apiItem = toApiItem(item, summary);
    return {
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION,
        exportedAt: now.toISOString(),
        source: 'Redemption Gear Creator',
        item: {
            ...apiItem,
            attributeList: apiItem.attributeList.map((row) => ({ ...row, attribute: nameOf.get(Number(row.AttributeName)) ?? null })),
        },
        summary: {
            size: item.size || null,
            baseBuildPoints: summary.basePoints,
            totalBuildPoints: summary.totalBP,
            costRating: summary.costRating,
            powerSlots: summary.powerSlots.map(({ gradeName, available, used, borrowed, short }) => ({ grade: gradeName, available, used, borrowed, short })),
            issues: summary.issues.map(({ severity, message }) => ({ severity, message })),
        },
    };
}

/** The export as a file's text: indented, ending in a newline. */
export const itemExportText = (...args) => JSON.stringify(itemExport(...args), null, 2) + '\n';

/** A safe file name from the item's name: "Plasma Carbine" -> "Plasma Carbine.json". */
export function exportFileName(name, extension) {
    const base = String(name ?? '').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'item';
    return `${base}.${extension}`;
}
