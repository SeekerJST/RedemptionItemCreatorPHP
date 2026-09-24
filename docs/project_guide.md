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
| `client/src/domain/` | Pure logic, no React. `constants.js` (rules and attribute IDs), `formula.js` (safe evaluator for `AttributeFormula`), `costs.js` (row BP), `summary.js` (everything Panel 3 shows), `item.js` (item reducer and the API payload). |
| `client/src/components/EditableGrid.jsx` | SVAR grid + sidebar editor used by all three sections. Displays rows owned by React state; with `tree`, nests attribute sub-rows by `parentId`. Contains the SVAR workarounds. |
| `client/src/components/` | `ItemEditor` (Panel 2), `ItemHeader`, `Section`, `LimitCounts`, `gridColumns.js`, `summary/*` (Panel 3 pieces). |
| `client/src/api/`, `client/src/hooks/` | `itemCreatorApi.js` (fetch wrappers), `useLookups.js` (loads reference data once). |
| `dev/router.php` | Router for PHP's built-in server; stands in for `.htaccess` locally. |
| `index.php` (root) | Only there so Visual Studio's F5 (built-in server, no router) can reach the API. |
| `db/migrations/` | Numbered SQL scripts. Run each one once, in order, on every database (local and Dreamhost). |
| `tests/smoke.php` | End-to-end test (32 checks) against a running server. |
| `api.http` | Sample requests for Visual Studio's HTTP editor. |

## Running locally

```
"C:\Program Files\IIS Express\PHP\v8.0\php.exe" -S localhost:5135 -t public dev/router.php
cd client && npm run dev          # http://localhost:58967, proxies /itemcreator to :5135
"C:\Program Files\IIS Express\PHP\v8.0\php.exe" tests/smoke.php   # needs allow_writes => true
```

## API

Routes match the C# API and are case-insensitive.

| Method | Route | Notes |
|---|---|---|
| GET | `itemcreator/getitemsizes` | `{ "1": "TINY", ... }` |
| GET | `itemcreator/getitemsizesds`, `getskillsds`, `getitemattributesds`, `getattributescaleds` | Raw rows with DB column names. Byte-identical to the C# output. |
| GET | `itemcreator/getallitems` | Items with `IsPublic = 1` |
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
- **Attribute IDs are hard-coded** in `domain/constants.js` (Armor 2, Body 5, Force Field 13,
  Modifier 20, Task 26, power sources Drive 10 and Power Supply 22). They must match the `attribute` table.
- **Sub-rows:** attribute rows have `parentId` (null = top level). They count toward totals
  like any row. With no system of their own, they use their parent's system.

## Current state (2026-09-23)

**Working:**
- The full API is ported and verified against the running C# API: lookups are
  byte-identical, CSV output matches apart from fixes, and items saved by the C# version load correctly.
- The smoke test passes all 32 checks.
- Attribute `Rank` is saved (migration 001, applied to the local DB).
- **React client refactored** into domain logic, components, API wrapper, and hooks.
  Verified in Chrome to reproduce the old app's numbers; ESLint is clean; no `eval`.
- **Attribute sub-rows work in the UI.** You can add them at any depth, edit them,
  collapse/expand, drag to reorder or reparent, and delete (a row's sub-rows go with it).
  They're shown indented in the System Breakdown.
- The project is a git repository.

**Not done yet:**
- **Sub-rows aren't saved.** The export sends `parentId`, but the API ignores it and
  `itemattribute` has no parent column.
- The React client only uses the lookup endpoints and the CSV export. Save, load, and
  delete aren't wired up; the [Save]/[Delete] buttons are disabled.
- There's no authentication. Write endpoints are controlled by the `allow_writes` config flag.
- `getallitems` returns nothing: every existing item has `IsPublic = 0`. They were
  disabled on purpose during testing and interview demos.
- The Attacks summary (each attack with its sub-rows, and a name field) from the old code
  was never displayed there and hasn't been rebuilt.
- Not deployed to Dreamhost yet.

## Decisions

- **Writes during the pre-login period.** Login is planned as part of the site revamp.
  Until then, item entries still have to get into the DB, either by keeping
  `allow_writes` on in production or by writing rows directly. Not settled yet.
  Leaving writes on means anyone can create, edit, or delete items.
- **Rank goes into the DB as a nullable INT.** Rank will never be non-numeric. Done in migration 001.
- **Same URL surface as the C# API,** so the React ports over unchanged. A cleaner
  REST scheme can come later along with the React rework.
- **Sub-rows:** any attribute can have them, and their BP counts toward the item total
  like any other row (2026-09-23).
- **Keeping the SVAR grid for now,** with the workarounds above. To revisit if more of its
  bugs turn up, or when upgrading (newer SVAR versions may fix them).

## Open rules questions

Behavior kept from the old code, but worth confirming:
- **Fractional costs:** only Regeneration Minor `(5+([N]-1)*[N]*5)/2` and Major
  `(15+([N]-1)*[N]*5)/2` give fractions: always x.5, e.g. 2.5 at rank 1 and 12.5 at rank 2
  (Major). The row shows 12.5, but the total counts 12 (truncated), as before. Round,
  truncate, or ceil, or should those formulas change? Every other formula, including the
  `*0.9` ones, always gives whole numbers.
- **Rank 0:** a formula attribute at rank 0 still costs its formula at N=0
  (e.g. `20+(0-1)*0*5` = 20).
- **Tag "Free" switch** doubles the tag's cost (10/rank instead of 5). This matches the old
  Normal/Free tag types, so "Free" means free-form, not free of cost. A clearer label?
- **Blank rows:** a tag or limitation with an empty description costs nothing and isn't
  counted. That's how the starter rows behaved before.

## Next steps

1. **Save sub-rows in the DB.** Migration 003 adds a nullable `ParentAttributeID` to
   `itemattribute`. `Item.php`/`ItemRepository` read and write `parentId`, the CSV export
   shows the hierarchy, and the smoke tests are extended.
2. **Commit the schema to the repo.** There's no schema or seed file yet, so the DB can't
   be rebuilt from source. Add a schema dump plus the lookup-table seed data
   (`itemsize`, `attribute`, `attributescale`, `skills`, ...).
3. **React: wire up save, load, and delete.** Enable [Save]/[Delete], add an item picker in
   the Inventory panel, and load items back into state. `getitem` returns attribute
   `Rank` as a number, and the reducer already normalizes it.
4. **Decide on writes before deploying** (see Decisions). If writes stay on, consider a
   stopgap such as a shared-secret header or HTTP basic auth on the write routes.
5. **Deploy to Dreamhost** following `README.md`: `public/` into the web folder, `src/` +
   `config/` outside it, `SetEnv ITEMCREATOR_ROOT`. Run the `db/migrations/` scripts on the
   Dreamhost DB first.
6. **Settle the open rules questions** above.
7. **Attacks summary:** list each attack with its sub-rows (multiplier, ammo) in Panel 3,
   which the old code was working toward.
8. **Login / authentication** as part of the SilentSpirits revamp, shared with SystemGeneratorLive.
9. **Merge planning with SystemGeneratorLive.** Shared layout and styling, a shared DB
   config approach (SystemGeneratorLive uses `db_config.php` variables; this project
   uses `config/config.php` returning an array), and a common site shell.
