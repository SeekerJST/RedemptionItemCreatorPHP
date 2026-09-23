import { useState } from 'react';
import { Button } from '@svar-ui/react-core';
import ModifierList from './ModifierList.jsx';
import PowerSlotList from './PowerSlotList.jsx';
import StructureList from './StructureList.jsx';
import SystemBreakdown from './SystemBreakdown.jsx';
import TaskList from './TaskList.jsx';

const Rule = ({ span = 4 }) => (
    <tr>
        <td colSpan={span}><hr /></td>
    </tr>
);

/** Panel 3: Build Point and Cost Rating totals, structure, power, systems, modifiers, tasks. */
export default function BuildSummary({ item, dispatch, summary, skills, onExport }) {
    const [exportError, setExportError] = useState(null);

    const handleExport = async () => {
        setExportError(null);
        try {
            await onExport();
        } catch (e) {
            setExportError(`Export failed: ${e.message}`);
        }
    };

    return (
        <div>
            <div>
                <div className="breakdown-left">Build Point Summary</div>
                <div className="breakdown-right">
                    <Button type="primary" onClick={handleExport}>[Export CSV]</Button>
                </div>
            </div>
            {exportError && <p role="alert" style={{ color: 'darkred', clear: 'both' }}>{exportError}</p>}

            <table>
                <tbody>
                    <Rule />
                    <tr>
                        <td className="panel_table_left">Base Build Points: </td>
                        <td className="panel_table_right">{summary.basePoints}</td>
                        <td className="panel_table_left">Total Build Points:</td>
                        <td className="panel_table_right">{summary.totalBP}</td>
                    </tr>
                    <tr>
                        <td className="panel_table_left">Base Cost Rating:</td>
                        <td className="panel_table_right">{summary.baseCR}</td>
                        <td className="panel_table_left"><b>Cost Rating: </b></td>
                        <td className="panel_table_right"><b>{summary.costRating}</b></td>
                    </tr>
                    <tr>
                        <td className="panel_table_left">Cost Rating Increment: </td>
                        <td className="panel_table_right">{summary.incrementPoints}</td>
                    </tr>
                    <Rule />
                    <tr>
                        <td colSpan={2}>
                            <StructureList body={summary.body} armor={summary.armor} forceField={summary.forceField} />
                        </td>
                        <td colSpan={2} className="itemContents">
                            <PowerSlotList powerSlots={summary.powerSlots} />
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={4}>
                            <SystemBreakdown systems={summary.systems} />
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2} className="itemContents">
                            <ModifierList
                                modifiers={summary.modifiers}
                                selectedSkills={item.modifierSkills}
                                skills={skills}
                                onChange={(rowId, skill) => dispatch({ type: 'setModifierSkill', rowId, skill })}
                            />
                        </td>
                        <td colSpan={2} className="itemContents">
                            <TaskList
                                tasks={summary.tasks}
                                names={item.taskNames}
                                onChange={(rowId, name) => dispatch({ type: 'setTaskName', rowId, name })}
                            />
                        </td>
                    </tr>
                    <Rule />
                </tbody>
            </table>
        </div>
    );
}
