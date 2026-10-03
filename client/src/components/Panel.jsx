/** One of the three framed panels (Inventory, item editor, summary). `className` adds a class of its own. */
export default function Panel({ title, size, className = '', children }) {
    return (
        <div className={`rd-panel ${size === 'small' ? 'small_panel' : 'large_panel'} ${className}`.trim()}>
            <div className="panel_title">{title}</div>
            {children}
        </div>
    );
}
