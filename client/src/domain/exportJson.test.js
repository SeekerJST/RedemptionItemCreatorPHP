import { describe, expect, it } from 'vitest';
import { catalogItem, catalogLookups } from './catalog.js';
import { EXPORT_FORMAT, exportFileName, itemExport } from './exportJson.js';
import { fromApiItem } from './item.js';
import { summarizeItem } from './summary.js';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync(new URL('../../../db/seed/catalog.json', import.meta.url), 'utf-8'));
const carbine = catalog.items.find((entry) => entry.itemName === 'Plasma Carbine');

describe('JSON export', () => {
    const item = catalogItem(carbine);
    const summary = summarizeItem(item, catalogLookups);
    const exported = itemExport(item, summary, catalogLookups.attributes, new Date('2026-10-02T12:00:00Z'));

    it('says what it is', () => {
        expect(exported).toMatchObject({ format: EXPORT_FORMAT, version: 1, exportedAt: '2026-10-02T12:00:00.000Z' });
    });

    it('carries the item as the API saves it, with category, description, and attribute names', () => {
        expect(exported.item).toMatchObject({ itemName: 'Plasma Carbine', itemSize: 'SMALL', category: 'Weapons: Firearms', CostRating: 2 });
        expect(exported.item.description).toContain('anti-Shohan plasma arms');
        expect(exported.item.attributeList.map((r) => [r.attribute, r.Implementation, r.BuildPoints])).toEqual([
            ['Attack', null, 10],
            ['Attack Multiplier', 'plasmaSelfPowered', 60],
            ['Counter', 'shields', 0],
            ['Bleed', null, 10],
            ['Counter', 'armor', 20],
            ['Resource', 'ammunition', 10],
        ]);
    });

    it('includes the computed totals and rule checks', () => {
        expect(exported.summary).toMatchObject({ size: 'SMALL', baseBuildPoints: 50, totalBuildPoints: 115, costRating: 2, powerSlots: [], issues: [] });
    });

    it('loads back into the same item', () => {
        const reloaded = fromApiItem(JSON.parse(JSON.stringify(exported.item)));
        expect(summarizeItem(reloaded, catalogLookups).totalBP).toBe(115);
        expect(reloaded.attributes).toEqual(item.attributes);
    });

    it('names the file after the item, without characters a file name can\'t have', () => {
        expect(exportFileName('Riot/LEO Armor', 'json')).toBe('Riot-LEO Armor.json');
        expect(exportFileName('  ', 'pdf')).toBe('item.pdf');
    });
});
