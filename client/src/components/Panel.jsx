/** One of the three framed panels (Inventory, item editor, summary). */
export default function Panel({ title, size, children }) {
    return (
        <div className={`rd-panel ${size === 'small' ? 'small_panel' : 'large_panel'}`}>
            <div className="panel_title">{title}</div>
            {children}
        </div>
    );
}
