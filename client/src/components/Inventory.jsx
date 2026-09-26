import { useMemo, useState } from 'react';
import { groupInventory } from '../domain/inventory.js';

/** Panel 1: the saved items, grouped by category, with a search. Clicking one loads it into the editor. */
export default function Inventory({ items, error, currentId, onOpen }) {
    const [query, setQuery] = useState('');
    const groups = useMemo(() => groupInventory(items ?? [], query), [items, query]);

    return (
        <div className="inventory">
            <p>Inventory</p>
            {error && <p role="alert" className="inventory_note">Couldn't load saved items: {error}</p>}
            {!error && items === null && <p role="status" className="inventory_note">Loading...</p>}
            {items?.length === 0 && <p className="inventory_note">No saved items yet.</p>}
            {items?.length > 0 && (
                <>
                    <input
                        type="search"
                        className="inventory_search"
                        placeholder="Search items"
                        aria-label="Search saved items"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {groups.length === 0 && <p className="inventory_note">Nothing matches "{query}".</p>}
                    <div className="inventory_groups">
                        {groups.map((group) => (
                            <details key={group.category} className="inventory_group" open>
                                <summary>
                                    {group.category} <span className="inventory_count">({group.items.length})</span>
                                </summary>
                                <ul className="inventory_list">
                                    {group.items.map((entry) => (
                                        <li key={entry.itemID}>
                                            <button
                                                type="button"
                                                className={entry.itemID === currentId ? 'inventory_item current' : 'inventory_item'}
                                                aria-current={entry.itemID === currentId ? 'true' : undefined}
                                                onClick={() => onOpen(entry.itemID)}
                                            >
                                                <span className="inventory_name">{entry.itemName || '(unnamed)'}</span>
                                                <span className="inventory_meta">
                                                    {entry.itemSize ?? '?'} · CR {entry.CostRating ?? '?'}
                                                    {entry.IsPublic === false && ' · private'}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
