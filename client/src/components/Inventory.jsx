/** Panel 1: the saved items. Clicking one loads it into the editor. */
export default function Inventory({ items, error, currentId, onOpen }) {
    return (
        <div className="inventory">
            <p>Inventory</p>
            {error && <p role="alert" className="inventory_note">Couldn't load saved items: {error}</p>}
            {!error && items === null && <p role="status" className="inventory_note">Loading...</p>}
            {items?.length === 0 && <p className="inventory_note">No saved items yet.</p>}
            {items?.length > 0 && (
                <ul className="inventory_list">
                    {items.map((entry) => (
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
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
