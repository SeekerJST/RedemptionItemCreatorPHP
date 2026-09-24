# Implementation Plan: Attributes, Rules, and Validation

Status: **Phase 1 done** (2026-09-23). Next: Phase 2.

Goal: make the item creator follow `item_creation_rules.md`. That means correct costs,
correct totals, validation of illegal builds, and a better attribute model (Attack split,
filtered sub-rows).

Related docs: `item_creation_rules.md` (the rules), `project_guide.md` (architecture,
decisions), `change_log.md`.

---

## Decisions

### From the review of the rules spec

1. **Build on the existing validation in the client.** Panel 3 already works out structure
   and power from the attributes; extend that. Two current gaps:
   - A wrong Body/grade combination (e.g. Major Body on a Small item) isn't prevented or flagged.
   - Power shortfalls aren't flagged. A Moderate Force Field with no power shows
     "Moderate: 1/0" with no warning, and a Major Power Supply can't power a Moderate
     Force Field.
2. **Split the Attack attribute** into Attack, Attack (Melee), and Attack Multiplier (see
   "Attack model" below).
3. **Limit the sub-row attribute list to what makes sense for the parent.** An Attack
   doesn't need Body; Armor doesn't need Attack Multiplier but might take Regeneration.
4. **Out of scope for now:** faction/tech-base fields, software items, the design-roll
   tracker, and field modifications. The attributes and validation come first.
   - **No faction enforcement.** Shohan-only tech is a table discussion. Some people use
     the rules to build gear for other settings (Star Wars, Star Trek, Mass Effect).

### From the answers to the plan's open questions (2026-09-23)

5. **Attack model:**
   - An **Attack** is **2x** at the book's base cost (10 / 20 / 40 BP). Each rank of
     **Attack Multiplier** adds 1x: rank 1 = 3x, rank 2 = 4x, and so on. It costs the book's
     upgrade above 2x, so the book's totals are unchanged (Space 8x = Attack 40 + Multiplier
     rank 6 at 210 = 250).
   - **Anti-Missile** is its own attribute: the only **1x** attack, with no multiplier. Its
     cost stays half the Attack base (5 / 10 / 20).
   - (An earlier answer put Attack at 1x. That was revised the same day; this is the ruling.)
   - **Turrets** are a **count on the Attack**. Each extra turret lets another player use
     that Attack on their turn (meant for vehicles and spaceships). Per spec §5.3, each
     costs the Attack's base again and needs its own feed.
   - **Tse** is a Multiplier implementation that's only allowed under **Attack (Melee)**.
6. **Sub-rows:**
   - **Only one level deep.** A sub-row can't have its own sub-rows. (Today any depth is
     allowed; Phase 3 enforces this.)
   - **Manufacture** can take a supply Resource.
   - A **Computer** can have many Tasks under it.
7. **Old test items are disposable.** They were only for testing at the time; the Attack
   migration can delete them.
8. **Resource types:** keep the default **Resource** (5 / 10 / 15 BP per rank), and add the
   setting's specific types: Ammunition, Charge (4 / 8 / 12), Fuel, Magazine, Tangle (10).
   The types are specific tech patterns of the setting, not a complete list of what
   players will build.
9. **Launchers are bought in increments of 4,** matching their power use: one increment =
   4 launchers = 1 Power Slot. Cost per increment = 4 × the per-launcher price
   (Firefight 20, Battlefield 40, Space 60).
   - This changes the Frigate test case (spec §10). The book buys 6 launchers (90 BP);
     here that's 2 increments (8 launchers, 120 BP). Total: **1,471 BP** (not 1,441), and
     still **CR 10** (871 over → 4 increments of 200).
10. **Spec typo fixed.** Curve A in `item_creation_rules.md` §5.0 now reads
    `base + 5·n·(n+1)`. The two worked checks that repeated the typo are corrected too.

### Principles

- **Where the rules fully decide something, the app decides it. Where the player
  chooses, the app checks the choice.**
  - Example: Body's increment and cost come from the **item size** (Small/Medium: 5 BP per
    +5 Body; Large: 10 BP per +20; Huge/Colossal: 20 BP per +50; Tiny: not allowed). So
    a Body row has no grade to pick, and "Major Body on a Small item" can't happen.
  - Example: a power shortfall is the player's choice to fix, so it's flagged, not blocked.
- **The rules live in code, one module per attribute,** tested against the spec's tables.
  The database keeps attribute names and IDs. The `attributescale` formula column stops
  being the source of costs, because too many rules can't be written as a single formula
  (size-based Body, Kinetic rounding, launcher increments, turrets, higher-grade slots
  powering lower grades).
- **Errors vs warnings.** Errors are builds the rules forbid; they're shown in red, with
  the rows highlighted. Warnings are only for things the book itself calls legal but
  risky. Neither blocks saving or exporting; the player decides.

---

## Attack model

```
Attack               grade = combat scale; 2x; cost = base (10 / 20 / 40); 1 Power Slot per mount
│                    Turrets: a count on the row (each extra: +base cost, +its own feed)
└─ Attack Multiplier  rank = +1x per rank (rank 1 = 3x); cost = the upgrade above 2x:
                      Curve A total − base = 5·k·(k+1) → +10, +30, +60, +100, +150, +210
                      implementation: Energy | Kinetic | Plasma | Flare | Hyperspace
                      Kinetic: 10% off the multiplier cost, rounded up
                      Plasma: the parent Attack uses 2 Power Slots per mount

Attack (Melee)       everything costs half; can never take Area
└─ Attack Multiplier  as above, plus Tse (Melee only)

Anti-Missile         1x only; no multiplier; cost = half the Attack base (5 / 10 / 20)
```

## Allowed sub-rows (one level deep)

| Parent | Allowed sub-rows |
|---|---|
| Attack | Attack Multiplier, Area, Far Ranged, Counter, Bleed, Resource (ammunition), Modifier |
| Attack (Melee) | Attack Multiplier (incl. Tse), Far Ranged, Counter, Bleed, Resource, Modifier. **No Area.** |
| Armor Rating | Regeneration, Shrouded Hull, Counter |
| Body | Regeneration |
| Force Field | Regeneration |
| Drive | Maneuver, Resource (fuel) |
| Power Supply | Resource (fuel / charge) |
| Launchers | Resource (magazine) |
| Communication (Ansible) | Resource (tangle) |
| Manufacture | Resource (supply) |
| Computer | Task (any number) |

Attributes not listed as parents take no sub-rows.

---

## Phase 1: Rules engine and tests (no visible UI change)

1. **Rules modules** in `client/src/domain/rules/`, one per attribute, each giving:
   - cost (BP) for a row
   - allowed grades (and whether the grade is a combat scale: Firefight/Battlefield/Space)
   - rank limits (e.g. Maneuver ≤ 4, Computer 1–6, Tag ≤ 3)
   - power slots used or provided
   - allowed sub-row attributes (table above)
   - validation checks for that attribute
2. **Shared cost curves** from spec §5.0, implemented once:
   - Curve A: `base + 5·n·(n+1)`, n = steps above the first (Armor, Attack multiplier)
   - Curve B: `base + 5·N·(N−1)/2`, N = rank (Bleed, Regeneration)
3. **Fixes that fall out of using the spec's numbers** (the DB values are wrong today):

   | Attribute | Today | Spec |
   |---|---|---|
   | Regeneration (all grades) | about half price; Moderate gives Minor's costs | 5/10/15 base + Curve B |
   | Armor, Battlefield | base 40 | base 50 |
   | Computer | cost = the TN formula; Major 10/rank | rank × 3 / 5 / 20 |
   | Kinetic | whole cost × 0.9 | base + ceil(multiplier cost × 0.9) |
   | Hypercomms | 30 | 25 |
   | Shrouded Hull | 120 × rank | 120 + Curve A |

4. **Test setup:** add Vitest (already named in `RedemptionItemCreator.client.esproj`) as a
   dev dependency, with `npm test`.
5. **Tests:**
   - every cost table in spec §5
   - CR examples from spec §4
   - **the Redemption-class Frigate (spec §10) as a fixture**, with launchers in
     increments of 4: **1,471 BP, CR 10**, Major power slots 8 used of 9

**Done when:** all tests pass and the running app's totals match the tests.

### Phase 1 results (2026-09-23)

- **Rules engine:** `client/src/domain/rules/`. `attacks.js`, `protection.js`, `systems.js` (one entry per
  attribute), `curves.js`, `sizes.js`, `costRating.js`, `power.js`, `registry.js`, `index.js` (the
  registry, database-name mapping, `rowCost`, `withRelations`).
- **Tests:** 151 in total, run with `npm test` in `client/`. They cover every cost table in spec §5, the CR
  rules, power (including higher grades covering lower), the database-name mapping, and the
  **Frigate: 1,471 BP, CR 10, Major 8 of 9 slots**, with every row matching the book.
- **Wired into the app:** grid and summary costs now come from the rules, not the
  `attributescale` formula column. Body is sized by the item size. Checked against the real
  database with the app's own summary code.
- **Until Phase 3,** the database's attack attributes (`Attack`, `Attack (Kinetic)`, ...) use the
  pre-split meaning (Rank = final multiplier) via a `legacyAttack` rule, costed the same way as
  Attack + Multiplier. Phase 3 points them at the new rules.
- **Items raised, and the rulings (2026-09-23):**
  1. **Melee feed.** Spec §9 says every Attack needs a feed (ammo or a Power Slot), but a knife
     has neither. **Ruling: melee attacks need no feed.**
  2. **Plain "Communication".** The book prices comms only by implementation (Radio, Laser Link,
     Ansible, Hypercomms). **Ruling: keep the plain Communication row at 5 / 15 / 30.**
  3. **Gravity Control power.** **Ruling: it draws power like an Attack at its own scale:** a Major
     Gravity Control needs a Major Power Slot. (The book says "the item's scale".)
  4. **The starter row now costs 20 BP.** New items start with an Area row, and Area is a flat 20
     at any grade (it used to cost 0 because the database only priced Area at Major). **Ruling: fine
     for now.**

## Phase 2: Totals and validation in the UI

1. **Cost Rating** per the rulings in spec §4:
   - whole increments only (floor), over or under budget
   - can go negative, down to −2
2. **Body** driven by item size (see Principles). Tiny items can't add Body.
3. **Power slots**, per spec §5.22:
   - Power Supply: 3 slots per rank, at its grade
   - every Drive also provides 3 slots at its grade
   - higher-grade slots can power lower-grade loads (never the reverse)
   - Attack: 1 slot per mount (the Attack plus each turret); Plasma: 2 per mount
   - Launchers: 1 slot per increment of 4
   - Force Field: 1 slot for the whole track
   - Gravity Control: 1 slot per unit at its own grade (ruling)
   - Manufacture: 1 slot at its grade
4. **Validation list in Panel 3:** errors and warnings, each naming the row it's about,
   with those rows highlighted in the grids. It covers the hard rules from spec §9 that
   don't depend on faction or setting.
5. **Grade labels:** Attack, Armor, Launchers, and Far Ranged show Firefight / Battlefield /
   Space instead of Minor / Moderate / Major. Each attribute only offers the grades it has
   (Area is flat-cost, Far Ranged has no Major, and so on).

**Done when:** the Phase 1 fixture builds in the UI with the right totals, and each §9
rule in scope has a test that trips it.

## Phase 3: Attribute model and sub-rows

1. **Attack remodel** (see "Attack model"). A DB migration removes the eight `Attack (…)`
   variants (IDs 28–34) and adds Attack (Melee), Attack Multiplier, and Anti-Missile. It
   also deletes the old test items (decision 7).
2. **Implementation / type options:** Attack Multiplier gets an implementation, and Resource
   gets a type (decision 8).
3. **Filtered sub-row attributes.** When editing a sub-row, the Attribute dropdown only lists
   the children its parent allows. Top-level rows list everything that can stand alone.
   This is possible now because `EditableGrid` controls the editor and can give each row
   its own option list.
4. **One level of sub-rows:**
   - [+>] is disabled when a sub-row is selected.
   - A drag that would nest a row two deep, or put a row that has sub-rows under another
     row, is undone.
5. **Sub-rows feed the rules.** Examples:
   - an Ammunition Resource under a Kinetic Attack counts as its feed
   - Area under a Melee Attack is an error
   - Maneuver under a Drive takes that Drive's grade

**Done when:** the Frigate fixture can be entered in the UI using sub-rows, and the
sub-row dropdowns only offer allowed children.

## Phase 4: Save and load

1. **Migration:** nullable `ParentAttributeID` on `itemattribute`.
2. **API:** `Item.php` / `ItemRepository` read and write `parentId`. The CSV export shows the
   hierarchy. The smoke tests are extended.
3. **Client:** enable [Save]/[Delete]. The Inventory panel lists saved items and loads
   them back into the editor.

