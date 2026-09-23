import { useMemo } from 'react';
import EditableGrid from './EditableGrid.jsx';
import ItemHeader from './ItemHeader.jsx';
import LimitCounts from './LimitCounts.jsx';
import Section from './Section.jsx';
import { attributeColumns, limitColumns, tagColumns } from './gridColumns.js';

/** Panel 2: the item's name and size, and its Tags, Attributes, and Limitations grids. */
export default function ItemEditor({ item, dispatch, summary, lookups }) {
    const columnsForAttributes = useMemo(() => attributeColumns(lookups.attributes), [lookups.attributes]);

    // What each grid displays: the row as stored, plus its computed cost columns.
    const tagRows = item.tags.map((row) => ({ ...row, BuildPoints: summary.tagCosts.get(row.id) }));
    const limitRows = item.limits.map((row) => ({ ...row, BuildPoints: summary.limitCosts.get(row.id) }));
    const attributeRows = item.attributes.map((row) => {
        const cost = summary.attributeCosts.get(row.id);
        return { ...row, BuildPoints: cost.buildPoints, PowerSlots: cost.powerSlots };
    });

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
                    <EditableGrid rows={tagRows} columns={tagColumns} onReorder={reorder('tags')} {...handlersFor('tags')} />
                </Section>
                <br />

                <Section title="Attributes" ruleWidth="600px" onAdd={add('attributes')}>
                    <EditableGrid
                        rows={attributeRows}
                        columns={columnsForAttributes}
                        tree
                        onReorder={reorder('attributes')}
                        {...handlersFor('attributes')}
                    />
                </Section>

                <Section title="Limitations" ruleWidth="500px" onAdd={add('limits')}>
                    <div className="limitationBody">
                        <LimitCounts counts={summary.limitCounts} />
                        <EditableGrid rows={limitRows} columns={limitColumns} {...handlersFor('limits')} />
                    </div>
                </Section>
            </div>
        </>
    );
}
