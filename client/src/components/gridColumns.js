// SVAR column configs for the three grids, and for the sidebar editor.
// A column with an `editor` becomes a field in the sidebar; the others are display-only.

import { SCALES, SYSTEMS, TAG_RANKS } from '../domain/constants.js';
import { ATTRIBUTE_RULES, GRADE_NAMES, SCALE_NAMES } from '../domain/rules/index.js';
import { RANK } from '../domain/rules/common.js';

const select = (options) => ({
    editor: { type: 'richselect', config: { template: (option) => option.label } },
    options,
});

const hiddenId = { id: 'id', width: 50, hidden: true };
const GRADE_OPTIONS = SCALES.map((scale) => ({ id: scale.id, label: scale.name }));

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
    { id: 'LimitScale', header: 'Grade', width: 150, ...select(GRADE_OPTIONS) },
    { id: 'BuildPoints', header: 'BP Cost', width: 75 },
];

const systemColumn = { id: 'AttributeSystem', header: 'System', width: 100, ...select(SYSTEMS.map((name) => ({ id: name, label: name }))) };
const attributeColumn = (attributes) => ({
    id: 'AttributeName',
    header: 'Attribute',
    width: 154,
    treetoggle: true,
    ...select(attributes.map((a) => ({ id: a.AttributeID, label: a.AttributeName }))),
});

/**
 * Grid columns for attributes. GradeLabel and PowerLabel are computed per row by the
 * caller (ItemEditor), because what they say depends on the attribute.
 * @param {Array<{AttributeID: number, AttributeName: string}>} attributes from the lookups
 */
export function attributeColumns(attributes) {
    return [
        hiddenId,
        systemColumn,
        attributeColumn(attributes),
        { id: 'GradeLabel', header: 'Grade / Scale', width: 110 },
        { id: 'Rank', header: 'Rank', width: 75 },
        { id: 'BuildPoints', header: 'BP Cost', width: 75 },
        { id: 'PowerLabel', header: 'Power', width: 80 },
    ];
}

/** What the Rank number means for each kind of attribute, as the editor labels it. */
const RANK_LABELS = {
    [RANK.RANK]: 'Rank',
    [RANK.QUANTITY]: 'Quantity',
    [RANK.PURCHASES]: 'Purchases',
    [RANK.MOUNTS]: 'Mounts (1 + extra turrets)',
    [RANK.MULTIPLIER_STEPS]: 'Multiplier steps (+1x each)',
    [RANK.INCREMENTS]: 'Increments (4 launchers each)',
    [RANK.TARGET_NUMBER]: 'Task TN',
};

/**
 * Sidebar editor fields for one attribute row: its grade field only offers the grades that
 * attribute comes in, labelled as a combat scale where it is one, and is left out where the
 * grade doesn't matter (e.g. Body, which follows the item's size).
 *
 * @param {Array<{AttributeID, AttributeName}>} attributes from the lookups
 * @param {string|null} key the row's rule key (null if the rules don't know the attribute)
 */
export function attributeEditorColumns(attributes, key) {
    const rule = ATTRIBUTE_RULES[key];
    const columns = [systemColumn, attributeColumn(attributes)];

    if (!rule || rule.gradeKind !== 'none') {
        const names = rule?.gradeKind === 'scale' ? SCALE_NAMES : GRADE_NAMES;
        const grades = rule?.grades ?? [1, 2, 3];
        columns.push({
            id: 'Scale',
            header: rule?.gradeKind === 'scale' ? 'Combat scale' : 'Grade',
            ...select(grades.map((grade) => ({ id: String(grade), label: names[grade] }))),
        });
    }

    const rankLabel = key === 'legacyAttack' ? 'Weapon Multiplier (2 = 2x)' : RANK_LABELS[rule?.rank.meaning] ?? 'Rank';
    columns.push({ id: 'Rank', header: rankLabel, editor: 'text' });
    return columns;
}
