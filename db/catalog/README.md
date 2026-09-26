# Item catalog

Catalog files list ready-made items, such as the gear in the core book, as JSON. You write
attribute names, grades, and ranks, never database IDs. `dev/import-catalog.mjs` runs each item
through the same rules engine as the editor: it computes BP and Cost Rating, checks the rules,
and saves the item through the API.

```
node dev/import-catalog.mjs db/catalog/core-book.json --dry-run   # report only
node dev/import-catalog.mjs db/catalog/core-book.json             # import
```

- **The API must be running** (`npm run dev` in `client/`), with `allow_writes => true` to save.
  `--api <url>` points it elsewhere.
- **An item is matched by name.** Importing again updates it in place, so fix the file and re-run.
- **Imported items are public** by default, so they're listed even with writes off. Use `--private` to change that.
- **Nothing is saved for an item whose names don't resolve**, such as an unknown attribute, type,
  skill, or size. The report says exactly which name failed. Items with *rule* errors (not enough
  power, a missing Fuel, ...) are still imported, because the book is sometimes wrong. The report
  lists every error and warning so you can check them against the book or errata.
- **Give the book's CR as `printedCR`.** The report marks items whose computed CR differs with `≠`.
  The spec (`docs/item_creation_rules.md` §12) says to trust the computed CR and treat a mismatch
  as a book error to check, not to copy the printed number.

`examples.json` shows the format with two items that come out at known totals: the first Powered
Armor test build (280 BP, CR 4) and the book's Redemption-class Frigate (§10).

## File format

A file is either an array of items, or an object with a default `category` and an `items` array:

```json
{
  "category": "Ranged Weapons",
  "items": [
    {
      "name": "Standard Gauss Rifle",
      "size": "Small",
      "page": 231,
      "printedCR": -1,
      "attributes": [
        {
          "attribute": "Attack", "grade": "Firefight",
          "subRows": [
            { "attribute": "Attack Multiplier", "implementation": "Kinetic", "rank": 2 },
            { "attribute": "Resource", "type": "Ammunition", "grade": "Minor", "rank": 3 }
          ]
        },
        { "attribute": "Modifier", "skill": "Firearms", "rank": 1 }
      ],
      "tags": [{ "name": "Rugged", "rank": 1, "free": false }],
      "limitations": [{ "name": "Loud", "grade": "Minor" }]
    }
  ]
}
```

(The numbers above only illustrate the format; they aren't the book's Gauss Rifle.)

### Item fields

| Field | Required | Meaning |
|---|---|---|
| `name` | yes | Unique across everything you import: it's how re-imports find the item. |
| `size` | yes | Tiny, Small, Medium, Large, Huge, or Colossal (any case). |
| `category` | no | Inventory group, e.g. "Armor". Falls back to the file's `category`; none = Uncategorized. |
| `attributes` | no | The attribute rows, in order (below). |
| `tags` | no | `{ "name", "rank": 1-3 (default 1), "free": true/false (default false) }` |
| `limitations` | no | `{ "name", "grade": "Minor" / "Moderate" / "Major" }` |
| `printedCR` | no | The book's CR, compared in the report. Not saved. |
| `page`, `notes` | no | For you; ignored by the importer. |

### Attribute rows

| Field | Meaning |
|---|---|
| `attribute` | The attribute's name, as in the table below (any case). |
| `grade` | Minor/Moderate/Major, or Firefight/Battlefield/Space for combat-scale attributes (the two sets are interchangeable, and 1-3 works too). Leave it out where the table says it's not needed. Sub-rows without a grade take their parent's. |
| `rank` | What the Rank column means for that attribute (table below). Default 1. |
| `implementation` or `type` | One of the attribute's types, by name (any case). Leave it out for the default. |
| `skill` | Modifiers only: the Skill it improves, from the skills list. |
| `task` | Tasks only: the Task's name. `rank` is its TN. |
| `system` | Optional system name (e.g. "Main Attack") for the System Breakdown. |
| `subRows` | Rows under this one, one level deep only. Use this for multipliers, ammo, fuel, magazines, Maneuver, Tasks, Regeneration, ... |

**Communication:** write `"attribute": "Communication", "implementation": "Radio"` (or Laser Link,
Ansible, Hypercomms). Leave the implementation out for the plain Communication.

**Resources are shared.** A Fuel Resource anywhere on the item feeds every Drive and Fusion Power
Supply, but putting it under what it feeds reads best.

### Attributes

| Attribute | Grade | Rank means | Types (`implementation`) | Sub-rows allowed |
|---|---|---|---|---|
| Anti-Missile | Firefight / Battlefield / Space | mounts (1 + extra turrets) | — | — |
| Area | not needed | how many | — | — |
| Armor Rating | Firefight / Battlefield / Space | rank | — | Regeneration, Shrouded Hull, Counter |
| Attack | Firefight / Battlefield / Space | mounts (1 + extra turrets) | — | Attack Multiplier, Far Ranged, Counter, Bleed, Resource, Modifier, Area |
| Attack (Melee) | Firefight / Battlefield / Space | mounts (1 + extra turrets) | — | Attack Multiplier, Far Ranged, Counter, Bleed, Resource, Modifier |
| Attack Multiplier | not needed | +1x per rank (rank 1 = 3x) | Energy (default), Kinetic, Plasma, Flare, Hyperspace, Tse (Melee only) | — |
| Bleed | Minor / Moderate / Major | damage per round | — | — |
| Body | not needed (follows item size) | purchases | — | Regeneration |
| Cargo | Minor / Moderate / Major | units | — | — |
| Communication | Minor / Moderate / Major | how many | Radio, Laser Link, Ansible, Hypercomms (or none) | Resource |
| Computer | Minor / Moderate / Major | rank (TN = 12 + 2 × rank) | Standard (default), Brain, Quantum Processor | Task |
| Counter | not needed | how many | Armor, Shields, Disabling, Strike | — |
| Drive | Minor / Moderate / Major | how many | Standard (default), Air, Ground, Sea, Reaction, Reactionless, Gravitic, Light Sail, Jump | Maneuver, Resource |
| Far Ranged | Minor / Moderate | how many | — | — |
| Force Field | Minor / Moderate / Major | purchases | — | Regeneration |
| Gravity Control | Minor / Moderate / Major | how many | — | — |
| Hangar | Minor / Moderate / Major | how many | — | — |
| Launchers | Firefight / Battlefield / Space | increments of 4 launchers | — | Resource |
| Life Support | Minor / Moderate / Major | how many | Standard (default), Artificial Ecology | — |
| Link | Minor / Moderate / Major | how many | Data, Psi, Weapon | — |
| Maneuver | its Drive's (leave out) | rank (max 4) | — | — |
| Manufacture | Minor / Moderate / Major | how many | G3P, Coil Gin, Tangle Spinner, Other Specialty | Resource |
| Modifier | not needed | the bonus (+1 to +4 per skill) | — | — |
| Neural Interface | Minor / Moderate / Major | how many | — | — |
| Power Supply | Minor / Moderate / Major | rank (3 slots each) | Fusion (default), Antimatter, Coil, Environmental, Hyperspace Tap | Resource |
| Regeneration | Minor / Moderate / Major | points | Biological, Force Field, Mechanical | — |
| Resource | Minor / Moderate / Major | rank | Resource (default), Ammunition, Fuel, Magazine, Charge, Tangle | — |
| Shrouded Hull | not needed | rank | — | — |
| Task | not needed | the Task's TN | — | — |

Feeds the rules check: Fusion and Antimatter Power Supplies and Drives (except Light Sail and Jump)
need Fuel, Coil needs Charge, Launchers need a Magazine, an Ansible needs Tangle, and a Kinetic
Attack needs Ammunition under it. Other ranged Attacks use a Power Slot unless they have
Ammunition under them; melee Attacks need no feed.
