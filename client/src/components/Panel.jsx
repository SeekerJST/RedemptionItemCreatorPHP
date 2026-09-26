/**
 * One of the three framed panels (Inventory, item editor, summary).
 * scroll: the content scrolls inside the panel instead of being cut off by its fixed height
 * (for panels without their own scrolling area, like the summary).
 */
export default function Panel({ title, size, scroll = false, children }) {
    return (
        <div className={size === 'small' ? 'small_panel' : 'large_panel'}>
            <div className="panel_title">{title}</div>
            {scroll ? <div className="panel_scroll">{children}</div> : children}
        </div>
    );
}
