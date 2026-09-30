// The Inventory panel's tree: saved items grouped by category.
// A category is "Group: Subgroup" (e.g. "Weapons: Firearms") or one level ("Armor").

export const UNCATEGORIZED = 'Uncategorized';

/** "Weapons: Firearms" -> ['Weapons', 'Firearms']; "Armor" -> ['Armor', null]; '' -> ['Uncategorized', null]. */
export function splitCategory(category) {
    const text = String(category ?? '').trim();
    if (!text) {
        return [UNCATEGORIZED, null];
    }
    const at = text.indexOf(':');
    if (at < 0) {
        return [text, null];
    }
    const group = text.slice(0, at).trim();
    const subgroup = text.slice(at + 1).trim();
    return [group || UNCATEGORIZED, subgroup || null];
}

const byName = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });

/**
 * @param {Array<{itemID: string, itemName: string, category?: string}>} items
 * @returns {Array<{key: string, label: string, items: object[], subgroups: Array<{key: string, label: string, items: object[]}>}>}
 *          groups by name (Uncategorized last); in each, subgroups by name, then its own items.
 *          Keys ("Weapons", "Weapons/Firearms") identify a node for expanding and collapsing.
 */
export function groupInventory(items) {
    const groups = new Map();
    for (const item of items) {
        const [groupName, subgroupName] = splitCategory(item.category);
        if (!groups.has(groupName)) {
            groups.set(groupName, { key: groupName, label: groupName, items: [], subgroups: new Map() });
        }
        const group = groups.get(groupName);
        if (subgroupName == null) {
            group.items.push(item);
        } else {
            if (!group.subgroups.has(subgroupName)) {
                group.subgroups.set(subgroupName, { key: `${groupName}/${subgroupName}`, label: subgroupName, items: [] });
            }
            group.subgroups.get(subgroupName).items.push(item);
        }
    }

    const sortItems = (list) => [...list].sort((a, b) => byName(a.itemName ?? '', b.itemName ?? ''));
    return [...groups.values()]
        .sort((a, b) => (a.label === UNCATEGORIZED) - (b.label === UNCATEGORIZED) || byName(a.label, b.label))
        .map((group) => ({
            ...group,
            items: sortItems(group.items),
            subgroups: [...group.subgroups.values()]
                .sort((a, b) => byName(a.label, b.label))
                .map((subgroup) => ({ ...subgroup, items: sortItems(subgroup.items) })),
        }));
}

/** The node keys to expand so an item is visible: its group, and its subgroup if it has one. */
export function pathKeys(category) {
    const [group, subgroup] = splitCategory(category);
    return subgroup == null ? [group] : [group, `${group}/${subgroup}`];
}

/** Every category in use, for suggestions in the editor's Category field. */
export function knownCategories(items) {
    return [...new Set(items.map((item) => String(item.category ?? '').trim()).filter(Boolean))].sort(byName);
}
