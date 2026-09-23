import { useMemo, useReducer } from 'react';
import Starfield from 'react-starfield';
import { downloadItemCsv } from './api/itemCreatorApi.js';
import ItemEditor from './components/ItemEditor.jsx';
import Panel from './components/Panel.jsx';
import BuildSummary from './components/summary/BuildSummary.jsx';
import { createInitialItem, itemReducer, toApiItem } from './domain/item.js';
import { summarizeItem } from './domain/summary.js';
import { useLookups } from './hooks/useLookups.js';
import './App.css';

export default function App() {
    const { lookups, error } = useLookups();

    return (
        <div>
            <Starfield starCount={1000} starColor={[255, 255, 255]} speedFactor={0.01} backgroundColor="black" />
            <div className="panel_header">
                <div className="top_panel">Redemption Gear Creator</div>
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

    const exportCsv = () => downloadItemCsv(toApiItem(item, summary, lookups.skills[0]?.skillName ?? ''));

    return (
        <>
            <Panel title="Panel.01" size="small">
                <p>Inventory</p>
            </Panel>
            <Panel title="Panel.02" size="large">
                <ItemEditor item={item} dispatch={dispatch} summary={summary} lookups={lookups} />
            </Panel>
            <Panel title="Panel.03" size="large">
                <BuildSummary item={item} dispatch={dispatch} summary={summary} skills={lookups.skills} onExport={exportCsv} />
            </Panel>
        </>
    );
}
