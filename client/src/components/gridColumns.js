// SVAR column configs for the three grids, and for the sidebar editor.
// A column with an `editor` becomes a field in the sidebar; the others are display-only.

import { SCALES, SYSTEMS, TAG_RANKS } from '../domain/constants.js';
import { ATTRIBUTE_RULES, GRADE_NAMES, SCALE_NAMES, resolveAttributeName } from '../domain/rules/index.js';
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
const attributeSelect = (attributes) => ({
    id: 'AttributeName',
    header: 'Attribute',
    ...select(attributes.map((a) => ({ id: a.AttributeID, label: a.AttributeName }))),
});

/**
 * The attributes a row can be, given where it sits: a sub-row lists only the children its
 * parent allows (Attack -> Attack Multiplier, Area, ...); a top-level row lists everything
 * that can stand alone (not an Attack Multiplier). The row's current attribute is always
 * kept, so an existing (invalid) choice still shows; validation flags it.
 */
function attributesFor(attributes, parentKey, currentAttributeId) {
    const allowed = parentKey ? ATTRIBUTE_RULES[parentKey]?.children ?? [] : null;
    return attributes.filter((a) => {
        if (a.AttributeID === Number(currentAttributeId)) {
            return true;
        }
        const key = resolveAttributeName(a.AttributeName)?.key;
        return allowed ? allowed.includes(key) : !ATTRIBUTE_RULES[key]?.subRowOnly;
    });
}

/**
 * The first attribute a new sub-row of `parentKey` should start as (e.g. Attack Multiplier
 * under an Attack, Maneuver under a Drive), or null if the parent takes no sub-rows.
 */
export function firstChildAttributeId(attributes, parentKey) {
    const [first] = ATTRIBUTE_RULES[parentKey]?.children ?? [];
    return first ? attributes.find((a) => resolveAttributeName(a.AttributeName)?.key === first)?.AttributeID ?? null : null;
}

/**
 * Grid columns for attributes. AttributeLabel, GradeLabel, and PowerLabel are computed per
 * row by the caller (ItemEditor), because what they say depends on the attribute.
 */
export function attributeColumns() {
    return [
        hiddenId,
        systemColumn,
        { id: 'AttributeLabel', header: 'Attribute', width: 154, treetoggle: true },
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
 * Sidebar editor fields for one attribute row:
 * - Attribute: only what fits where the row sits (see attributesFor)
 * - Implementation / Type: for attributes that have them (e.g. Attack Multiplier, Resource);
 *   Tse only under an Attack (Melee)
 * - Grade / Combat scale: only the grades the attribute comes in; left out where the grade
 *   doesn't matter (e.g. Body, which follows the item's size)
 * - Rank: labelled by what it means for the attribute
 *
 * @param {Array<{AttributeID, AttributeName}>} attributes from the lookups
 * @param {object} row the row being edited (with any unsaved Attribute choice)
 * @param {string|null} key the row's rule key (null if the rules don't know the attribute)
 * @param {string|null} parentKey the parent row's rule key, for a sub-row
 */
export function attributeEditorColumns(attributes, row, key, parentKey = null) {
    const rule = ATTRIBUTE_RULES[key];
    const columns = [systemColumn, attributeSelect(attributesFor(attributes, parentKey, row.AttributeName))];

    // Communication's implementations come from its name ("Communication (Radio)"), not a field.
    if (rule?.implementations && key !== 'communication') {
        const options = Object.entries(rule.implementations)
            .filter(([, implementation]) => !implementation.meleeOnly || parentKey === 'attackMelee')
            .map(([id, implementation]) => ({ id, label: implementation.name }));
        columns.push({ id: 'Implementation', header: key === 'resource' ? 'Type' : 'Implementation', ...select(options) });
    }

    if (!rule || rule.gradeKind !== 'none') {
        const names = rule?.gradeKind === 'scale' ? SCALE_NAMES : GRADE_NAMES;
        const grades = rule?.grades ?? [1, 2, 3];
        columns.push({
            id: 'Scale',
            header: rule?.gradeKind === 'scale' ? 'Combat scale' : 'Grade',
            ...select(grades.map((grade) => ({ id: String(grade), label: names[grade] }))),
        });
    }

    const rankLabel = RANK_LABELS[rule?.rank.meaning] ?? 'Rank';
    columns.push({ id: 'Rank', header: rankLabel, editor: 'text' });
    return columns;
}
