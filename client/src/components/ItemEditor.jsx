import { useCallback, useMemo, useState } from 'react';
import { Button } from '@svar-ui/react-core';
import EditableGrid from './EditableGrid.jsx';
import ItemHeader from './ItemHeader.jsx';
import LimitCounts from './LimitCounts.jsx';
import Section from './Section.jsx';
import { attributeColumns, attributeEditorColumns, firstChildAttributeId, limitColumns, tagColumns } from './gridColumns.js';
import { isOneLevelDeep } from '../domain/item.js';
import { ATTRIBUTE_RULES, gradeLabel, resolveAttributeName } from '../domain/rules/index.js';

/** Changing these in the attribute editor re-shapes it right away (grade options, Rank label). */
const LIVE_ATTRIBUTE_FIELDS = ['AttributeName'];

/** "+3" for a power source, the slot count for a power user, blank otherwise. */
const powerLabel = ({ provides, uses }) => (provides ? `+${provides}` : uses ? String(uses) : '');

/** Panel 2: the item's name and size, and its Tags, Attributes, and Limitations grids. */
export default function ItemEditor({ item, dispatch, summary, lookups, categories, toolbar, status, confirm, onCancelConfirm }) {
    const columnsForAttributes = useMemo(() => attributeColumns(), []);
    const [selectedAttributeId, setSelectedAttributeId] = useState(null);
    const selectedAttribute = item.attributes.find((row) => row.id === selectedAttributeId);

    // AttributeID -> { name, key } from the lookups (key: the rule; null if the rules don't know it).
    const attributeInfo = useMemo(
        () =>
            new Map(
                lookups.attributes.map((a) => [a.AttributeID, { name: a.AttributeName, key: resolveAttributeName(a.AttributeName)?.key ?? null }])
            ),
        [lookups.attributes]
    );
    const keyOf = useCallback((attributeId) => attributeInfo.get(Number(attributeId))?.key ?? null, [attributeInfo]);

    // [+>] adds a sub-row under a selected top-level row whose attribute takes sub-rows.
    const selectedKey = selectedAttribute ? keyOf(selectedAttribute.AttributeName) : null;
    const canAddSubRow =
        selectedAttribute != null && selectedAttribute.parentId == null && (ATTRIBUTE_RULES[selectedKey]?.children ?? []).length > 0;
    let subRowHint = 'Add a sub-row under the selected attribute';
    if (!selectedAttribute) {
        subRowHint = 'Select an attribute row to add a sub-row under it';
    } else if (selectedAttribute.parentId != null) {
        subRowHint = 'Sub-rows can only be one level deep: select a top-level row';
    } else if (!canAddSubRow) {
        subRowHint = (attributeInfo.get(Number(selectedAttribute.AttributeName))?.name ?? 'This attribute') + ' takes no sub-rows';
    }

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
                const key = summary.ruleKeys.get(row.id);
                const rule = ATTRIBUTE_RULES[key];
                // Show a chosen implementation in the name ("Attack Multiplier (Plasma)"), but not the default.
                const shownImplementation =
                    row.Implementation && row.Implementation !== rule?.defaultImplementation && key !== 'communication'
                        ? rule?.implementations?.[row.Implementation]?.name
                        : null;
                const name = attributeInfo.get(Number(row.AttributeName))?.name ?? '?';
                return {
                    ...row,
                    // So the editor shows the default implementation as selected.
                    Implementation: row.Implementation ?? rule?.defaultImplementation ?? null,
                    AttributeLabel: shownImplementation ? name + ' (' + shownImplementation + ')' : name,
                    BuildPoints: cost.buildPoints,
                    GradeLabel: gradeLabel(key, Number(row.Scale)),
                    PowerLabel: powerLabel(cost.power),
                };
            }),
        [item.attributes, summary.attributeCosts, summary.ruleKeys, attributeInfo]
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
    // The editor's fields follow the Attribute picked in it, even before Save, and a sub-row's
    // Attribute list is limited to what its parent allows.
    const editorColumnsForAttribute = useCallback(
        (row) => {
            const parent = row.parentId != null ? item.attributes.find((p) => p.id === row.parentId) : null;
            return attributeEditorColumns(lookups.attributes, row, keyOf(row.AttributeName), parent ? keyOf(parent.AttributeName) : null);
        },
        [lookups.attributes, item.attributes, keyOf]
    );

    // Callbacks shared by the three sections; `section` is the key in the item state.
    const handlersFor = (section) => ({
        onUpdate: (id, values) => dispatch({ type: 'updateRow', section, id, values }),
        onDelete: (id) => dispatch({ type: 'deleteRow', section, id }),
    });
    const add = (section) => () => dispatch({ type: 'addRow', section });
    /** Returns false (and the grid snaps back) for a drag that would nest attributes two deep. */
    const reorder = (section) => (order) => {
        if (section === 'attributes' && !isOneLevelDeep(order)) {
            return false;
        }
        dispatch({ type: 'reorderRows', section, order });
        return true;
    };
    const addSubRow = () =>
        dispatch({
            type: 'addRow',
            section: 'attributes',
            parentId: selectedAttribute.id,
            values: { AttributeName: firstChildAttributeId(lookups.attributes, selectedKey) ?? 1, Scale: selectedAttribute.Scale },
        });

    return (
        <>
            <ItemHeader
                name={item.name}
                size={item.size}
                sizes={lookups.sizes}
                onNameChange={(name) => dispatch({ type: 'setName', name })}
                onSizeChange={(size) => dispatch({ type: 'setSize', size })}
                category={item.category}
                categories={categories}
                onCategoryChange={(category) => dispatch({ type: 'setCategory', category })}
                toolbar={toolbar}
                status={status}
                confirm={confirm}
                onCancelConfirm={onCancelConfirm}
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
                            disabled={!canAddSubRow}
                            title={subRowHint}
                            onClick={addSubRow}
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
