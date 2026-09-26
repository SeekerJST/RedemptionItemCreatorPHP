// Imports catalog items (db/catalog/*.json) through the API, costing each with the same rules
// engine the UI uses. See db/catalog/README.md for the file format.
//
//   node dev/import-catalog.mjs db/catalog/core-book.json            import (create or update by name)
//   node dev/import-catalog.mjs db/catalog/core-book.json --dry-run  report only; nothing is saved
//
// Options:
//   --api <url>   the running API (default: PHP_API_URL or http://localhost:5135). Saving needs allow_writes.
//   --dry-run     resolve, cost, and check every item, and print the report, without saving.
//   --private     save the items as private (default: public, so they're listed with writes off).
//
// The report gives each item's BP and CR, the book's printed CR when the entry has one ("≠" marks a
// difference), and every rule error and warning. Items whose names don't resolve are never saved.
// Exit code 1 if any item couldn't be resolved or saved.

import { readFileSync } from 'node:fs';
import { catalogEntries, catalogItemToState } from '../client/src/domain/catalog.js';
import { toApiItem } from '../client/src/domain/item.js';
import { summarizeItem } from '../client/src/domain/summary.js';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const files = args.filter((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--api');
const dryRun = flag('--dry-run');
const isPublic = !flag('--private');
const base = `${(option('--api') || process.env.PHP_API_URL || 'http://localhost:5135').replace(/\/$/, '')}/itemcreator`;

if (files.length === 0) {
    console.error('Usage: node dev/import-catalog.mjs <catalog.json>... [--dry-run] [--private] [--api <url>]');
    process.exit(2);
}

async function api(path, options = {}) {
    let response;
    try {
        response = await fetch(`${base}/${path}`, { ...options, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        throw new Error(`Can't reach the API at ${base} (${e.cause?.code ?? e.message}). Is it running? (npm run dev in client/)`);
    }
    if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.detail || problem?.title || `${response.status} ${response.statusText}`);
    }
    return response.status === 204 ? null : response.json();
}

const [sizes, attributes, skills, saved] = await Promise.all([
    api('getitemsizesds'),
    api('getitemattributesds'),
    api('getskillsds'),
    api('getallitems'),
]);
const lookups = { sizes, attributes, skills };
const savedIdByName = new Map(saved.map((s) => [s.itemName.toLowerCase(), s.itemID]));

const entries = files.flatMap((file) => {
    try {
        return catalogEntries(JSON.parse(readFileSync(file, 'utf8'))).map((entry) => ({ ...entry, file }));
    } catch (e) {
        console.error(`${file}: ${e.message}`);
        process.exit(1);
    }
});

const seen = new Set();
const results = [];
for (const entry of entries) {
    const result = { name: entry.name ?? '(no name)', file: entry.file, page: entry.page, printedCR: entry.printedCR ?? null, errors: [], warnings: [] };
    results.push(result);

    const key = String(entry.name ?? '').toLowerCase();
    if (seen.has(key)) {
        result.status = 'SKIPPED';
        result.errors.push('Another entry has the same name.');
        continue;
    }
    seen.add(key);

    const { state, problems } = catalogItemToState(entry, lookups);
    if (!state) {
        result.status = 'UNRESOLVED';
        result.errors.push(...problems);
        continue;
    }

    const summary = summarizeItem(state, lookups);
    Object.assign(result, { size: state.size, category: state.category, bp: summary.totalBP, cr: summary.costRating });
    for (const issue of summary.issues) {
        (issue.severity === 'error' ? result.errors : result.warnings).push(issue.message);
    }

    const existingId = savedIdByName.get(key) ?? null;
    const apiItem = { ...toApiItem({ ...state, itemId: existingId }, summary, summary.defaultSkill), IsPublic: isPublic };
    if (dryRun) {
        result.status = existingId ? 'would update' : 'would create';
        continue;
    }
    try {
        await api(existingId ? `updateitem/${encodeURIComponent(existingId)}` : 'createitem', {
            method: existingId ? 'PUT' : 'POST',
            body: JSON.stringify(apiItem),
        });
        result.status = existingId ? 'updated' : 'created';
    } catch (e) {
        result.status = 'FAILED';
        result.errors.push(`Save failed: ${e.message}`);
    }
}

// ---- report ---------------------------------------------------------------------------------
const pad = (value, width) => String(value ?? '').padEnd(width);
const width = Math.min(40, Math.max(4, ...results.map((r) => r.name.length)));
console.log(`\n${pad('Status', 13)} ${pad('Item', width)} ${pad('Size', 9)} ${pad('BP', 6)} ${pad('CR', 4)} Book CR`);
for (const r of results) {
    const mismatch = r.printedCR != null && r.cr != null && r.printedCR !== r.cr ? ' ≠' : '';
    console.log(`${pad(r.status, 13)} ${pad(r.name.slice(0, width), width)} ${pad(r.size, 9)} ${pad(r.bp, 6)} ${pad(r.cr, 4)} ${r.printedCR ?? ''}${mismatch}`);
    for (const message of r.errors) console.log(`${' '.repeat(14)}error:   ${message}`);
    for (const message of r.warnings) console.log(`${' '.repeat(14)}warning: ${message}`);
}

const count = (predicate) => results.filter(predicate).length;
const failed = count((r) => ['UNRESOLVED', 'FAILED', 'SKIPPED'].includes(r.status));
console.log(
    `\n${results.length} item(s): ${count((r) => /creat/.test(r.status))} ${dryRun ? 'to create' : 'created'}, ` +
    `${count((r) => /updat/.test(r.status))} ${dryRun ? 'to update' : 'updated'}, ${failed} not ${dryRun ? 'importable' : 'imported'}; ` +
    `${count((r) => r.status !== 'UNRESOLVED' && r.errors.length > 0)} with rule errors, ` +
    `${count((r) => r.printedCR != null && r.cr != null && r.printedCR !== r.cr)} with a CR that differs from the book.`
);
if (dryRun) console.log('Dry run: nothing was saved.');
process.exitCode = failed > 0 ? 1 : 0;
