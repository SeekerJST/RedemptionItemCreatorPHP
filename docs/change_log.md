# Change Log

Newest changes are at the top. See `docs/project_guide.md` for the project's purpose,
current state, and the reasoning behind recurring patterns.

## 2026-09-23 (7): "Free" tags confirmed

- Decision: "Free" is the RPG's term for a tag that can be used without spending Action
  Points, which is why it costs double (10 BP per rank instead of 5). The label and the
  cost rule stay as they are.
- Corrected the code comment in `client/src/domain/constants.js`, which had guessed
  "free-form". Removed from the open rules questions; recorded under Decisions.

## 2026-09-23 (6): New attribute rows start at rank 1

- Decision: new attribute rows (the starter row, [+], and [+>] sub-rows) start at rank 1
  instead of 0. At rank 0, formula attributes still cost their formula at N=0, often more
  than rank 1 (Attack Minor: 20 at rank 0, 10 at rank 1).
- Changed in `newRow.attributes` (`client/src/domain/item.js`). Removed from the open rules
  questions; recorded under Decisions.

## 2026-09-23 (5): Fractional costs round to the nearest whole number

- Decision: a formula cost with a fraction rounds to the nearest whole number, halves up
  (2.5 → 3). Previously the row showed 12.5 while the total truncated it to 12.
- Rounding happens once, in `attributeCost()` (`client/src/domain/costs.js`), so the grid
  row, the totals, and the CSV export all use the same number. The separate truncation in
  `summary.js` and `item.js` is gone.
- Affects only Regeneration Minor and Major today. For example, Minor ranks 1-4 now cost
  3/8/18/33 (raw 2.5/7.5/17.5/32.5).
- Removed from the open rules questions; recorded under Decisions.

## 2026-09-23 (4): Bleed (Moderate) formula fixed

- **New `db/migrations/002_fix_bleed_moderate_formula.sql`.** Bleed Moderate was
  `(20+([N]-1)*[N]*5/2)`: the `/2` was inside the parentheses, so its base was 20 instead
  of 10, overcharging by 10 BP at every rank. Now `(20+([N]-1)*[N]*5)/2`.
  - Confirmed against the rules spreadsheet: Bleed = base + N(N-1)*5/2, with base 5/10/20
    for Minor/Moderate/Major. All three scales now match it at ranks 1-5 and 10.
  - Applied to the local DB. Nothing is deployed to Dreamhost yet, so its DB will be created
    fresh from the schema file, which will include this fix. The migration matches on
    attribute, scale, and the old text (not the row ID), so a second run changes nothing.
- **Open rules questions:** the formula typo is resolved. The fractional-cost question is
  narrowed to the two formulas that actually produce fractions (Regeneration Minor and Major).
- The planned sub-row migration is now 003.

## 2026-09-23 (3): React refactor and attribute sub-rows

- **Git:** the project is now a repository. Baseline commit `6da8bda`, refactor `da56c04`,
  sub-rows `cf6e513`.
- **Refactor** (behavior kept, verified in Chrome against the old app's numbers).
  The 1,850-line `App.jsx` was split into:
  - `domain/`: pure logic. Rules constants, a safe formula evaluator replacing `eval()`
    (checked against `eval` on every formula in the DB), row costs, a pure `summarizeItem()`,
    the item reducer, and the API payload.
  - `components/`: `EditableGrid` (one grid + sidebar editor wrapper instead of three
    copies), plus the Panel 2 and Panel 3 pieces.
  - `api/itemCreatorApi.js`, `hooks/useLookups.js`. `App.jsx` is now layout only.
  - React state owns the rows and the grids display them; totals are derived, not pushed
    around by grid events. This removed ~40 `useState` calls and the ref/closure workarounds.
  - ESLint went from 15+ errors to 0. Removed the dead code (the old tag/attribute field UI,
    `addSystem`, the unused attack state, stub handlers).
- **Bugs fixed on the way:**
  - A new attribute row with no System crashed the whole BP calculation, which then
    silently stopped updating.
  - Deleting Armor, Body, or Force Field left its old value in the summary.
  - Power slot "used" concatenated strings (`"0" + 1` = `"01"`).
  - Limitation counts missed the starter row (number `1` vs string `'1'`).
  - Modifiers left on the default skill were missing from the export.
  - Save threw a ReferenceError (`Tasks`). [Save]/[Delete] are now disabled until they're wired to the API.
  - The CSV export now POSTs the item instead of putting it in the URL.
- **Attribute sub-rows** (any attribute, any depth; BP counts toward totals):
  - The [+>] button adds a sub-row under the selected row.
  - Sub-rows can be edited in the sidebar, collapsed/expanded, dragged to reorder or
    reparent, and are deleted along with their parent.
  - The System Breakdown indents them and uses the parent's system when they have none.
  - The export sends `parentId`. The API doesn't store it yet (next step 1).
- **Why sub-rows were hard before:** SVAR 2.3's `add-row`/`update-row`/`delete-row` only
  work on top-level rows. Owning the rows in React state sidesteps that.
- **SVAR 2.3 bugs found and worked around** (details in the project guide):
  - Re-init uses `_select` instead of `select`, so clicks stop selecting rows.
  - A re-init mid-drag destroys the dragged row.
  - An instant drag can throw inside SVAR's drag code (it doesn't happen with a normal mouse drag).
- **Dependencies:**
  - Removed `axios` and `@svar-ui/svelte-core` (unused).
  - Declared `@svar-ui/react-editor`, which was imported but not listed.
  - Pinned all SVAR packages to one 2.3.x version: npm had pulled in a 2.7 editor plus
    three copies of `react-core`.
- **Docs:** project guide updated (client file map, React notes, current state, decisions,
  next steps) and a new "Open rules questions" section (formula typo, fractional costs,
  rank 0, the "Free" tag label, blank rows).

## 2026-09-23 (2): Note on the data grid for the React rework

- Recorded in the project guide (next step 5): consider a different data grid
  implementation. The goal is attribute rows with sub-rows (e.g. an Attack with
  attack-multiplier and Ammo sub-rows), which has been hard to do with the current
  SVAR grid. No code changes; deferred to the React rework.
- Also noted:
  - Existing tree-mode scaffolding in `App.jsx`.
  - The `=`/`===` bug at `App.jsx:739`.
  - Sub-rows will need a parent column in `itemattribute` and matching API changes,
    since the DB currently stores attributes flat.

## 2026-09-23: Attribute Rank is saved

- **New `db/migrations/001_itemattribute_rank.sql`** adds `itemattribute.Rank INT NULL`
  (after `AttributeScaleID`). Applied to the local DB. It still needs to be run on Dreamhost.
  - Nullable because rows saved earlier have no rank; they come back as `"Rank": null`.
    Verified by loading a C#-era item.
  - Decision: Rank will never be non-numeric, so INT rather than VARCHAR.
- **API:** attribute `Rank` now round-trips.
  - `Item::fromArray()` accepts `4` or `"4"` and returns a 400 naming the field
    (`attributeList[0].Rank`) for anything non-numeric.
  - Responses always return a number or `null`. Before, it was echoed back as a string and never saved.
  - `ItemRepository` reads and writes the column. `Rank` is a MySQL 8 reserved word too,
    and it's covered by the existing backtick quoting in `insertRows()`.
- `TagRank` is unchanged (already an INT column; still sent to the client as a string).
- **Smoke test:** 32 checks. New: Rank `"4"` saves and comes back as `4`; a non-numeric Rank is a 400.
- **Docs:** project guide updated (file map, things to know, current state, and next
  steps, renumbered with Rank removed).

## 2026-09-22 (2)

- **Added `docs/`:** `project_guide.md` (purpose, stack, file map, things to know, current
  state, decisions, next steps) and this change log.
- **Recorded decisions:**
  - Login will come with the site revamp.
  - Writes are needed before then to get items into the DB, either with `allow_writes` on
    or by writing rows directly. Still open.
  - Adding a `Rank` column to `itemattribute` is approved.
  - All items having `IsPublic = 0` is intentional: they were disabled during testing
    and interview demos.

## 2026-09-22 (1): PHP port of the API

- **New project `RedemptionItemCreatorPHP`:** a PHP reimplementation of the RoutingTest2
  ASP.NET Core API, with the React client copied over.
  - Plain PHP 8.0+ and PDO with no Composer, so it runs as-is on Dreamhost.
  - Layout: `public/` (web root), `src/`, `config/`, `client/`, `dev/`, `tests/`.
  - Same routes as the C# API (`itemcreator/{action}`), so the React needed no API changes.
- **Verified against the C# API, running both side by side:**
  - All six read endpoints return byte-identical JSON.
  - CSV export matches, apart from the fixes below.
  - Items the C# saved load correctly.
  - New `tests/smoke.php` (30 checks) covers create/read/update/export/delete, rollback,
    and validation errors.
  - The built React app loads all lookups from PHP in Chrome with no console errors.
- **Bugs fixed relative to the C# version:**
  - Table-name case: `Item`/`ITEM` would fail on Linux MySQL. Everything is lowercase now.
  - Create/update/delete are transactional. Failed saves used to leave partial rows behind.
  - An empty attribute list generated invalid SQL.
  - Error signaling: `"fail"` vs `null` / `"failed"` mismatches meant errors were reported as success.
  - An unknown `itemSize` was stored as 0, which hid the item from joins. It's now a 400,
    and sizes are looked up in `itemsize` instead of being hard-coded.
  - CSV fields containing commas are now quoted properly. Header rows no longer have
    stray spaces after the commas.
  - Updating or deleting a missing ID now returns 404. The update used to create orphan child rows.
- **Now saved:** `CostRating` → `item.CostRating`, `AttributeSystem` → `itemattribute.System`.
  Both columns existed but the C# never wrote to them.
- **API additions:**
  - Item JSON can be sent as the request body (the `?Item=` query parameter still works).
  - `POST` for CSV export, to avoid URL length limits.
  - RFC 7807 error bodies; 404/405 (with `Allow` header) for bad routes.
  - `allow_writes` and `debug` config flags.
- **Client changes:**
  - Vite now proxies to PHP on :5135. Dropped the .NET dev-cert/HTTPS setup.
  - `base: './'` so the app works from a subfolder of the site.
  - Build output goes to `public/`, with a `prebuild` step that clears old assets.
  - Removed the dead `weatherforecast` template code from `App.jsx`.
- **Implementation notes:**
  - `System` is a MySQL 8 reserved word, so inserted column names are quoted.
  - `TagFree BIT(1)` needs typed binds (`PDO::PARAM_INT`).
- Added `README.md`, `api.http`, `.gitignore`, and `config/config.example.php`.

## 2026-05-20: RoutingTest2 (C#), attribute BP calculation

- The last commit in the C# original: attribute Build Point calculation logic in the React client.

## 2025-11-25: RoutingTest2 (C#), initial commit

- React + ASP.NET Core (.NET 8) item creator started in `F:\Projects\RoutingTest2`
  as a skills-currency and job-search project, using MySqlConnector and Newtonsoft.Json.
