import { describe, expect, it } from 'vitest';
import { UNCATEGORIZED, groupInventory, knownCategories, pathKeys, splitCategory } from './inventory.js';

const item = (itemName, category) => ({ itemID: itemName, itemName, category });

describe('splitCategory', () => {
    it('splits "Group: Subgroup", keeps one level, and files blanks under Uncategorized', () => {
        expect(splitCategory('Weapons: Firearms')).toEqual(['Weapons', 'Firearms']);
        expect(splitCategory('Armor')).toEqual(['Armor', null]);
        expect(splitCategory('  ')).toEqual([UNCATEGORIZED, null]);
        expect(splitCategory(null)).toEqual([UNCATEGORIZED, null]);
        expect(splitCategory('Shohan:')).toEqual(['Shohan', null]);
    });
});

describe('groupInventory', () => {
    const tree = groupInventory([
        item('Sniper Rifle', 'Weapons: Firearms'),
        item('Knife', 'Weapons: Melee'),
        item('My Blaster', ''),
        item('Standard Gauss Pistol', 'Weapons: Firearms'),
        item('Stealth Suit', 'Armor'),
        item('Camouflage Suit', 'Armor'),
    ]);

    it('orders groups by name, Uncategorized last', () => {
        expect(tree.map((g) => g.label)).toEqual(['Armor', 'Weapons', UNCATEGORIZED]);
    });

    it('nests subgroups, with items in name order', () => {
        const weapons = tree[1];
        expect(weapons.items).toEqual([]);
        expect(weapons.subgroups.map((s) => [s.key, s.items.map((i) => i.itemName)])).toEqual([
            ['Weapons/Firearms', ['Sniper Rifle', 'Standard Gauss Pistol']],
            ['Weapons/Melee', ['Knife']],
        ]);
    });

    it('lists a one-level category\'s items directly', () => {
        expect(tree[0].subgroups).toEqual([]);
        expect(tree[0].items.map((i) => i.itemName)).toEqual(['Camouflage Suit', 'Stealth Suit']);
    });
});

describe('pathKeys and knownCategories', () => {
    it('names the nodes to open for an item', () => {
        expect(pathKeys('Weapons: Firearms')).toEqual(['Weapons', 'Weapons/Firearms']);
        expect(pathKeys('')).toEqual([UNCATEGORIZED]);
    });

    it('lists each category once, sorted', () => {
        expect(knownCategories([item('a', 'Weapons: Melee'), item('b', 'Armor'), item('c', 'Armor'), item('d', '')])).toEqual(['Armor', 'Weapons: Melee']);
    });
});
