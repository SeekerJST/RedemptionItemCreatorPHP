import { describe, expect, it } from 'vitest';
import { createInitialItem, isOneLevelDeep, itemReducer, toApiItem } from './item.js';

describe('item reducer', () => {
    it('adds a sub-row with starting values (e.g. an Attack Multiplier under an Attack)', () => {
        let item = createInitialItem();
        item = itemReducer(item, { type: 'addRow', section: 'attributes', parentId: 1, values: { AttributeName: 40, Scale: '3', Implementation: 'plasma' } });
        expect(item.attributes[1]).toMatchObject({ id: 2, parentId: 1, AttributeName: 40, Scale: '3', Rank: 1, Implementation: 'plasma' });
    });

    it('keeps the Implementation when a row is edited, and clears a blank one to null', () => {
        let item = createInitialItem();
        item = itemReducer(item, { type: 'updateRow', section: 'attributes', id: 1, values: { Implementation: 'kinetic' } });
        expect(item.attributes[0].Implementation).toBe('kinetic');
        item = itemReducer(item, { type: 'updateRow', section: 'attributes', id: 1, values: { Implementation: '' } });
        expect(item.attributes[0].Implementation).toBeNull();
    });
});

// A saved item as getitem returns it: an Attack with a Kinetic Multiplier sub-row (listed first,
// as a drag can leave it), a Modifier, and a tag and limitation.
const savedItem = {
    itemID: 'abc-123',
    itemName: 'Gauss Rifle',
    itemSize: 'SMALL',
    CostRating: 0,
    modifierList: [{ modifierID: 'Modifier_3', modifierName: 'Firearms' }],
    taskList: [],
    attributeList: [
        { id: 2, parentId: 1, AttributeSystem: 'Weapons', AttributeName: 40, Scale: '1', Rank: 2, Implementation: 'kinetic', BuildPoints: 27, PowerSlots: 0 },
        { id: 1, parentId: null, AttributeSystem: 'Weapons', AttributeName: 3, Scale: '1', Rank: 1, Implementation: null, BuildPoints: 10, PowerSlots: 1 },
        { id: 3, parentId: null, AttributeSystem: 'Modifiers', AttributeName: 20, Scale: '1', Rank: 2, Implementation: null, BuildPoints: 20, PowerSlots: 0 },
    ],
    limitList: [{ id: 1, LimitDesc: 'Loud', LimitScale: '1', BuildPoints: -10 }],
    tagList: [{ id: 1, TagDesc: 'Rugged', TagRank: '2', TagFree: true, BuildPoints: 20 }],
};

/** Just enough of summarizeItem's result for toApiItem. */
function fakeSummary(item) {
    const byId = (value) => new Map(item.attributes.map((row) => [row.id, value(row)]));
    return {
        costRating: 0,
        modifiers: item.attributes
            .filter((row) => row.AttributeName === 20)
            .map((row) => ({ ...row, skill: item.modifierSkills[row.id] })),
        tasks: [],
        attributeSystems: byId((row) => row.AttributeSystem ?? item.attributes.find((p) => p.id === row.parentId)?.AttributeSystem ?? null),
        attributeCosts: byId(() => ({ buildPoints: 0, power: { uses: 0 } })),
        limitCosts: new Map(item.limits.map((row) => [row.id, 0])),
        tagCosts: new Map(item.tags.map((row) => [row.id, 0])),
    };
}

describe('loading a saved item', () => {
    const item = itemReducer(createInitialItem(), { type: 'loadItem', apiItem: savedItem });

    it('restores the ID, name, size, and rows in their saved order, and starts clean', () => {
        expect(item).toMatchObject({ itemId: 'abc-123', name: 'Gauss Rifle', size: 'SMALL', dirty: false });
        expect(item.attributes.map((row) => row.id)).toEqual([2, 1, 3]);
        expect(item.attributes[0]).toMatchObject({ parentId: 1, AttributeName: 40, Rank: 2, Implementation: 'kinetic' });
        expect(item.tags[0]).toEqual({ id: 1, TagDesc: 'Rugged', TagRank: '2', TagFree: true });
        expect(item.limits[0]).toEqual({ id: 1, LimitDesc: 'Loud', LimitScale: '1' });
    });

    it('drops a sub-row system that just repeats its parent, so it keeps following its parent', () => {
        expect(item.attributes[0].AttributeSystem).toBeNull();
        expect(item.attributes[1].AttributeSystem).toBe('Weapons');
    });

    it('restores Modifier skills by row id', () => {
        expect(item.modifierSkills).toEqual({ 3: 'Firearms' });
    });

    it('saves back the same rows it loaded', () => {
        const api = toApiItem(item, fakeSummary(item));
        expect(api.itemID).toBe('abc-123');
        expect(api.modifierList).toEqual(savedItem.modifierList);
        expect(api.attributeList.map(({ id, parentId, AttributeSystem, AttributeName, Scale, Rank, Implementation }) =>
            ({ id, parentId, AttributeSystem, AttributeName, Scale, Rank, Implementation })
        )).toEqual(savedItem.attributeList.map(({ id, parentId, AttributeSystem, AttributeName, Scale, Rank, Implementation }) =>
            ({ id, parentId, AttributeSystem, AttributeName, Scale, Rank, Implementation })
        ));
    });

    it('marks edits dirty until saved, and a save keeps the new ID', () => {
        let edited = itemReducer(item, { type: 'setName', name: 'Gauss Rifle Mk II' });
        expect(edited.dirty).toBe(true);
        edited = itemReducer(edited, { type: 'saved', itemId: 'abc-123' });
        expect(edited).toMatchObject({ dirty: false, itemId: 'abc-123', name: 'Gauss Rifle Mk II' });
    });

    it('starts over with New', () => {
        expect(itemReducer(item, { type: 'newItem' })).toEqual(createInitialItem());
    });
});

describe('isOneLevelDeep', () => {
    it('accepts top-level rows and sub-rows of top-level rows', () => {
        expect(isOneLevelDeep([{ id: 1, parentId: null }, { id: 2, parentId: 1 }, { id: 3, parentId: 1 }, { id: 4, parentId: null }])).toBe(true);
    });
    it('rejects a sub-row of a sub-row', () => {
        expect(isOneLevelDeep([{ id: 1, parentId: null }, { id: 2, parentId: 1 }, { id: 3, parentId: 2 }])).toBe(false);
    });
});
