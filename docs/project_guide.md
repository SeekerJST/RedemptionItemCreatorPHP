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
- **Client:** React 19 + Vite 7 in `client/`, using the SVAR React grid.
  `npm run build` writes into `public/`.
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
| `client/src/App.jsx` | The whole React UI (~2000 lines). |
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

## Current state (2026-09-23)

**Working:**
- The full API is ported and verified against the running C# API: lookups are
  byte-identical, CSV output matches apart from fixes, and items saved by the C# version load correctly.
- The smoke test passes all 32 checks.
- Attribute `Rank` is saved (migration 001, applied to the local DB).
- The React app, built and served by PHP, loads all lookup data with no console errors.

**Not done yet:**
- The React client only uses the lookup endpoints and the CSV export. Save, load, and delete aren't wired into the UI.
- There's no authentication. Write endpoints are controlled by the `allow_writes` config flag.
- `getallitems` returns nothing: every existing item has `IsPublic = 0`. They were
  disabled on purpose during testing and interview demos.
- The React has lint debt: unused variables, two undefined names (`system_add_fld`,
  `AttriGridData`), and an `eval` at `App.jsx:513` (probably the attribute cost formula).
- Not deployed to Dreamhost yet. This folder isn't a git repository yet.

## Decisions

- **Writes during the pre-login period.** Login is planned as part of the site revamp.
  Until then, item entries still have to get into the DB, either by keeping
  `allow_writes` on in production or by writing rows directly. Not settled yet.
  Leaving writes on means anyone can create, edit, or delete items.
- **Rank goes into the DB as a nullable INT.** Rank will never be non-numeric. Done in migration 001.
- **Same URL surface as the C# API,** so the React ports over unchanged. A cleaner
  REST scheme can come later along with the React rework.

## Next steps

1. **Commit the schema to the repo.** There's no schema or seed file yet, so the DB can't
   be rebuilt from source. Add a schema dump plus the lookup-table seed data
   (`itemsize`, `attribute`, `attributescale`, `skills`, ...).
2. **Decide on writes before deploying** (see Decisions). If writes stay on, consider a
   stopgap such as a shared-secret header or HTTP basic auth on the write routes.
3. **Deploy to Dreamhost** following `README.md`: `public/` into the web folder, `src/` +
   `config/` outside it, `SetEnv ITEMCREATOR_ROOT`. Run `db/migrations/001_itemattribute_rank.sql`
   on the Dreamhost DB first.
4. **React: wire up save, load, and delete.** Add an item picker (inventory panel), and
   load items back into the grids. Note that `getitem` returns attribute `Rank` as a number,
   while the grid's text editor produces strings.
5. **React cleanup.** Fix the lint errors, replace `eval` with a small formula evaluator,
   and split `App.jsx` into components.
   - **Re-evaluate the data grid library** (currently SVAR `@svar-ui/react-grid`). Goal:
     attribute rows with sub-rows under them, e.g. a weapon Attack with child rows for
     its attack multiplier and an Ammo resource. That has proven hard with the current
     grid. What exists so far:
     - The attributes grid already runs in tree mode (`tree={true}`, `treetoggle`).
     - There's an unused `addSubRow` (`App.jsx:364`) whose button is commented out (`App.jsx:1521`).
     - Parent/child links use the grid's internal `$parent`/`$level` fields.
     - Bug: `App.jsx:739` uses `=` instead of `===` (`attack.attributeID = attribute.$parent`),
       so the sub-row attack lookup always matches the first attack and overwrites its ID.
   - **Sub-rows need backend support too.** `itemattribute` has no parent column, so a saved
     item loses its hierarchy (the client sends `flatData`). This will need a migration
     (e.g. nullable `ParentAttributeID` referencing `ItemAttributeID` within the same item)
     plus API and CSV export changes. Design it together with the grid choice.
6. **Login / authentication** as part of the SilentSpirits revamp, shared with SystemGeneratorLive.
7. **Merge planning with SystemGeneratorLive.** Shared layout and styling, a shared DB
   config approach (SystemGeneratorLive uses `db_config.php` variables; this project
   uses `config/config.php` returning an array), and a common site shell.
8. `git init` and first commit.
