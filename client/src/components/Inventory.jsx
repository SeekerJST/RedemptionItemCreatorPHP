import { useEffect, useMemo, useState } from 'react';
import { groupInventory, pathKeys } from '../domain/inventory.js';

/**
 * Panel 1: the saved items as a tree by category (group, then subgroup). Clicking an item
 * loads it into the editor. Groups start collapsed; the open item's branch expands itself.
 */
export default function Inventory({ items, error, currentId, onOpen }) {
    const tree = useMemo(() => groupInventory(items ?? []), [items]);
    const [expanded, setExpanded] = useState(() => new Set());

    // Show the open item: expand its group (and subgroup) whenever it changes.
    const currentCategory = items?.find((entry) => entry.itemID === currentId)?.category;
    useEffect(() => {
        if (currentId != null && items?.some((entry) => entry.itemID === currentId)) {
            setExpanded((keys) => new Set([...keys, ...pathKeys(currentCategory)]));
        }
    }, [currentId, currentCategory, items]);

    const toggle = (key) =>
        setExpanded((keys) => {
            const next = new Set(keys);
            if (!next.delete(key)) {
                next.add(key);
            }
            return next;
        });

    const itemList = (list) => (
        <ul className="inventory_list">
            {list.map((entry) => (
                <li key={entry.itemID}>
                    <button
                        type="button"
                        className={entry.itemID === currentId ? 'inventory_item current' : 'inventory_item'}
                        aria-current={entry.itemID === currentId ? 'true' : undefined}
                        onClick={() => onOpen(entry.itemID)}
                    >
                        <span className="inventory_name">
                            {entry.IsPublic && <span className="inventory_lock" title="Public item: read-only" aria-label="read-only">🔒 </span>}
                            {entry.itemName || '(unnamed)'}
                        </span>
                        <span className="inventory_meta">
                            {entry.itemSize ?? '?'} · CR {entry.CostRating ?? '?'}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );

    const node = (key, label, count, depth, children) => {
        const open = expanded.has(key);
        return (
            <li key={key} className={`inventory_node depth-${depth}`}>
                <button type="button" className="inventory_group" aria-expanded={open} onClick={() => toggle(key)}>
                    <span className="inventory_twisty" aria-hidden="true">{open ? '▾' : '▸'}</span> {label}
                    <span className="inventory_count"> ({count})</span>
                </button>
                {open && children}
            </li>
        );
    };

    return (
        <div className="inventory">
            <p>Inventory</p>
            {error && <p role="alert" className="inventory_note">Couldn't load saved items: {error}</p>}
            {!error && items === null && <p role="status" className="inventory_note">Loading...</p>}
            {items?.length === 0 && <p className="inventory_note">No saved items yet.</p>}
            {tree.length > 0 && (
                <ul className="inventory_tree">
                    {tree.map((group) =>
                        node(
                            group.key,
                            group.label,
                            group.items.length + group.subgroups.reduce((n, s) => n + s.items.length, 0),
                            0,
                            <>
                                {group.subgroups.length > 0 && (
                                    <ul className="inventory_tree">
                                        {group.subgroups.map((sub) => node(sub.key, sub.label, sub.items.length, 1, itemList(sub.items)))}
                                    </ul>
                                )}
                                {group.items.length > 0 && itemList(group.items)}
                            </>
                        )
                    )}
                </ul>
            )}
        </div>
    );
}
