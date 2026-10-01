# Redemption Item Creation Rules — Implementation Spec

Source: *Redemption: A Game of Tactics and Consequences*, **Chapter 10: The Workbench**
(pp. 206–221, file `Redemption-7x10-Ch1-13-interactive-v10-dtrpg.pdf`), with every
change from `Redemption Errata.txt` applied. Where the errata changes a rule, the
errata wins, and the change is marked **[Errata pNNN]**.

This document is written for developers building the item creator. It restates the
rules as data and formulas, gives validation rules, and lists the places where the
book is ambiguous or contradicts itself (section 12). Anything marked
**[Interpretation]** is a reading the book doesn't state outright; confirm it with the
designer (PJ) before treating it as settled.

Related docs: `project_guide.md` (architecture, decisions), `change_log.md`.

---

## 1. Glossary

| Term | Meaning |
|---|---|
| **BP** (Build Points) | The design currency. Attributes cost BP; limitations give BP back. |
| **CR** (Cost Rating) | The item's price tier, compared against a character's Income Rating. Signed integer; can be negative. |
| **Size Category** | Tiny, Small, Medium, Large, Huge, Colossal. Sets budget, increment, base CR, default Body. |
| **Budget / Budget Increment** | The BP an item "should" cost, and the step size that moves CR up or down. |
| **Attribute** | A feature (Attack, Armor, Drive…). Many have a **grade** and/or **scale**, and many have **ranks**. |
| **Grade** | Minor / Moderate / Major. Most attributes use it. |
| **Combat Scale** | Firefight / Battlefield / Space. Independent of item size. Maps 1:1 to grade: Firefight = Minor, Battlefield = Moderate, Space = Major. |
| **Implementation** | A named variant of an attribute (e.g. Attack → Kinetic, Plasma; Drive → Gravitic). Some change cost or rules. |
| **Limitation** | A drawback that refunds BP. Minor / Moderate / Major. |
| **Power Slot** | Capacity provided by Power Supplies (and Drives), consumed by Attacks, Force Fields, etc. |
| **Resource** | A consumable (ammo, fuel, charge, magazine, tangle), bought in ranks. |
| **Tag** | A narrative/mechanical descriptor with a rank (max 3). "Free" Tags can be invoked without spending AP. |
| **TN** (Target Number) | Roll-under number for checks. Computers and Tasks have fixed TNs. |
| **Weapon Multiplier** | An Attack's damage multiplier, written `2x`, `3x`, … Minimum 2x. |

---

## 2. Design pipeline (what the app computes)

1. **Pick a Size Category** → base budget, budget increment, base CR, default Body (section 3).
2. **Add attributes** (section 5). Each row's BP comes from its cost rule.
3. **Add limitations** (section 6). Each refunds a fixed BP amount; count caps apply.
4. **Total:** `totalBP = Σ attributeBP − Σ limitationRefund`.
5. **Compute CR** (section 4).
6. **Validate** (section 9): power slots, resource feeds, caps, size minimums, tech availability.
7. *(Optional, table-side)* Run the design rolls (section 7).

Designs may exceed the budget; that only raises CR. Nothing forbids an over-budget item.

---

## 3. Size Categories

| Size | Examples | Base BP Budget | Budget Increment | Base CR | Default Body | Software: required computer grade **[Errata p209]** |
|---|---|---:|---:|---:|---:|---|
| Tiny | Coin, insect, or smaller | 25 | 10 | 0 | 1 | Minor |
| Small | Hand-held up to what a person can comfortably carry | 50 | 25 | 0 | 5 | Minor |
| Medium | Average human up to a small truck | 100 | 50 | 1 | 10 | Minor |
| Large | Large truck to commercial aircraft / small starship | 300 | 100 | 3 | 50 | Moderate |
| Huge | Capital starships, small stations, major architecture | 600 | 200 | 6 | 200 | Moderate |
| Colossal | Largest stations, entire cities | 1,200 | 400 | 9 | 500 | Major |

- Default Body is free; extra Body is bought with the Body Track attribute.
- For **software**, the size category is chosen by complexity and sets the computer
  rank needed to run it.
- Size order matters for several rules (Hangar, Link, Force Field, Cargo, minimum sizes).
  Store it as an ordinal: Tiny=1 … Colossal=6.

---

## 4. Cost Rating (CR)

> "For every Budget Increment the project goes over budget, the item's CR increases by 1."
> "Every 200 points above or below the budget raises or lowers the cost of the finished
> product by 1 CR." (Huge example)

```
delta = totalBP − sizeBudget
if delta > 0:  CR = baseCR + floor(delta / increment)
if delta < 0:  CR = baseCR − floor(|delta| / increment)      // [Ruling] steps down the same way
CR = max(CR, −2)                                             // [Ruling] −2 is the lowest CR/Wealth tracked
```

**[Ruling 2026-09-23]** Staying under budget lowers CR by 1 per full increment, the same
way going over raises it (e.g. Huge at 390 BP: 210 under → CR 5).

**[Ruling 2026-09-23] CR can be negative.** Cheap gear lands below 0 (Chapter 11 quick
reference, p. 225: Knife −2, Standard Gauss Pistol −1, Standard Gauss Rifle −1). These are
items a character can still get while in significant debt. Use a signed integer
everywhere CR is stored or displayed.

**[Ruling 2026-09-23] CR never goes below −2**, the lowest value the game tracks for Cost
Rating and Wealth. Total BP itself may go negative (limitations can refund more than the
attributes cost); only the CR is clamped.

For reference, the CR each size reaches at 0 BP:

| Size | Tiny | Small | Medium | Large | Huge | Colossal |
|---|---:|---:|---:|---:|---:|---:|
| CR at 0 BP | −2 | −2 | −1 | 0 | 3 | 6 |

Floor (not ceiling) is confirmed by the book's worked example: 811 BP on a 600-BP Huge
budget (211 over, increment 200) → +1 CR; 1,321 BP (721 over) → +3; 1,441 BP (841 over) → +4.

---

## 5. Attributes

### 5.0 Shared cost curves

Several attributes use one of two "parabolic" curves. Implement them once.

**Curve A — step grows by 10** (Armor Rating, Attack multiplier):
```
costA(base, n) = base + 5 · n · (n + 1)        // n = number of steps above the first
```
Increments: +10, +20, +30, +40, … (Armor rank 1→2 costs 10, 2→3 costs 20, …)

**Curve B — step grows by 5** (Bleed, Regeneration):
```
costB(base, n) = base + 5 · n · (n − 1) / 2    // n = rank (1-based)
```
Increments: +5, +10, +15, +20, … `n·(n−1)` is always even, so this is always a whole
multiple of 5 — **no rounding is ever needed.**

The book's tables stop at rank 5 (or 6x). Nothing in the rules caps these; extrapolate
with the formula unless a cap is listed below.

### 5.1 Area — 20 BP (flat)

- A sub-feature that adds an area effect to another feature (area attack, dispersal system…).
- Sudden or sustained (see Combat chapter).
- **Melee Attacks can never gain Area. [Errata p210]**

### 5.2 Armor Rating — variable BP

- Each rank reduces an incoming attack's Weapon Multiplier by 1.
- Scale is chosen independently of item size.
- Items have **no armor by default**; buying rank 1 costs the scale's base.

| Scale | Base (rank 1) | Rank 2 | Rank 3 | Rank 4 | Rank 5 |
|---|---:|---:|---:|---:|---:|
| Firefight | 20 | 30 | 50 | 80 | 120 |
| Battlefield | 50 | 60 | 80 | 110 | 150 |
| Space | 80 | 90 | 110 | 140 | 180 |

```
armorBP(scale, rank) = costA(base[scale], rank − 1)
```
Check: Space rank 6 = 80 + 5·5·6 = **230** (matches the Redemption example).

**Shrouded Hull** (implementation, Space scale only): observers need a successful Hard
Detection check to spot the ship in space. Must be part of the original design; **cannot be
added by Field Modification** (§8).
**[Ruling 2026-09-23]** The 120 BP **replaces** the Space base of 80; ranks above 1 add the
normal curve on top:
```
shroudedBP(rank) = costA(120, rank − 1)      // rank 1 = 120, rank 2 = 130, rank 6 = 270
```

Related: Force Fields do not benefit from Armor Rating. The **Partial Armor** limitation (§6)
lets aimed shots bypass the armor.

### 5.3 Attack — variable BP

Gives the item a Weapon Multiplier. Starts at 2x.

| Scale | 2x (base) | 3x | 4x | 5x | 6x |
|---|---:|---:|---:|---:|---:|
| Firefight | 10 | 20 | 40 | 70 | 110 |
| Battlefield | 20 | 30 | 50 | 80 | 120 |
| Space | 40 | 50 | 70 | 100 | 140 |

```
baseAttack(scale, m) = costA(base[scale], m − 2)      // m = Weapon Multiplier, m ≥ 2
upgrade(scale, m)    = baseAttack(scale, m) − base[scale]
```
Check: Space 8x = 40 + 5·6·7 = **250** (example: base 40 + 210 for six upgrades).

**Feed requirement:** every Attack must be fed by **either** a limited-ammunition clip
Resource (§5.24, Ammunition) **or** one Power Slot of the matching grade (§5.22).

**Implementations** may be combined, subject to the restrictions noted.
**[Ruling 2026-09-23]** Melee combines with anything except Anti-Missile. Kinetic + Melee
takes both discounts (a melee weapon that also uses ammunition or charges). Hyperspace +
Melee and Flare + Melee are unusual but legal.

| Implementation | Cost effect | Rules | Availability |
|---|---|---|---|
| **Energy** | none | Lasers, particle cannons. No special rules. | All |
| **Kinetic** | Multiplier upgrades cost 10% less, rounded up | Fires solid projectiles; needs an Ammunition Resource bought separately. Two implementations **[Ruling 2026-09-29]**: **Kinetic** (built into or slaved to a host: ship and vehicle guns, suit or Weapon Link mounts) also draws a Power Slot; **Kinetic (self-powered)** (hand weapons such as gauss pistols and rifles) draws none, since each round carries its own power **[Errata p210]**. | All |
| **Melee** | Everything (base and upgrades) costs half | Attacks are ranged by default; this limits to melee. **Can never take Area. [Errata p210]** | All |
| **Anti-Missile** | Half of base cost (5 / 10 / 20); **1x** **[Ruling 2026-09-23]** | Its own attribute: the only 1x attack. Only targets missiles. Cannot take a multiplier. | All |
| **Plasma** | none to BP | Uses **2× the Power Slots**. Gains **Counter (Shields)** free. Applies a free **Bleed** of `floor(m / 2)` damage/round; its magnitude matches the Attack's scale (Firefight → Minor, Battlefield → Moderate, Space → Major).  **[Ruling]** Extra Bleed damage above the free amount costs the difference between the full Bleed cost and the free Bleed **[Ruling 2026-09-27]**. Plasma draws its 2 slots per mount even with Ammunition (the Light Plasma Cannon uses both). **Plasma (self-powered)** **[Ruling 2026-09-29]** (hand weapons, e.g. the Plasma Carbine) needs special ammunition (an Ammunition Resource) instead of Power Slots; that requirement is built in as a **Moderate limitation** that takes one of the two Moderate slots but refunds no BP. | All (Terran Sphere tech) |
| **Flare** | none | Energy variant. Cover Tags cannot be condemned against it. | Shohan only |
| **Tse** | none | Melee only. Gains **Counter (Armor)** free. | Shohan only; cannot be manufactured by the Fourth Population |
| **Hyperspace** | none | Gains **Counter (Armor)** and **Area: Small Sudden** free **[Errata p210]**; both are printed in the stat block as reminders. Only known example: the Dreadnought's Hyper Cannon. | Shohan only |

Resulting costs:
```
kineticCost      = base + ceil(upgrade × 0.9)      // always exact: upgrade steps are multiples of 10
meleeCost        = (base + upgrade) × 0.5          // always exact: every Attack cost is a multiple of 10
kineticMeleeCost = base × 0.5 + ceil(upgrade × 0.45)  // [Ruling 2026-09-23]
antiMissile      = base[scale] × 0.5               // Firefight 5, Battlefield 10, Space 20
```
Kinetic + Melee halves everything and takes a further 10% off the multiplier upgrades only
(the book's Kinetic rule never discounts the 2x base). The upgrade part is the only place
a fraction can appear (always .5), and it rounds **up**, following the Kinetic rule.

| Kinetic Melee | Base part | Upgrade part | Total |
|---|---:|---:|---:|
| Firefight 2x | 5 | 0 | 5 |
| Firefight 3x | 5 | ceil(4.5) = 5 | 10 |
| Battlefield 4x | 10 | ceil(13.5) = 14 | 24 |
| Space 6x | 20 | 45 | 65 |

**Turrets / multiple gunners [Errata p210]:** paying the Attack's base cost again adds
another gunner (or lets the same gunner fire again if they spend the AP). Each extra
turret also needs its own feed (Power Slots or ammo).
**[Ruling 2026-09-23]** "Base cost" is that Attack's own 2x price after its implementation
modifier, so an extra mount always costs the same as the first mount's base:

| Attack | Extra turret cost |
|---|---|
| Space Plasma 8x (base 40) | +40 BP, +2 Major Power Slots |
| Space Anti-Missile (base 20) | +20 BP, +1 Major Power Slot |
| Battlefield Melee (base 10) | +10 BP |

**Plasma vs Shields [Errata p183]:** Plasma gets +2 Weapon Multiplier against Force Fields
(not "double damage"). This is the same as Counter (Shields).

### 5.4 Bleed — variable BP

Ongoing damage (toxin, fire, bioweapon). Negated by an appropriate Skill check at the
listed difficulty.

| Magnitude | Negation difficulty | 1 dmg/rd | 2 | 3 | 4 |
|---|---|---:|---:|---:|---:|
| Minor | Easy | 5 | 10 | 20 | 35 |
| Moderate | Standard | 10 | 15 | 25 | 40 |
| Major | Hard | 20 | 25 | 35 | 50 |

```
bleedBP(magnitude, dmg) = costB(base[magnitude], dmg)    // base 5 / 10 / 20
```
- Combat rules (for display): a Bleed applied by an attack from a larger combat scale does
  +2 damage/round; attacks cannot apply Bleeds to targets of a larger scale.

### 5.5 Body Track — variable BP

Buy extra Body in increments; repeatable.

| Item size | Body per purchase | BP per purchase |
|---|---:|---:|
| Tiny | cannot be improved | — |
| Small, Medium | 5 | 5 |
| Large | 20 | 10 |
| Huge, Colossal | 50 | 20 |

```
totalBody = defaultBody[size] + purchases × increment[size]
bodyBP    = purchases × cost[size]
```
Check: Huge, 3 purchases → +150 Body (350 total) for 60 BP.

### 5.6 Cargo — 5 / 15 / 30 BP per unit

One unit holds a few items of the next smaller size category. Repeatable.

| Grade | Description | BP per unit |
|---|---|---:|
| Minor | Simple empty space | 5 |
| Moderate | Powered and climate-controlled, or for non-solid matter | 15 |
| Major | Automated, or for sensitive freight | 30 |

### 5.7 Communication — 3 to 30 BP

Grades: Minor = planetary, Moderate = in-system, Major = interstellar/FTL. Costs are set
per implementation:

| Implementation | Minor | Moderate | Major | Notes | Availability |
|---|---:|---:|---:|---|---|
| Radio | 3 | 13 | — | Light-speed. Reveals transmitter location; unencrypted traffic is easy to overhear. | All |
| Laser Link | 3 | 13 | — | Light-speed, point-to-point, needs precise aim; sudden movement breaks it. | All |
| Ansible | — | — | 30 | FTL, point-to-point. Consumes **Tangle** Resource (10 BP/rank). | Fourth Population |
| Hypercomms | — | — | 25 | Any distance. | Shohan only |

### 5.8 Computer — variable BP

Rank sets the max TN of its Tasks. Grade sets how many programs/Tasks it can run at once and
which program sizes it can run.

**[Errata p209–212] Software requirements.** Program size sets the computer **grade** it needs
(rank no longer limits program size):

| Program size | Required Computer Grade | Tasks per program | Users |
|---|---|---|---|
| Tiny, Small, Medium | Minor | 1–2 | Single user |
| Large, Huge | Moderate | Multiple | Dozens at once |
| Colossal | Major | Multiple | Hundreds at once |

A program's Task runs at **min(Task TN, computer rank's max TN)**. A TN 20 program on a rank 2
computer (max TN 16) is legal and rolls at 16. Store `requiredComputerGrade` on programs
(derived from size); drop `requiredComputerRank`.

| Rank | TN |
|---:|---:|
| 1 | 14 |
| 2 | 16 |
| 3 | 18 |
| 4 | 20 |
| 5 | 22 |
| 6 | 24 |

`TN = 12 + 2 × rank`. Max rank 6.

| Grade | Simultaneous tasks | BP per rank (standard) |
|---|---|---:|
| Minor | 5 | 3 |
| Moderate | 50 | 5 |
| Major | unlimited | 20 |

`computerBP = rank × perRank[grade]` (e.g. Major rank 3 = 60 BP).

**Implementations:**

| Implementation | BP per rank (Minor / Moderate / Major) | Rules |
|---|---|---|
| Standard | 3 / 5 / 20 | — |
| **Brain** | 5 / 10 / 40 | Item must be a biological organism **or** have Life Support. Tasks on the item cost **half**. Cannot run non-Task software. Can earn XP: 4 XP → +1 TN on one Task. Rank 5–6 brains are probably sentient. |
| **Quantum Processor** | 20 / 40 / 80 | Required for self-aware Digital Intelligences. Quantum DIs can learn Psionic Skills as Tasks. Used only where required. |

### 5.9 Counter — 20 BP each

Negates something specific. Repeatable. Common implementations:

| Implementation | Effect |
|---|---|
| **Armor** **[Errata p212]** | Tied to one Attack type. On an **unaimed** attack, reduces the target's Armor Rating by 1. On an **aimed** attack, reduces it by 2. The reduction that carries over to other attackers stays at −1. The reduction lasts until the end of the round **[Errata p185]**. (Replaces the book's "−2 or ignore armor" rule.) |
| **Shields** | Actions against Force Fields with this item get +2 Weapon Multiplier. |
| **Disabling** | On a successful attack or Skill check, negates Target Modifiers on electronic items for one combat round or scene. An appropriate Engineering check by the victim can undo it. |
| **Strike** | Lowers the difficulty of rolls made to oppose a named class of thing (e.g. a drug that eases curing a specific disease). |
| **Strain** **[Errata p212]** | Raises or lowers the user's Psionic Strain by 5 per Counter (20 BP each; buy several for more). Used by drugs: Psi Amp +5 (1), Psi Damp −25 (5). |

Free Counters from implementations (Plasma → Shields; Tse, Hyperspace → Armor) cost 0 BP. Hyperspace's free Area: Small Sudden also costs 0 BP.

### 5.10 Drive — 10 / 25 / 50 BP

Lets the item move under its own power. Repeatable (a ship can have several).

| Grade | Range | BP |
|---|---|---:|
| Minor | Planetary | 10 |
| Moderate | In-system | 25 |
| Major | FTL / interstellar | 50 |

- Every vehicle also needs **either** a Computer running a Drive/Pilot Task **or** a sentient
  operator with those Skills.
- **Every Drive also acts as a rank-1 Power Supply of its grade: 3 Power Slots.**
- Needs a **Fuel** Resource unless its implementation says otherwise.

| Implementation | Grade | Cost / rule changes | Availability |
|---|---|---|---|
| Air | usually Minor | Flavor only (wings, rotors, lighter-than-air, thrust). | All |
| Ground | usually Minor | Flavor only (wheels, rails, hover, legs). | All |
| Sea | usually Minor | Surface ships to submarines. | All |
| Reaction | Moderate | Rocketry, usually fusion. Can share fuel with a Fusion/Antimatter Power Supply. **[Ruling 2026-09-28]** A **Minor** Reaction Drive is a jet pack: it works on a planet or in microgravity (Flight Pack). | All |
| **Reactionless** | Moderate | Does **not** expel reaction mass **[Errata p213]**, still needs fuel (unless its item's Power Supply runs it: see below). | Shohan only (rumored elsewhere) |
| **Light Sail** | Moderate | Costs **15 BP**. No Fuel needed. The item cannot take **Maneuver**. | All |
| Gravitic | Major | Unsafe inside deep gravity wells; only works outside a system's grav shore. | Fourth Population's FTL |
| **Biological** **[Ruling 2026-09-30]** | usually Minor | A creature's legs, wings, or fins. No Fuel. | All |
| **Jump** | Major | Includes a **Hyperspace Tap** Power Supply; no Fuel. Comes with Drawback Tag **[Disoriented]**: can't act for 1 combat round after arriving. | Shohan, Celestines, older Populations only |

### 5.11 Maneuver — 5 / 10 / 20 BP per rank

- Applies to a Drive (not Light Sail). Each rank = +1 Skill bonus on Drive/Pilot checks,
  and improves battlefield mobility.
- **Max rank 4.**
- BP per rank by the Drive's grade: Minor 5, Moderate 10, Major 20.
- Buy it at the grade of the item's **largest** Drive; the bonus applies to smaller Drives
  automatically. (Validation: warn if Maneuver grade ≠ highest Drive grade.)

The book's combined table (Drive + Maneuver):

| Drive grade | No Maneuver | Rank 1 | Rank 2 | Rank 3 | Rank 4 |
|---|---:|---:|---:|---:|---:|
| Minor | 10 | 15 | 20 | 25 | 30 |
| Moderate | 25 | 35 | 45 | 55 | 65 |
| Major | 50 | 70 | 90 | 110 | 130 |

### 5.12 Far Ranged — 20 / 40 BP

Weapon reaches one combat scale further; extended range is Hard.

| Grade | Range increase | BP |
|---|---|---:|
| Minor | Firefight → Battlefield | 20 |
| Moderate | Battlefield → Space | 40 |
| Major | not available | — |

Battlefield weapons with Far Ranged can hit Space-scale targets at Short range only
(e.g. a planetary cannon hitting low orbit, at Hard).

**Range scale ladder [Ruling 2026-09-27]:** Far range at one combat scale is Short range
at the next scale up. Firefight Far = Battlefield Short; Battlefield Far = Space Short.
Use this whenever an item's range or movement limit is stated at one scale and checked
at another (e.g. the Flight Pack: Far range at Battlefield scale, Short range at Space).

**Larger-scale attacks on smaller targets [Ruling 2026-09-27]:** an attack of a larger
combat scale used against targets of a smaller scale (e.g. Battlefield against Firefight)
counts as an area attack by default, without buying Area. A limitation such as "no area
attacks against Firefight targets" (Tse Blade, War Drone claws) removes that and is a
legitimate refund.

### 5.13 Force Field — variable BP

Energy shield that absorbs damage before it reaches the item. Bought in increments like
Body; repeatable.

| Grade | Track per purchase | Max item size covered | BP per purchase |
|---|---:|---|---:|
| Minor | 10 | Medium | 15 |
| Moderate | 20 | Large | 20 |
| Major | 50 | Colossal | 25 |

- Needs Power Slots equal to an Attack of the same scale: **one slot of the matching grade
  for the item's entire Force Field track**, however many increments are bought. **[Ruling 2026-09-23]**
- Force Fields do not benefit from Armor Rating.

| Implementation | Rules | Availability |
|---|---|---|
| Shohan | Built into the gear and its unique power supply; very hard to salvage/transfer. | Shohan |
| Terran | **Cannot be Major grade.** **Cannot take Regeneration.** Same BP cost as Shohan. | Terran Sphere |

Combat note **[Errata p183]**: Terran psionics using force fields leave a gap while
using powers; aimed or area attacks can bypass the field during that time.

### 5.14 Gravity Control — 10 / 20 / 40 BP

Artificial gravity. Works poorly or not at all inside strong natural gravity wells.

| Grade | Max item size | BP |
|---|---|---:|
| Minor | Medium | 10 |
| Moderate | Large | 20 |
| Major | Huge | 40 |

- Uses Power Slots equal to an Attack of **its own** scale: a Major Gravity Control needs a
  Major Power Slot. **[Ruling 2026-09-23]** (The book says "the item's scale".)
- A Colossal item needs an array of Major Gravity Controls (one Major covers up to Huge).

### 5.15 Hangar — 15 / 30 / 60 BP

Stores, launches, and recovers auxiliary craft.

| Grade | Capacity | BP |
|---|---|---:|
| Minor | One item 2 sizes smaller than the host | 15 |
| Moderate | One item 1 size smaller, or several items 2 sizes smaller | 30 |
| Major | Several items 1+ sizes smaller | 60 |

**Capacity (errata, p214):** "several" / "multiple" items means **3 items, or 4 if crammed in**. So a Major Hangar on a Huge host holds 3 Large craft (4 crammed); a Moderate Hangar holds 3 items two sizes smaller (4 crammed). The app should store hangar capacity as 3 with a crammed maximum of 4.

### 5.16 Launcher — 5 / 10 / 15 BP each

Fires missiles from a **Magazine** Resource. Several launchers may share one magazine.
Missiles themselves are separate Kinetic Attack items.

| Scale | BP per launcher |
|---|---:|
| Firefight | 5 |
| Battlefield | 10 |
| Space | 15 |

- **Power:** up to 4 launchers share 1 Power Slot. `slots = ceil(launchers / 4)`.
- **[Ruling 2026-09-23] Launchers are bought in increments of 4,** matching the power use:
  one increment = 4 launchers = 1 Power Slot, costing 20 / 40 / 60 BP.
- **Disposable** (single-shot): no Power or Resource needed; destroyed on use.

### 5.17 Life Support — 5 / 20 / 40 BP

| Grade | People | BP |
|---|---:|---:|
| Minor | 1 | 5 |
| Moderate | 12 | 20 |
| Major | 100 | 40 |

- Repeatable at any grade; capacities add.
- Can run up to 50% over capacity (rounded down) at reduced comfort:
  `maxOccupancy = floor(capacity × 1.5)`.

**Artificial Ecology** (implementation): more efficient, needs space.

| Grade | People | Minimum item size | BP |
|---|---:|---|---:|
| Minor | 12 | Large | 15 |
| Moderate | 100 | Huge | 30 |
| Major | 1,000 | Colossal | 60 |

### 5.18 Link — 5 / 15 / 50 BP

Lets the item host and operate smaller modular items. Repeatable, mixed grades and types.

| Grade | Max linked item size | BP |
|---|---|---:|
| Minor | Medium | 5 |
| Moderate | Large | 15 |
| Major | Huge | 50 |

| Type | Rules |
|---|---|
| Data | Hard, unlimited-bandwidth connection. Can't be hacked without physical access. |
| Psi | Lets a Psionic draw on the item's Power Supply. |
| Weapon | Modular mount that accepts a separately built Attack. Built-in Attacks (e.g. turrets) don't need one. |
| **Refueling** **[Errata p215]** | Docking connection that transfers fuel to a linked craft up to the Link's max size. **Draws 1 Power Slot of its grade** while in use. |

### 5.19 Manufacture — 25 / 50 / 100 BP

Produces items from design specs and raw mass. Needs a suitable Power Supply. Any item size.

| Grade | Products | Materials | BP |
|---|---|---|---:|
| Minor | Simple non-mechanical objects, knives, parts | Basic metals, plastics | 25 |
| Moderate | Complex machines, firearms, ground vehicles | Quality metals, synthetics | 50 |
| Major | Sub-nanometer parts, air and space craft | Premium materials | 100 |

Implementations: **G3P** (general purpose), **Coil Gin** (always Major), **Tangle Spinner**
(always Major), **Other Specialties** (flavor only).

### 5.20 Modifier — 10 / 20 / 30 BP per rank

Bonus to Skill or Ability checks. **Max rank 4 per Skill/Ability** (sum all Modifier
rows targeting the same Skill/Ability when validating). The Abilities are **Detection**,
**Discern**, and **Initiative** **[PJ 2026-09-29]**.

**[Ruling 2026-09-28]** The grade is how many skills the Modifier covers:

| Grade | Covers | BP per rank | Example |
|---|---|---:|---|
| Minor | 1 skill | 10 | Gunnery +2 = 20 |
| Moderate | 2 skills | 20 | Melee, Heavy Weapons +2 = 40 (Shohan Personal Armor) |
| Major | 3+ skills, or a class of skills ("Weapons", "Technical Skills") | 30 | Persuade, Discern, Socialize +3 = 90 (Social Aggregator) |

**Engineering, Science, and Profession** always take a specialty: Engineering (Weapons),
Science (Physics), Profession (Lawyer). **[PJ 2026-09-30]**

In the app, a Minor Modifier picks its skill from the list, with a specialty for those three
and an optional note ("Medicine (first response only)"), or **Other…** for a target that isn't
a skill ("Design Software", "Credentials"); Moderate and Major ones name their skills as free
text. The +4 cap counts the listed skills the text names (a class
such as "Weapons" names none, so it isn't checked). **[Ruling 2026-09-29]** Deliberately
loose: whether a class Modifier stacks past +4 with others is left to the table.

### 5.21 Neural Interface — 3 / 5 / 10 BP

| Grade | Capability | Initiative bonus | BP |
|---|---|---:|---:|
| Minor | One low-bandwidth stream; simple commands | +1 | 3 |
| Moderate | Several low-bandwidth streams; real-time control of one vehicle | +2 | 5 |
| Major | Several high-bandwidth streams; several vehicles at once | +3 | 10 |

### 5.22 Power Supply — 5 / 10 / 40 BP per rank

Each rank gives **3 Power Slots** of its grade.

| Grade | Minimum item size | Powers combat scale | Psionic effect scale | Strain threshold per rank | BP per rank |
|---|---|---|---|---:|---:|
| Minor | — | Firefight | Minor | 5 | 5 |
| Moderate | Small **[Errata p216]** | Battlefield | Moderate | 10 | 10 |
| Major | Large (Medium for a Hyperspace Tap or Coil) **[Errata p216]** | Space | Major | 20 | 40 |

| Implementation | Fuel | Rules | Availability |
|---|---|---|---|
| Fusion | Fuel Resource | Most common. Can share fuel with a Reaction Drive. | All |
| Antimatter | Fuel Resource | Can share fuel with a Reaction Drive. Doubles effective fuel rating when running on antimatter. Often hybrid fusion/antimatter. Antimatter fuel costs **+1 CR when bought in Port**: a provisioning cost, not a build cost, so it doesn't change BP or the item's CR. **[Ruling]** | All |
| Coil | **Charge** Resource | Battery. Recharges from an external powered station. Its 20% discount is the Charge Resource's reduced price (4 / 8 / 12 BP); not an extra discount. **[Ruling]** A Major Coil stack fits in a Medium item (one size below the usual minimum) **[Errata p216]**. | All |
| Environmental | none | Wind, water, geothermal, solar. Static or slow-moving. | All |
| Hyperspace Tap | none | Also bundled into Jump Drives. Compact enough that a Major tap fits in a Medium item (one size below the usual minimum) **[Errata p216]**. | Shohan only |

**Power budget:**
```
slotsAvailable[grade] = 3 × Σ(PowerSupply ranks of grade) + 3 × count(Drives of grade)
slotsUsed[grade]      = Σ consumer slots (table below)
```

**[Ruling 2026-09-23] Slots power their own grade or lower.** A Major slot can run a
Moderate or Minor consumer; a Moderate slot can run a Minor one; never upward. One slot
still runs one slot's worth of load. The design is valid when, for each grade `g`, the
slots of grade `g` or higher cover the load of grade `g` or higher:
```
Major:     avail[Major]                               ≥ used[Major]
Moderate:  avail[Major] + avail[Moderate]             ≥ used[Major] + used[Moderate]
Minor:     avail[Major] + avail[Moderate] + avail[Minor] ≥ used[Major] + used[Moderate] + used[Minor]
```
For display, assign load greedily: each grade first uses its own slots, then spills into
the lowest higher grade with spare slots.

| Consumer | Slots |
|---|---|
| Attack (energy-fed) | 1 per Attack/turret, grade = Attack scale. On a **One-Time Use** item (a grenade): 0, the item is its own charge **[Ruling 2026-09-30]** |
| Rail (Kinetic Ranged) Attack **[Errata p210]** | Integrated or slaved (ship/vehicle weapons, suit-mounted or Weapon Link modules): 1 per Attack/turret, grade = Attack scale, **plus** Ammunition. Standalone (hand weapons): 0; power is built into each round's casing, already included in the Ammunition. |
| Plasma Attack | 2 per Attack/turret, with or without Ammunition. **Plasma (self-powered)**: 0 (special ammunition instead) |
| Launcher | `ceil(count / 4)`, grade = launcher scale |
| Anti-Missile Attack | 1 each (as shown in the example) |
| Force Field | 1 for the whole Force Field track, grade = Force Field grade |
| Gravity Control | 1 per unit, grade = its own grade **[Ruling]** |
| Manufacture | 1, grade = Manufacture grade **[Ruling]** |
| Psi Link | Psionics draw on it; strain threshold per rank applies |

Higher-grade slots may power lower-grade consumers (ruling above).

### 5.23 Regeneration — variable BP

Repairs a depletable Track (Body, Force Field) automatically.

| Grade | Frequency | 1 pt | 2 | 3 | 4 | 5 |
|---|---|---:|---:|---:|---:|---:|
| Minor | 1 / Refresh | 5 | 10 | 20 | 35 | 55 |
| Moderate | 1 / Scene | 10 | 15 | 25 | 40 | 60 |
| Major | 1 / Round | 15 | 20 | 30 | 45 | 65 |

```
regenBP(grade, points) = costB(base[grade], points)     // base 5 / 10 / 15
```
Implementations: **Biological**, **Force Field** (Shohan force fields only; **always Major grade** **[Ruling 2026-09-27]**), **Mechanical**
(repair robots, nanites, smart materials), **Strain** **[Errata]** (restores Psionic Strain; e.g. Psi Amp: Strain 5, Major, every round for its Duration).

### 5.24 Resource — 5 / 10 / 15 BP per rank

A consumable. Each rank ≈ 30 days of light standby, 10 days of constant use, 10 combat
rounds, or 10 firings. Buy as many ranks as needed.

**[Errata] Duration** (drugs and other timed effects) is bought as a Resource: 1 Minor rank ≈ 10 combat rounds or 1 hour; 1 Moderate rank ≈ 1 day.

| Grade | Combat scale | Drive / Power Supply grade | BP per rank |
|---|---|---|---:|
| Minor | Firefight | Minor | 5 |
| Moderate | Battlefield | Moderate | 10 |
| Major | Space | Major | 15 |

| Type | Rules |
|---|---|
| Ammunition | Feeds Kinetic Attacks; 10 shots per rank. Most rounds of the right scale fit. |
| Charge | Feeds Coil Power Supplies. **20% cheaper, rounded down** (4 / 8 / 12 BP). Recharges only at an external station. |
| Fuel | Feeds Drives and Power Supplies of the same principle (shareable). **[Errata p217]** A Fuel Resource can feed consumers of its own grade **or lower** (a Major tank can feed a Moderate Reaction Drive), never higher. |
| Magazine | Feeds Launchers; 10 missiles per rank. |
| Tangle | Feeds Ansibles; ~10 days casual use per rank. **10 BP per rank.** |

Resources aren't interchangeable across types unless stated.

### 5.25 Tags — 5 / 10 BP per rank

| Kind | BP per rank |
|---|---:|
| Standard | 5 |
| Free (usable without spending AP) | 10 |

Max Tag rank is 3 (Basic Training chapter). Drawback Tags (e.g. [Disoriented], [The Gremlin's Due])
are given by rules, not bought.

### 5.26 Tasks — 2 × TN BP each

Items don't have Stats and Skills; they have Tasks with a fixed TN (self-driving,
an AI's skills, a creature's abilities).

```
taskBP = 2 × TN              // halved if the item's Computer is a Brain
```
- Needs a Computer whose TN (§5.8) ≥ the Task's TN. **[Ruling 2026-09-23]** the Task's TN
  can't exceed the computer's TN.
- Each Task counts against the Computer's simultaneous-task limit (Minor 5, Moderate 50, Major ∞).

---

## 6. Limitations

| Grade | BP refund | Max per design | Examples |
|---|---:|---:|---|
| Minor | 10 | 3 | **Hungry** (uses a whole Resource rank per use, e.g. a burst-fire area attack); **Usage Restriction** (fails under a plausible condition, like rain) |
| Moderate | 20 | 2 | **Malfunction** (failed rolls can produce Drawback Tags); **Prerequisite** (needs rails, a satellite network…); **Slave** (must be mounted on / controlled by bigger equipment); **Crew Requirement**; **Partial Armor** (aimed shots bypass armor); **Key Personnel** (needs a specific crew member, e.g. a Navigator) **[Ruling 2026-09-28]** |
| Major | 50 | 1 | **One-Time Use** (needs an overhaul, Hard Engineering, before reuse); **Restricted Technology** (heavily regulated; severe reprisals) |

Crew Requirement crew by item size: Small 1, Medium 2, Large 5, Huge 20, Colossal 100.

Limitations are free text plus a grade; the list above is examples, not a closed set.
The caps are per grade and independent (a design can have 3 Minor + 2 Moderate + 1 Major).

---

## 7. Design rolls (optional table-side tracker)

The app may track these, but they don't change BP or CR. Dice: Easy 3d6, Standard 3d8,
Hard 3d10; a roll succeeds if it's ≤ TN, and the margin of success is `TN − roll`.

- The designer makes **three extended Skill rolls**, **success tally 30**:
  1. At the start of the design.
  2. When the chosen components reach the size budget. If the design never reaches the
     budget, this roll is made alongside roll 3.
  3. When the design is finalized.
- Roll 1 is **Standard**. Later rolls: **over budget → one stage harder**; **under budget →
  one stage easier**. Experimental work may also make it harder. Other engineers with
  relevant expertise can add to the roll.
- **Failure** to reach the tally → a critical flaw. The designer can spend AP on extra
  rolls to fix it, but each time faces **the Gremlin Murphy**.
- **Gremlin Murphy** (GM-run): TN 20; challenge rating is the reverse of the designer's
  (Easy ↔ Hard, Standard ↔ Standard). If the Gremlin's tally beats the designer's, it may
  add the Drawback Tag **[The Gremlin's Due]**.
- Time: GM's call, from hours (small/simple) to years (large/complex). The result is a
  working prototype plus a design any capable G3P can build in any quantity.

---

## 8. Field Modifications (modifying existing gear)

- Final design success tally is **20** (not 30).
- CR rises by the normal budget increments for the item's size as attributes are added
  (recompute CR from the new total per §4).
- The character may use the item's **base CR as a temporary Income Rating** for buying
  the upgrade, and only pays the difference between base and modified CR (Income Rating
  rules), **minimum 1 CR**.
- Removing (selling off) attributes lowers the modified CR. The character still pays at
  least 1 CR, but may recoup money if the modified CR falls below the base CR and they
  find a buyer for the parts.
- Shrouded Hull can't be retrofitted.

```
modifiedCR = CR(newTotalBP)
costToPay  = max(1, modifiedCR − baseCR)     // in CR terms, resolved via Income Rating rules
```

---

## 9. Validation rules (summary)

Hard errors (the rules forbid it):

1. Attack multiplier ≥ 2x. Anti-Missile is exactly 1x. **[Ruling 2026-09-23]**
2. Melee Attack + Area. **[Errata p210]** Melee + Anti-Missile. **[Ruling]**
3. Tse on a non-Melee Attack.
4. Every Attack has a feed: ammo/clip Resource **or** Power Slot(s), except on a One-Time Use item **[Ruling 2026-09-30]**. Resources can be shared, so several Attacks (a weapon's modes) can use one Ammunition row. Kinetic needs Ammunition.
5. Power Slots cover the load using the cumulative, top-down check in §5.22.
6. Launchers (non-Disposable) have a Magazine.
7. Ansible has Tangle.
8. Drives have Fuel unless Light Sail, Jump, Biological, or the item has a Coil, Environmental, or Hyperspace Tap Power Supply to run them **[Ruling 2026-09-30]**. The Fuel's grade must be equal to or higher than the Drive's grade **[Errata p217]**.
9. Light Sail items have no Maneuver. Maneuver rank ≤ 4.
10. Modifier rank ≤ 4 per Skill/Ability (summed).
11. Tag rank ≤ 3.
12. Limitation counts: Minor ≤ 3, Moderate ≤ 2, Major ≤ 1. Built-in limitations count too: each Plasma (self-powered) Attack takes a Moderate slot **[Ruling 2026-09-29]**.
13. Power Supply minimum size: Moderate ≥ Small; Major ≥ Large, or ≥ Medium if the implementation is Hyperspace Tap or Coil **[Errata p216]**.
14. Artificial Ecology minimum size: Minor ≥ Large, Moderate ≥ Huge, Major = Colossal.
15. Force Field grade covers the item's size (Minor ≤ Medium, Moderate ≤ Large, Major ≤ Colossal).
16. Terran Force Field: not Major, no Regeneration.
17. Tiny items can't buy Body Track.
18. Brain needs a biological item or Life Support.
19. Task TN ≤ Computer TN; Task count ≤ Computer's task limit.
20. Far Ranged is not available at Major.
21. Computer rank 1–6.
22. Shrouded Hull only on Space-scale Armor.
23. Software items (Tasks but no Computer of their own): shown as "Requires a Minor/Moderate/Major Computer to run" **[PJ 2026-09-30]**. The running Computer's grade ≥ the size's required grade (Tiny–Medium Minor, Large–Huge Moderate, Colossal Major); Tiny–Medium programs carry at most 2 Tasks. Program Tasks above the computer's TN are legal and run at the computer's max TN.

Warnings (legal but worth flagging):

- Shohan-only tech in a non-Shohan design: Flare, Tse, Hyperspace Attack, Hypercomms,
  Reactionless Drive, Jump Drive, Hyperspace Tap, Shohan Force Field, Force Field Regeneration.
  Suggest a per-item "faction/tech base" field and gate on it.
- Maneuver grade ≠ grade of the largest Drive.
- Vehicle with a Drive but no Computer Pilot/Drive Task (the operator may supply it).
- Life Support occupancy over capacity (allowed up to 150%).

---

## 10. Worked example — Redemption-class Frigate (use as a test fixture)

Book pp. 219–221. All numbers below re-checked against the formulas in this spec.

| Step | Item | BP | Running total |
|---|---|---:|---:|
| Size | Huge: budget 600, increment 200, base CR 6, Body 200 | — | 0 |
| Armor | Space, rank 6 (80+10+20+30+40+50) | 230 | 230 |
| Body | Huge, 3 purchases × 20 BP (+150 Body → 350) | 60 | 290 |
| Life Support | Major (100 people) | 40 | |
| Hangar | Major | 60 | |
| Cargo | Major × 1 unit | 30 | 420 |
| Comms | Moderate Radio 13, Moderate Laser Link 13, Ansible 30, Tangle 5 ranks × 10 | 106 | 526 |
| Drives | Moderate Reaction 25, Major Gravitic 50 | 75 | |
| Maneuver | Major, rank 3 × 20 | 60 | |
| Fuel | Moderate, 7 ranks × 10 | 70 | |
| Power Supply | Major × 2 ranks × 40 | 80 | 811 (CR 7) |
| Attack | Space Plasma 8x (40 + 210) | 250 | |
| 2nd turret | + base cost 40 | 40 | |
| Launchers | Space × 6 × 15 | 90 | |
| Magazines | 6 ranks × 15 | 90 | |
| Anti-Missile | Space × 2 × 20 | 40 | 1,321 (CR 9) |
| Modifiers | +2 Gunnery, +2 Detection (2 ranks × 10 each) | 40 | |
| Computer | Major rank 3 (TN 18, ∞ tasks) | 60 | |
| Tags | 3 × rank 3, 1 × rank 2, 1 × rank 1 (standard, 5/rank) | 60 | 1,481 |
| Limitations | 2 Moderate (Property of the Terran Sphere, Crew Complement) | −40 | **1,441** |

**Final: 1,441 BP → 841 over → floor(841/200) = 4 → CR 10.**

**With launchers in increments of 4 [Ruling 2026-09-23]**, the 6 launchers become 2 increments
(8 launchers, 120 BP): **1,471 BP → 871 over → CR 10**, with the same power use (2 Major slots).

**The app's test fixture now follows the catalog instead [2026-09-29]** (`equipment_catalog.md`,
p259 errata): 4 launchers, Major Fuel (this exercise's Moderate Fuel can't feed the Major
Gravitic Drive and Fusion supply under errata p217), and Crew Requirement + Restricted Technology.
**1,416 BP, CR 10**, Major 7 of 9 slots.

Power check: available Major = 3 (Gravitic Drive) + 6 (2 Power Supply ranks) = 9.
Used Major = 4 (2 Plasma turrets × 2) + 2 (6 Launchers → ceil(6/4)) + 2 (Anti-Missile) = 8. ✔
Moderate: 3 available (Reaction Drive), 0 used.
Free effects: Plasma → Counter (Shields), Bleed 4 (floor(8/2)).

---

## 11. Errata applied (item creation and related)

| Page | Change | Where in this spec |
|---|---|---|
| p183 | Plasma: +2 Weapon Multiplier vs shields (not double damage) | §5.3 |
| p183 | Terran psionic force field gap | §5.13 note |
| p185 | Armor reduction (Coordinated Fire / Counter Armor) lasts until end of round | §5.9 |
| p210 | Turret rule: pay the base cost again per extra gunner | §5.3 |
| p210 | Melee Attacks can never gain Area | §5.1, §5.3, §9 |
| p212 | Counter (Armor): −1 unaimed, −2 aimed; −1 carries to other attackers | §5.9 |
| p213 | Reactionless drives don't expel reaction mass | §5.10 |
| p213 | **[New 2026-09-30]** Drives need no Fuel when a Coil, Environmental, or Hyperspace Tap Power Supply runs them; Biological Drives need none. | §5.10, §9 |
| p210 | **[New 2026-09-30]** Attacks on a One-Time Use item need no feed. | §5.22, §9 |
| p216 | **[New 2026-09-30]** An item with no Power Supply or Drive of its own draws its Power Slots from its host (a Slave limitation still means it needs the right Link). | §5.22 |
| p216 | **[New 2026-09-25]** Power Supplies may go on an item one size smaller than the table first listed: Moderate on Small (was Medium). Major stays Large, except that a Hyperspace Tap or a Coil stack can fit a Major Power Supply in a Medium item. | §5.22, §9 |
| p217 | **[New 2026-09-25]** A Fuel Resource can feed Drives and Power Supplies of its own grade or lower (a larger tank can feed a smaller drive). | §5.24, §9 |
| p211 | **[New 2026-09-29]** Plasma (self-powered): special ammunition instead of 2 Power Slots, built in as a Moderate limitation (takes a slot, no refund). Built-in Plasma draws 2 slots per mount even with ammunition. Kinetic splits the same way: Kinetic (Power Slot + Ammunition) and Kinetic (self-powered) (Ammunition only). | §5.3, §5.22, §9 |
| p217–218 | **[New 2026-09-29]** A Modifier's grade is how many skills it covers: Minor 1 skill (10 BP/rank), Moderate 2 (20), Major 3+ or a class of skills (30). Replaces per-skill costing. | §5.20 |

**Gear errata (Chapter 11 catalog).** These don't change the rules, but if the app seeds
reference items from Chapter 11, use the corrected values. This table is a summary; the
complete list is in `errata.csv` / `errata.sql`, and each item's errata are in `equipment_catalog.md`.

| Page | Item | Correction |
|---|---|---|
| p226 | Psionic Light Armor | Fuel 10 Days / Combat turns (not 1 Day) |
| p227 | Riot/LEO Armor, Psi Variant | Fuel 10 Days / Combat turns |
| p227 | Standard Powered Armor | Battlefield armor (not Firefight) |
| p228 | Kavacha Powered Armor | Battlefield armor (not Firefight) |
| p231 | Wellpoint Armory Stormguard 9MP | Ammo CR 1 (not "3x") |
| p232 | Plasma Carbine | 5x multiplier (errata 2026-09-27; first 4x); ammo CR 1 (was 5x); loses Area, gains Counter: Armor. **[New 2026-09-29]** Self-powered Plasma replaces its Prerequisite (special ammunition) limitation; Bleed 3 (2 free + 1 bought). CR 2 unchanged |
| p234 | Light Plasma Cannon | Ammo CR 1 |
| p235 | Personal Psi Link | Moderate Power Supply (not Major); Strain 10 (not 25) |
| p237 | Basic and Advanced NICL | **[New 2026-09-29]** Technical-class Skills +1 is a Major Modifier; Usage Restriction is Moderate. CR 1 and CR 2 (were 0 and 1) |
| p238 | Psi Amps | Rebuilt (2026-09-28): Counter: Strain +5, Regeneration: Strain 5 (Major), Duration 1 Minor. Supersedes the +10 Strain erratum |
| p238 | Telekinetic Shuttle | Major Psi Link |
| p255 | Phantom DRIV | Moderate Laser Link |
| p258 | Standard Frigate | Skeleton crew 100 (was 10); full complement 200 (was 20) |
| p262 | Arniston | Power Slots: 6 Major, 3 used |
| p264 | Heavy Railgun | Attack 7 (was 6), Body 50 |
| p264 | Heavy Laser Cannon | Attack 8 (was 7), Body 50 |
| p268 | Tse Blade | 5x multiplier |
| p263 | Havenite Lilith Carrier | **[New 2026-09-30]** Engineering (Starship) +3 (was Engineering +3; Engineering takes a specialty) |
| p268 | Shohan Personal Armor | Battlefield armor (not Firefight). **[New 2026-09-29]** Weapons +2 covers Melee and Heavy Weapons (Moderate Modifier); Target On Your Back is a Major limitation. CR 5 unchanged |
| p269 | Shohan War Drone | Body 80, Armor 5 |

---

## 12. Ambiguities and contradictions

Listed so the code can make each one a single named constant or function, easy to change.

### Resolved by PJ (2026-09-23)

| Question | Ruling | Where |
|---|---|---|
| CR below budget | Steps down by 1 per full increment, same as going over | §4 |
| Shrouded Hull cost | 120 BP replaces the Space armor base of 80 | §5.2 |
| Kinetic + Melee | Allowed: `base × 0.5 + ceil(upgrade × 0.45)` | §5.3 |
| CR floor | CR can go negative, down to −2 (the lowest CR/Wealth tracked). Total BP may go negative; only CR is clamped. | §4 |
| Catalog CR mismatches | Hand-math errors in the book. Compute CR with the §4 formula; don't copy printed values. | §12 notes |
| Other Melee combinations | Hyperspace + Melee and Flare + Melee are legal (edge cases). Only Anti-Missile + Melee is invalid. | §5.3, §9 |
| Extra turret cost | The Attack's own base cost (after the Anti-Missile / Melee halving) | §5.3 |
| Slot grades | A slot powers its own grade or lower | §5.22, §9 |
| Plasma free Bleed magnitude | Matches the Attack's scale (Space → Major) | §5.3 |
| Force Field power | One slot for the entire Force Field track | §5.13, §5.22 |
| Manufacture power | One slot of the Manufacture's grade | §5.22 |
| Antimatter "+1 CR" | Provisioning, not build: antimatter fuel bought in Port costs +1 CR over baseline. No effect on BP or item CR. | §5.22 |
| Task TN cap | A Task's TN can't exceed the running Computer's TN | §5.26, §9 |
| Coil discount | Same discount as the Charge Resource (4 / 8 / 12 BP per rank) | §5.22, §5.24 |
| Melee feed | Melee Attacks need no feed (no Power Slot, no ammunition) | §5.3, §9 |
| Plain Communication | Kept alongside the book's implementations, at 5 / 15 / 30 | §5.7 |
| Gravity Control power | One slot at its own grade, like an Attack of that scale | §5.14, §5.22 |
| Attack model | Attack = 2x at the base cost. Each Attack Multiplier rank adds 1x (rank 1 = 3x) and costs the upgrade above 2x. | §5.3 |
| Anti-Missile | Its own attribute: the only 1x attack. Cost stays half the Attack base. | §5.3, §9 |
| Launchers | Bought in increments of 4 (1 Power Slot per increment) | §5.16 |

### Still open

None. Every question raised so far has a ruling above.

### Notes (no ruling needed)

- **Tags above rank 3 / Free Tag caps** come from Basic Training, not the Workbench.
- **Chapter 11 catalog CRs are hand-calculated and some are off.** Computed by §4, the Knife
  (5 BP) is −1, not −2; the Quality Gauss Pistol (25 BP) is −1, not 0; the Concealable Pistol
  (45 BP) is 0, not 1. If the app seeds catalog items, compute their CR rather than copying
  the printed value, and treat mismatches as book errata candidates.
- **Limitation grade in the example.** The Redemption takes "Property of the Terran Sphere"
  as a Moderate limitation, although the book's matching example (Restricted Technology) is
  Major. Limitation grade is the designer's choice; don't hard-code names to grades.
- **Text errors in the worked example** (the sidebar numbers are right; the prose isn't):
  - "Strengthening the hull cost a total of 210 BP": it's 290 (230 armor + 60 Body).
  - "offset the 90 BP spent on Tags and Skill Modifiers": it's 100 (60 + 40).
  - "The computer makes these additions cost a total of 110 BP": it's 160 (120 after limitations).
  - "Drive and Power Supply thus total 285 BP": correct (205 + 80), but the sidebar
    labels 205 as "Drive Cost" including fuel and Maneuver.

### Notes against the current implementation

From `project_guide.md` / `change_log.md` (2026-09-23), without reading the DB formulas themselves:

- **Regeneration formulas look wrong.** The guide says Regeneration Minor/Major use
  `(5+…)/2` and `(15+…)/2` and produce fractions (Minor ranks 1–4 = 2.5/7.5/17.5/32.5).
  The book gives **5/10/20/35/55** (Minor) and **15/20/30/45/65** (Major): whole numbers,
  from `base + 5·N·(N−1)/2`. The `/2` looks misplaced the same way the Bleed Moderate one was
  (fixed in migration 002). If so, the half-up rounding decision would no longer be needed
  for any current formula. Moderate should be 10/15/25/40/60.
- **Attack at rank 0 costing more than rank 1** fits a formula where rank = Weapon Multiplier.
  If so, the minimum valid rank for Attack rows is 2 (2x), not 1, and rank 0/1 should be
  rejected rather than costed.
