// Prices db/seed/catalog.json with the app's own rules, the way [Save] does: each attribute row
// gets BuildPoints and PowerSlots, each tag and limitation BuildPoints, and the item its CostRating.
// The importer (db/seed/import_catalog.php) stores those figures.
//
//   node scripts/price-catalog.mjs [path]        (npm run price-catalog)
//
// Refuses to write anything if an item doesn't match the catalog or breaks a rule: the parity
// test (src/domain/catalog.test.js) says which and why.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compareCatalogEntry, matchesCatalog } from '../src/domain/catalog.js';

const path = process.argv[2] ?? fileURLToPath(new URL('../../db/seed/catalog.json', import.meta.url));
const catalog = JSON.parse(readFileSync(path, 'utf-8'));

const problems = [];
for (const entry of catalog.items) {
    const result = compareCatalogEntry(entry);
    if (!matchesCatalog(result) || result.errors.length > 0) {
        problems.push(`${entry.itemName}: app ${result.appBP} BP / CR ${result.appCR}, catalog ${result.catalogBP} / ${result.catalogCR}` +
            (result.errors.length ? `; ${result.errors.join('; ')}` : ''));
        continue;
    }
    const { summary } = result;
    entry.CostRating = summary.costRating;
    for (const row of entry.attributeList) {
        const cost = summary.attributeCosts.get(row.id);
        row.BuildPoints = cost.buildPoints;
        row.PowerSlots = cost.power.uses;
    }
    for (const row of entry.tagList) row.BuildPoints = summary.tagCosts.get(row.id);
    for (const row of entry.limitList) row.BuildPoints = summary.limitCosts.get(row.id);
}

if (problems.length > 0) {
    console.error(`Not priced: ${problems.length} item(s) disagree with the catalog or break a rule.\n  ${problems.join('\n  ')}`);
    process.exit(1);
}
writeFileSync(path, JSON.stringify(catalog, null, 1) + '\n');
console.log(`Priced ${catalog.items.length} items -> ${path}`);
