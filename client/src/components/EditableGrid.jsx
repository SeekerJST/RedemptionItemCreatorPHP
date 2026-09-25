import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Grid, getEditorConfig } from '@svar-ui/react-grid';
import { Editor, registerEditorItem } from '@svar-ui/react-editor';
import { RichSelect, Switch, WillowDark } from '@svar-ui/react-core';
import '@svar-ui/react-grid/all.css';

// Field types the sidebar editor can show (see `editor.type` in the column configs).
registerEditorItem('richselect', RichSelect);
registerEditorItem('switch', Switch);

const EDITOR_TOP_BAR = {
    items: [
        { comp: 'icon', icon: 'wxi-close', id: 'close' },
        { comp: 'spacer' },
        { comp: 'button', type: 'danger', text: 'Delete', id: 'delete' },
        { comp: 'button', type: 'primary', text: 'Save', id: 'save' },
    ],
};

/**
 * A SVAR grid used as a view of rows owned by React state, plus the sidebar
 * editor that opens when a row is double-clicked.
 *
 * The grid never changes the rows itself: edits, deletes, and drag-reorders
 * are reported through the callbacks, the parent updates its state, and the
 * new rows flow back in through `rows`. (SVAR's own add/update/delete-row
 * actions only work on top-level rows, so they can't be used for sub-rows.)
 *
 * With `tree`, rows are flat with a `parentId`, and are shown nested:
 * sub-rows sit under their parent, which can be expanded and collapsed.
 *
 * @param {object} props
 * @param {object[]} props.rows flat rows to display (with any computed columns filled in)
 * @param {object[]} props.columns SVAR column config; columns with an `editor` appear in the sidebar
 * @param {(id: number, values: object) => void} props.onUpdate
 * @param {(id: number) => void} props.onDelete
 * @param {(order: Array<{id: number, parentId: number|null}>) => void} [props.onReorder] enables drag-to-reorder
 * @param {(id: number|null) => void} [props.onSelect] called when the selected row changes
 * @param {boolean} [props.tree] show rows nested by parentId
 * @param {(row: object) => string} [props.rowClass] extra CSS class for a row (e.g. to flag errors)
 * @param {(row: object) => object[]} [props.editorColumns] the columns to edit for a given row;
 *        defaults to `columns`. Lets the sidebar offer different fields/options per row.
 * @param {string[]} [props.liveFields] editor fields whose unsaved value should immediately
 *        re-shape the editor (e.g. picking a different Attribute changes which grades it offers)
 */
export default function EditableGrid({
    rows,
    columns,
    onUpdate,
    onDelete,
    onReorder,
    onSelect,
    tree = false,
    rowClass,
    editorColumns,
    liveFields = [],
}) {
    const [editingId, setEditingId] = useState(null);
    // Unsaved editor values for the liveFields, so the editor can re-shape itself before Save.
    const [draft, setDraft] = useState({});
    // Parents the user has collapsed. The grid is re-fed its data on every change,
    // so it can't remember this itself.
    const [collapsed, setCollapsed] = useState(() => new Set());

    // The grid calls init() once, so it reads the latest callbacks through a ref.
    const callbacks = useRef({ onReorder, onSelect });
    useLayoutEffect(() => {
        callbacks.current = { onReorder, onSelect };
    });

    const init = useCallback((api) => {
        // Double-click opens the sidebar editor instead of the grid's inline editor.
        api.intercept('open-editor', ({ id }) => {
            setEditingId(id);
            setDraft({});
            return false;
        });
        // Drags fire move-item repeatedly while in progress; inProgress === false marks the drop.
        api.on('move-item', ({ inProgress }) => {
            if (inProgress === false) {
                const order = api.getState().flatData.map((row) => ({ id: row.id, parentId: row.$parent || null }));
                callbacks.current.onReorder?.(order);
            }
        });
        // Workaround for a SVAR 2.3 bug: when the `data` prop changes, the grid
        // re-initializes its store with `_select` instead of `select`, so clicks
        // stop selecting rows. Clicks still focus a cell, so select from that.
        api.on('focus-cell', ({ row, eventSource }) => {
            if (eventSource === 'click' && row != null && !api.getState().selectedRows.includes(row)) {
                api.exec('select-row', { id: row });
            }
        });
        api.on('select-row', () => {
            const [selectedId = null] = api.getState().selectedRows;
            callbacks.current.onSelect?.(selectedId);
        });
        api.on('open-row', ({ id }) => setCollapsed((ids) => without(ids, id)));
        api.on('close-row', ({ id }) => setCollapsed((ids) => new Set(ids).add(id)));
    }, []);

    const data = useMemo(() => (tree ? nest(rows, collapsed) : rows), [tree, rows, collapsed]);
    const editingRow = rows.find((row) => row.id === editingId);

    return (
        <WillowDark>
            <Grid
                data={data}
                columns={columns}
                init={init}
                autoRowHeight
                reorder={Boolean(onReorder)}
                tree={tree}
                rowStyle={rowClass}
            />
            {/* Portaled to <body>: inside the scrolling section it would be clipped off-screen. */}
            {editingRow && createPortal(
                <WillowDark>
                    <Editor
                        key={editingRow.id}
                        values={editingRow}
                        items={getEditorConfig(editorColumns ? editorColumns({ ...editingRow, ...draft }) : columns)}
                        topBar={EDITOR_TOP_BAR}
                        placement="sidebar"
                        onChange={({ key, value }) => {
                            if (liveFields.includes(key)) {
                                setDraft((current) => ({ ...current, [key]: value }));
                            }
                        }}
                        onSave={({ values }) => onUpdate(editingRow.id, values)}
                        onAction={({ item }) => {
                            if (item.id === 'delete') {
                                onDelete(editingRow.id);
                            }
                            if (item.comp) {
                                setEditingId(null);
                                setDraft({});
                            }
                        }}
                    />
                </WillowDark>,
                document.body
            )}
        </WillowDark>
    );
}

/**
 * Flat rows with parentId -> the nested shape SVAR's tree mode expects:
 * a parent row carries its sub-rows in `data`, and `open` says whether they show.
 */
function nest(rows, collapsed) {
    const ids = new Set(rows.map((row) => row.id));
    const childrenOf = new Map();
    for (const row of rows) {
        // A row whose parent is missing is shown at the top level instead of disappearing.
        const parentKey = ids.has(row.parentId) ? row.parentId : null;
        childrenOf.set(parentKey, [...(childrenOf.get(parentKey) ?? []), row]);
    }

    const build = (parentKey) =>
        (childrenOf.get(parentKey) ?? []).map((row) => {
            const children = build(row.id);
            return children.length > 0 ? { ...row, data: children, open: !collapsed.has(row.id) } : { ...row };
        });
    return build(null);
}

function without(set, value) {
    const copy = new Set(set);
    copy.delete(value);
    return copy;
}
