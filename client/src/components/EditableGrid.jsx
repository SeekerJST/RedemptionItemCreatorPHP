import { useCallback, useLayoutEffect, useRef, useState } from 'react';
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
 * @param {object} props
 * @param {object[]} props.rows rows to display (with any computed columns filled in)
 * @param {object[]} props.columns SVAR column config; columns with an `editor` appear in the sidebar
 * @param {(id: number, values: object) => void} props.onUpdate
 * @param {(id: number) => void} props.onDelete
 * @param {(orderedIds: number[]) => void} [props.onReorder] enables drag-to-reorder
 */
export default function EditableGrid({ rows, columns, onUpdate, onDelete, onReorder, ...gridProps }) {
    const [editingId, setEditingId] = useState(null);

    // The grid calls init() once, so it reads the latest callbacks through a ref.
    const callbacks = useRef({ onReorder });
    useLayoutEffect(() => {
        callbacks.current = { onReorder };
    });

    const init = useCallback((api) => {
        // Double-click opens the sidebar editor instead of the grid's inline editor.
        api.intercept('open-editor', ({ id }) => {
            setEditingId(id);
            return false;
        });
        // Drags fire move-item repeatedly while in progress; inProgress === false marks the drop.
        api.on('move-item', ({ inProgress }) => {
            if (inProgress === false) {
                callbacks.current.onReorder?.(api.getState().flatData.map((row) => row.id));
            }
        });
    }, []);

    const editingRow = rows.find((row) => row.id === editingId);

    return (
        <WillowDark>
            <Grid data={rows} columns={columns} init={init} autoRowHeight reorder={Boolean(onReorder)} {...gridProps} />
            {/* Portaled to <body>: inside the scrolling section it would be clipped off-screen. */}
            {editingRow && createPortal(
                <WillowDark>
                    <Editor
                        values={editingRow}
                        items={getEditorConfig(columns)}
                        topBar={EDITOR_TOP_BAR}
                        placement="sidebar"
                        onSave={({ values }) => onUpdate(editingRow.id, values)}
                        onAction={({ item }) => {
                            if (item.id === 'delete') {
                                onDelete(editingRow.id);
                            }
                            if (item.comp) {
                                setEditingId(null);
                            }
                        }}
                    />
                </WillowDark>,
                document.body
            )}
        </WillowDark>
    );
}
