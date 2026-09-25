import { describe, expect, it } from 'vitest';
import { createInitialItem, isOneLevelDeep, itemReducer } from './item.js';

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

describe('isOneLevelDeep', () => {
    it('accepts top-level rows and sub-rows of top-level rows', () => {
        expect(isOneLevelDeep([{ id: 1, parentId: null }, { id: 2, parentId: 1 }, { id: 3, parentId: 1 }, { id: 4, parentId: null }])).toBe(true);
    });
    it('rejects a sub-row of a sub-row', () => {
        expect(isOneLevelDeep([{ id: 1, parentId: null }, { id: 2, parentId: 1 }, { id: 3, parentId: 2 }])).toBe(false);
    });
});
