import { describe, expect, it } from 'vitest';
import { UNCATEGORIZED, categoriesOf, groupInventory } from './inventory.js';

const items = [
    { itemID: '1', itemName: 'Plasma Carbine', itemType: 'Ranged Weapons' },
    { itemID: '2', itemName: 'Knife', itemType: 'Melee Weapons' },
    { itemID: '3', itemName: 'Gauss Rifle', itemType: 'Ranged Weapons' },
    { itemID: '4', itemName: 'Test Build', itemType: null },
    { itemID: '5', itemName: 'Powered Armor', itemType: 'Armor' },
];
const shape = (groups) => groups.map((g) => [g.category, g.items.map((i) => i.itemName)]);

describe('inventory grouping', () => {
    it('groups by category A-Z, Uncategorized last, items A-Z', () => {
        expect(shape(groupInventory(items))).toEqual([
            ['Armor', ['Powered Armor']],
            ['Melee Weapons', ['Knife']],
            ['Ranged Weapons', ['Gauss Rifle', 'Plasma Carbine']],
            [UNCATEGORIZED, ['Test Build']],
        ]);
    });

    it('searches names and categories, every word, any case', () => {
        expect(shape(groupInventory(items, 'RIFLE'))).toEqual([['Ranged Weapons', ['Gauss Rifle']]]);
        expect(shape(groupInventory(items, 'ranged plasma'))).toEqual([['Ranged Weapons', ['Plasma Carbine']]]);
        expect(shape(groupInventory(items, 'weapons'))).toHaveLength(2);
        expect(groupInventory(items, 'zzz')).toEqual([]);
    });

    it('lists the categories in use for suggestions', () => {
        expect(categoriesOf(items)).toEqual(['Armor', 'Melee Weapons', 'Ranged Weapons']);
    });
});
