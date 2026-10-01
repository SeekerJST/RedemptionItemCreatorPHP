// Parity between the equipment catalog (docs/equipment_catalog.md, exported to db/seed/catalog.json
// by docs/catalog_tools/gen_catalog_json.py) and the app's rules: every catalog item, built the way
// the app builds it, must cost what the catalog says, row by row, and come out at the same CR.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compareCatalogEntry } from './catalog.js';

const catalog = JSON.parse(readFileSync(new URL('../../../db/seed/catalog.json', import.meta.url), 'utf-8'));

describe('catalog parity', () => {
    const results = new Map(catalog.items.map((entry) => [entry.itemName, compareCatalogEntry(entry)]));

    it('exports every costed catalog item', () => {
        expect(results.size).toBe(103);
    });

    describe.each([...results.keys()])('%s', (name) => {
        const result = results.get(name);

        it('costs what the catalog says, row by row, at the same CR', () => {
            expect(result.rowDiffs).toEqual([]);
            expect(result.appBP).toBe(result.catalogBP);
            expect(result.appCR).toBe(result.catalogCR);
        });

        it('breaks no rules', () => {
            expect(result.errors).toEqual([]);
        });
    });

    // Warnings are legal builds worth a note. These are the expected ones; a new kind fails here.
    const EXPECTED_WARNINGS = [
        /^Draws \d+ \w+ Power Slots? from its host/, // modules powered by what they're mounted on
        /^Requires a \w+ Computer to run\.$/, // programs
        /^A Brain needs a biological item or Life Support\.$/, // creatures and the War Drone are biological
    ];
    it('raises only the expected kinds of warning', () => {
        const unexpected = [...results.values()].flatMap((r) =>
            r.warnings.filter((w) => !EXPECTED_WARNINGS.some((pattern) => pattern.test(w))).map((w) => `${r.name}: ${w}`)
        );
        expect(unexpected).toEqual([]);
    });
});
