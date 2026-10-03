// The equipment catalog (db/seed/catalog.json, exported from docs/catalog_tools by
// gen_catalog_json.py) seen through the app's rules: build each entry the way the app builds an
// item, and compare its costs with the catalog's. Used by catalog.test.js (parity) and
// scripts/price-catalog.mjs (which stores the app's figures in the JSON for the importer).

import { fromApiItem } from './item.js';
import { summarizeItem } from './summary.js';

// The `attribute` table's names (IDs here are arbitrary; the rules go by name).
const ATTRIBUTE_NAMES = [
    'Anti-Missile', 'Area', 'Armor Rating', 'Attack', 'Attack (Melee)', 'Attack Multiplier', 'Bleed', 'Body', 'Cargo',
    'Communication', 'Communication (Ansible)', 'Communication (Hypercomms)', 'Communication (Laser Link)',
    'Communication (Radio)', 'Computer', 'Counter', 'Drive', 'Far Ranged', 'Force Field', 'Gravity Control', 'Hangar',
    'Launchers', 'Life Support', 'Link', 'Maneuver', 'Manufacture', 'Modifier', 'Neural Interface', 'Power Supply',
    'Regeneration', 'Resource', 'Shrouded Hull', 'Task',
];
const ATTRIBUTE_ID = new Map(ATTRIBUTE_NAMES.map((name, i) => [name, i + 1]));

// The `skills` table after migration 006 (Skills, then Abilities).
const SKILL_NAMES = [
    'Animal Ken', 'Athletics', 'Clairvoyance', 'Command', 'Computers', 'Diplomacy', 'Drive', 'Energy Manipulation',
    'Engineering', 'Firearms', 'Gunnery', 'Heavy Weapons', 'Medicine', 'Meditation', 'Melee', 'Organize', 'Persuade',
    'Pilot', 'Profession', 'Science', 'Socialize', 'Stealth', 'Survival', 'Tactics', 'Telekinesis', 'Telepathy',
    'Detection', 'Discern', 'Initiative',
];

/** Reference data shaped like useLookups() returns it. */
export const catalogLookups = {
    // The `itemsize` table (spec §3).
    sizes: [
        ['TINY', 25, 10, 0, 1], ['SMALL', 50, 25, 0, 5], ['MEDIUM', 100, 50, 1, 10],
        ['LARGE', 300, 100, 3, 50], ['HUGE', 600, 200, 6, 200], ['COLOSSAL', 1200, 400, 9, 500],
    ].map(([SizeName, BasePoints, IncrementPoints, BaseCR, BaseBody], i) => ({ ItemSizeID: i + 1, SizeName, BasePoints, IncrementPoints, BaseCR, BaseBody })),
    attributes: ATTRIBUTE_NAMES.map((AttributeName) => ({ AttributeID: ATTRIBUTE_ID.get(AttributeName), AttributeName })),
    skills: SKILL_NAMES.map((skillName, i) => ({ skillID: i + 1, skillName })),
};

/** A catalog entry as the app's item state, via the same path a saved item takes. */
export function catalogItem(entry) {
    return fromApiItem({
        ...entry,
        attributeList: entry.attributeList.map((row) => ({ ...row, AttributeName: ATTRIBUTE_ID.get(row.attribute) })),
    });
}

/**
 * The app's summary of a catalog entry, and how it compares with the catalog: per catalog row,
 * the total, the CR, and any rule problems.
 */
export function compareCatalogEntry(entry) {
    const item = catalogItem(entry);
    const summary = summarizeItem(item, catalogLookups);
    const appRowBP = entry.catalogRows.map(() => 0);
    for (const row of entry.attributeList) appRowBP[row.catalogRow] += summary.attributeCosts.get(row.id).buildPoints;
    for (const row of entry.tagList) appRowBP[row.catalogRow] += summary.tagCosts.get(row.id);
    for (const row of entry.limitList) appRowBP[row.catalogRow] += summary.limitCosts.get(row.id);
    const rowDiffs = entry.catalogRows
        .map(([label, detail, bp], i) => ({ label, detail, catalog: bp, app: appRowBP[i] }))
        .filter((row) => row.catalog !== row.app);
    return {
        name: entry.itemName,
        summary,
        catalogBP: entry.catalogBP,
        appBP: summary.totalBP,
        catalogCR: entry.catalogCR,
        appCR: summary.costRating,
        rowDiffs,
        errors: summary.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message),
        warnings: summary.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
    };
}

/** True if the app and the catalog agree on every row, the total, and the CR. */
export const matchesCatalog = (result) => result.rowDiffs.length === 0 && result.appBP === result.catalogBP && result.appCR === result.catalogCR;
