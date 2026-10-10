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
| `src/Controller/ItemCreatorController.php` | One method per C# action. `ROUTES` maps action → HTTP method → handler. Checks who may see and change each item (through `AuthController`). |
| `src/Controller/AuthController.php` | Accounts under `itemcreator/auth/{action}`: register, confirm email, sign in/out, forgot/reset password, profile, change password. Also `currentUser()` / `requireVerifiedUser()` for the item routes. |
| `src/Auth/` | `Session` (the `SSGS_SESSION` cookie, started only when needed), `UserRepository` (`users`, one-time `user_tokens` stored as SHA-256, `login_attempts` for rate limiting), `Mailer` (PHPMailer over SMTP, or `log` transport: writes each email to a file), `GoogleSignIn` (Sign in with Google: the OAuth code flow with PKCE, state and nonce; accounts linked in `user_identities`). |
| `lib/phpmailer/` | PHPMailer 7.1.1, vendored (`src/` only; LGPL-2.1). |
| `src/Domain/Item.php` | Item model. `fromArray()` accepts any key casing and numeric strings; `toArray()` emits the shape the client builds. |
| `src/Repository/LookupRepository.php` | Read-only reference tables (`itemsize`, `skills`, `attribute`, `attributescale`). |
| `src/Repository/ItemRepository.php` | Item CRUD across `item` + 5 child tables, in transactions. |
| `src/Export/ItemCsvExporter.php` | CSV sheet export. |
| `src/Export/ItemPdfExporter.php` | PDF export: checks the client's stat block and lays it out like the corebook (name bar, Size/CR/CC box, section bands), rendered by Dompdf. Font metrics cache in the system temp dir. |
| `lib/dompdf/` | Dompdf 3.1.6, vendored from its release zip (it bundles its dependencies and `autoload.inc.php`; LGPL-2.1). |
| `lib/pdf-fonts/` | The PDF's fonts: Andada Pro (static Regular/Bold/Italic, from huertatipografica/Andada-Pro) and Asimovian (from google/fonts), with their OFL licenses. |
| `client/src/domain/statBlock.js` | An item as the book prints it: COMBAT, POWER, CAPABILITIES, EFFECTS, SOFTWARE sections of "Label: value" entries (the PDF export's input). |
| `client/src/domain/exportJson.js` | The JSON export (`redemption-item`, version 1). |
| `src/Http/` | `Request`, `Response`, `HttpException`. |
| `config/config.example.php` | Template for `config.php` (`db`, `allow_writes`, `app_url`, `mail`, `session`, `debug`). The real `config.php` holds the DB and mailbox passwords and is gitignored. |
| `client/src/App.jsx` | Layout only: loads lookups, holds the item state (`useReducer`), derives the summary, renders the three panels. |
| `client/src/domain/` | Pure logic, no React. `constants.js` (UI constants and attribute IDs), `costs.js` (row BP), `summary.js` (everything Panel 3 shows), `item.js` (item reducer and the API payload), `ruleRows.js` (item rows → rules rows), `inventory.js` (the Inventory tree by category). |
| `client/src/domain/rules/sources.js` | Optional content: `SOURCES` (Decisive Action), `sourceEnabled()`. Rules, implementations, and catalog items from a supplement carry `source`; the app hides them unless the user switches that source on. |
| `client/src/hooks/useOptionalSources.js` | The optional-content switches (off by default), remembered in the browser. The switch is at the top of the Inventory panel. |
| `client/src/domain/rules/` | **The item creation rules** (docs/item_creation_rules.md) as code: one entry per attribute (cost, grades, rank meaning, power, allowed sub-rows), cost curves, sizes, Cost Rating, power budget. `*.test.js` beside them; the Frigate fixture is `frigate.test.js`. |
| `client/src/styles/theme.css` | **The Redemption theme**, meant to be shared with SystemGeneratorLive and the site: colors, fonts, and `rd-` classes (`.rd-panel` gold cut-corner frame, `.rd-title`, `.rd-heading`, `.rd-button`, `.rd-field`). Matches the corebook cover via the Roll20 sheet. |
| `client/src/components/NavBar.jsx` | The site navigation bar across the top: SilentSpirits logo (`client/icons/SSGSLogo.png`), Redemption › Gear Creator, and Login / Profile / Logout. Takes `user` (undefined while loading), `onLogin`, `onLogout`, `onProfile`; shows "unconfirmed" beside an account whose email isn't confirmed. Link targets are `NAV_LINKS`: the logo goes to https://www.silentspiritsgames.com/ (which this site will replace); Redemption to the site root for now. |
| `client/src/components/EditableGrid.jsx` | SVAR grid + sidebar editor used by all three sections. Displays rows owned by React state; with `tree`, nests attribute sub-rows by `parentId`. Contains the SVAR workarounds. |
| `client/src/components/` | `ItemEditor` (Panel 2), `ItemHeader`, `Section`, `LimitCounts`, `gridColumns.js`, `summary/*` (Panel 3 pieces). |
| `client/src/api/`, `client/src/hooks/` | `itemCreatorApi.js` (fetch wrappers; `request()` adds the `X-SSGS-Request` header to non-GET calls), `authApi.js` (the `auth/` routes), `useLookups.js` (loads reference data once), `useAuth.js` (who's signed in; handles the emailed `?verify=` and `?reset=` links), `useInventory.js` (reloads when the user changes). |
| `client/src/components/AccountPanel.jsx` | The account panel that drops from the nav bar: sign in, create an account, forgot/reset password, and Profile (display name, change password, resend the confirmation email). |
| `dev/router.php` | Router for PHP's built-in server; stands in for `.htaccess` locally. |
| `index.php` (root) | Only there so Visual Studio's F5 (built-in server, no router) can reach the API. |
| `db/migrations/` | Numbered SQL scripts. Run each one once, in order, on every existing database. A new database (e.g. the first Dreamhost one) is created from the schema file instead, which already includes them. |
| `tests/smoke.php` | End-to-end test (79 checks) against a running server: items, ownership, and accounts. Makes and removes its own `smoke-*@example.invalid` accounts. |
| `db/seed/` | `catalog.json` (the equipment catalog as app items, generated: 182 items from the core book, the Deployment Companion, New Detroit, and Decisive Action, each with its `source` and `groupSize`) and `import_catalog.php` (loads it as public items, with `item.Source` and `item.GroupSize`). |
| `docs/catalog_tools/da.py` | Decisive Action's gear, built row by row; adds each item to the catalog (`items.py` imports it) and feeds `decisive_action_reconciliation.md` (`da_report.py`). |
| `docs/catalog_tools/` | The catalog's source: `items.py` (data), `costs.py` (helpers: catalog text plus app rows), `gen.py` (the markdown), `gen_errata*.py` (errata files), `gen_catalog_json.py` (`db/seed/catalog.json`). |
| `client/scripts/price-catalog.mjs` | Prices `catalog.json` with the app's rules (`npm run price-catalog`). |
| `api.http` | Sample requests for Visual Studio's HTTP editor. |

## Running locally

```
"C:\Program Files\IIS Express\PHP\v8.0\php.exe" -S localhost:5135 -t public dev/router.php
cd client && npm run dev          # http://localhost:58967, proxies /itemcreator to :5135
"C:\Program Files\IIS Express\PHP\v8.0\php.exe" tests/smoke.php   # needs allow_writes => true
cd client && npm test              # rules tests (Vitest), including catalog parity
```

**Loading the catalog** (after editing `docs/catalog_tools`):

```
py docs/catalog_tools/gen_catalog_json.py                          # export: db/seed/catalog.json
cd client && npm test && npm run price-catalog                     # check parity, then price it
"C:\Program Files\IIS Express\PHP\v8.0\php.exe" db/seed/import_catalog.php   # load (--dry-run to check)
```

`catalog.test.js` builds every catalog item with the app's rules and fails if any row, total, or CR
differs from the catalog, or if an item breaks a rule. `price-catalog` refuses to price in that case.
The import gives each item a fixed ID from its name, so re-importing replaces the same items.

## API

Routes match the C# API and are case-insensitive.

| Method | Route | Notes |
|---|---|---|
| GET | `itemcreator/getitemsizes` | `{ "1": "TINY", ... }` |
| GET | `itemcreator/getitemsizesds`, `getskillsds`, `getitemattributesds`, `getattributescaleds` | Raw rows with DB column names. Byte-identical to the C# output, except `getskillsds`, which gained `SkillType` (migration 006). |
| GET | `itemcreator/getallitems` | Items with `IsPublic = 1`; every item while `allow_writes` is on. Each has `category` and `IsPublic`. |
| GET | `itemcreator/getitem/{id}` | 404 if missing |
| POST | `itemcreator/createitem` | 201 + item with new `itemID` |
| PUT | `itemcreator/updateitem/{id}` | Replaces all child rows |
| DELETE | `itemcreator/deleteitem/{id}` | 204 |
| GET/POST | `itemcreator/exportitemtocvs/download` | CSV attachment |
| POST | `itemcreator/exportitemtopdf/download` | PDF attachment, from a stat block (`domain/statBlock.js`) |

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
- **Public items are read-only (migration 005).** `updateitem` and `deleteitem` return 403 for an item
  with `IsPublic = 1`. `createitem` always saves `IsPublic = 0`, and `Item::fromArray` ignores any
  `IsPublic` the client sends, so nothing through the API can publish or unlock an item. The catalog
  import (and later an admin panel) sets it in the database.
- **`skills.SkillType`** (migration 006) is `Skill` or `Ability` (Detection, Discern, Initiative). The table may
  be rebuilt for the character creator, so keep code that depends on it small.
- **`item.Category`** is `"Group: Subgroup"` (e.g. `Weapons: Firearms`) or one level (`Armor`); NULL is
  Uncategorized. The Inventory tree splits on the first `:`.

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
- **Read-only items in the client:** `item.isPublic` locks everything. The reducer ignores edit actions
  (the backstop), `EditableGrid` takes `readOnly` (no sidebar editor, no dragging), and the [+], [+>],
  [Save], and [Delete] buttons are disabled with a tooltip. [Copy] (`copyItem`) clears the ID and
  `isPublic` and appends " (copy)"; saving it creates a private item.
- **Styling:** colors and fonts come from `styles/theme.css` (CSS custom properties); `App.css` is layout plus the
  theme applied to this app, including SVAR's grid and buttons (re-themed through its `--wx-*` variables).
  - Fonts: Aerovias Brasil NF (titles) is loaded from `Fonts/` (gitignored; Vite bundles it into the build, and a
    build without it falls back to Asimovian). Galexica (the book's headers) isn't licensed for the web yet:
    Asimovian stands in via `--rd-font-header`. Oswald, Share Tech Mono, and Andada Pro come from Google Fonts.
  - Keep the page's black-to-violet sky (`#root` in `index.html`) and the starfield behind **see-through** panels.
    `#root` is `display: flow-root` so it wraps the floated panels; without it the sky collapses to the header.
- **No browser dialogs.** Confirmations (delete, discarding unsaved edits) are an inline line
  under the toolbar. `window.confirm` would also block browser-automation testing.

## Current state (2026-09-25)

**Working:**
- The full API is ported and verified against the running C# API: lookups are
  byte-identical, CSV output matches apart from fixes, and items saved by the C# version load correctly.
- The smoke test passes all 79 checks.
- **Decisive Action** (2026-10-09, migration 008): its 61 items are in the catalog, and the app
  prices all 182 catalog items exactly. New rules in the engine: Area by size steps, 1x attacks,
  Gravitic and Pyre attacks, Grav Blades, Psi-Resonant Materials, Lamellar Matrix, box launchers,
  Shohan Artificial Ecology, Regeneration power, items sold per 10. Its content is **optional**:
  hidden unless the user switches it on in the Inventory panel.
- **Accounts** (2026-10-03, migration 007): email + password sign-up with email confirmation,
  sign in/out, forgot/reset password, profile. Saving takes a signed-in account with a confirmed
  email; each saved item belongs to its creator, who alone (or an admin) can see, change, or delete it.
- **Save, load, and delete** (Phase 4): [New]/[Save]/[Delete] in Panel 2, and the Inventory panel
  lists saved items and loads one on click. Sub-rows, implementations, and row order are saved
  (migration 004, applied to the local DB).
- Attribute `Rank` is saved (migration 001, applied to the local DB).
- **React client refactored** into domain logic, components, API wrapper, and hooks.
  Verified in Chrome to reproduce the old app's numbers; ESLint is clean; no `eval`.
- **Attribute sub-rows work in the UI.** You can add them at any depth, edit them,
  collapse/expand, drag to reorder or reparent, and delete (a row's sub-rows go with it).
  They're shown indented in the System Breakdown.
- The project is a git repository.
- **Rules engine and validation** (implementation plan, Phases 1-2): costs, Cost Rating, power
  slots, and §9 checks come from `client/src/domain/rules`, with the client tests including the
  Redemption-class Frigate (built as the catalog has it: 1,416 BP, CR 10). Panel 3 lists rule problems and highlights the rows involved.

**Not done yet:**
- Sign in with Google is built (2026-10-09, migration 009) but not yet confirmed end to end: the Google client's localhost redirect URI was just added. No Microsoft (or Apple) sign-in yet.
- Nothing in the UI sets `IsPublic` or a user's `Role`: new items are private, and admins are
  made by setting `users.Role = 'admin'` in the DB. The admin panel is still to come.
- Real email works through Dreamhost's SMTP (2026-10-03: a confirmation email reached Gmail and its link
  confirmed the account). Spam-folder placement (SPF/DKIM) hasn't been checked across providers yet.
- The catalog (103 items) is imported locally as public items; Dreamhost needs it after the schema.
- Terran vs Shohan Force Fields (§9 #16) aren't modelled: that needs the faction/tech-base field,
  which is out of scope for now.
- The Attacks summary (each attack with its sub-rows, and a name field) from the old code
  was never displayed there and hasn't been rebuilt.
- Not deployed to Dreamhost yet.

## Decisions

- **Supplements as optional content** (2026-10-09). Decisive Action's gear, attributes, and
  implementations are possibilities rather than core: off by default, switched on per browser. Core
  rulings made while reconciling it (Area by size, 1x attacks, group pricing) apply everywhere.
- **Accounts** (2026-10-03). Open sign-up, confirmed by email; email + password first, Google and
  Microsoft sign-in later (Apple only if wanted: it needs the paid developer program). Mail goes
  through the no-reply@silentspiritsgames.com mailbox on Dreamhost (PHPMailer, vendored like Dompdf).
  `allow_writes` is now only a site-wide read-only switch.
- **Account security choices.** Passwords: `password_hash` (bcrypt), 10+ characters. Emailed links
  are random 256-bit tokens, stored only as their SHA-256, single use (confirm: 48 hours, reset: 1 hour).
  Register and forgot-password give the same answer whether or not the email has an account, and
  sign-in takes as long for an unknown email, so none of them reveal who has one. Sign-in is limited
  to 5 failures per email and 20 per IP in 15 minutes. Cross-site requests are blocked by requiring
  the `X-SSGS-Request` header on every non-GET request (plus a SameSite=Lax cookie).
- **Public and private items** (2026-09-29, ownership 2026-10-03). Public items (the catalog, to
  start) can be loaded read-only by anyone; [Copy] makes an editable private copy. Private items
  belong to the account that saved them (`item.OwnerUserID`) and only it, or an admin, can see,
  change, or delete them; to anyone else they're a 404, so their existence doesn't leak. The
  catalog's items have no owner. An **admin panel** will manage which items are public.
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

1. **Commit the schema to the repo.** There's no schema or seed file yet, so the DB can't
   be rebuilt from source. Add a schema dump (after migration 004) plus the lookup-table
   seed data (`itemsize`, `attribute`, `attributescale`, `skills`, ...).
2. **Check email deliverability** before deploying: SPF/DKIM for silentspiritsgames.com, so
   confirmation and reset emails don't land in spam.
3. **Deploy to Dreamhost** following `README.md`: `public/` into the web folder, `src/` +
   `config/` outside it, `SetEnv ITEMCREATOR_ROOT`. Nothing is deployed there yet, so the
   Dreamhost DB is created fresh from the schema and seed files in step 1.
4. **Settle the open rules questions** above.
5. **Attacks summary:** list each attack with its sub-rows (multiplier, ammo) in Panel 3,
   which the old code was working toward.
6. **Catalog import on Dreamhost**, once the schema and seed files exist (step 1).
7. **Microsoft sign-in** (OAuth / OpenID Connect), like Google's (`GoogleSignIn`, `user_identities`):
   needs an app registration in Microsoft Entra. Share accounts with SystemGeneratorLive (same
   `SSGS_SESSION` cookie name).
8. **Merge planning with SystemGeneratorLive.** Shared layout and styling, a shared DB
   config approach (SystemGeneratorLive uses `db_config.php` variables; this project
   uses `config/config.php` returning an array), and a common site shell.
