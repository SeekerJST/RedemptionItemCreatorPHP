// The Inventory panel's view of the saved items: grouped by category, filtered by a search.

export const UNCATEGORIZED = 'Uncategorized';

/**
 * Items whose name or category contains every word of the query (any case), grouped by
 * category: categories A-Z with Uncategorized last, items A-Z within each.
 *
 * @param {Array<{itemID: string, itemName: string, itemType?: string|null}>} items from getallitems
 * @param {string} query
 * @returns {Array<{category: string, items: object[]}>}
 */
export function groupInventory(items, query = '') {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const groups = new Map();

    for (const item of items) {
        const category = item.itemType?.trim() || UNCATEGORIZED;
        const haystack = `${item.itemName ?? ''} ${category}`.toLowerCase();
        if (!words.every((word) => haystack.includes(word))) {
            continue;
        }
        const group = groups.get(category) ?? [];
        group.push(item);
        groups.set(category, group);
    }

    const byName = (a, b) => (a.itemName ?? '').localeCompare(b.itemName ?? '');
    return [...groups.entries()]
        .sort(([a], [b]) => (a === UNCATEGORIZED) - (b === UNCATEGORIZED) || a.localeCompare(b))
        .map(([category, groupItems]) => ({ category, items: groupItems.sort(byName) }));
}

/** The categories in use, A-Z, for suggestions in the editor. */
export function categoriesOf(items) {
    return [...new Set(items.map((item) => item.itemType?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
