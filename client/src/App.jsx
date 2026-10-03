import { useMemo, useReducer, useState } from 'react';
import Starfield from 'react-starfield';
import { deleteItem, downloadItemCsv, fetchItem, saveItem } from './api/itemCreatorApi.js';
import Inventory from './components/Inventory.jsx';
import ItemEditor from './components/ItemEditor.jsx';
import Panel from './components/Panel.jsx';
import BuildSummary from './components/summary/BuildSummary.jsx';
import { knownCategories } from './domain/inventory.js';
import { createInitialItem, itemReducer, toApiItem } from './domain/item.js';
import { summarizeItem } from './domain/summary.js';
import { useInventory } from './hooks/useInventory.js';
import { useLookups } from './hooks/useLookups.js';
import './App.css';

export default function App() {
    const { lookups, error } = useLookups();

    return (
        <div>
            <Starfield starCount={1000} starColor={[255, 255, 255]} speedFactor={0.01} backgroundColor="black" />
            <div className="panel_header">
                <div className="rd-panel top_panel">
                    <h1 className="rd-title">Redemption Gear Creator</h1>
                </div>
            </div>

            <div className="panel_body">
                {lookups ? (
                    <GearCreator lookups={lookups} />
                ) : (
                    <Panel title="Panel.02" size="large">
                        <p role={error ? 'alert' : 'status'}>
                            {error ? `Couldn't load item data: ${error}` : 'Loading item data...'}
                        </p>
                    </Panel>
                )}
            </div>
        </div>
    );
}

/** The three panels, once the reference data has loaded. */
function GearCreator({ lookups }) {
    const [item, dispatch] = useReducer(itemReducer, undefined, createInitialItem);
    const summary = useMemo(() => summarizeItem(item, lookups), [item, lookups]);
    const inventory = useInventory();
    const [status, setStatus] = useState(null);
    /** A pending question before something that would lose work: { message, actionLabel, run }. */
    const [confirm, setConfirm] = useState(null);
    const [busy, setBusy] = useState(false);

    const categories = useMemo(() => knownCategories(inventory.items ?? []), [inventory.items]);

    const apiItem = () => toApiItem(item, summary);
    const exportCsv = () => downloadItemCsv(apiItem());

    /** Runs an API call with the toolbar disabled, reporting failures in the status line. */
    const run = async (busyText, work) => {
        setConfirm(null);
        setBusy(true);
        setStatus({ kind: 'busy', text: busyText });
        try {
            setStatus({ kind: 'ok', text: await work() });
        } catch (e) {
            setStatus({ kind: 'error', text: e.message });
        } finally {
            setBusy(false);
        }
    };

    /** Asks first if there are unsaved edits that `action` would throw away. */
    const unlessUnsaved = (actionLabel, action) => {
        if (item.dirty) {
            setConfirm({ message: 'This item has unsaved changes.', actionLabel, run: action });
        } else {
            action();
        }
    };

    const save = () =>
        run('Saving...', async () => {
            const saved = await saveItem(apiItem());
            dispatch({ type: 'saved', itemId: saved.itemID });
            inventory.refresh();
            return `Saved "${saved.itemName}".`;
        });

    const remove = () =>
        setConfirm({
            message: `Delete "${item.name || 'this item'}" permanently?`,
            actionLabel: 'Delete',
            run: () =>
                run('Deleting...', async () => {
                    await deleteItem(item.itemId);
                    dispatch({ type: 'newItem' });
                    inventory.refresh();
                    return `Deleted "${item.name}".`;
                }),
        });

    /** An editable, unsaved copy of the open item (the way to change a public one). */
    const copy = () => {
        setConfirm(null);
        dispatch({ type: 'copyItem' });
        setStatus({ kind: 'ok', text: `Copied "${item.name}". Save to keep your copy.` });
    };

    const startNew = () =>
        unlessUnsaved('Discard changes', () => {
            setConfirm(null);
            setStatus(null);
            dispatch({ type: 'newItem' });
        });

    const open = (itemId) =>
        unlessUnsaved('Discard changes', () =>
            run('Loading...', async () => {
                const saved = await fetchItem(itemId);
                dispatch({ type: 'loadItem', apiItem: saved });
                return `Loaded "${saved.itemName}".`;
            })
        );

    let saveHint = null;
    if (!item.name.trim()) {
        saveHint = 'Give the item a name to save it';
    } else if (!item.size) {
        saveHint = 'Choose an item size to save it';
    }

    return (
        <>
            <Panel title="Panel.01" size="small">
                <Inventory items={inventory.items} error={inventory.error} currentId={item.itemId} onOpen={open} />
            </Panel>
            <Panel title="Panel.02" size="large">
                <ItemEditor
                    item={item}
                    dispatch={dispatch}
                    summary={summary}
                    lookups={lookups}
                    categories={categories}
                    toolbar={{
                        onNew: startNew,
                        onSave: save,
                        onCopy: copy,
                        onDelete: remove,
                        canCopy: item.itemId != null,
                        canDelete: item.itemId != null,
                        saveHint,
                        busy,
                    }}
                    status={status}
                    confirm={confirm && { ...confirm, onConfirm: confirm.run }}
                    onCancelConfirm={() => setConfirm(null)}
                />
            </Panel>
            <Panel title="Panel.03" size="large">
                <BuildSummary item={item} dispatch={dispatch} summary={summary} skills={lookups.skills} onExport={exportCsv} />
            </Panel>
        </>
    );
}
