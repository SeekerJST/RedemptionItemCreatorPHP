// SVAR column configs for the three grids. A column with an `editor` becomes a
// field in the sidebar editor; the others (costs) are display-only.

import { SCALES, SYSTEMS, TAG_RANKS } from '../domain/constants.js';

const select = (options) => ({
    editor: { type: 'richselect', config: { template: (option) => option.label } },
    options,
});

const hiddenId = { id: 'id', width: 50, hidden: true };

export const tagColumns = [
    hiddenId,
    { id: 'TagDesc', header: 'Description', width: 398, editor: 'text' },
    { id: 'TagRank', header: 'Rank', width: 75, ...select(TAG_RANKS) },
    { id: 'TagFree', header: 'Free', width: 50, editor: { type: 'switch' } },
    { id: 'BuildPoints', header: 'BP Cost', width: 75 },
];

export const limitColumns = [
    hiddenId,
    { id: 'LimitDesc', header: 'Description', width: 374, editor: 'text' },
    { id: 'LimitScale', header: 'Scale', width: 150, ...select(SCALES) },
    { id: 'BuildPoints', header: 'BP Cost', width: 75 },
];

/** @param {Array<{AttributeID: number, AttributeName: string}>} attributes from the lookups */
export function attributeColumns(attributes) {
    return [
        hiddenId,
        { id: 'AttributeSystem', header: 'System', width: 100, ...select(SYSTEMS.map((name) => ({ id: name, label: name }))) },
        {
            id: 'AttributeName',
            header: 'Attribute',
            width: 154,
            treetoggle: true,
            ...select(attributes.map((a) => ({ id: a.AttributeID, label: a.AttributeName }))),
        },
        { id: 'Scale', header: 'Scale', width: 100, ...select(SCALES) },
        { id: 'Rank', header: 'Rank', width: 75, editor: 'text' },
        { id: 'BuildPoints', header: 'BP Cost', width: 75 },
        { id: 'PowerSlots', header: 'Power Slots', width: 95 },
    ];
}
