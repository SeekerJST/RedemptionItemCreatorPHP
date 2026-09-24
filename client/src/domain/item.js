// The item being built, as React state. The grids display this state; they
// don't own it. Row field names match the API's item JSON (TagDesc, LimitScale, ...).

import { ATTRIBUTE_IDS, MAX_MODIFIER_RANK } from './constants.js';

const newRow = {
    tags: (id) => ({ id, TagDesc: '', TagRank: '1', TagFree: false }),
    // parentId: the attribute row this one sits under (a sub-row), or null for a top-level row.
    // Rank starts at 1: many cost formulas give a non-zero (even higher) cost at rank 0.
    attributes: (id, parentId = null) => ({ id, parentId, AttributeSystem: null, AttributeName: 1, Scale: '1', Rank: 1 }),
    limits: (id) => ({ id, LimitDesc: '', LimitScale: '1' }),
};

/** The fields a user can edit in each section; anything else in editor values is ignored. */
const editableFields = {
    tags: ['TagDesc', 'TagRank', 'TagFree'],
    attributes: ['AttributeSystem', 'AttributeName', 'Scale', 'Rank'],
    limits: ['LimitDesc', 'LimitScale'],
};

export function createInitialItem() {
    return {
        name: '',
        size: '',
        tags: [newRow.tags(1)],
        attributes: [newRow.attributes(1)],
        limits: [newRow.limits(1)],
        /** Skill chosen for each Modifier attribute row, keyed by row id. */
        modifierSkills: {},
        /** Name typed for each Task attribute row, keyed by row id. */
        taskNames: {},
    };
}

export function itemReducer(item, action) {
    switch (action.type) {
        case 'setName':
            return { ...item, name: action.name };

        case 'setSize':
            return { ...item, size: action.size };

        case 'addRow': {
            // action.parentId (attributes only): add the new row as a sub-row of that row.
            const rows = item[action.section];
            const parentId = rows.some((row) => row.id === action.parentId) ? action.parentId : null;
            const id = Math.max(0, ...rows.map((row) => row.id)) + 1;
            return { ...item, [action.section]: [...rows, newRow[action.section](id, parentId)] };
        }

        case 'updateRow':
            return {
                ...item,
                [action.section]: item[action.section].map((row) =>
                    row.id === action.id ? normalizeRow(action.section, { ...row, ...pick(action.values, editableFields[action.section]) }) : row
                ),
            };

        case 'deleteRow': {
            // Deleting a row also deletes its sub-rows, and theirs.
            const doomed = withDescendants(item[action.section], action.id);
            return { ...item, [action.section]: item[action.section].filter((row) => !doomed.has(row.id)) };
        }

        case 'reorderRows': {
            // action.order: [{ id, parentId }] in the new display order, from the grid after a drag.
            // A drag in the attribute tree can also move a row under a different parent.
            const byId = new Map(item[action.section].map((row) => [row.id, row]));
            const reordered = action.order
                .filter(({ id }) => byId.has(id))
                .map(({ id, parentId }) => {
                    const row = byId.get(id);
                    return 'parentId' in row ? { ...row, parentId: parentId ?? null } : row;
                });
            return { ...item, [action.section]: reordered };
        }

        case 'setModifierSkill':
            return { ...item, modifierSkills: { ...item.modifierSkills, [action.rowId]: action.skill } };

        case 'setTaskName':
            return { ...item, taskNames: { ...item.taskNames, [action.rowId]: action.name } };

        default:
            throw new Error(`Unknown item action "${action.type}"`);
    }
}

/** The id plus the ids of every row below it in the tree. */
function withDescendants(rows, id) {
    const ids = new Set([id]);
    let grew = true;
    while (grew) {
        grew = false;
        for (const row of rows) {
            if (row.parentId != null && ids.has(row.parentId) && !ids.has(row.id)) {
                ids.add(row.id);
                grew = true;
            }
        }
    }
    return ids;
}

function pick(values, fields) {
    return Object.fromEntries(fields.filter((field) => field in values).map((field) => [field, values[field]]));
}

/** Keeps field types consistent no matter what the editor hands back. */
function normalizeRow(section, row) {
    switch (section) {
        case 'tags':
            return { ...row, TagRank: String(row.TagRank), TagFree: Boolean(row.TagFree) };
        case 'limits':
            return { ...row, LimitScale: String(row.LimitScale) };
        case 'attributes': {
            const AttributeName = Number(row.AttributeName);
            let Rank = Math.max(0, parseInt(row.Rank, 10) || 0);
            if (AttributeName === ATTRIBUTE_IDS.MODIFIER) {
                Rank = Math.min(Rank, MAX_MODIFIER_RANK);
            }
            return { ...row, AttributeName, Scale: String(row.Scale), Rank };
        }
        default:
            return row;
    }
}

/**
 * The item as the API's createitem/updateitem/export endpoints expect it.
 *
 * @param {object} item
 * @param {object} summary from summarizeItem
 * @param {string} defaultSkill shown for a Modifier row until a skill is picked
 */
export function toApiItem(item, summary, defaultSkill) {
    return {
        itemID: null,
        itemName: item.name,
        itemSize: item.size,
        CostRating: summary.costRating,
        modifierList: summary.modifiers.map((row) => ({
            modifierID: `Modifier_${row.id}`,
            modifierName: item.modifierSkills[row.id] ?? defaultSkill,
        })),
        taskList: summary.tasks.map((row) => ({
            taskID: `Task_${row.id}`,
            taskName: item.taskNames[row.id] ?? '',
        })),
        attributeList: item.attributes.map((row) => ({
            id: row.id,
            parentId: row.parentId,
            AttributeSystem: summary.attributeSystems.get(row.id),
            AttributeName: row.AttributeName,
            Scale: row.Scale,
            Rank: row.Rank,
            BuildPoints: summary.attributeCosts.get(row.id).buildPoints,
            PowerSlots: summary.attributeCosts.get(row.id).powerSlots,
        })),
        limitList: item.limits.map((row) => ({ ...row, BuildPoints: summary.limitCosts.get(row.id) })),
        tagList: item.tags.map((row) => ({ ...row, BuildPoints: summary.tagCosts.get(row.id) })),
    };
}
