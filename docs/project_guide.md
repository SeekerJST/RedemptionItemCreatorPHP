# Redemption Item Creator (PHP) — Project Guide

An online gear/item builder for the *Redemption* tabletop RPG. Players pick an item
size, then add attributes, tags, limits, modifiers, and tasks. The app totals the
Build Point cost and Cost Rating, and can save the item or export it as a CSV sheet.

This is the PHP port of `F:\Projects\RoutingTest2` (React + ASP.NET Core). That project
was built to keep skills current during a job search and to add online tools to the
Redemption site. The port exists because the live site is PHP (Joomla on Dreamhost),
so the tools have to run there.

Together with `F:\Projects\SystemGeneratorLive`, this project is meant to become the
core of the new SilentSpirits website. Keep conventions compatible with it.

## Goals

1. Run the item creator on the existing Dreamhost hosting (Apache, PHP, MySQL on Linux).
2. Keep the code clean and well structured. It doubles as a job-search portfolio piece.
3. Grow into the shared foundation for the SilentSpirits site revamp, including a login system.

## Stack

- **Production target:** Dreamhost shared hosting. Apache with `.htaccess`, PHP 8.1+
  (8.3 is what SystemGeneratorLive runs on), MySQL 8 on Linux.
- **API:** plain PHP 8.0+ with PDO. No Composer and no framework; a small autoloader
  lives in `src/bootstrap.php`. Namespace `SilentSpirits\ItemCreator`.
- **Client:** React 19 + Vite 7 in `client/`, using the SVAR React grid and editor
  (pinned to 2.3.x, one version for all SVAR packages). `npm run build` writes into `public/`.
- **Local PHP:** `C:\Program Files\IIS Express\PHP\v8.0\php.exe` (not on PATH).
- **Local DB:** MySQL 8, database `itemcreator`, user `itemcreator`. Credentials go in
  `config/config.php`, which is gitignored.
- **IDE:** Visual Studio with Devsense PHP Tools (`RedemptionItemCreatorPHP.phpproj`),
  plus a JavaScript project for the client (`client/RedemptionItemCreator.client.esproj`).

## File map

| Path | Role |
|---|---|
| `public/` | Web root: the only folder exposed to the web. |
| `public/.htaccess` | Sends `itemcreator/*` to `api/index.php`; everything else falls back to the React `index.html`. |
| `public/api/index.php` | Front controller. Finds `src/` via `ITEMCREATOR_ROOT` (SetEnv), or next to `public/` by default. |
| `src/App.php` | Loads config, routes `/itemcreator/{action}/...`, turns exceptions into RFC 7807 JSON problems. Connects to the DB lazily. |
| `src/Controller/ItemCreatorController.php` | One method per C# action. `ROUTES` maps action → HTTP method → handler. |
| `src/Domain/Item.php` | Item model. `fromArray()` accepts any key casing and numeric strings; `toArray()` emits the shape the client builds. |
| `src/Repository/LookupRepository.php` | Read-only reference tables (`itemsize`, `skills`, `attribute`, `attributescale`). |
| `src/Repository/ItemRepository.php` | Item CRUD across `item` + 5 child tables, in transactions. |
| `src/Export/ItemCsvExporter.php` | CSV sheet export. |
| `src/Http/` | `Request`, `Response`, `HttpException`. |
| `config/config.example.php` | Template for `config.php` (`db`, `allow_writes`, `debug`). |
| `client/src/App.jsx` | Layout only: loads lookups, holds the item state (`useReducer`), derives the summary, renders the three panels. |
| `client/src/domain/` | Pure logic, no React. `constants.js` (UI constants and attribute IDs), `costs.js` (row BP), `summary.js` (everything Panel 3 shows), `item.js` (item reducer and the API payload), `ruleRows.js` (item rows → rules rows). |
| `client/src/domain/rules/` | **The item creation rules** (docs/item_creation_rules.md) as code: one entry per attribute (cost, grades, rank meaning, power, allowed sub-rows), cost curves, sizes, Cost Rating, power budget. `*.test.js` beside them; the Frigate fixture is `frigate.test.js`. |
| `client/src/components/EditableGrid.jsx` | SVAR grid + sidebar editor used by all three sections. Displays rows owned by React state; with `tree`, nests attribute sub-rows by `parentId`. Contains the SVAR workarounds. |
| `client/src/components/` | `ItemEditor` (Panel 2), `ItemHeader`, `Section`, `LimitCounts`, `gridColumns.js`, `summary/*` (Panel 3 pieces). |
| `client/src/api/`, `client/src/hooks/` | `itemCreatorApi.js` (fetch wrappers), `useLookups.js` (loads reference data once). |
| `dev/router.php` | Router for PHP's built-in server; stands in for `.htaccess` locally. |
| `index.php` (root) | Only there so Visual Studio's F5 (built-in server, no router) can reach the API. |
| `db/migrations/` | Numbered SQL scripts. Run each one once, in order, on every existing database. A new database (e.g. the first Dreamhost one) is created from the schema file instead, which already includes them. |
| `tests/smoke.php` | End-to-end test (32 checks) against a running server. |
| `api.http` | Sample requests for Visual Studio's HTTP editor. |

## Running locally

```
"C:\Program Files\IIS Express\PHP\v8.0\php.exe" -S localhost:5135 -t public dev/router.php
cd client && npm run dev          # http://localhost:58967, proxies /itemcreator to :5135
"C:\Program Files\IIS Express\PHP\v8.0\php.exe" tests/smoke.php   # needs allow_writes => true
cd client && npm test              # rules tests (Vitest)
```

## API

Routes match the C# API and are case-insensitive.

| Method | Route | Notes |
|---|---|---|
| GET | `itemcreator/getitemsizes` | `{ "1": "TINY", ... }` |
| GET | `itemcreator/getitemsizesds`, `getskillsds`, `getitemattributesds`, `getattributescaleds` | Raw rows with DB column names. Byte-identical to the C# output. |
| GET | `itemcreator/getallitems` | Items with `IsPublic = 1`; every item while `allow_writes` is on |
| GET | `itemcreator/getitem/{id}` | 404 if missing |
| POST | `itemcreator/createitem` | 201 + item with new `itemID` |
| PUT | `itemcreator/updateitem/{id}` | Replaces all child rows |
| DELETE | `itemcreator/deleteitem/{id}` | 204 |
| GET/POST | `itemcreator/exportitemtocvs/download` | CSV attachment |

The item JSON goes in the request body. The C# style `?Item=` / `?item=` query
parameter still works.

## Things to know before changing code

- **Table names must be lowercase.** MySQL on Linux treats table names as
  case-sensitive, and the C# original mixed `Item`/`ITEM`/`item`.
- **`System` and `Rank` are reserved words in MySQL 8.** Column names in multi-row inserts are backtick-quoted.
- **Attribute `Rank` is a nullable INT** (migration 001). The API accepts `4` or `"4"` and
  always returns a number (or `null`). Rows saved before the migration have `null`.
  `TagRank` is unchanged: stored as INT, sent to the client as a string, as before.
- **`itemtag.TagFree` is `BIT(1)`.** Read it as `TagFree + 0`. Write it with a typed
  `PDO::PARAM_INT` bind; the string `'0'` is rejected.
- **`itemattribute.AttributeScaleID` holds the scale level (1/2/3),** not an
  `attributescale` row ID. The name is misleading; it's kept for compatibility.
- **Child-row IDs come from the client grid.** They're part of composite primary keys, so
  duplicate IDs make the save fail and roll back.
- **Modifier and Task rows link to attribute rows by grid row ID:** `Modifier_5` names the
  attribute row with `id: 5`.
- **Attribute sub-rows and order (migration 004):** `ParentAttributeID` holds the parent row's
  `ItemAttributeID` (NULL = top level), `Implementation` the client's rule key (`kinetic`, `fuel`),
  and `SortOrder` the editor order. Load by `SortOrder`, not id: ids stop matching the order
  after a drag. `Item::fromArray` rejects an unknown parent or nesting two deep.
- **Native prepares** (`ATTR_EMULATE_PREPARES => false`) make INT columns come back as JSON
  numbers, matching the C# output. Don't turn emulation on.
- The code must run on PHP 8.0 (local interpreter): no enums, readonly properties, or `array_is_list()`.

**React client:**
- **React state owns the item; the grids only display it.** Edits, deletes, and drags come
  back through `EditableGrid` callbacks, and the reducer (`domain/item.js`) updates state.
  Don't use SVAR's `add-row`/`update-row`/`delete-row` actions: in SVAR 2.3 they only
  touch top-level rows, so they break sub-rows.
- **Everything in Panel 3 is derived** by `summarizeItem()` from the item and lookups.
  Add new totals there, not as extra state.
- **Costs, power, Cost Rating, and validation come from `domain/rules`,** keyed by rule name
  (`resolveAttributeName()` maps database names to keys). Add or change a rule there, with a test.
  Validation issues carry the rows they're about; `summary.rowStatus` turns them into grid highlights.
- **The attribute editor is built per row** (`attributeEditorColumns`): the grades offered and the
  Rank label depend on the attribute, and follow the Attribute field live (`liveFields` in `EditableGrid`).
- **SVAR 2.3 bugs worked around in `EditableGrid`:**
  - When the `data` prop changes, the grid re-inits its store with `_select` instead of
    `select`, and clicks stop selecting rows. Selection is triggered from `focus-cell` instead.
  - A re-init during a drag destroys the dragged row. Keep grid rows memoized
    (`ItemEditor` uses `useMemo`) so unrelated re-renders don't re-feed the grid.
  - An instant drag (press, jump, release in the same frame) can still throw inside SVAR's
    drag code. Normal mouse drags work. Browser automation needs a stepped drag to test it.
- **The sidebar editor is portaled to `<body>`.** Inside the scrolling section container it
  was clipped off-screen.
- **Keep all `@svar-ui/*` packages on one version** (currently exact `2.3.x` pins in
  `package.json`). Mixed versions install duplicate copies, and the editor/theme
  registration then isn't shared.
- **Attack model (migration 003):** Attack (2x, Rank = mounts), Attack (Melee), Attack Multiplier
  (sub-row only; Rank = +1x steps; carries the implementation), Anti-Missile (1x). The old
  "Attack (Kinetic)" and similar attributes are gone.
- **`Implementation` on attribute rows** holds an Attack Multiplier's implementation or a Resource's
  type (also Computer/Drive/Life Support). null = the rule's default. Communication's comes from
  the attribute name instead.
- **Sub-rows are one level deep,** and a sub-row's Attribute list is its parent's allowed children
  (`children` in each rule).
- **Sub-rows:** attribute rows have `parentId` (null = top level). They count toward totals
  like any row. With no system of their own, they use their parent's system.
- **Saving and loading:** `toApiItem()` and `fromApiItem()` in `domain/item.js` are each other's
  reverse. Saving writes a sub-row's effective system; loading drops it again when it only repeats
  the parent's. The item state carries `itemId` (null until first saved) and `dirty`; any edit
  action sets `dirty`, and `loadItem`/`saved`/`newItem` clear it.
- **No browser dialogs.** Confirmations (delete, discarding unsaved edits) are an inline line
  under the toolbar. `window.confirm` would also block browser-automation testing.

## Current state (2026-09-25)

**Working:**
- The full API is ported and verified against the running C# API: lookups are
  byte-identical, CSV output matches apart from fixes, and items saved by the C# version load correctly.
- The smoke test passes all 47 checks.
- **Save, load, and delete** (Phase 4): [New]/[Save]/[Delete] in Panel 2, and the Inventory panel
  lists saved items and loads one on click. Sub-rows, implementations, and row order are saved
  (migration 004, applied to the local DB).
- **Ready for the book catalog** (2026-09-25):
  - `db/schema.sql` + `db/seed.sql` rebuild the database from the repo (verified table by table).
  - Item categories (migration 005, applied locally). The Inventory groups by category, with a search.
  - `dev/import-catalog.mjs` imports `db/catalog/*.json` through the same rules engine as the UI and
    reports BP, CR, rule issues, and CR mismatches with the book. The format is in `db/catalog/README.md`.
  - Power Supply types with their feeds, and types for Drive, Counter, Link, Manufacture, and
    Regeneration, so book gear can say what kind each part is.
  - The Attacks summary in Panel 3. Panel 3 scrolls inside its frame.
- Attribute `Rank` is saved (migration 001, applied to the local DB).
- **React client refactored** into domain logic, components, API wrapper, and hooks.
  Verified in Chrome to reproduce the old app's numbers; ESLint is clean; no `eval`.
- **Attribute sub-rows work in the UI.** You can add them at any depth, edit them,
  collapse/expand, drag to reorder or reparent, and delete (a row's sub-rows go with it).
  They're shown indented in the System Breakdown.
- The project is a git repository.
- **Rules engine and validation** (implementation plan, Phases 1-2): costs, Cost Rating, power
  slots, and §9 checks come from `client/src/domain/rules`, with 192 client tests including the
  Redemption-class Frigate. Panel 3 lists rule problems and highlights the rows involved.

**Not done yet:**
- There's no authentication. Write endpoints are controlled by the `allow_writes` config flag.
- Only the catalog importer sets `IsPublic`: items made in the editor are private, so with writes
  off they don't appear in `getallitems`.
- **Modifiers can only target skills.** The rules allow "a Skill or Ability", but the `skills` table
  has no abilities (the Frigate's +2 Detection can't be entered), and it holds a stray `'Skills '` row.
- Not deployed to Dreamhost yet.

## Decisions

- **Writes during the pre-login period.** Login is planned as part of the site revamp.
  Until then, item entries still have to get into the DB, either by keeping
  `allow_writes` on in production or by writing rows directly. Not settled yet.
  Leaving writes on means anyone can create, edit, or delete items.
- **`getallitems` lists private items while writes are on** (2026-09-25). With writes on,
  anyone can already load, edit, or delete any item by ID, so hiding private items protects
  nothing, and new items (`IsPublic = 0`) have to show up in the Inventory to be reopened.
  With writes off it's public items only, as before. Revisit with login.
- **Categories are free text** (2026-09-25), stored as `itemtype` rows and linked by
  `item.ItemTypeID` (migration 005). Saving an item with a new category name adds it; a category
  with no items left is deleted, so the editor only suggests categories in use.
- **`IsPublic` is only changed when it's sent** (2026-09-25). The catalog importer sends `true`; the
  editor never sends it, so re-saving a catalog item in the editor keeps it public.
- **Catalog items are costed by the client's rules engine** (2026-09-25), run in Node by
  `dev/import-catalog.mjs`, not re-implemented in PHP. One set of rules for the UI and the import.
- **Schema and seed are generated, not hand-written** (`php dev/dump-db.php`). Changes still go
  through a migration; regenerate the two files after applying one.
- **Rank goes into the DB as a nullable INT.** Rank will never be non-numeric. Done in migration 001.
- **Same URL surface as the C# API,** so the React ports over unchanged. A cleaner
  REST scheme can come later along with the React rework.
- **Sub-rows:** any attribute can have them, and their BP counts toward the item total
  like any other row (2026-09-23).
- **Fractional costs round to the nearest whole number** (halves up: 2.5 → 3), once per
  row in `attributeCost()`, so the row, the total, and the export agree (2026-09-23). Only
  Regeneration Minor `(5+…)/2` and Major `(15+…)/2` produce fractions today.
- **New attribute rows start at rank 1** (2026-09-23), not 0. Many formulas give a non-zero
  cost at rank 0, sometimes more than at rank 1 (Attack Minor: 20 at rank 0, 10 at rank 1).
  Rank 0 can still be entered in the editor, and it's costed by the formula as-is.
- **Keeping the SVAR grid for now,** with the workarounds above. To revisit if more of its
  bugs turn up, or when upgrading (newer SVAR versions may fix them).
- **"Free" is the rules term and stays as the tag label** (2026-09-23). A Free tag can be
  used without the player spending Action Points, so it costs double: 10 BP per rank
  instead of 5. It does not mean "free of cost".

## Open rules questions

Behavior kept from the old code, but worth confirming:
- **Blank rows:** a tag or limitation with an empty description costs nothing and isn't
  counted. That's how the starter rows behaved before.

## Next steps

1. **Write the core book catalog** in `db/catalog/` (format: `db/catalog/README.md`), dry-run
   it, and check the report's rule errors and CR mismatches against the book and errata.
2. **Abilities for Modifiers** (see "Not done yet"), and remove the stray `'Skills '` row.
3. **Decide on writes before deploying** (see Decisions). If writes stay on, consider a
   stopgap such as a shared-secret header or HTTP basic auth on the write routes.
4. **Deploy to Dreamhost** following `README.md`: `public/` into the web folder, `src/` +
   `config/` outside it, `SetEnv ITEMCREATOR_ROOT`, and the DB from `db/schema.sql` + `db/seed.sql`.
5. **Settle the open rules questions** above.
6. **Login / authentication** as part of the SilentSpirits revamp, shared with SystemGeneratorLive.
7. **Merge planning with SystemGeneratorLive.** Shared layout and styling, a shared DB
   config approach (SystemGeneratorLive uses `db_config.php` variables; this project
   uses `config/config.php` returning an array), and a common site shell.
