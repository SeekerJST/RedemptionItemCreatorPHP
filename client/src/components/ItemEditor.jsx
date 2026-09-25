import { useCallback, useMemo, useState } from 'react';
import { Button } from '@svar-ui/react-core';
import EditableGrid from './EditableGrid.jsx';
import ItemHeader from './ItemHeader.jsx';
import LimitCounts from './LimitCounts.jsx';
import Section from './Section.jsx';
import { attributeColumns, attributeEditorColumns, limitColumns, tagColumns } from './gridColumns.js';
import { gradeLabel, resolveAttributeName } from '../domain/rules/index.js';

/** Changing these in the attribute editor re-shapes it right away (grade options, Rank label). */
const LIVE_ATTRIBUTE_FIELDS = ['AttributeName'];

/** "+3" for a power source, the slot count for a power user, blank otherwise. */
const powerLabel = ({ provides, uses }) => (provides ? `+${provides}` : uses ? String(uses) : '');

/** Panel 2: the item's name and size, and its Tags, Attributes, and Limitations grids. */
export default function ItemEditor({ item, dispatch, summary, lookups }) {
    const columnsForAttributes = useMemo(() => attributeColumns(lookups.attributes), [lookups.attributes]);
    const [selectedAttributeId, setSelectedAttributeId] = useState(null);
    const selectedAttribute = item.attributes.find((row) => row.id === selectedAttributeId);

    // What each grid displays: the row as stored, plus its computed cost columns.
    // Memoized: a new array makes the grid re-initialize and rebuild its rows, which
    // would, for example, cancel a drag that starts by selecting a row.
    const tagRows = useMemo(
        () => item.tags.map((row) => ({ ...row, BuildPoints: summary.tagCosts.get(row.id) })),
        [item.tags, summary.tagCosts]
    );
    const limitRows = useMemo(
        () => item.limits.map((row) => ({ ...row, BuildPoints: summary.limitCosts.get(row.id) })),
        [item.limits, summary.limitCosts]
    );
    const attributeRows = useMemo(
        () =>
            item.attributes.map((row) => {
                const cost = summary.attributeCosts.get(row.id);
                return {
                    ...row,
                    BuildPoints: cost.buildPoints,
                    GradeLabel: gradeLabel(summary.ruleKeys.get(row.id), Number(row.Scale)),
                    PowerLabel: powerLabel(cost.power),
                };
            }),
        [item.attributes, summary.attributeCosts, summary.ruleKeys]
    );

    // Rows with a validation error or warning get a highlight class (styles in App.css).
    const { rowStatus } = summary;
    const rowClassFor = useCallback(
        (section) => (row) => {
            const status = rowStatus.get(`${section}:${row.id}`);
            return status ? `row-${status}` : '';
        },
        [rowStatus]
    );
    // The editor's fields follow the Attribute picked in it, even before Save.
    const editorColumnsForAttribute = useCallback(
        (row) => {
            const name = lookups.attributes.find((a) => a.AttributeID === Number(row.AttributeName))?.AttributeName;
            return attributeEditorColumns(lookups.attributes, resolveAttributeName(name)?.key ?? null);
        },
        [lookups.attributes]
    );

    // Callbacks shared by the three sections; `section` is the key in the item state.
    const handlersFor = (section) => ({
        onUpdate: (id, values) => dispatch({ type: 'updateRow', section, id, values }),
        onDelete: (id) => dispatch({ type: 'deleteRow', section, id }),
    });
    const add = (section) => () => dispatch({ type: 'addRow', section });
    const reorder = (section) => (order) => dispatch({ type: 'reorderRows', section, order });

    return (
        <>
            <ItemHeader
                name={item.name}
                size={item.size}
                sizes={lookups.sizes}
                onNameChange={(name) => dispatch({ type: 'setName', name })}
                onSizeChange={(size) => dispatch({ type: 'setSize', size })}
            />

            <div className="section_container">
                <Section title="Tags" ruleWidth="500px" onAdd={add('tags')}>
                    <EditableGrid
                        rows={tagRows}
                        columns={tagColumns}
                        onReorder={reorder('tags')}
                        rowClass={rowClassFor('tags')}
                        {...handlersFor('tags')}
                    />
                </Section>
                <br />

                <Section
                    title="Attributes"
                    ruleWidth="600px"
                    onAdd={add('attributes')}
                    actions={
                        <Button
                            type="primary"
                            disabled={!selectedAttribute}
                            title={selectedAttribute ? 'Add a sub-row under the selected attribute' : 'Select an attribute row to add a sub-row under it'}
                            onClick={() => dispatch({ type: 'addRow', section: 'attributes', parentId: selectedAttribute.id })}
                        >
                            [+&gt;]
                        </Button>
                    }
                >
                    <EditableGrid
                        rows={attributeRows}
                        columns={columnsForAttributes}
                        tree
                        onReorder={reorder('attributes')}
                        onSelect={setSelectedAttributeId}
                        rowClass={rowClassFor('attributes')}
                        editorColumns={editorColumnsForAttribute}
                        liveFields={LIVE_ATTRIBUTE_FIELDS}
                        {...handlersFor('attributes')}
                    />
                </Section>

                <Section title="Limitations" ruleWidth="500px" onAdd={add('limits')}>
                    <div className="limitationBody">
                        <LimitCounts counts={summary.limitCounts} />
                        <EditableGrid rows={limitRows} columns={limitColumns} rowClass={rowClassFor('limits')} {...handlersFor('limits')} />
                    </div>
                </Section>
            </div>
        </>
    );
}
