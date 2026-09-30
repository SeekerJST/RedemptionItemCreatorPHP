# Redemption Equipment Catalog — Chapter 11: The Armory

Source: *Redemption: A Game of Tactics and Consequences*, **Chapter 11: The Armory: Equipment**
(pp. 222–271, file `Redemption-7x10-Ch1-13-interactive-v10-dtrpg.pdf`), with every gear
change from `Redemption Errata.txt` applied (marked **Errata**). Errata agreed on 2026-09-25
are marked **Errata (new, 2026-09-25)** and have been added to `Redemption Errata.txt`.

Companion to `item_creation_rules.md`. Every item below is written as builder rows (size,
attributes, limitations, tags) so the app can load it, cost it with the build rules, and
compare the result with the book's printed CR.

**Status:** first pass (2026-09-25), updated with PJ's rulings the same day. The hand-built book values have known mistakes, so
each entry shows both the **printed CR** and the **formula CR** (from the rules spec), and
lists anything that looks off under **Check**. None of the checks are ruled on yet.

---

## 1. How to use this file

**Each entry has:**

- **Header:** category, page, size, printed CR and CC (plus XP for implants,
  Required Computer Grade for software).
- **Build rows:** one row per attribute, limitation, or tag, in builder terms, with the
  BP each costs under `item_creation_rules.md`. Limitations are negative. Rows marked `?`
  have no Workbench cost and are left out of the total.
- **Totals:** total BP and **formula CR** (§4 of the rules spec, clamped at −2).
- **Power:** slots provided and used, if the book lists them or they matter.
- **Check:** likely mistakes or rules gaps, for PJ to rule on.

**Suggested seeding approach**

1. Seed each item from its build rows, not from the printed CR.
2. Store the printed CR and CC as reference fields (`printedCR`, `printedCC`) so the UI or a
   test can show where the book and the formula disagree.
3. Treat the **Check** notes as open questions. Don't "fix" rows to hit the printed CR.

---

## 2. Conventions: book notation → builder rows

These apply across the catalog. Items only repeat them where it helps.

| Book notation | How it's entered here |
|---|---|
| `Attacks (1/attack):` followed by several modes | One weapon with selectable modes. **Each mode is costed as its own Attack**, with the mode's own Area/Counter/limitations. (This matches most printed CRs.) |
| `Kinetic Ranged (Space) 7x` etc. | In the app: an **Attack** (2x, base cost) plus an **Attack Multiplier** sub-row at rank m − 2 (implementation plan decision 5). Melee weapons use **Attack (Melee)**; Tse is a Multiplier implementation under Attack (Melee). The rows below show the combined cost. |
| `2 Kinetic Ranged (…) 5x`, `2 Energy …` | Two turrets on one Attack: full cost once, plus the Attack's base cost per extra turret. |
| `N Launchers` | Launchers are bought in **increments of 4** (implementation plan decision 9). A book count that isn't a multiple of 4 is rounded up to the next increment and noted in the row. |
| `Anti-Missile (Space) 1x Counter: Missiles, Limitation: Usage Restriction (only targets missiles)` | The **Anti-Missile** attribute (1x, no multiplier, half the Attack base: 5 / 10 / 20 BP; implementation plan decision 5). The printed Counter and limitation describe what Anti-Missile already is, so they aren't costed separately. |
| `Counter: Missiles`, `Counter: Detection` | A Counter (20 BP) with that target. Neither is among the rules' listed examples (Armor, Shields, Disabling, Strike), but Counters are open-ended. |
| `Power Requirement: N slots` | The item has no power of its own and draws N slots from its host (vehicle, suit, battery). No BP. |
| `Total Power Slots: …` | Informational. The app should derive it (3 per Power Supply rank, 3 per Drive). Mismatches are noted under **Check**. |
| Rail/gauss weapons at Firefight and Battlefield scale | Use **both** ammunition and power (e.g. the Tactical Railgun, the Assault Platform's cannons). Space-scale railguns (Standard Cruiser, Intrepid, System Defense Craft) use ammunition only. **Rules question:** the rules say an Attack is fed by ammo *or* power; decide whether rail weapons need both. |
| `Resource: … (N shots / days / rounds)` | Ranks = N ÷ 10 (Magazine: 10 missiles per rank). Where the count and the rank number disagree, it's noted. |
| `Major Tangle` | Tangle costs 10 BP per rank whatever grade is printed (rules §5.24). |
| Coil Power Supply with "Fuel" | Entered as the **Charge** resource (Coil runs on Charge). Noted where the book says Fuel. |
| Armor ratings and weapon multipliers one step low | A known editing error (PJ, 2026-09-26): some stat blocks printed the **Multiplier rank** as the final value, leaving out the base rank. Items confirmed from the build notes are corrected in the errata (+1 Armor and/or +1 to the single-target Attack). Don't apply this as a blanket rule: many items were printed correctly. |
| `Sidearms` (Modifiers on Chapter 11 gear) | **Firearms**. "Sidearms" is an old name for the personal-weapon skill that slipped into the equipment chapter (new errata, 2026-09-26). All entries below use Firearms. |
| Modifier covering several skills (`Firearms/Heavy Weapons +1`) | **Grade by breadth** (ruling 2026-09-28): Minor 1 skill (10 BP/rank), Moderate 2 skills (20), Major 3+ skills or a class like "Weapons" (30). |
| `Malfunction: [Tag]` | A **Moderate Malfunction** limitation (−20); the Tag is the Drawback it produces. |
| `Side Effect: [Tag]`, `[Disoriented]` from a Jump Drive, `[Emergent Altered]` | Drawback Tags. 0 BP. |
| `[Free Tags 3] or 15 BP` | A 15 BP placeholder the owner spends on Tags or other attributes. Entered as a 15 BP row. |
| `Maneuver` | Costed at the grade printed. The rule says buy it at the largest Drive's grade; mismatches are noted. |
| Software | Size comes from the build notes and errata (programs don't print a size). Size sets the **Required Computer Grade**: Tiny, Small and Medium need a Minor computer; Large and Huge need Moderate; Colossal needs Major. A Task runs at the lower of its own TN and the computer's max TN. |
| Limitations not in the Workbench examples (No Combat Reload, No Personal Concealment, Unique Fuel, Key Personnel) | No Combat Reload / No Personal Concealment / Unique Fuel = Minor (Usage Restriction style). Key Personnel = Moderate (like Prerequisite/Crew). **Rules question:** confirm grades. |
| Fields with no Workbench rule: `XP` (implants) | Kept as a data field, not costed. (Cover became Partial Armor; drug Strain and Duration are now costed; Upkeep was phased out.) |
| Shohan items | Printed CR/CC apply only to Altered characters (chapter note, p. 267). Items with CR "—" can't be bought. Formula CR is still shown. |

**CC (Character Creation cost)** follows CR almost everywhere: `CC = 0` for CR ≤ 0,
otherwise `CC = CR × (CR + 1) / 2` (1, 3, 6, 10, 15, 21, 28, 36, 45, 55). Exceptions:
Explosive Grenade and sidearm ammunition (CR 1, CC 0), and implants, which have their own CC
alongside an XP cost.

---

## 3. Summary: printed vs formula CR

| Item | Size | BP | Formula CR | Printed CR | Δ |
|---|---|---:|---:|---:|---:|
| [Standard Light Armor](#standard-light-armor) | Small | 35 | 0 | 0 | ✔ |
| [Psionic Light Armor](#psionic-light-armor) | Small | 49 | 0 | 0 | ✔ |
| [Camouflage Suit](#camouflage-suit) | Small | 85 | 1 | 1 | ✔ |
| [Stealth Suit](#stealth-suit) | Small | 101 | 2 | 2 | ✔ |
| [Riot/LEO Armor](#riotleo-armor) | Small | 106 | 2 | 2 | ✔ |
| [Riot/LEO Armor, Psi Variant](#riotleo-armor-psi-variant) | Small | 104 | 2 | 2 | ✔ |
| [Standard Powered Armor](#standard-powered-armor) | Medium | 214 | 3 | 3 | ✔ |
| [Kavacha-class A-350 Marine Engagement Suit](#kavacha-class-a-350-marine-engagement-suit) | Medium | 292 | 4 | 4 | ✔ |
| [Kavacha-class A-350SR Marine Reconnaissance Suit](#kavacha-class-a-350sr-marine-reconnaissance-suit) | Medium | 257 | 4 | 4 | ✔ |
| [Flight Pack](#flight-pack) | Small | 30 | 0 | 0 | ✔ |
| [Bolt-on Thruster Pack](#bolt-on-thruster-pack) | Small | 85 | 1 | 1 | ✔ |
| [Knife](#knife) | Small | -5 | −2 | −2 | ✔ |
| [Concealable Knife](#concealable-knife) | Small | 35 | 0 | 0 | ✔ |
| [Standard Gauss Pistol](#standard-gauss-pistol) | Small | 10 | −1 | −1 | ✔ |
| [Quality Gauss Pistol](#quality-gauss-pistol) | Small | 34 | 0 | 0 | ✔ |
| [Heavy Gauss Pistol](#heavy-gauss-pistol) | Small | 74 | 0 | 0 | ✔ |
| [Concealable Pistol](#concealable-pistol) | Small | 79 | 1 | 1 | ✔ |
| [Wellpoint Armory Stormguard 9MP](#wellpoint-armory-stormguard-9mp) | Small | 117 | 2 | 2 | ✔ |
| [Standard Gauss Rifle](#standard-gauss-rifle) | Small | 10 | −1 | −1 | ✔ |
| [Quality Gauss Rifle](#quality-gauss-rifle) | Small | 29 | 0 | 0 | ✔ |
| [Security Gauss Rifle](#security-gauss-rifle) | Small | 91 | 1 | 1 | ✔ |
| [Plasma Carbine](#plasma-carbine) | Small | 115 | 2 | 2 | ✔ |
| [Sniper Rifle](#sniper-rifle) | Small | 134 | 3 | 3 | ✔ |
| [Explosive Grenade](#explosive-grenade) | Small | 90 | 1 | 1 | ✔ |
| [Tactical Railgun](#tactical-railgun) | Small | 107 | 2 | 2 | ✔ |
| [Tactical Missile Rack](#tactical-missile-rack) | Medium | 140 | 1 | 1 | ✔ |
| [Light Plasma Cannon](#light-plasma-cannon) | Medium | 150 | 2 | 2 | ✔ |
| [Suit-Mounted Tactical Weapon](#suit-mounted-tactical-weapon) | Small | — | — | — | not costed |
| [Personal Computer](#personal-computer) | Small | 55 | 0 | 0 | ✔ |
| [Carry Comp](#carry-comp) | Tiny | 36 | 1 | 1 | ✔ |
| [Personal Psi Link](#personal-psi-link) | Small | 76 | 1 | 1 | ✔ |
| [Coil Stack Battery/Recharger](#coil-stack-batteryrecharger) | Small | 26 | 0 | 0 | ✔ |
| [Personal G3P](#personal-g3p) | Small | 75 | 1 | 1 | ✔ |
| [Craftsman G3P](#craftsman-g3p) | Medium | 165 | 2 | 2 | ✔ |
| [Commercial G3P](#commercial-g3p) | Large | 330 | 3 | 3 | ✔ |
| [Basic Neural Interface Control Link (NICL)](#basic-neural-interface-control-link-nicl) | Tiny | 35 | 1 | 1 | ✔ |
| [Advanced Neural Interface Control Link](#advanced-neural-interface-control-link) | Tiny | 50 | 2 | 2 | ✔ |
| [Reflex Enhancements](#reflex-enhancements) | Tiny | 35 | 1 | 1 | ✔ |
| [Cybernetic Arm](#cybernetic-arm) | Small | 37 | 0 | 0 | ✔ |
| [Psi Amp](#psi-amp) | Tiny | 35 | 1 | 1 | ✔ |
| [Psi Damp](#psi-damp) | Tiny | 40 | 1 | 1 | ✔ |
| [“Fluffy”](#fluffy) | Medium | 210 | 3 | 3 | ✔ |
| [Monster in the Dark](#monster-in-the-dark) | Medium | 161 | 2 | — | — |
| [Colonial Personal Transport (Hoverbike)](#colonial-personal-transport-hoverbike) | Medium | 71 | 1 | 1 | ✔ |
| [Family Transport](#family-transport) | Medium | 49 | 0 | 0 | ✔ |
| [Quality Family Transport](#quality-family-transport) | Medium | 88 | 1 | 1 | ✔ |
| [Speedster](#speedster) | Medium | 151 | 2 | 2 | ✔ |
| [Light Air Transport](#light-air-transport) | Large | 134 | 2 | 2 | ✔ |
| [Light Performance Aircraft](#light-performance-aircraft) | Medium | 203 | 3 | 3 | ✔ |
| [Cargo Transport](#cargo-transport) | Large | 103 | 2 | 2 | ✔ |
| [Armored Cargo Transport](#armored-cargo-transport) | Large | 299 | 3 | 3 | ✔ |
| [Air Transport](#air-transport) | Large | 303 | 3 | 3 | ✔ |
| [Assault Platform](#assault-platform) | Large | 429 | 4 | 4 | ✔ |
| [Attack Hovercraft](#attack-hovercraft) | Large | 420 | 4 | 4 | ✔ |
| [Armored Personnel Carrier](#armored-personnel-carrier) | Large | 441 | 4 | 4 | ✔ |
| [Autonomous Kill Vehicle (“Auntie”)](#autonomous-kill-vehicle-auntie) | Medium | 294 | 4 | 4 | ✔ |
| [Recon Drone](#recon-drone) | Medium | 158 | 2 | 2 | ✔ |
| [SAR Probe](#sar-probe) | Medium | 178 | 2 | 2 | ✔ |
| [Stealth FTL Recon Drone](#stealth-ftl-recon-drone) | Medium | 364 | 6 | 6 | ✔ |
| [Telekinetic Shuttle](#telekinetic-shuttle) | Large | 303 | 3 | 3 | ✔ |
| [Courier](#courier) | Large | 552 | 5 | 5 | ✔ |
| [Shuttle/Yacht](#shuttleyacht) | Large | 412 | 4 | 4 | ✔ |
| [Locust Mobile Industrial Platform](#locust-mobile-industrial-platform) | Huge | 808 | 7 | 7 | ✔ |
| [Factory Freighter](#factory-freighter) | Huge | 1,313 | 9 | 9 | ✔ |
| [Light Lugger](#light-lugger) | Huge | 926 | 7 | 7 | ✔ |
| [Security Escort/Corsair](#security-escortcorsair) | Large | 563 | 5 | 5 | ✔ |
| [Standard Assault Shuttle](#standard-assault-shuttle) | Large | 578 | 5 | 5 | ✔ |
| [Tanker/Command Ship](#tankercommand-ship) | Large | 688 | 6 | 6 | ✔ |
| [System Defense Craft (Pocket Cruiser)](#system-defense-craft-pocket-cruiser) | Large | 687 | 6 | 6 | ✔ |
| [Dragon-class Fleet Interceptor/Escort](#dragon-class-fleet-interceptorescort) | Large | 663 | 6 | 6 | ✔ |
| [Bridgehead Assault Shuttle](#bridgehead-assault-shuttle) | Large | 623 | 6 | 6 | ✔ |
| [Phantom Deep Recon and Insertion Vehicle (DRIV)](#phantom-deep-recon-and-insertion-vehicle-driv) | Large | 841 | 8 | 8 | ✔ |
| [Standard Cruiser](#standard-cruiser) | Huge | 1,157 | 8 | 8 | ✔ |
| [Defiance-class Cruiser](#defiance-class-cruiser) | Huge | 953 | 7 | 7 | ✔ |
| [Conventional Frigate](#conventional-frigate) | Huge | 1,453 | 10 | 10 | ✔ |
| [Intrepid-class Frigate](#intrepid-class-frigate) | Huge | 1,201 | 9 | 9 | ✔ |
| [Resolute-class Frigate](#resolute-class-frigate) | Huge | 1,401 | 10 | 10 | ✔ |
| [Redemption-class Frigate](#redemption-class-frigate) | Huge | 1,416 | 10 | 10 | ✔ |
| [Retribution-class Frigate](#retribution-class-frigate) | Huge | 1,501 | 10 | 10 | ✔ |
| [Marine LASCO (Launch, Support, and Command) Vessel](#marine-lasco-launch-support-and-command-vessel) | Huge | 1,593 | 10 | 10 | ✔ |
| [Fleet Auxiliary](#fleet-auxiliary) | Huge | 1,393 | 9 | 9 | ✔ |
| [Arniston (Unique Armed Merchantman)](#arniston-unique-armed-merchantman) | Huge | 1,203 | 9 | 9 | ✔ |
| [Havenite Lilith Carrier](#havenite-lilith-carrier) | Huge | 1,463 | 10 | 10 | ✔ |
| [Havenite Marauder](#havenite-marauder) | Large | 693 | 6 | 6 | ✔ |
| [Havenite Lamprey](#havenite-lamprey) | Large | 563 | 5 | 5 | ✔ |
| [Heavy Railgun](#heavy-railgun) | Medium | 245 | 3 | 3 | ✔ |
| [Heavy Laser Cannon](#heavy-laser-cannon) | Medium | 270 | 4 | 4 | ✔ |
| [Quad Missile Pack](#quad-missile-pack) | Medium | 150 | 2 | 2 | ✔ |
| [Social Aggregator](#social-aggregator) | Small | 100 | 2 | 2 | ✔ |
| [Basic Security Software](#basic-security-software) | Small | 40 | 0 | 0 | ✔ |
| [Security Software](#security-software) | Small | 85 | 1 | 1 | ✔ |
| [Traceback](#traceback) | Tiny | 36 | 1 | 1 | ✔ |
| [Honey Pot](#honey-pot) | Tiny | 46 | 2 | 2 | ✔ |
| [Military-Grade Security](#military-grade-security) | Small | 160 | 4 | 4 | ✔ |
| [Cover Identity](#cover-identity) | Tiny | 45 | 2 | 2 | ✔ |
| [Good Cover Identity](#good-cover-identity) | Tiny | 65 | 4 | 4 | ✔ |
| [Tse Blade](#tse-blade) | Small | 150 | 4 | 4 | ✔ |
| [Shohan Personal Armor](#shohan-personal-armor) | Medium | 337 | 5 | 5 | ✔ |
| [War Drone (Cerberus)](#war-drone-cerberus) | Medium | 733 | 13 | — | — |
| [Shohan Deployment Pod](#shohan-deployment-pod) | Large | 590 | 5 | — | — |
| [Shohan Destroyer](#shohan-destroyer) | Huge | 1,314 | 9 | — | — |
| [Shohan Dreadnought](#shohan-dreadnought) | Colossal | 2,503 | 12 | — | — |
| [Resistance Lumber Mech](#resistance-lumber-mech) | Medium | 296 | 4 | 4 | ✔ |
| [Resistance Variable Laser Array](#resistance-variable-laser-array) | Small | 98 | 1 | 1 | ✔ |

**98 match, 0 differ.** Every item now matches its printed or errata CR.


---

## 4. Rules questions raised by the catalog

Gathered from the entries so they can be settled once.

1. ~~**Rail weapons: ammo, power, or both?**~~ **Resolved (new errata p210):** integrated and slaved
   rail weapons draw a Power Slot plus Ammunition; standalone rail weapons use self-powered rounds.
2. ~~**Launcher counts.**~~ **Resolved (new errata):** launchers come in sets of 4. Shuttle 4, Dragon 8, Conventional Frigate 8, Redemption 4, Marauder 8.
3. ~~**Multi-skill Modifiers.**~~ **Resolved:** costed per skill (10 BP × rank × skills), as the Social Aggregator shows.
4. ~~Bulk fuel as cargo.~~ **Resolved (new errata):** bulk fuel is Cargo; pumping it into a
   ship's systems takes an Engineering check.
5. ~~Coil batteries below minimum size.~~ **Resolved (new errata p216):** Moderate Power
   Supplies are allowed on Small items; Major Power Supplies need Large, except Hyperspace
   Tap and Coil implementations, which fit in Medium. Only the Coil Stack (Tiny) is still too small.
6. ~~**Body increments.**~~ **Resolved (new errata):** the Large ground vehicles' Body 80 becomes 90 (same cost).
7. ~~**Undefined fields.**~~ **Resolved:** the Hoverbike's `Cover` is Limitation: Partial Armor (Moderate); drug Strain
   and Duration use Counter: Strain, Regeneration: Strain and a Duration Resource; Upkeep was phased out and is deleted from the Plasma Carbine.)
8. ~~**Reactionless Drive on Havenite ships**~~ Resolved: the Lamprey uses a modified in-system Major Gravitic drive (errata p264).
9. ~~**Maneuver without a Drive / Maneuver 5.**~~ **Resolved (new errata):** the creatures gain a Minor Land Drive; the Recon Drone's Maneuver is 4.
10. ~~**Tasks above their Computer's TN.**~~ **Resolved (new errata):** the Armored Cargo Transport, Recon Drone and War Drone get computers rated for their Task TNs; built-in Tasks keep the hard cap.
11. ~~**Plasma free Bleed.**~~ **Resolved:** the Plasma Carbine and Light Plasma Cannon errata already follow the rule; the Bridgehead's Bleed is Major 2.
12. ~~**Software pricing and computer requirements.**~~ **Resolved (new errata p209–212):** program
    size sets the Required Computer Grade (Tiny–Medium Minor, Large–Huge Moderate, Colossal Major);
    Tasks run at the lower of their TN and the computer's max TN. All programs now match their CRs.

---

## 5. Items


### Armor

#### Standard Light Armor

p. 226 · **Size:** Small · **Printed CR:** 0 · **CC:** 0

Description: "A basic armored vest designed to repel low-level weaponry."

> **Errata** (new, 2026-09-27) p226: CR 0, not 2 (a typo; its printed CC is already 0).

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Firefight, rank 2 | 30 |
| Body Track | 10 (default 5 + 1×5) | 5 |
| **Total** | | **35** |

**Formula CR:** 0 ✔ matches printed

**Check:**

- Printed CR shown here is the errata value (CR 0). The book printed CR 2.

#### Psionic Light Armor

p. 226 · **Size:** Small · **Printed CR:** 0 · **CC:** 0

Description: "This variant on the standard vest includes a small battery pack to power Psionic effects."

> **Errata** p226: Charge lasts 10 days / combat turns (was 1 day). One rank of Charge = 10 days, so this is 1 rank.

> **Errata** (new, 2026-09-27) p226: CR 0, CC 0 (was CR 1, CC 1). Stats unchanged.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Firefight, rank 2 | 30 |
| Body Track | 10 (default 5 + 1×5) | 5 |
| Power Supply | Minor Coil rank 1 | 5 |
| Resource | Charge, Minor ×1 | 4 |
| Link | Minor Psi | 5 |
| **Total** | | **49** |

**Formula CR:** 0 ✔ matches printed

**Power:** 3 Minor slots from Coil; 1 used (Psi Link). OK.

- Strain Threshold 5 (Minor Power Supply rank 1).

**Check:**

- Printed CR/CC shown here are the errata values. The book printed CR 1, CC 1.

#### Camouflage Suit

p. 226 · **Size:** Small · **Printed CR:** 1 · **CC:** 1

Description: "This extra-durable suit is produced in a variety of camouflage schemes to suit specific environments."

> **Errata** (new, 2026-09-26) p226: Armor Rating 4 (was 3).

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Firefight, rank 4 | 80 |
| Body Track | 10 (default 5 + 1×5) | 5 |
| Modifier | Stealth +3 | 30 |
| Limitation | Moderate: Partial Armor | −20 |
| Limitation | Minor: Usage Restriction (specific environment) | −10 |
| **Total** | | **85** |

**Formula CR:** 1 ✔ matches printed

#### Stealth Suit

p. 226 · **Size:** Small · **Printed CR:** 2 · **CC:** 3

Description: "Ninja-inspired garb augmented with active camouflage and ECM systems in addition to armor."

> **Errata** (new, 2026-09-27) p226: Size is Small, not Medium (per the build notes); it can be worn under street clothing.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Firefight, rank 3 | 50 |
| Body Track | 15 (default 5 + 2×5) | 10 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 1 (TN 14) | 3 |
| Modifier | Athletics +1 | 10 |
| Modifier | Stealth +3 | 30 |
| Tag | [Now You See Me, Now You Don't] 3 | 15 |
| Limitation | Moderate: Partial Armor | −20 |
| **Total** | | **101** |

**Formula CR:** 2 ✔ matches printed

#### Riot/LEO Armor

p. 227 · **Size:** Small · **Printed CR:** 2 · **CC:** 3

Description: "A heavy suit of armor designed to repel multiple incoming attacks in hostile environments."

> **Errata** (new, 2026-09-27) p227: Size is Small, not Medium (per the build notes). Armor Rating 4 (Firefight), not 3.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Firefight, rank 4 | 80 |
| Body Track | 20 (default 5 + 3×5) | 15 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 1 (TN 14) | 3 |
| Life Support | Minor ×1 | 5 |
| Modifier | Detection +1 | 10 |
| Limitation | Minor: Usage Restriction (life support only provides rebreather) | −10 |
| **Total** | | **106** |

**Formula CR:** 2 ✔ matches printed

#### Riot/LEO Armor, Psi Variant

p. 227 · **Size:** Small · **Printed CR:** 2 · **CC:** 3

Description: "A riot suit with a power supply and link for Psionics."

> **Errata** (new, 2026-09-27) p227: Size is Small, not Medium (per the build notes). Restores Minor Life Support (the rebreather its limitation refers to) and adds Tag [Mental Block]. Strain Threshold is 10, not 5.

> **Errata** p227: Charge lasts 10 days / combat turns (1 rank).

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Firefight, rank 3 | 50 |
| Body Track | 20 (default 5 + 3×5) | 15 |
| Power Supply | Moderate Coil rank 1 | 10 |
| Resource | Charge, Moderate ×1 | 8 |
| Link | Minor Psi | 5 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 1 (TN 14) | 3 |
| Life Support | Minor ×1 | 5 |
| Modifier | Detection +1 | 10 |
| Tag | [Mental Block] | 5 |
| Limitation | Minor: Usage Restriction (life support only provides rebreather) | −10 |
| **Total** | | **104** |

**Formula CR:** 2 ✔ matches printed

**Power:** 3 Moderate slots; 1 used.

- Strain Threshold 10 (Moderate Power Supply, rank 1).

#### Standard Powered Armor

p. 227 · **Size:** Medium · **Printed CR:** 3 · **CC:** 6

Description: "The standard infantry armor of the Terran Sphere and other Fourth Population forces. Its tough construction and integrated weapon mount grant its wearer a considerable advantage over unarmored enemies."

> **Errata** p227: Armor is Battlefield, not Firefight.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Battlefield, rank 4 | 110 |
| Body Track | 25 (default 10 + 3×5) | 15 |
| Power Supply | Moderate Coil rank 1 | 10 |
| Resource | Charge, Moderate ×1 | 8 |
| Link | Minor Weapon | 5 |
| Link | Moderate Psi | 15 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 1 (TN 14) | 3 |
| Life Support | Minor ×1 | 5 |
| Modifier | Athletics +1 | 10 |
| Modifier | Detection +1 | 10 |
| Modifier | Firearms/Heavy Weapons +1 (counted ×2 skills) | 20 |
| **Total** | | **214** |

**Formula CR:** 3 ✔ matches printed

**Power:** 3 Moderate slots; 2 used.

#### Kavacha-class A-350 Marine Engagement Suit

p. 228 · **Size:** Medium · **Printed CR:** 4 · **CC:** 10

Description: "The Kavacha-class suit represents the Terran Sphere’s most advanced personal defense technology, adding Force Fields to powered armor’s already significant benefits. Though it doesn’t put its wearer on even terms with a Shohan Soldier, it does give squads of marines a fighting chance against them in combat."

> **Errata** p228: Armor is Battlefield, not Firefight.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Battlefield, rank 4 | 110 |
| Body Track | 35 (default 10 + 5×5) | 25 |
| Force Field | Minor ×3 (track 30) | 45 |
| Power Supply | Moderate Coil rank 1 | 10 |
| Resource | Charge, Moderate ×1 | 8 |
| Link | Minor Weapon ×2 | 10 |
| Link | Moderate Psi | 15 |
| Modifier | Firearms/Heavy Weapons +2 (counted ×2 skills) | 40 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 2 (TN 16) | 6 |
| Life Support | Minor ×1 | 5 |
| Modifier | Athletics +2 | 20 |
| Modifier | Detection +2 | 20 |
| Tag | [Shohan Killer] | 5 |
| Tag | [High Security] 3 | 15 |
| Tag | [Coordinated Fire] | 5 |
| Limitation | Major: Restricted Technology (Property of the Terran Sphere Marines) | −50 |
| **Total** | | **292** |

**Formula CR:** 4 ✔ matches printed

**Power:** 3 Moderate slots; 2 used (Force Field 1, Psi Link 1).

- Terran Force Field (reverse-engineered): Minor is allowed.

#### Kavacha-class A-350SR Marine Reconnaissance Suit

p. 228 · **Size:** Medium · **Printed CR:** 4 · **CC:** 10

Description: "A lighter version of the Kavacha-class powered armor suit with integrated stealth technologies."

> **Errata** (new, 2026-09-26) p228: Armor is Battlefield, not Firefight (the Kavacha errata covers both suits).

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Battlefield, rank 3 | 80 |
| Body Track | 30 (default 10 + 4×5) | 20 |
| Force Field | Minor ×3 (track 30) | 45 |
| Power Supply | Moderate Coil rank 1 | 10 |
| Resource | Charge, Moderate ×1 | 8 |
| Link | Minor Weapon | 5 |
| Modifier | Firearms/Heavy Weapons +1 (counted ×2 skills) | 20 |
| Link | Moderate Psi | 15 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 2 (TN 16) | 6 |
| Modifier | Athletics +2 | 20 |
| Modifier | Detection +2 | 20 |
| Modifier | Stealth +2 | 20 |
| Tag | [Now You See Me, Now You Don't] 3 | 15 |
| Tag | [High Security] 3 | 15 |
| Tag | [Shohan Killer] | 5 |
| Limitation | Major: Restricted Technology (Property of the Terran Sphere Marines) | −50 |
| **Total** | | **257** |

**Formula CR:** 4 ✔ matches printed

**Power:** 3 Moderate slots; 2 used.

#### Flight Pack

p. 229 · **Size:** Small · **Printed CR:** 0 · **CC:** 0

Description: "This condensed vectored thrust unit allows a character in powered armor to make tactical hops on the Battlefield or brief jumps between starships in close Space range."

> **Errata** (new, 2026-09-27) p229: Adds Modifier: Pilot +2. [Turn Your Head to Steer] is a Free Tag; [A Leap of Faith] is rank 3. Its Usage Restriction is a Moderate limitation. CR 0, CC 0 (was CR 1, CC 1).

| Row | Detail | BP |
|---|---|---:|
| Drive | Minor Reaction | 10 |
| Resource | Fuel, Minor ×3 | 15 |
| Modifier | Pilot +2 | 20 |
| Tag | [Turn Your Head to Steer] (Free) | 10 |
| Tag | [A Leap of Faith] 3 | 15 |
| Limitation | Moderate: Slave (powered armor Weapon Link) | −20 |
| Limitation | Moderate: Usage Restriction (Short range movement at Space scale, Far range at Battlefield scale) | −20 |
| **Total** | | **30** |

**Formula CR:** 0 ✔ matches printed

- [Turn Your Head to Steer] grants a free skill switch from Piloting to Athletics.
- Range reference (PJ): Firefight Far range = Battlefield Short; Battlefield Far = Space Short.
- Its Minor Reaction Drive is a jet pack: it works on a planet and in microgravity.

**Check:**

- Printed CR/CC shown here are the errata values. The book printed CR 1, CC 1.

#### Bolt-on Thruster Pack

p. 229 · **Size:** Small · **Printed CR:** 1 · **CC:** 1

Description: "This bolt-on thruster assembly adds Space flight and maneuvering capabilities to powered armor suits."

> **Errata** (new, 2026-09-27) p229: Adds Modifier: Pilot +2 and Life Support: Minor (extends suit operations in space). Fuel is 3 Moderate, not Minor (Minor fuel cannot feed its Moderate drive).

| Row | Detail | BP |
|---|---|---:|
| Drive | Moderate Reaction | 25 |
| Maneuver | rank 2 at Moderate grade | 20 |
| Resource | Fuel, Moderate ×3 | 30 |
| Modifier | Pilot +2 | 20 |
| Life Support | Minor ×1 | 5 |
| Limitation | Moderate: Slave (powered armor Weapon Link) | −20 |
| Tag | [Leap of Faith] | 5 |
| **Total** | | **85** |

**Formula CR:** 1 ✔ matches printed


### Weapons: Melee

#### Knife

p. 229 · **Size:** Small · **Printed CR:** −2 · **CC:** 0

Description: "A short piece of sharp metal."

> **Errata** (new, 2026-09-27) p229: Adds Limitation: Usage Restriction (Firefight targets only; useless against Battlefield or hull armor), Minor.

| Row | Detail | BP |
|---|---|---:|
| Attack | Melee (Firefight) 2x | 5 |
| Limitation | Minor: Usage Restriction (Firefight targets only; useless against Battlefield or hull armor) | −10 |
| **Total** | | **-5** |

**Formula CR:** −2 ✔ matches printed

#### Concealable Knife

p. 229 · **Size:** Small · **Printed CR:** 0 · **CC:** 0

Description: "A blade that may fold or be disguised to go unnoticed."

| Row | Detail | BP |
|---|---|---:|
| Attack | Melee (Firefight) 2x | 5 |
| Modifier | Concealable +2 | 20 |
| Tag | [Disappearing Act] 2 | 10 |
| **Total** | | **35** |

**Formula CR:** 0 ✔ matches printed


### Weapons: Firearms

#### Standard Gauss Pistol

p. 230 · **Size:** Small · **Printed CR:** −1 · **CC:** 0

Description: "A common slugthrower, and one of the most ubiquitous weapons in the Fourth Population."

| Row | Detail | BP |
|---|---|---:|
| Attack | Kinetic (Firefight) 2x | 10 |
| Resource | Ammunition, Minor ×2 | 10 |
| Limitation | Minor: Usage Restriction (ineffective at Far Range) | −10 |
| **Total** | | **10** |

**Formula CR:** −1 ✔ matches printed

#### Quality Gauss Pistol

p. 230 · **Size:** Small · **Printed CR:** 0 · **CC:** 0

Description: "Manufactured or crafted from higher-quality designs and components, providing improved accuracy and reliability."

> **Errata** (new, 2026-09-26) p230: Attack increases to 3x (was 2x); the build notes used 3x.

| Row | Detail | BP |
|---|---|---:|
| Attack | Kinetic (Firefight) 3x | 19 |
| Resource | Ammunition, Minor ×3 | 15 |
| Modifier | Firearms +1 | 10 |
| Limitation | Minor: Usage Restriction (ineffective at Far Range) | −10 |
| **Total** | | **34** |

**Formula CR:** 0 ✔ matches printed

#### Heavy Gauss Pistol

p. 230 · **Size:** Small · **Printed CR:** 0 · **CC:** 0

Description: "A fully automatic weapon, providing intense firepower in a small package."

> **Errata** (new, 2026-09-26) p230: Single-target mode increases to 3x (was 2x). Burst mode stays 2x.

| Row | Detail | BP |
|---|---|---:|
| Attack (mode 1: single target) | Kinetic (Firefight) 3x | 19 |
| Attack (mode 2: burst) | Kinetic (Firefight) 2x | 10 |
| Area |  | 20 |
| Limitation | Minor: Hungry (10 shots/round, burst mode) | −10 |
| Resource | Ammunition, Minor ×5 | 25 |
| Modifier | Firearms +2 | 20 |
| Limitation | Minor: Usage Restriction (ineffective at Far Range) | −10 |
| **Total** | | **74** |

**Formula CR:** 0 ✔ matches printed

- "Attacks (1/attack)": one weapon with selectable modes. Each mode is costed as its own Attack (see Conventions).

#### Concealable Pistol

p. 230 · **Size:** Small · **Printed CR:** 1 · **CC:** 1

Description: "The concealable pistol lacks both bulge and bang."

> **Errata** (new, 2026-09-26) p230: Attack increases to 3x (was 2x), adds Modifier: Firearms +2 (per the build notes), and Ammunition increases to 4 ranks / 40 shots (was 3 / 30). 79 BP, CR 1.

| Row | Detail | BP |
|---|---|---:|
| Attack | Kinetic (Firefight) 3x | 19 |
| Resource | Ammunition, Minor ×4 | 20 |
| Counter | Detection (−2 to opponents’ Discern/Detection checks to spot it) | 20 |
| Modifier | Firearms +2 | 20 |
| Tag | [Silent, But Deadly] 2 | 10 |
| Limitation | Minor: Usage Restriction (ineffective at Far Range) | −10 |
| **Total** | | **79** |

**Formula CR:** 1 ✔ matches printed

#### Wellpoint Armory Stormguard 9MP

p. 231 · **Size:** Small · **Printed CR:** 2 · **CC:** 3

Description: "One of the few chemical propellant guns still manufactured, each of the pistol’s six barrels contains a full clip of ammunition that can be ignited individually or in rapid sequence. To compete with modern gauss gun technology, the Stormguard uses extremely specialized ammunition."

> **Errata** p231: Ammunition now costs CR 1 (was "3x"). Update the Prerequisite text.

| Row | Detail | BP |
|---|---|---:|
| Attack (mode 1) | Kinetic (Firefight) 3x | 19 |
| Counter | Armor (mode 1) | 20 |
| Attack (mode 2: scatter) | Kinetic (Firefight) 3x | 19 |
| Area |  | 20 |
| Limitation | Minor: Hungry (10 shots/round, scatter) | −10 |
| Attack (mode 3: burst) | Kinetic (Firefight) 3x | 19 |
| Area |  | 20 |
| Limitation | Minor: Hungry (10 shots/round, burst) | −10 |
| Resource | Ammunition, Minor ×6 | 30 |
| Modifier | Firearms +2 | 20 |
| Limitation | Moderate: Prerequisite (special ammunition) | −20 |
| Limitation | Minor: Usage Restriction (ineffective at Far Range) | −10 |
| **Total** | | **117** |

**Formula CR:** 2 ✔ matches printed

- Uses all 3 Minor limitation slots.

#### Standard Gauss Rifle

p. 231 · **Size:** Small · **Printed CR:** −1 · **CC:** 0

Description: "This is the common long arm of the Fourth Population, and is available to most every criminal, law enforcer, and hunter."

| Row | Detail | BP |
|---|---|---:|
| Attack | Kinetic (Firefight) 2x | 10 |
| Resource | Ammunition, Minor ×2 | 10 |
| Limitation | Minor: Usage Restriction (cannot be concealed on a person) | −10 |
| **Total** | | **10** |

**Formula CR:** −1 ✔ matches printed

#### Quality Gauss Rifle

p. 231 · **Size:** Small · **Printed CR:** 0 · **CC:** 0

Description: ""

| Row | Detail | BP |
|---|---|---:|
| Attack | Kinetic (Firefight) 3x | 19 |
| Resource | Ammunition, Minor ×2 | 10 |
| Modifier | Firearms +1 | 10 |
| Limitation | Minor: No Personal Concealment | −10 |
| **Total** | | **29** |

**Formula CR:** 0 ✔ matches printed

- "No Personal Concealment" is the same limitation the Standard rifle writes out as a Usage Restriction. Normalize the wording.

#### Security Gauss Rifle

p. 231 · **Size:** Small · **Printed CR:** 1 · **CC:** 1

Description: "A high-capacity gauss rifle capable of rapid-fire bursts."

> **Errata** (new, 2026-09-26) p231: Single-target attack increases to 4x (was 3x). Burst mode stays 3x.

| Row | Detail | BP |
|---|---|---:|
| Attack (mode 1: single target) | Kinetic (Firefight) 4x | 37 |
| Attack (mode 2: burst) | Kinetic (Firefight) 3x | 19 |
| Area |  | 20 |
| Limitation | Minor: Hungry (10 shots/round, burst) | −10 |
| Resource | Ammunition, Minor ×5 | 25 |
| Modifier | Firearms +1 | 10 |
| Limitation | Minor: No Personal Concealment | −10 |
| **Total** | | **91** |

**Formula CR:** 1 ✔ matches printed

#### Plasma Carbine

p. 232 · **Size:** Small · **Printed CR:** 2 · **CC:** 3

Description: "The smallest implementation of the Terran Sphere’s anti-Shohan plasma arms, this is the preferred Marine weapon for close combat, due to the operator being less likely to get caught in the ensuing conflagration."

> **Errata** (new, 2026-09-29) p232: Its attack is self-powered Plasma: it needs special ammunition instead of 2 Power Slots, and that requirement is built into the implementation (it takes a Moderate limitation slot but refunds nothing), replacing the separate Prerequisite (special ammunition) limitation. Bleed 3 (Minor): 2 free from Plasma plus 1 bought (was 2 bought). CR 2 unchanged.

> **Errata** (new, 2026-09-28) p232: Delete "Upkeep: 1". Upkeep was a recurring maintenance cost that was phased out of the rules; this listing is a leftover.

> **Errata** p232: Weapon Multiplier 4x (was 3x). Ammunition costs CR 1 (was 5x). Loses Area; gains Counter: Armor.

> **Errata** (new, 2026-09-27) p232: Attack 5x (was 4x). Bleed 4 (Minor): 2 free from Plasma plus 2 bought.

| Row | Detail | BP |
|---|---|---:|
| Attack | Plasma (self-powered) (Firefight) 5x | 70 |
| Counter | Shields (free) | 0 |
| Bleed | Minor 3 (Plasma: 2 free + 1 bought) | 10 |
| Counter | Armor | 20 |
| Resource | Ammunition, Minor ×2 | 10 |
| Tag | [The Building's on Fire, and It's My Fault] | 5 |
| Limitation (built in) | Moderate: special ammunition (Plasma (self-powered)); takes a Moderate slot, no refund | 0 |
| **Total** | | **115** |

**Formula CR:** 2 ✔ matches printed

**Check:**

- Self-powered Plasma: special ammunition replaces Plasma's 2 Power Slots, so the carbine needs no power.

#### Sniper Rifle

p. 232 · **Size:** Small · **Printed CR:** 3 · **CC:** 6

Description: "A time-honored method for eliminating foes at long range, updated to use high-powered laser technology."

> **Errata** (new, 2026-09-26) p232: Attack 5x (was 4x).

| Row | Detail | BP |
|---|---|---:|
| Attack | Energy (Firefight) 5x | 70 |
| Counter | Armor | 20 |
| Power Supply | Minor Coil rank 1 | 5 |
| Resource | Charge, Minor ×1 | 4 |
| Modifier | Detection +2 | 20 |
| Modifier | Firearms +2 | 20 |
| Tag | [Reach Out And Touch Someone] | 5 |
| Limitation | Minor: Usage Restriction (no personal concealment) | −10 |
| **Total** | | **134** |

**Formula CR:** 3 ✔ matches printed

**Power:** 3 Minor slots; 1 used.


### Weapons: Grenades

#### Explosive Grenade

p. 233 · **Size:** Small · **Printed CR:** 1 · **CC:** 0

Description: ""

> **Errata** (new, 2026-09-26) p233: Attack 6x (was 5x).

| Row | Detail | BP |
|---|---|---:|
| Attack | Energy (Firefight) 6x | 110 |
| Area |  | 20 |
| Counter | Armor | 20 |
| Limitation | Major: One-Time Use | −50 |
| Limitation | Minor: Hungry (1 shot per grenade) | −10 |
| **Total** | | **90** |

**Formula CR:** 1 ✔ matches printed

**Check:**

- No implementation is given ("Ranged 5x"). Costed as Energy; as Kinetic it would be 6 BP cheaper. The CR is the same either way.
- CC 0 at CR 1 breaks the usual CR→CC pattern (CR 1 → CC 1). Possibly deliberate for consumables; sidearm ammo does the same.


### Weapons: Heavy

#### Tactical Railgun

p. 233 · **Size:** Small · **Printed CR:** 2 · **CC:** 3

Description: "A scaled-up version of the gauss gun, the tactical railgun consumes far more power. Railguns have replaced chemically powered artillery on the modern battlefield. This version is designed for emplacement in fortifications for suppressive fire."

> **Errata** (new, 2026-09-26) p233: Size is Small (was Medium). Its Hungry limitation is Moderate (was treated as Minor). Attack stays 4x.

| Row | Detail | BP |
|---|---|---:|
| Attack | Kinetic (Battlefield) 4x | 47 |
| Area |  | 20 |
| Resource | Ammunition, Moderate ×4 | 40 |
| Limitation | Moderate: Hungry (10 shots/round) | −20 |
| Modifier | Heavy Weapons +2 | 20 |
| **Total** | | **107** |

**Formula CR:** 2 ✔ matches printed

**Power:** Draws 1 Moderate slot from its host (no Power Supply of its own).

- Uses both ammunition and power. See Conventions: gauss/rail weapons in this chapter do this.

**Check:**

- The Suit-Mounted Tactical Weapon template (p234) shrinks its weapons to Small. The railgun is now Small already, so for it the template only adds the power requirement and the Slave limitation.

#### Tactical Missile Rack

p. 233 · **Size:** Medium · **Printed CR:** 1 · **CC:** 1

Description: "A popular battlefield module capable of launching multiple different missile loadouts."

> **Errata** (new, 2026-09-27) p233: Adds Limitation: Slave (Moderate); the rack is a module mounted on and powered by a host unit.

| Row | Detail | BP |
|---|---|---:|
| Launcher | Battlefield ×12, 3 increments | 120 |
| Resource | Magazine, Moderate ×3 | 30 |
| Modifier | Gunnery +2 | 20 |
| Limitation | Minor: Usage Restriction (cannot reload during combat) | −10 |
| Limitation | Moderate: Slave (mounted on a host unit that powers it) | −20 |
| **Total** | | **140** |

**Formula CR:** 1 ✔ matches printed

**Power:** Draws 3 Moderate slots from its host (12 launchers ÷ 4 = 3). OK.

#### Light Plasma Cannon

p. 234 · **Size:** Medium · **Printed CR:** 2 · **CC:** 3

Description: "In unskilled hands, this squad-based anti-Shohan weapon can cause severe environmental complications to both sides of a conflict."

> **Errata** p234: Ammunition costs CR 1 (was 5x). Update the Prerequisite text.

> **Errata** (new, 2026-09-27) p234: Attack 5x (was 4x). Bleed 4 (Moderate): 2 free from Plasma plus 2 bought.

| Row | Detail | BP |
|---|---|---:|
| Attack | Plasma (Battlefield) 5x | 80 |
| Counter | Shields (free) | 0 |
| Bleed | Moderate 4 (Plasma: 2 free + 2 bought) | 25 |
| Area |  | 20 |
| Resource | Ammunition, Moderate ×4 | 40 |
| Tag | [The Building's on Fire, and It's My Fault] | 5 |
| Limitation | Moderate: Prerequisite (special ammunition) | −20 |
| **Total** | | **150** |

**Formula CR:** 2 ✔ matches printed

**Power:** Draws 2 Moderate slots from its host (Plasma = 2). OK.

#### Suit-Mounted Tactical Weapon

p. 234 · **Size:** Small · **Printed CR:** — · **CC:** —

Description: "The tactical railgun, missile rack, and light plasma cannon can be miniaturized for mounting to powered armor or units, with the same firepower if the unit can provide for these additional requirements."

| Row | Detail | BP |
|---|---|---:|
| Template | Apply to Tactical Railgun, Tactical Missile Rack, or Light Plasma Cannon: size becomes Small, add +1 Moderate slot to the power requirement, add Limitation: Slave (unit with a Weapon Link) | 0 |

**Not costed** (see Check).

- A modification template, not an item. Implement it as a variant/derived item. No CR is printed.


### Computers

#### Personal Computer

p. 234 · **Size:** Small · **Printed CR:** 0 · **CC:** 0

Description: "A standard personal computing device that fits comfortably in a hand and has two variable-geometry screens."

| Row | Detail | BP |
|---|---|---:|
| Computer | Minor rank 3 (TN 18) | 9 |
| Tasks | Intrusion Detection 18 | 36 |
| Link | Minor Data | 5 |
| Tag | [Pick Up and Go] | 5 |
| **Total** | | **55** |

**Formula CR:** 0 ✔ matches printed

**Power:** Draws 1 Minor slot from its host/battery.

#### Carry Comp

p. 235 · **Size:** Tiny · **Printed CR:** 1 · **CC:** 1

Description: "A tiny disc-shaped computer the size of a thick coin that can be attached to a neural interface implant/DNI jack and worn behind the ear."

> **Errata** (new, 2026-09-27) p235: Computer is rank 4 (TN 20), not rank 3.

| Row | Detail | BP |
|---|---|---:|
| Communication | Minor Radio | 3 |
| Computer | Minor rank 4 (TN 20) | 12 |
| Tasks | Intrusion Detection 18 | 36 |
| Link | Minor Data | 5 |
| Limitation | Moderate: Prerequisite (requires a neural interface) | −20 |
| **Total** | | **36** |

**Formula CR:** 1 ✔ matches printed

**Power:** Draws 1 Minor slot.


### Power Supplies

#### Personal Psi Link

p. 235 · **Size:** Small · **Printed CR:** 1 · **CC:** 1

Description: "Standard equipment for Psionics trained in Telekinesis or Energy Manipulation, a Psi Link is capable of providing the power needed for such effects and the ability to interface with larger power supplies if necessary. Most are built into gantlets out of convenience, but can range from helmets and backpacks to an ornamental mage’s staff, depending on the Psionic's tastes and peculiarities."

> **Errata** p235: Power Supply is Moderate (was Major); Strain Threshold 10 (was 25). The Charge resource drops to Moderate to match.

> **Errata** (new, 2026-09-25) p216: Moderate Power Supplies are allowed on Small items, so this is now legal.

> **Errata** (new, 2026-09-27) p235: 2 Moderate Charge (was 1; 20 days or 20 combat rounds). CR 1, CC 1 (was CR 2, CC 3); the printed CR matched the original Major power supply.

| Row | Detail | BP |
|---|---|---:|
| Link | Major Psi | 50 |
| Power Supply | Moderate Coil rank 1 | 10 |
| Resource | Charge, Moderate ×2 | 16 |
| **Total** | | **76** |

**Formula CR:** 1 ✔ matches printed

**Power:** 3 Moderate slots; 1 used.

**Check:**

- Printed CR/CC shown here are the errata values. The book printed CR 2, CC 3.

#### Coil Stack Battery/Recharger

p. 235 · **Size:** Small · **Printed CR:** 0 · **CC:** 0

Description: "A Stack can hold a stable electrical charge via a segment of superconducting Coil capable of powering or recharging a device."

> **Errata** (new, 2026-09-28) p235: Size is Small, not Tiny (a Moderate Power Supply needs a Small item), and it holds 2 Moderate Charge, not 1.

| Row | Detail | BP |
|---|---|---:|
| Power Supply | Moderate Coil rank 1 | 10 |
| Resource | Charge, Moderate ×2 | 16 |
| **Total** | | **26** |

**Formula CR:** 0 ✔ matches printed

**Power:** 3 Moderate slots; 0 used.


### Manufacturing

#### Personal G3P

p. 236 · **Size:** Small · **Printed CR:** 1 · **CC:** 1

Description: "A sophisticated micro-manufacturing pod capable of turning out Tiny and Small items or constructing parts for many Medium items."

> **Errata** (new, 2026-09-27) p236: [Hobbyist Builder's Best Friend] is rank 3 (was 1).

| Row | Detail | BP |
|---|---|---:|
| Manufacture | Moderate | 50 |
| Modifier | Design Software +1 | 10 |
| Tag | [Hobbyist Builder's Best Friend] 3 | 15 |
| **Total** | | **75** |

**Formula CR:** 1 ✔ matches printed

**Power:** Draws 1 Moderate slot from its host.

#### Craftsman G3P

p. 236 · **Size:** Medium · **Printed CR:** 2 · **CC:** 3

Description: "A manufacturing pod suitable for a small shop or tradesman, capable of turning out many Medium items or parts for larger items."

| Row | Detail | BP |
|---|---|---:|
| Manufacture | Moderate | 50 |
| Manufacture | Major | 100 |
| Modifier | Design Software +1 | 10 |
| Tag | [Professional Grade] | 5 |
| **Total** | | **165** |

**Formula CR:** 2 ✔ matches printed

**Power:** Draws 1 Moderate + 1 Major slot from its host.

#### Commercial G3P

p. 236 · **Size:** Large · **Printed CR:** 3 · **CC:** 6

Description: "A manufacturing pod suitable for a dedicated commercial structure. These heavyweights are capable of producing many Medium or Large items or the parts required for a Huge item, if given the time and materials."

| Row | Detail | BP |
|---|---|---:|
| Manufacture | Major ×3 | 300 |
| Modifier | Design Software +2 | 20 |
| Tag | [Industrial Load] | 5 |
| Tag | [No Assembly Required] | 5 |
| **Total** | | **330** |

**Formula CR:** 3 ✔ matches printed

**Power:** Draws 3 Major slots from its host.


### Biotech: Implants

#### Basic Neural Interface Control Link (NICL)

p. 237 · **Size:** Tiny · **Printed CR:** 1 · **CC:** 2 · **XP:** 4

Description: "Known as DNIs, NICLs, (Nickles) or Slots, neural interfaces are some of the most common pieces of cyberware in the Fourth Population. Nanotechnology techniques grow a weave inside the subject’s brain, creating an interface between a sentient being and technology that flows at the speed of thought. However, these DNIs are deliberately inhibited to prevent them from completely overriding a user’s senses and motor control for their own safety."

> **Errata** (new, 2026-09-29) p237: Technical-class Skills +1 is a Major Modifier (it covers a class of skills). Its Usage Restriction is Moderate, not Minor. CR 1 (was 0).

> **Errata** (new, 2026-09-27) p237: Modifier: Initiative +1 (was +2), per the build notes.

| Row | Detail | BP |
|---|---|---:|
| Link | Minor Data | 5 |
| Neural Interface | Moderate | 5 |
| Modifier | Technical-class Skills +1 (Major: a class of skills) | 30 |
| Modifier | Initiative +1 | 10 |
| Tag | [Protective Limiters] | 5 |
| Limitation | Moderate: Usage Restriction (Skill modifiers only apply to linked gear) | −20 |
| **Total** | | **35** |

**Formula CR:** 1 ✔ matches printed

- Initiative: +2 from the Moderate Neural Interface when operating linked equipment; +1 in general from the Modifier.

**Check:**

- Printed CR shown here is the errata value (CR 1). The book printed CR 0; CC is unchanged.

#### Advanced Neural Interface Control Link

p. 237 · **Size:** Tiny · **Printed CR:** 2 · **CC:** 4 · **XP:** 6

Description: "Unlike their relatively tame brothers, these DNIs lack the inhibitors that prevent them from overriding a character’s senses and motor control. The user experience is greatly improved, at the cost of creating a potential back door directly into their brain."

> **Errata** (new, 2026-09-29) p237: Technical-class Skills +1 is a Major Modifier (it covers a class of skills). Its Usage Restriction is Moderate, not Minor. CR 2 (was 1).

> **Errata** (new, 2026-09-28) p237: Initiative Modifier is +2 (was +3). The Major Neural Interface gives +3 Initiative when operating linked equipment; the Modifier is the general bonus. [Dance Along the Bleeding Edge, But You Might Get Cut] splits in two: the Tag [Dance Along The Bleeding Edge 2] and the Major limitation [...But You Might Get Cut 2].

> **Errata** (new, 2026-09-25) p237: [Dance Along the Bleeding Edge, But You Might Get Cut] is a Major Limitation, not a Tag: hacking that breaches the user’s defenses can inflict physical damage.

| Row | Detail | BP |
|---|---|---:|
| Link | Major Data | 50 |
| Neural Interface | Major | 10 |
| Modifier | Technical-class Skills +1 (Major: a class of skills) | 30 |
| Modifier | Initiative +2 | 20 |
| Tag | [Dance Along The Bleeding Edge] 2 | 10 |
| Limitation | Major: [...But You Might Get Cut 2]: hacking that breaches the user’s defenses can inflict physical damage | −50 |
| Limitation | Moderate: Usage Restriction (Skill modifiers only apply to linked gear) | −20 |
| **Total** | | **50** |

**Formula CR:** 2 ✔ matches printed

- Initiative: +3 from the Major Neural Interface when operating linked equipment; +2 in general from the Modifier.

#### Reflex Enhancements

p. 237 · **Size:** Tiny · **Printed CR:** 1 · **CC:** 4 · **XP:** 6

Description: ""

> **Errata** (new, 2026-09-27) p237: Adds Tag: [Need For Speed].

| Row | Detail | BP |
|---|---|---:|
| Modifier | Initiative +3 | 30 |
| Tag | [Need For Speed] | 5 |
| **Total** | | **35** |

**Formula CR:** 1 ✔ matches printed

#### Cybernetic Arm

p. 238 · **Size:** Small · **Printed CR:** 0 · **CC:** 2 · **XP:** 4

Description: "A replacement limb with enhanced control and power support options."

| Row | Detail | BP |
|---|---|---:|
| Power Supply | Minor Coil rank 1 | 5 |
| Resource | Charge, Minor ×3 | 12 |
| Modifier | Appropriate physical tasks +2 | 20 |
| **Total** | | **37** |

**Formula CR:** 0 ✔ matches printed

**Power:** 3 Minor slots; 1 used.


### Biotech: Drugs

#### Psi Amp

p. 238 · **Size:** Tiny · **Printed CR:** 1 · **CC:** 1

Description: "This drug blasts away Psionic Strain in a chemical rush. Unfortunately, like many drugs, there are side effects."

> **Errata** (new, 2026-09-28) p238: Rebuilt. The initial hit is Counter: Strain, 1 rank (+5 Psionic Strain), followed by Regeneration: Strain 5 (Major, every round) for its Duration (1 Minor rank: 10 combat rounds). [Euphoria] is a Minor limitation. Supersedes the +10 Strain erratum.

> **Errata** p238: Psionic Strain +10 (was +25).

| Row | Detail | BP |
|---|---|---:|
| Counter | Strain, 1 rank (+5 Psionic Strain, initial hit) | 20 |
| Regeneration | Strain 5, Major grade | 65 |
| Resource | Duration, Minor ×1 | 5 |
| Tag | [My Mind Is Clear] | 5 |
| Limitation | Minor: [Euphoria] (side effect) | −10 |
| Limitation | Major: One-Time Use | −50 |
| **Total** | | **35** |

**Formula CR:** 1 ✔ matches printed

- Counter: Strain is 20 BP per rank of 5 Strain. Duration is bought as a Resource.

#### Psi Damp

p. 238 · **Size:** Tiny · **Printed CR:** 1 · **CC:** 1

Description: "Frequently used to restrain incarcerated Psionics, Psi Damps cause no lasting harm but are universally described as uncomfortable for prisoners who are required to take them."

> **Errata** (new, 2026-09-28) p238: Costed as Counter: Strain, 5 ranks (−25 Psionic Strain), with a Duration of 1 Moderate Resource rank (1 day). [It Itches In My Brain] becomes [It Itches In My Brain 3], a Moderate limitation.

| Row | Detail | BP |
|---|---|---:|
| Counter | Strain, 5 ranks (−25 Psionic Strain) | 100 |
| Resource | Duration, Moderate ×1 | 10 |
| Limitation | Moderate: [It Itches In My Brain 3] (side effect) | −20 |
| Limitation | Major: One-Time Use | −50 |
| **Total** | | **40** |

**Formula CR:** 1 ✔ matches printed


### Creatures

#### “Fluffy”

p. 239 · **Size:** Medium · **Printed CR:** 3 · **CC:** 6

Description: "Your best friend, their worst nightmare. He’s just a little… stubborn sometimes."

> **Errata** (new, 2026-09-28) p239: Adds Drive: Minor Land (legs), which carries its Maneuver 1.

> **Errata** (new, 2026-09-26) p239: Armor Rating 3 (was 2).

| Row | Detail | BP |
|---|---|---:|
| Attack (Claws and Teeth) | Melee (Firefight) 3x | 10 |
| Armor Rating | Firefight, rank 3 | 50 |
| Body Track | 30 (default 10 + 4×5) | 20 |
| Drive | Minor Land (legs) | 10 |
| Maneuver | rank 1 at Minor grade | 5 |
| Computer | Minor Brain rank 4 (TN 20) | 20 |
| Tasks | Stealth 17, Combat 17, Athletics 18, Tracking 18, Initiative 5 (Brain: half) | 75 |
| Limitation | Moderate: Malfunction [Has A Mind of His Own] | −20 |
| Tag | [Nice Kitty/Good Doggie] 2 | 10 |
| Tag | [Does He Do Any Tricks?] | 5 |
| Tag | [Loyal Companion] 2 | 10 |
| Tag | [Quick on His Feet] 3 | 15 |
| **Total** | | **210** |

**Formula CR:** 3 ✔ matches printed

- Attack can optionally deal Subdual damage.

**Check:**

- "Initiative 5" as a Task is odd (TN 5). Probably meant as an Initiative value, not a Task.

#### Monster in the Dark

p. 239 · **Size:** Medium · **Printed CR:** — · **CC:** —

Description: "Did you hear that…?"

> **Errata** (new, 2026-09-28) p239: Adds Drive: Minor Land (legs), which carries its Maneuver 1.

| Row | Detail | BP |
|---|---|---:|
| Attack (Lethal Claws) | Melee (Firefight) 4x | 20 |
| Counter | Armor | 20 |
| Drive | Minor Land (legs) | 10 |
| Maneuver | rank 1 at Minor grade | 5 |
| Computer | Minor Brain rank 4 (TN 20) | 20 |
| Tasks | Stealth 18, Combat 19, Athletics 18, Tracking 16, Initiative 5 (Brain: half) | 76 |
| Limitation | Moderate: Malfunction [Inverse Ninja Rule 3] | −20 |
| Tag | [Don't Turn Around] 2 | 10 |
| Tag | [Clever Girl] | 5 |
| Tag | [Quick on Its Feet] 3 | 15 |
| **Total** | | **161** |

**Formula CR:** 2

- GM creature; not for sale (CR —).

**Check:**

- Same Initiative-Task issue as Fluffy. No Armor or Body listed (default Body 10).


### Vehicles: Personal

#### Colonial Personal Transport (Hoverbike)

p. 240 · **Size:** Medium · **Printed CR:** 1 · **CC:** 1

Description: "A rugged craft capable of carrying up to two people over ground or air, these vehicles see a lot of use on newly developed worlds with remote settlements and little infrastructure. They also have a following in the Core Worlds as a compact means of personal transportation across urban sprawl."

> **Errata** (new, 2026-09-28) p240: Armor Rating 2 (Firefight), not 1. "Cover: Moderate (Partial)" becomes Limitation: Partial Armor (Moderate); an aimed shot bypasses the armor.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Firefight, rank 2 | 30 |
| Body Track | 10 (default) | 0 |
| Limitation | Moderate: Partial Armor (aimed shots bypass it) | −20 |
| Drive | Minor Ground | 10 |
| Drive | Minor Air | 10 |
| Maneuver | rank 2 at Minor grade | 10 |
| Resource | Fuel, Minor ×2 | 10 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 1 (TN 14) | 3 |
| Cargo | Minor ×1 | 5 |
| Tag | [Life is Too Short for Traffic] | 5 |
| Tag | [Drive or Pilot, It's All the Same] | 5 |
| **Total** | | **71** |

**Formula CR:** 1 ✔ matches printed

**Power:** 6 Minor slots (two Drives); 0 used. OK.

- [Drive or Pilot, It's All the Same]: free Skill switch between Drive and Pilot.

#### Family Transport

p. 240 · **Size:** Medium · **Printed CR:** 0 · **CC:** 0

Description: "Basic, self-driving ground automobile transportation."

> **Errata** (new, 2026-09-27) p240: Fuel is 2 Minor (20 days/combat rounds; was 5). Task: Drive 15 (was 16).

| Row | Detail | BP |
|---|---|---:|
| Body Track | 15 (default 10 + 1×5) | 5 |
| Drive | Minor Ground | 10 |
| Resource | Fuel, Minor ×2 | 10 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 2 (TN 16) | 6 |
| Tasks | Drive 15 | 30 |
| Cargo | Minor ×1 | 5 |
| Limitation | Moderate: Slave (external navigational infrastructure, such as GPS) | −20 |
| **Total** | | **49** |

**Formula CR:** 0 ✔ matches printed

#### Quality Family Transport

p. 241 · **Size:** Medium · **Printed CR:** 1 · **CC:** 1

Description: "Ground transportation with a carefully dolloped amount of panache."

| Row | Detail | BP |
|---|---|---:|
| Body Track | 20 (default 10 + 2×5) | 10 |
| Drive | Minor Ground | 10 |
| Maneuver | rank 1 at Minor grade | 5 |
| Resource | Fuel, Minor ×3 | 15 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 3 (TN 18) | 9 |
| Tasks | Drive 18 | 36 |
| Cargo | Minor ×1 | 5 |
| Tag | [A Touch of Class] 2 | 10 |
| Tag | [Security] | 5 |
| Limitation | Moderate: Slave (external navigational infrastructure, such as GPS) | −20 |
| **Total** | | **88** |

**Formula CR:** 1 ✔ matches printed

#### Speedster

p. 241 · **Size:** Medium · **Printed CR:** 2 · **CC:** 3

Description: "Performance transport for the discerning individual who needs to get there (or away) fast."

> **Errata** (new, 2026-09-27) p241: Adds Modifier: Drive +2 and the Free Tag [...And Turns A Few Heads 3].

| Row | Detail | BP |
|---|---|---:|
| Body Track | 30 (default 10 + 4×5) | 20 |
| Drive | Minor Ground | 10 |
| Maneuver | rank 3 at Minor grade | 15 |
| Resource | Fuel, Minor ×3 | 15 |
| Cargo | Minor ×1 | 5 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 3 (TN 18) | 9 |
| Tasks | Drive 17 | 34 |
| Modifier | Drive +2 | 20 |
| Tag | [Security] | 5 |
| Tag | [Turns on a Dime] | 5 |
| Tag | [...And Turns A Few Heads] 3 (Free) | 30 |
| Limitation | Moderate: Slave (external navigational infrastructure, such as GPS) | −20 |
| **Total** | | **151** |

**Formula CR:** 2 ✔ matches printed

#### Light Air Transport

p. 242 · **Size:** Large · **Printed CR:** 2 · **CC:** 3

Description: "A small aerial craft with the capacity to lift a handful of individuals and their gear."

> **Errata** (new, 2026-09-27) p242: Adds Task: Intrusion Detection 17 (per the build notes).

| Row | Detail | BP |
|---|---|---:|
| Body Track | 50 (default) | 0 |
| Drive | Minor Air | 10 |
| Maneuver | rank 2 at Minor grade | 10 |
| Resource | Fuel, Minor ×5 | 25 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 4 (TN 20) | 12 |
| Tasks | Autopilot 20, Intrusion Detection 17 | 74 |
| Cargo | Moderate ×1 | 15 |
| Tag | [Security] | 5 |
| Limitation | Moderate: Slave (external navigational infrastructure, such as GPS) | −20 |
| **Total** | | **134** |

**Formula CR:** 2 ✔ matches printed

- A flying van: Large. The Light Performance Aircraft is a 2–3 seat craft, a bigger Hoverbike: Medium.

#### Light Performance Aircraft

p. 242 · **Size:** Medium · **Printed CR:** 3 · **CC:** 6

Description: "A larger version of the Colonial Personal Transport, this vehicle uses the same vectored thrust/variable wing geometry design to achieve an impressive air performance capacity while still being legal for civilians in most jurisdictions."

> **Errata** (new, 2026-09-28) p242: Life Support is 3 Minor (3 people), not 1 Moderate (12); it is a 2–3 seat craft.

> **Errata** (new, 2026-09-26) p242: Armor Rating 2 (was 1).

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Firefight, rank 2 | 30 |
| Body Track | 40 (default 10 + 6×5) | 30 |
| Drive | Minor Ground | 10 |
| Drive | Minor Air | 10 |
| Resource | Fuel, Minor ×4 | 20 |
| Maneuver | rank 4 at Minor grade | 20 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 3 (TN 18) | 9 |
| Tasks | Autopilot 18 | 36 |
| Cargo | Moderate ×1 | 15 |
| Life Support | Minor ×3 | 15 |
| Modifier | Detection +1 | 10 |
| Tag | [Security] 2 | 10 |
| Tag | [Barnstormer's Dream] | 5 |
| Limitation | Moderate: Slave (external navigational infrastructure, such as GPS) | −20 |
| **Total** | | **203** |

**Formula CR:** 3 ✔ matches printed

**Power:** 6 Minor slots; 0 used.


### Vehicles: Commercial

#### Cargo Transport

p. 243 · **Size:** Large · **Printed CR:** 2 · **CC:** 3

Description: "Typical light delivery or work vehicles in a variety of makes and models."

> **Errata** (new, 2026-09-27) p243: [Security 2] (was [Security]).

| Row | Detail | BP |
|---|---|---:|
| Body Track | 50 (default) | 0 |
| Drive | Minor Ground | 10 |
| Resource | Fuel, Minor ×5 | 25 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 3 (TN 18) | 9 |
| Tasks | Drive 18 | 36 |
| Cargo | Moderate ×1 | 15 |
| Limitation | Moderate: Slave (external navigational infrastructure, such as GPS) | −20 |
| Tag | [Security] 2 | 10 |
| Tags | [Free Tags 3] or 15 BP (player-defined) | 15 |
| **Total** | | **103** |

**Formula CR:** 2 ✔ matches printed

- "[Free Tags 3] or 15 BP": a placeholder the owner fills with Tags worth 15 BP, or spends as 15 BP on other attributes.

#### Armored Cargo Transport

p. 243 · **Size:** Large · **Printed CR:** 3 · **CC:** 6

Description: "Secure transit for any number of physical valuables and commodities."

> **Errata** (new, 2026-09-28) p243: Body Track 90 (was 80). Computer is Minor rank 4 (20 target), not rank 3, to run its Intrusion Detection 20 Task.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Battlefield, rank 4 | 110 |
| Body Track | 90 (default 50 + 2×20) | 20 |
| Drive | Minor Ground | 10 |
| Maneuver | rank 1 at Minor grade | 5 |
| Resource | Fuel, Minor ×5 | 25 |
| Communication | Minor Radio | 3 |
| Computer | Minor rank 4 (TN 20) | 12 |
| Tasks | Drive 17, Intrusion Detection 20 | 74 |
| Cargo | Moderate ×1 | 15 |
| Life Support | Moderate ×1 | 20 |
| Modifier | Detection +1 | 10 |
| Tag | [Security] 2 | 10 |
| Tag | [Signed, Sealed, Delivered] | 5 |
| Limitation | Moderate: Slave (external navigational infrastructure, such as GPS) | −20 |
| **Total** | | **299** |

**Formula CR:** 3 ✔ matches printed

#### Air Transport

p. 244 · **Size:** Large · **Printed CR:** 3 · **CC:** 6

Description: "Fast transit for cargo or passengers anywhere on a planet."

> **Errata** (new, 2026-09-28) p244: Body Track 90 (was 80).

> **Errata** (new, 2026-09-27) p244: Armor Rating 2 (Battlefield; was 1). Maneuver 2 (was 1). Cargo is 3 Major (was 3 Moderate). Adds Life Support: Moderate (12 passengers). Computer is Minor rank 3 (was 2) and adds Task: Intrusion Detection 17.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Battlefield, rank 2 | 60 |
| Body Track | 90 (default 50 + 2×20) | 20 |
| Drive | Minor Air | 10 |
| Maneuver | rank 2 at Minor grade | 10 |
| Resource | Fuel, Minor ×5 | 25 |
| Cargo | Major ×3 | 90 |
| Life Support | Moderate ×1 | 20 |
| Computer | Minor rank 3 (TN 18) | 9 |
| Tasks | Pilot 16, Intrusion Detection 17 | 66 |
| Communication | Minor Radio | 3 |
| Limitation | Moderate: Slave (external navigational infrastructure, such as GPS) | −20 |
| Tag | [Security] 2 | 10 |
| **Total** | | **303** |

**Formula CR:** 3 ✔ matches printed


### Vehicles: Military

#### Assault Platform

p. 244 · **Size:** Large · **Printed CR:** 4 · **CC:** 10

Description: "While open ground combat is relatively rare in the Fourth Population, when it does occur, armored units provide key firepower and maneuverability."

> **Errata** (new, 2026-09-28) p244: Body Track 90 (was 80).

| Row | Detail | BP |
|---|---|---:|
| Attack (main cannon) | Kinetic (Battlefield) 5x ×2 mounts (+20 each extra) | 94 |
| Resource | Ammunition, Moderate ×4 | 40 |
| Anti-Missile | Battlefield 1x | 10 |
| Armor Rating | Battlefield, rank 4 | 110 |
| Body Track | 90 (default 50 + 2×20) | 20 |
| Drive | Moderate Ground | 25 |
| Maneuver | rank 2 at Moderate grade | 20 |
| Power Supply | Moderate Fusion rank 1 | 10 |
| Resource | Fuel, Moderate ×3 | 30 |
| Life Support | Moderate ×1 | 20 |
| Link | Moderate Weapon ×2 | 30 |
| Modifier | Gunnery +2 | 20 |
| **Total** | | **429** |

**Formula CR:** 4 ✔ matches printed

**Power:** 6 Moderate slots; 3 used (2 rail cannons + Anti-Missile). OK.

#### Attack Hovercraft

p. 245 · **Size:** Large · **Printed CR:** 4 · **CC:** 10

Description: "A militarized version of the same technologies that make up the Colonial Transport, these birds are frequently used as close air support for their deft aerial handling."

> **Errata** (new, 2026-09-28) p245: Body Track 90 (was 80).

> **Errata** (new, 2026-09-28) p245: Power Supply is Moderate Fusion rank 2 (was 1), so its 3 Weapon Links have power. Total Power Slots read 3 Minor (0 used), 6 Moderate (2 used).

> **Errata** (new, 2026-09-26) p245: Heavy railgun single-target attack increases to 5x (was 4x). Burst mode stays 4x.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Battlefield, rank 3 | 80 |
| Body Track | 90 (default 50 + 2×20) | 20 |
| Attack (heavy railgun, single target) | Kinetic (Battlefield) 5x | 74 |
| Attack (burst mode) | Kinetic (Battlefield) 4x | 47 |
| Area |  | 20 |
| Limitation | Minor: Hungry (10 shots/round) | −10 |
| Resource | Ammunition, Moderate ×3 | 30 |
| Drive | Minor Air | 10 |
| Maneuver | rank 3 at Minor grade | 15 |
| Power Supply | Moderate Fusion rank 2 | 20 |
| Resource | Fuel, Moderate ×3 | 30 |
| Link | Moderate Weapon ×3 | 45 |
| Computer | Minor rank 2 (TN 16) | 6 |
| Communication | Minor Radio | 3 |
| Modifier | Detection +1 | 10 |
| Modifier | Gunnery +1 | 10 |
| Tag | [High Security] 3 | 15 |
| Tag | [Float Like a Butterfly] | 5 |
| Tag | [Sting Like a Bee] 2 | 10 |
| Limitation | Moderate: Crew Requirement (2) | −20 |
| **Total** | | **420** |

**Formula CR:** 4 ✔ matches printed

**Power:** 3 Minor (Air Drive; 0 used) + 6 Moderate (Fusion ×2; 2 used, 4 spare for its 3 Weapon Links). OK.

**Check:**

- Crew Requirement lists 2, but for a Large item the rule is 5. The number is flavor; the limitation is the same.

#### Armored Personnel Carrier

p. 245 · **Size:** Large · **Printed CR:** 4 · **CC:** 10

Description: "While powered armor dominates TSN urban ground engagements, not all forces can field it, instead using lightly armored squads carried by APCs that trade heavier firepower for flexibility."

> **Errata** (new, 2026-09-28) p245: Body Track 90 (was 80).

> **Errata** (new, 2026-09-28) p245: Power Supply is Moderate Fusion rank 2 (was 1), so its 2 Weapon Links have power. Total Power Slots read 3 Minor (0 used), 6 Moderate (2 used).

> **Errata** (new, 2026-09-26) p245: Armor Rating 4 (was 3); single-target attack 5x (was 4x; burst stays 4x); Hangar is Major (was Minor), which holds the Medium marines.

| Row | Detail | BP |
|---|---|---:|
| Attack (heavy gauss gun, single target) | Kinetic (Battlefield) 5x | 74 |
| Attack (burst mode) | Kinetic (Battlefield) 4x | 47 |
| Area |  | 20 |
| Limitation | Minor: Hungry (10 shots/round) | −10 |
| Resource | Ammunition, Moderate ×4 | 40 |
| Armor Rating | Battlefield, rank 4 | 110 |
| Body Track | 90 (default 50 + 2×20) | 20 |
| Drive | Minor Ground | 10 |
| Power Supply | Moderate Fusion rank 2 | 20 |
| Resource | Fuel, Moderate ×2 | 20 |
| Hangar | Major | 60 |
| Link | Minor Weapon ×2 | 10 |
| Modifier | Detection +1 | 10 |
| Modifier | Gunnery +1 | 10 |
| Tag | [High Security] 3 | 15 |
| Tag | [Send in the Marines] | 5 |
| Limitation | Moderate: Crew Requirement (2) | −20 |
| **Total** | | **441** |

**Formula CR:** 4 ✔ matches printed

**Power:** 3 Minor (Ground Drive; 0 used) + 6 Moderate (Fusion ×2; 2 used, 4 spare for its 2 Weapon Links). OK.


### Space: Probes and Drones

#### Autonomous Kill Vehicle (“Auntie”)

p. 246 · **Size:** Medium · **Printed CR:** 4 · **CC:** 10

Description: "An autonomous attack drone commonly called an “Auntie”. The compromises required to create a space combatant that can be deployed from a standard Launcher preclude it from heavier combat roles."

> **Errata** (new, 2026-09-26) p246: Attack 5x (was 4x). Adds a Major Coil Power Supply (rank 1) with 1 rank of Major Charge (10 combat rounds) to power the Space-scale beam (new p216 rule: Coil can be Major on a Medium item). Maneuver 3 (was 5; the cap is 4). Its Far Range restriction is a Moderate limitation, No Far Range (was a Minor Usage Restriction).

| Row | Detail | BP |
|---|---|---:|
| Body Track | 25 (default 10 + 3×5) | 15 |
| Attack (light particle beam) | Energy (Space) 5x | 100 |
| Limitation | Moderate: No Far Range (the beam cannot fire at Far Range) | −20 |
| Drive | Moderate Reaction | 25 |
| Resource | Fuel, Moderate ×1 | 10 |
| Maneuver | rank 3 at Moderate grade | 30 |
| Power Supply | Major Coil rank 1 | 40 |
| Resource | Charge, Major ×1 | 12 |
| Computer | Minor rank 3 (TN 18) | 9 |
| Tasks | Detection 15, Gunnery 18, Piloting 17 | 100 |
| Communication | Moderate Radio | 13 |
| Tag | [Coordinated Fire] | 5 |
| Tag | [Security] | 5 |
| Limitation | Major: One-Time Use | −50 |
| **Total** | | **294** |

**Formula CR:** 4 ✔ matches printed

**Power:** 3 Moderate (Reaction Drive), 3 Major (Coil); 1 Major used (beam).

#### Recon Drone

p. 246 · **Size:** Medium · **Printed CR:** 2 · **CC:** 3

Description: "An independent drone with a sophisticated sensor array, the recon drone provides enhanced detection capacities to the deploying ship. In combat, the drone provides realtime updates via its advanced Ansible communications system."

> **Errata** (new, 2026-09-28) p246: Maneuver 4 (was 5; the cap is 4). Computer is Minor rank 3 (18 target), not rank 2, to run its Piloting 18 Task.

| Row | Detail | BP |
|---|---|---:|
| Body Track | 10 (default) | 0 |
| Drive | Moderate Reaction | 25 |
| Resource | Fuel, Moderate ×1 | 10 |
| Maneuver | rank 4 at Moderate grade | 40 |
| Computer | Minor rank 3 (TN 18) | 9 |
| Tasks | Piloting 18 | 36 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×1 | 10 |
| Modifier | Detection +2 | 20 |
| Tag | [Security] 2 | 10 |
| Tag | [I Spy with my Little Eye…] | 5 |
| Limitation | Major: One-Time Use | −50 |
| **Total** | | **158** |

**Formula CR:** 2 ✔ matches printed

#### SAR Probe

p. 247 · **Size:** Medium · **Printed CR:** 2 · **CC:** 3

Description: "A probe used in search and rescue operations deemed too dangerous for a human presence. A durable inflatable sac helps it to evacuate survivors to safety. The probe’s telepresence equipment allows a ship’s medical team to conduct first response medical procedures while the patient is in transit."

| Row | Detail | BP |
|---|---|---:|
| Body Track | 20 (default 10 + 2×5) | 10 |
| Drive | Moderate Reaction | 25 |
| Resource | Fuel, Moderate ×3 | 30 |
| Life Support | Moderate ×1 | 20 |
| Communication | Moderate Radio | 13 |
| Computer | Minor rank 4 (TN 20) | 12 |
| Tasks | Survivor Extraction 19 | 38 |
| Modifier | Detection +1 | 10 |
| Modifier | Medicine (first response only) +2 | 20 |
| Tag | [Security] 2 | 10 |
| Tag | [Medical Supplies] | 5 |
| Tag | [Grappling Arms] | 5 |
| Limitation | Moderate: Slave (external control only) | −20 |
| **Total** | | **178** |

**Formula CR:** 2 ✔ matches printed

#### Stealth FTL Recon Drone

p. 247 · **Size:** Medium · **Printed CR:** 6 · **CC:** 21

Description: "An experimental design that makes a series of programmed rapid FTL jumps in the target system before jumping to a predefined collection point."

> **Errata** (new, 2026-09-25) p247: Stat block replaced by PJ's rebuilt design (spreadsheet "FTL Recon Probe"): CR 6, CC 21. Changes from the printed block: the original build notes left out the Shrouded Hull; Body is the default 10 (was 15); Fuel is 2 Major ranks shared by both Drives (was 5 Moderate + 1 Major); Maneuver is 2 at Major grade (was 4 at Moderate); Tangle 1 rank (was 2); Tags [Security 2] (was [High Security 3]); adds Limitations One Track Mind (Moderate) and One-Time Use (Major).

> **Errata** (new, 2026-09-25) p217: A Major Fuel tank can feed the Moderate Reaction Drive (fuel feeds its own grade or lower).

| Row | Detail | BP |
|---|---|---:|
| Armor Rating (Shrouded Hull) | Space, rank 1 | 120 |
| Drive | Moderate Reaction | 25 |
| Drive | Major Gravitic | 50 |
| Resource | Fuel, Major ×2 | 30 |
| Maneuver | rank 2 at Major grade | 40 |
| Computer | Minor rank 4 (TN 20) | 12 |
| Tasks | Piloting 17, Detection 19, Intrusion Detection 15 | 102 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×1 | 10 |
| Tag | [Security] 2 | 10 |
| Tag | [I Spy with my Little Eye…] | 5 |
| Limitation | Moderate: One Track Mind (follows its programmed route) | −20 |
| Limitation | Major: One-Time Use (burned out after each run; an extended Engineering roll returns it to service) | −50 |
| **Total** | | **364** |

**Formula CR:** 6 ✔ matches printed

**Power:** 3 Moderate (Reaction Drive), 3 Major (Gravitic Drive); 0 used.

- The spreadsheet listed Sensors – EM (Minor, 5 BP); dropped per PJ. The spreadsheet's Reaction Drive cost of 15 is corrected to 25 (Moderate Drive), giving 364 BP; CR is 6 either way.

**Check:**

- Printed CR/CC shown here are the errata values (CR 6, CC 21). The book printed CR 5, CC 15.


### Space: Civilian Starships

#### Telekinetic Shuttle

p. 248 · **Size:** Large · **Printed CR:** 3 · **CC:** 6

Description: "Telekinesis offers an ideal way to move light cargo and passenger loads between surface and orbit, and shuttles designed for that use are largely responsible for making Telekinesis one of the most widespread Psionic skills in the Fourth Population."

> **Errata** (new, 2026-09-28) p248: Its Coil Power Supply runs on 2 Major Charge, not 2 Major Fuel.

> **Errata** p238: Telekinetic Shuttle has a Major Psi Link (added).

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Space, rank 1 | 80 |
| Body Track | 50 (default) | 0 |
| Power Supply | Major Coil rank 1 | 40 |
| Resource | Charge, Major ×2 | 24 |
| Link | Major Psi | 50 |
| Communication | Moderate Radio | 13 |
| Computer | Minor rank 2 (TN 16) | 6 |
| Cargo | Major ×1 | 30 |
| Life Support | Moderate ×2 | 40 |
| Modifier | Pilot +1 | 10 |
| Tag | [Security] | 5 |
| Tag | [Lifting Body] 2 | 10 |
| Tag | [Easy on the Hangar Bay] | 5 |
| Limitation | Minor: Usage Restriction (Telekinetic operators only) | −10 |
| **Total** | | **303** |

**Formula CR:** 3 ✔ matches printed

**Power:** 3 Major slots; 0 used.

**Check:**

- No Drive: the Psionic operator moves it by Telekinesis. Intentional, but the validator will flag it as a vehicle without a Drive.

#### Courier

p. 248 · **Size:** Large · **Printed CR:** 5 · **CC:** 15

Description: "These ubiquitous ships specialize in delivering data packets too large to be transferred over the Ansible relays. Paper mail is rare, but what little that remains usually travels on these vessels."

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Space, rank 2 | 90 |
| Body Track | 110 (default 50 + 3×20) | 30 |
| Drive | Minor Air | 10 |
| Drive | Moderate Reaction | 25 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 4 at Major grade | 80 |
| Resource | Fuel, Major ×8 | 120 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×4 | 40 |
| Computer | Minor rank 3 (TN 18) | 9 |
| Cargo | Minor ×1 | 5 |
| Life Support | Moderate ×2 | 40 |
| Tag | [We Get There Fast] | 5 |
| Tag | [Security] 2 | 10 |
| Tags | [Free Tags 3] or 15 BP | 15 |
| Limitation | Moderate: Crew Requirement (5) | −20 |
| **Total** | | **552** |

**Formula CR:** 5 ✔ matches printed

**Power:** 3 Minor, 3 Moderate, 3 Major; 0 used. OK.

#### Shuttle/Yacht

p. 249 · **Size:** Large · **Printed CR:** 4 · **CC:** 10

Description: "The smallest starships, these are fairly common either for personal pleasure or light commercial uses in the Fringes. In the Terran Sphere Core, the strict licensing requirements means they are rarely allowed anywhere near inhabited planets."

> **Errata** (new, 2026-09-27) p249: Adds Task: Pilot 17 and the Free Tag [The Grand Tour 3]. Tangle is 2 ranks (20 days), not 1.

| Row | Detail | BP |
|---|---|---:|
| Body Track | 70 (default 50 + 1×20) | 10 |
| Drive | Minor Air | 10 |
| Drive | Moderate Reaction | 25 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 2 at Major grade | 40 |
| Resource | Fuel, Major ×6 | 90 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×2 | 20 |
| Computer | Minor rank 5 (TN 22) | 15 |
| Tasks | Pilot 17 | 34 |
| Cargo | Moderate ×1 | 15 |
| Life Support | Moderate ×1 | 20 |
| Tag | [Security] 2 | 10 |
| Tag | [The Grand Tour] 3 (Free) | 30 |
| **Total** | | **412** |

**Formula CR:** 4 ✔ matches printed

#### Locust Mobile Industrial Platform

p. 250 · **Size:** Huge · **Printed CR:** 7 · **CC:** 28

Description: "A new colony’s first step toward self-sufficiency is often agriculture. The last step is usually spacecraft. Between the two, the Locust plies her trade, building a colony’s space-based infrastructure. The Locust is a starship capable of processing raw materials from asteroid mining and manufacturing complete spacecraft. At its heart is a top-quality G3P capable of working with almost any material at nanoscale precision. This device can “print” small spacecraft whole, such as security escorts and shuttlecraft, and components for prefabricated settlements and habitats. For mineral extraction, the G3P essentially runs in reverse, separating small asteroids into their constituent elements. Decomposition is significantly slower than traditional mining techniques, however, and a Locust’s crew often prefers to purchase raw and processed materials when possible."

> **Errata** (new, 2026-09-28) p250: Total Power Slots read 6 Major (3 used); the grade was missing.

> **Errata** (new, 2026-09-27) p250: Armor Rating 2 (Space; was 1), Body Track 250 (was 200), and Maneuver 1 (not listed).

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Space, rank 2 | 90 |
| Body Track | 250 (default 200 + 1×50) | 20 |
| Drive | Major Reaction | 50 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 1 at Major grade | 20 |
| Resource | Fuel, Major ×9 | 135 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×2 | 20 |
| Computer | Moderate rank 4 (TN 20) | 20 |
| Tasks | Engineering (Spacecraft) 20, Engineering (Asteroid Mining) 20 | 80 |
| Manufacture | Major | 100 |
| Hangar | Major | 60 |
| Cargo | Minor ×1 | 5 |
| Cargo | Moderate ×1 | 15 |
| Cargo | Major ×1 | 30 |
| Life Support | Artificial Ecology, Moderate | 30 |
| Gravity Control | Major | 40 |
| Tag | [The Family Shop] 3 | 15 |
| Tag | [Buy It, Use It, Break It, Fix It] | 5 |
| Limitation | Moderate: Crew Requirement (20) | −20 |
| **Total** | | **808** |

**Formula CR:** 7 ✔ matches printed

**Power:** 6 Major (two Major Drives; 3 used).

#### Factory Freighter

p. 251 · **Size:** Huge · **Printed CR:** 9 · **CC:** 45

Description: "Both a freighter and a manufacturing depot, the general freighter works the commodities circuit, plying shipments of tangle and coil to serve the twin pillars of the TSC’s economy: information and power. Out on the Fringes, the ships are also contracted for heavy duty manufacturing work that a colony might not have the capacity or expertise to perform on its own. Due the large size and long deployment times, entire families often reside on the ship, making it more like a small town in space."

> **Errata** (new, 2026-09-27) p251: Reaction Drive is Moderate, not Major. Hangars 2 Major (was 3). Life Support 5 Major (500 people, was 6). CR 9, CC 45 (was CR 8, CC 36). Computer is Major rank 3 (18 target); remove "5 tasks" (a Major computer runs unlimited tasks).

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Space, rank 4 | 140 |
| Body Track | 300 (default 200 + 2×50) | 40 |
| Drive | Moderate Reaction | 25 |
| Drive | Major Gravitic | 50 |
| Resource | Fuel, Major ×10 | 150 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×8 | 80 |
| Computer | Major rank 3 (TN 18) | 60 |
| Manufacture | Major ×3 | 300 |
| Cargo | Major ×3 | 90 |
| Hangar | Major ×2 | 120 |
| Life Support | Major ×5 | 200 |
| Tag | [Security] 2 | 10 |
| Tag | [Small Town in Space] 2 | 10 |
| Tag | [Profit and Prize] 3 | 15 |
| Limitation | Moderate: Crew Requirement (20 navigation, 40 manufacturing) | −20 |
| **Total** | | **1,313** |

**Formula CR:** 9 ✔ matches printed

**Power:** 3 Major (Gravitic Drive) + 3 Moderate (Reaction Drive); 3 Major used (3 Manufactures). OK.

**Check:**

- Printed CR/CC shown here are the errata values (CR 9, CC 45). The book printed CR 8, CC 36.

#### Light Lugger

p. 251 · **Size:** Huge · **Printed CR:** 7 · **CC:** 28

Description: "A huge vessel, the Light Lugger is an in-system workhorse. Designed to work in parallel with a system’s port stations, the lugger is powered by transit lasers that create a cargo transit system not unlike a railroad."

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Space, rank 3 | 110 |
| Body Track | 350 (default 200 + 3×50) | 60 |
| Drive | Moderate Light Sail | 15 |
| Power Supply | Moderate Coil rank 1 | 10 |
| Resource | Charge, Moderate ×6 | 48 |
| Limitation | Minor: Usage Restriction (charged only through laser contact) | −10 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×6 | 60 |
| Computer | Major rank 4 (TN 20) | 80 |
| Hangar | Major ×2 | 120 |
| Cargo | Major ×6 | 180 |
| Life Support | Major ×5 | 200 |
| Tag | [Towing Rig] 3 | 15 |
| Tag | [Security] 2 | 10 |
| Tag | [AAALLL Ah-BOARD!] | 5 |
| Limitation | Moderate: Crew Requirement (10 skeleton, 20 full) | −20 |
| **Total** | | **926** |

**Formula CR:** 7 ✔ matches printed

**Power:** 6 Moderate slots (Light Sail 3 + Coil 3); 0 used. OK.


### Space: Military Starships

#### Security Escort/Corsair

p. 252 · **Size:** Large · **Printed CR:** 5 · **CC:** 15

Description: "A light warship designed for escort work or raiding. Countless variations of the same basic hull exist throughout the Fourth Population. Due to its low cost compared to other ships, vessels of this type are often found on both sides of the law."

> **Errata** (new, 2026-09-28) p252: Total Power Slots read 6 Major (2 used), 3 Moderate (0 used), not 9 Major (4 used). Weapons fitted to its Weapon Links draw further slots.

| Row | Detail | BP |
|---|---|---:|
| Attack (main battery) | Energy (Space) 4x | 70 |
| Anti-Missile | Space 1x | 20 |
| Armor Rating | Space, rank 3 | 110 |
| Body Track | 110 (default 50 + 3×20) | 30 |
| Drive | Moderate Reaction | 25 |
| Maneuver | rank 3 at Moderate grade | 30 |
| Drive | Major Gravitic | 50 |
| Power Supply | Major Fusion rank 1 | 40 |
| Resource | Fuel, Major ×8 | 120 |
| Link | Minor Weapon ×2 | 10 |
| Communication | Moderate Radio | 13 |
| Computer | Moderate rank 3 (TN 18) | 15 |
| Life Support | Moderate ×1 | 20 |
| Modifier | Gunnery +1 | 10 |
| Tag | [Security] 2 | 10 |
| Tag | [Float Like a Butterfly, Sting Like a Bee] 2 | 10 |
| Limitation | Moderate: Crew Requirement (2 skeleton, 5 full) | −20 |
| **Total** | | **563** |

**Formula CR:** 5 ✔ matches printed

**Power:** 6 Major (Gravitic Drive + Fusion; 2 used: main battery, Anti-Missile) + 3 Moderate (Reaction Drive; 0 used). OK.

**Check:**

- Maneuver is bought at Moderate; the rule says Major (the largest Drive). At Major it's +30 BP; CR unchanged.

#### Standard Assault Shuttle

p. 252 · **Size:** Large · **Printed CR:** 5 · **CC:** 15

Description: "Designed to ferry troops and materiel into combat, assault shuttles balance speed, firepower, and protection. Due to its relatively short flight range, the shuttle is usually deployed from a larger ship."

> **Errata** (new, 2026-09-28) p252: Adds Communications: Moderate (Radio).

> **Errata** (new, 2026-09-28) p252: 4 Launchers (Space), not 2 (launchers come in sets of 4).

| Row | Detail | BP |
|---|---|---:|
| Attack (laser battery) | Energy (Space) 4x | 70 |
| Launcher | Space ×4, 1 increment | 60 |
| Resource | Magazine, Major ×2 | 30 |
| Armor Rating | Space, rank 3 | 110 |
| Body Track | 90 (default 50 + 2×20) | 20 |
| Drive | Minor Air | 10 |
| Drive | Moderate Reaction | 25 |
| Communication | Moderate Radio | 13 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 2 at Major grade | 40 |
| Resource | Fuel, Major ×2 | 30 |
| Hangar | Major | 60 |
| Life Support | Moderate ×2 | 40 |
| Modifier | Gunnery +1 | 10 |
| Tag | [High Security] 3 | 15 |
| Tag | [Rapid Fire] 2 | 10 |
| Tag | [Send in the Marines] | 5 |
| Limitation | Moderate: Crew Requirement (2 skeleton, 5 full) | −20 |
| **Total** | | **578** |

**Formula CR:** 5 ✔ matches printed

**Power:** Not listed. The Drives give 3 of each grade; 2 Major used (laser + launchers).

**Check:**

- No Computer listed; it has no Tasks, so none is required.

#### Tanker/Command Ship

p. 253 · **Size:** Large · **Printed CR:** 6 · **CC:** 21

Description: "These ships sacrifice weaponry for sensors, communications, fuel, and supplies for the squadron. They also frequently serve as a squadron’s command ship."

> **Errata** (new, 2026-09-28) p253: The ship's own Fuel is 10 Major (100 days), separate from the bulk fuel it carries as Cargo.

> **Errata** (new, 2026-09-26) p253: Armor Rating 4 (was 3).

> **Errata** (new, 2026-09-25) p253: The printed "100 Major Fuel" is bulk fuel held as Cargo, not the ship's own Fuel Resource. Pumping it from the storage tanks into a ship's systems takes an Engineering check.

| Row | Detail | BP |
|---|---|---:|
| Anti-Missile | Space 1x | 20 |
| Armor Rating | Space, rank 4 | 140 |
| Body Track | 110 (default 50 + 3×20) | 30 |
| Drive | Moderate Reaction | 25 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 3 at Major grade | 60 |
| Resource | Fuel, Major ×10 | 150 |
| Bulk fuel stores | Carried as Cargo (below); see errata | 0 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×4 | 40 |
| Computer | Moderate rank 4 (TN 20) | 20 |
| Cargo | Major ×2 | 60 |
| Life Support | Moderate ×1 | 20 |
| Modifier | Detection +2 | 20 |
| Modifier | Tactics +1 | 10 |
| Tag | [Security] 2 | 10 |
| Tag | [Command and Control] | 5 |
| Tag | [Mid-Flight Refuel] | 5 |
| Limitation | Moderate: Crew Requirement (2 skeleton, 5 full) | −20 |
| **Total** | | **688** |

**Formula CR:** 6 ✔ matches printed

#### System Defense Craft (Pocket Cruiser)

p. 253 · **Size:** Large · **Printed CR:** 6 · **CC:** 21

Description: "Employed by system defense fleets as a cheap way to bulk up their firepower, these escort-sized hulls trade a gravitic drive for armor and weaponry. They are the administrative bane of the Fleet, who dismisses them as “pocket cruisers” and would prefer FTL-capable craft that it can draft when needed."

> **Errata** (new, 2026-09-28) p253: In the alternate forms, "missile array" means the 4 Launchers and "particle cannon" means the heavy railgun (an earlier draft's name).

| Row | Detail | BP |
|---|---|---:|
| Attack (heavy railgun) | Kinetic (Space) 5x | 94 |
| Resource | Ammunition, Major ×2 | 30 |
| Anti-Missile | Space 1x | 20 |
| Launcher | Space ×4, 1 increment | 60 |
| Resource | Magazine, Major ×4 | 60 |
| Armor Rating | Space, rank 4 | 140 |
| Body Track | 110 (default 50 + 3×20) | 30 |
| Drive | Major Reaction | 50 |
| Maneuver | rank 4 at Major grade | 80 |
| Resource | Fuel, Major ×3 | 45 |
| Communication | Moderate Radio | 13 |
| Computer | Moderate rank 3 (TN 18) | 15 |
| Life Support | Moderate ×1 | 20 |
| Modifier | Detection +1 | 10 |
| Modifier | Gunnery +1 | 10 |
| Tag | [High Security] 3 | 15 |
| Tag | [Rapid Fire] 2 | 10 |
| Tag | [Sentinel] | 5 |
| Limitation | Moderate: Crew Requirement (2 skeleton, 5 full) | −20 |
| **Total** | | **687** |

**Formula CR:** 6 ✔ matches printed

- Alternate form STRIKE CRAFT: +1 Armor Rating; add Energy Ranged (Space, linked particle cannon); +1 to the heavy railgun's multiplier; remove the 4 Launchers.
- Alternate form TORPEDO BOAT: add 4 Launchers and +1 Magazine; remove the heavy railgun.

#### Dragon-class Fleet Interceptor/Escort

p. 254 · **Size:** Large · **Printed CR:** 6 · **CC:** 21

Description: "An experiment by the Terran Sphere Navy to create a parasitic light space and atmospheric escort and support craft capable of taking on the Shohan. The Dragon forgoes traditional beam armament for reverse-engineered Force Fields and a heavy missile loadout, carrying a mix of countermeasure missiles and plasma heads."

> **Errata** (new, 2026-09-28) p254: Fuel is 2 Major (20 days), not 2 Moderate, so it can run the Major Fusion reactor as well as the drives.

> **Errata** (new, 2026-09-28) p254: The Air Drive is Minor, not Moderate (a typo; the build notes have a Moderate in-system Reaction Drive and a Minor Air Drive). It carries 8 Launchers, not 6.

> **Errata** (new, 2026-09-25) p254: Adds the auxiliary Major Fusion Power Supply (rank 1) described in the design notes but missing from the stat block. Power Slots become 6 Moderate + 3 Major.

| Row | Detail | BP |
|---|---|---:|
| Launcher | Space ×8, 2 increments | 120 |
| Resource | Magazine, Major ×6 | 90 |
| Armor Rating | Space, rank 4 | 140 |
| Body Track | 90 (default 50 + 2×20) | 20 |
| Force Field | Moderate ×4 (track 80) | 80 |
| Drive | Moderate Reaction | 25 |
| Drive | Minor Air | 10 |
| Power Supply | Major Fusion (auxiliary) rank 1 | 40 |
| Maneuver | rank 4 at Moderate grade | 40 |
| Resource | Fuel, Major ×2 | 30 |
| Communication | Moderate Radio | 13 |
| Computer | Moderate rank 3 (TN 18) | 15 |
| Life Support | Minor ×2 | 10 |
| Modifier | Detection +1 | 10 |
| Modifier | Gunnery +1 | 10 |
| Tag | [Shohan Killer] | 5 |
| Tag | [High Security] 3 | 15 |
| Tag | [Hit and Run Tactics] | 5 |
| Tag | [Take One for the Team] | 5 |
| Limitation | Moderate: Crew Requirement (2) | −20 |
| **Total** | | **663** |

**Formula CR:** 6 ✔ matches printed

- [Take One for the Team] lets the Dragon redirect an attack onto itself.

#### Bridgehead Assault Shuttle

p. 255 · **Size:** Large · **Printed CR:** 6 · **CC:** 21

Description: "Although classified as an assault shuttle, the larger custom-built Bridgeheads are starships in their own right. With both plasma weapons and Force Field technology, a fast gravitic drive, the Bridgehead is becoming a workhorse in The War beyond its original role as an assault platform, with DIRT teams using them when stealth is unnecessary or by the Fleet as a fast, light recon vessel."

> **Errata** (new, 2026-09-28) p255: Bleed is Major 2 (the free Plasma Bleed: half of 5x, rounded down), not Major 3. Total Power Slots read 3 Moderate (1 used), 3 Major (3 used).

> **Errata** (new, 2026-09-26) p255: Armor Rating 4 (was 3); plasma cannon 5x (was 4x).

| Row | Detail | BP |
|---|---|---:|
| Attack (rapid plasma cannon) | Plasma (Space) 5x | 100 |
| Counter | Shields (free) | 0 |
| Bleed | Major 2 (free, Plasma) | 0 |
| Anti-Missile | Space 1x | 20 |
| Armor Rating | Space, rank 4 | 140 |
| Body Track | 90 (default 50 + 2×20) | 20 |
| Force Field | Moderate ×3 (track 60) | 60 |
| Drive | Minor Air | 10 |
| Drive | Moderate Reaction | 25 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 3 at Major grade | 60 |
| Resource | Fuel, Major ×2 | 30 |
| Communication | Moderate Radio | 13 |
| Computer | Moderate rank 3 (TN 18) | 15 |
| Hangar | Major | 60 |
| Life Support | Moderate ×2 | 40 |
| Modifier | Detection +1 | 10 |
| Modifier | Gunnery +1 | 10 |
| Tag | [High Security] 3 | 15 |
| Tag | [Rapid Fire] 2 | 10 |
| Tag | [Send in the Marines] | 5 |
| Limitation | Major: Restricted Technology (property of the Terran Sphere) | −50 |
| Limitation | Moderate: Crew Requirement (2 skeleton, 5 full) | −20 |
| **Total** | | **623** |

**Formula CR:** 6 ✔ matches printed

**Power:** 3 Moderate (1 used: Force Field), 3 Major (3 used: Plasma 2, Anti-Missile 1). OK.

#### Phantom Deep Recon and Insertion Vehicle (DRIV)

p. 255 · **Size:** Large · **Printed CR:** 8 · **CC:** 36

Description: "The Phantom uses experimental stealth technologies, including a meta-material hull Shroud, heat sinks, and a modified in-system drive to become effectively invisible to scanners. The ship is intended as a recon platform into Shohan-occupied systems, and more dangerously as an insertion vehicle and base for DIRT teams on Shohan-controlled worlds. The lightly armed ship carries jammers in its missile bays and relies on speed and stealth to keep it out of trouble."

> **Errata** p255: Moderate Laser Link (added).

| Row | Detail | BP |
|---|---|---:|
| Launcher | Space ×4, 1 increment | 60 |
| Resource | Magazine, Major ×4 | 60 |
| Limitation | Minor: Usage Restriction (no combat reload) | −10 |
| Armor Rating (Shrouded Hull) | Space, rank 3 | 150 |
| Body Track | 110 (default 50 + 3×20) | 30 |
| Limitation | Minor: Usage Restriction (hull shroud does not work during atmospheric re-entry) | −10 |
| Drive | Major Gravitic (modified in-system) | 50 |
| Limitation | Minor: Hungry (1 Fuel/round for in-system maneuvers) | −10 |
| Drive | Moderate Reaction | 25 |
| Drive | Moderate Air | 25 |
| Drive | Minor Sea/Submersible | 10 |
| Maneuver | rank 4 at Moderate grade | 40 |
| Resource | Fuel, Major ×7 | 105 |
| Communication | Moderate Radio | 13 |
| Communication | Moderate Laser Link | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×5 | 50 |
| Computer | Moderate rank 3 (TN 18) | 15 |
| Manufacture | Major | 100 |
| Cargo | Major ×1 | 30 |
| Life Support | Moderate ×1 | 20 |
| Modifier | Detection +2 | 20 |
| Modifier | Gunnery +1 | 10 |
| Tag | [Marines on Ice] | 5 |
| Tag | [The High Dive] | 5 |
| Tag | [Now You See Me, Now You Don't] 2 | 10 |
| Tag | [High Security] 3 | 15 |
| Limitation | Moderate: Crew Requirement (2 skeleton, 5 full) | −20 |
| **Total** | | **841** |

**Formula CR:** 8 ✔ matches printed

- Uses all 3 Minor limitation slots.

#### Standard Cruiser

p. 256 · **Size:** Huge · **Printed CR:** 8 · **CC:** 36

Description: "The Fourth Population’s standard mid-sized patrol craft carries a respectable arsenal with decent staying power. These craft are deployed as a visible show of TSN force in systems where a frigate’s presence is deemed excessive."

> **Errata** (new, 2026-09-28) p256: Adds Computer: Major 3 (18 target, unlimited tasks), matching the Redemption and Retribution.

> **Errata** (new, 2026-09-28) p256: Adds Power Supply: Major Fusion, rank 1, to power its integrated railgun turrets. Total Power Slots read 6 Major (4 used), 3 Moderate (0 used), not 3 Major (2 used).

| Row | Detail | BP |
|---|---|---:|
| Attack (heavy railgun turrets) | Kinetic (Space) 5x ×2 mounts (+40 each extra) | 134 |
| Resource | Ammunition, Major ×8 | 120 |
| Anti-Missile | Space 1x | 20 |
| Launcher | Space ×4, 1 increment | 60 |
| Resource | Magazine, Major ×4 | 60 |
| Armor Rating | Space, rank 4 | 140 |
| Body Track | 250 (default 200 + 1×50) | 20 |
| Drive | Major Gravitic | 50 |
| Drive | Moderate Reaction | 25 |
| Maneuver | rank 3 at Major grade | 60 |
| Power Supply | Major Fusion rank 1 | 40 |
| Resource | Fuel, Major ×10 | 150 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Computer | Major rank 3 (TN 18) | 60 |
| Resource | Tangle, Major ×3 | 30 |
| Cargo | Moderate ×1 | 15 |
| Hangar | Moderate | 30 |
| Life Support | Major ×1 | 40 |
| Modifier | Detection +2 | 20 |
| Modifier | Gunnery +2 | 20 |
| Modifier | Tactics +1 | 10 |
| Tag | [High Security] 3 | 15 |
| Tag | [Coordinated Fire] 2 | 10 |
| Tag | [On Patrol] | 5 |
| Limitation | Moderate: Crew Requirement (20 skeleton, 75 full) | −20 |
| **Total** | | **1,157** |

**Formula CR:** 8 ✔ matches printed

**Power:** 6 Major (Gravitic Drive + Fusion; 4 used: 2 railgun turrets, Anti-Missile, 4 Launchers = 1) + 3 Moderate (Reaction Drive; 0 used). OK.

#### Defiance-class Cruiser

p. 257 · **Size:** Huge · **Printed CR:** 7 · **CC:** 28

Description: "The first ship to be engineered solely to counter the Shohan, the Defiance-class has become the Fleet’s backbone as it struggles to rebuild. Only slightly larger than an escort, it combines the smaller ship’s maneuverability with a cruiser’s firepower, at the expense of a standard cruiser’s range. As an early plasma weapon platform design, the ship suffers from a few flaws related to the massive plasma cannon it mounts."

| Row | Detail | BP |
|---|---|---:|
| Attack (spinal heavy plasma cannon) | Plasma (Space) 8x | 250 |
| Counter | Shields (free) | 0 |
| Bleed | Major 4 (free, Plasma) | 0 |
| Anti-Missile | Space 1x | 20 |
| Launcher | Space ×4, 1 increment | 60 |
| Resource | Magazine, Major ×4 | 60 |
| Armor Rating | Space, rank 5 | 180 |
| Body Track | 200 (default) | 0 |
| Drive | Major Reaction | 50 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 4 at Major grade | 80 |
| Resource | Fuel, Major ×3 | 45 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×2 | 20 |
| Computer | Major rank 3 (TN 18) | 60 |
| Life Support | Moderate ×1 | 20 |
| Modifier | Detection +1 | 10 |
| Modifier | Gunnery +1 | 10 |
| Tag | [High Security] | 5 |
| Tag | [Go to Rapid Fire!] | 5 |
| Tag | [Shohan Killer] | 5 |
| Limitation | Moderate: Malfunction [That Gun’s Got Kick 2] | −20 |
| **Total** | | **953** |

**Formula CR:** 7 ✔ matches printed

**Power:** 6 Major; 4 used (Plasma 2, Anti-Missile 1, Launchers 1). OK.

#### Conventional Frigate

p. 258 · **Size:** Huge · **Printed CR:** 10 · **CC:** 55

Description: "Frigates represent the Fourth Population’s heavy warcraft. Many of the Fleet’s frigates were lost at the Massacre of Artemis III. Larger systems, such as Sol and Alpha Centauri, still possess squadrons of these vessels, although they are rapidly being retrofitted into Redemption-class variants. While the Terran Sphere is optimizing its frigates for ship-to-ship combat, traditional frigate designs carry out fleet engagements while supporting marine deployments against planetary targets."

> **Errata** (new, 2026-09-28) p258: 8 Launchers (Space), not 6 (launchers come in sets of 4).

> **Errata** p258 ("Standard Frigate"): skeleton crew 100 (was 10), full complement 200 (was 20). Applied here on the assumption that it means the Conventional Frigate; there's no ship called Standard Frigate.

| Row | Detail | BP |
|---|---|---:|
| Attack (laser batteries alpha and beta) | Energy (Space) 6x ×2 mounts (+40 each extra) | 180 |
| Counter | Armor | 20 |
| Anti-Missile | Space 1x | 20 |
| Launcher | Space ×8, 2 increments | 120 |
| Resource | Magazine, Major ×6 | 90 |
| Armor Rating | Space, rank 5 | 180 |
| Body Track | 350 (default 200 + 3×50) | 60 |
| Drive | Major Reaction | 50 |
| Drive | Major Gravitic | 50 |
| Resource | Fuel, Major ×7 | 105 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×5 | 50 |
| Computer | Major rank 4 (TN 20) | 80 |
| Tasks | Intrusion Detection 20 | 40 |
| Cargo | Major ×1 | 30 |
| Hangar | Major ×2 | 120 |
| Life Support | Major ×3 | 120 |
| Modifier | Detection +2 | 20 |
| Modifier | Engineering (Starship) +1 | 10 |
| Modifier | Gunnery +4 | 40 |
| Modifier | Tactics +1 | 10 |
| Tag | [High Security] 3 | 15 |
| Tag | [Go to Rapid Fire!] 2 | 10 |
| Tag | [The One-Two Punch] 2 | 10 |
| Limitation | Moderate: Crew Requirement (100 skeleton, 200 full) | −20 |
| **Total** | | **1,453** |

**Formula CR:** 10 ✔ matches printed

**Power:** 6 Major; 5 used (2 lasers, Anti-Missile, 6 Launchers = 2). OK.

#### Intrepid-class Frigate

p. 258 · **Size:** Huge · **Printed CR:** 9 · **CC:** 45

Description: "Prior to the Redemption-class frigate, Intrepids were a mainstay of the Fleet. Their heavy turrets, thick hull plating, and strong engines are designed to mix it up at close range with fleet pirate raiders and ponderous Kriak clanships alike."

| Row | Detail | BP |
|---|---|---:|
| Attack (railgun turrets) | Kinetic (Space) 7x ×2 mounts (+40 each extra) | 215 |
| Resource | Ammunition, Major ×8 | 120 |
| Anti-Missile | Space 1x | 20 |
| Launcher | Space ×4, 1 increment | 60 |
| Resource | Magazine, Major ×4 | 60 |
| Armor Rating | Space, rank 5 | 180 |
| Body Track | 400 (default 200 + 4×50) | 80 |
| Drive | Major Reaction | 50 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 2 at Major grade | 40 |
| Resource | Fuel, Major ×5 | 75 |
| Communication | Moderate Radio | 13 |
| Communication | Moderate Laser Link | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×2 | 20 |
| Computer | Major rank 3 (TN 18) | 60 |
| Hangar | Moderate | 30 |
| Life Support | Major ×1 | 40 |
| Modifier | Detection +2 | 20 |
| Modifier | Gunnery +2 | 20 |
| Tag | [Hold the Line] 3 | 15 |
| Tag | [Security Alert] 2 | 10 |
| Limitation | Moderate: Crew Requirement (30 skeleton, 85 full with marines) | −20 |
| **Total** | | **1,201** |

**Formula CR:** 9 ✔ matches printed

- The railguns take no Power Slots here (2 used = Anti-Missile + Launchers), unlike the ground-scale rail weapons. See Conventions.

#### Resolute-class Frigate

p. 259 · **Size:** Huge · **Printed CR:** 10 · **CC:** 55

Description: "A complement to the Intrepid-class frigate, the Resolute is designed to provide long-range supply and command support. Though less durable, it boasts longer-ranged weaponry and increased hangar space for support craft, as well as deeper fuel and tangle reserves for extended operations."

> **Errata** (new, 2026-09-26) p259: Armor Rating 5 (was 4); laser turret 7x (was 6x).

| Row | Detail | BP |
|---|---|---:|
| Attack (laser turret) | Energy (Space) 7x | 190 |
| Anti-Missile | Space 1x | 20 |
| Launcher | Space ×12, 3 increments | 180 |
| Resource | Magazine, Major ×12 | 180 |
| Armor Rating | Space, rank 5 | 180 |
| Body Track | 300 (default 200 + 2×50) | 40 |
| Drive | Major Reaction | 50 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 1 at Major grade | 20 |
| Resource | Fuel, Major ×6 | 90 |
| Communication | Moderate Radio | 13 |
| Communication | Moderate Laser Link | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×6 | 60 |
| Computer | Major rank 4 (TN 20) | 80 |
| Hangar | Major | 60 |
| Life Support | Major ×3 | 120 |
| Modifier | Gunnery +2 | 20 |
| Tag | [At Arm's Length] 3 | 15 |
| Tag | [Security Alert] 2 | 10 |
| Limitation | Moderate: Crew Requirement (50 skeleton, 95 full) | −20 |
| **Total** | | **1,401** |

**Formula CR:** 10 ✔ matches printed

**Power:** 6 Major; 5 used (laser, Anti-Missile, 12 Launchers = 3). OK.

#### Redemption-class Frigate

p. 259 · **Size:** Huge · **Printed CR:** 10 · **CC:** 55

Description: "The newest generation of Terran Sphere frigates is designed to devastate Shohan ships at the expense of most of its planetary strike capacity."

> **Errata** (new, 2026-09-28) p259: 4 Launchers (Space), not 6; the ship is built around its plasma cannons. Total Power Slots: 9 Major (7 used), 3 Moderate (0 used).

> **Errata** (new, 2026-09-28) p259: Total Power Slots read 9 Major (8 used), 3 Moderate (0 used), not 9 Major (7 used).

| Row | Detail | BP |
|---|---|---:|
| Attack (heavy plasma cannon) | Plasma (Space) 8x ×2 mounts (+40 each extra) | 290 |
| Counter | Shields (free) | 0 |
| Bleed | Major 4 (free, Plasma) | 0 |
| Anti-Missile | Space 1x ×2 | 40 |
| Launcher | Space ×4, 1 increment | 60 |
| Resource | Magazine, Major ×6 | 90 |
| Armor Rating | Space, rank 6 | 230 |
| Body Track | 350 (default 200 + 3×50) | 60 |
| Drive | Moderate Reaction | 25 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 3 at Major grade | 60 |
| Power Supply | Major Fusion rank 2 | 80 |
| Resource | Fuel, Major ×7 | 105 |
| Communication | Moderate Radio | 13 |
| Communication | Moderate Laser Link | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×5 | 50 |
| Computer | Major rank 3 (TN 18) | 60 |
| Cargo | Major ×1 | 30 |
| Hangar | Major | 60 |
| Life Support | Major ×1 | 40 |
| Modifier | Detection +2 | 20 |
| Modifier | Gunnery +2 | 20 |
| Tag | [Security: High Alert] 3 | 15 |
| Tag | [All Ahead Full] 3 | 15 |
| Tag | [Pride of the Fleet] 3 | 15 |
| Tag | [The One-Two Punch] 2 | 10 |
| Tag | [Shohan Killer] | 5 |
| Limitation | Moderate: Crew Requirement (10 skeleton, 20 full) | −20 |
| Limitation | Major: Restricted Technology (Property of the Terran Sphere Navy) | −50 |
| **Total** | | **1,416** |

**Formula CR:** 10 ✔ matches printed

**Power:** 9 Major (Fusion ×2 + Gravitic Drive; 7 used: 2 Plasma ×2, 2 Anti-Missile, 4 Launchers = 1) + 3 Moderate (Reaction Drive; 0 used). OK.

**Check:**

- Differs from the Workbench design exercise (pp. 219–221): fuel here is Major (15/rank) where the exercise used Moderate (10/rank); the limitations are Crew + Restricted Technology here, 2 Moderate in the exercise. Both land on CR 10.

#### Retribution-class Frigate

p. 260 · **Size:** Huge · **Printed CR:** 10 · **CC:** 55

Description: "The sister class to the Redemption. While built on the same general hull design, the Retribution is the sniper to the Redemption’s brawler, trading one of the Redemption’s Plasma Cannons for a heavier missile armament."

> **Errata** (new, 2026-09-28) p260: Reaction Drive is Moderate, not Major, like its sister ship the Redemption. Total Power Slots read 6 Major (6 used), 3 Moderate (0 used).

> **Errata** (new, 2026-09-28) p260: "Anti-Missile (Space) 2x" reads Anti-Missile (Space) 1x (one mount). Total Power Slots read 9 Major (6 used), not 7 used.

| Row | Detail | BP |
|---|---|---:|
| Attack (heavy plasma cannon) | Plasma (Space) 7x | 190 |
| Counter | Shields (free) | 0 |
| Bleed | Major 3 (free, Plasma) | 0 |
| Anti-Missile | Space 1x | 20 |
| Launcher | Space ×12, 3 increments | 180 |
| Resource | Magazine, Major ×12 | 180 |
| Armor Rating | Space, rank 6 | 230 |
| Body Track | 350 (default 200 + 3×50) | 60 |
| Drive | Moderate Reaction | 25 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 3 at Major grade | 60 |
| Power Supply | Major Fusion rank 1 | 40 |
| Resource | Fuel, Major ×7 | 105 |
| Communication | Moderate Radio | 13 |
| Communication | Moderate Laser Link | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×5 | 50 |
| Computer | Major rank 3 (TN 18) | 60 |
| Cargo | Moderate ×1 | 15 |
| Hangar | Major | 60 |
| Life Support | Major ×1 | 40 |
| Modifier | Detection +3 | 30 |
| Modifier | Engineering (Starship) +1 | 10 |
| Modifier | Gunnery +2 | 20 |
| Modifier | Tactics +1 | 10 |
| Tag | [Security: High Alert] 3 | 15 |
| Tag | [Flush the Tubes!] 2 | 10 |
| Tag | [Shohan Hunter] | 5 |
| Limitation | Moderate: Crew Requirement (20 skeleton, 100 full) | −20 |
| **Total** | | **1,501** |

**Formula CR:** 10 ✔ matches printed

**Power:** 6 Major (Fusion + Gravitic Drive; 6 used: Plasma 2, Anti-Missile 1, 12 Launchers = 3) + 3 Moderate (Reaction Drive; 0 used). OK.

#### Marine LASCO (Launch, Support, and Command) Vessel

p. 261 · **Size:** Huge · **Printed CR:** 10 · **CC:** 55

Description: "A JESF design, the LASCO is dedicated to planetary operations: housing marines, launch bays, and weaponry for bombardment. Like the Redemption-class frigate, the LASCO is a specialized implementation of a role previously filled by conventional frigates. A LASCO can fight in a space engagement if it must, but at a significant disadvantage compared to other frigates due to its specialized weaponry."

> **Errata** (new, 2026-09-27) p261: Fuel is 10 Major (100 days), not 13. Adds Limitation: Prerequisite [Property of the Terran Sphere] (Moderate). The 4 Major Hangars hold 3 Large craft each (4 crammed), so 12–16 Bridgehead Assault Shuttles.

| Row | Detail | BP |
|---|---|---:|
| Anti-Missile | Space 1x | 20 |
| Launcher | Space ×8, 2 increments | 120 |
| Resource | Magazine, Major ×8 | 120 |
| Limitation | Minor: Usage Restriction (limited firing arc) | −10 |
| Armor Rating | Space, rank 6 | 230 |
| Body Track | 350 (default 200 + 3×50) | 60 |
| Drive | Major Reaction | 50 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 2 at Major grade | 40 |
| Resource | Fuel, Major ×10 | 150 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×5 | 50 |
| Computer | Major rank 4 (TN 20) | 80 |
| Cargo | Major ×2 | 60 |
| Hangar | Major ×4 | 240 |
| Life Support | Major ×5 | 200 |
| Modifier | Detection +2 | 20 |
| Modifier | Engineering (Starship) +1 | 10 |
| Modifier | Gunnery +2 | 20 |
| Modifier | Medicine +1 | 10 |
| Modifier | Tactics +1 | 10 |
| Tag | [High Security] 3 | 15 |
| Tag | [The Hammer of God] 3 | 15 |
| Tag | [Go to Rapid Fire] 3 | 15 |
| Tag | [Coordinated Fire] 2 | 10 |
| Tag | [Eye in the Sky] | 5 |
| Limitation | Moderate: Crew Requirement (20 skeleton, 40 full) | −20 |
| Limitation | Moderate: Prerequisite (Property of the Terran Sphere) | −20 |
| **Total** | | **1,593** |

**Formula CR:** 10 ✔ matches printed

**Check:**

- The bombardment weaponry in the flavor text is the missile launchers; there is no separate bombardment Attack (confirmed against the build notes).

#### Fleet Auxiliary

p. 261 · **Size:** Huge · **Printed CR:** 9 · **CC:** 45

Description: "Designed to extend the reach of limited-range Defiance squadrons and other Fleet elements, these frigate-class hulls are a fleet’s front-line resupply nodes. They carry considerable cargo and enough fuel to supply three frigates with a full refuel. Industrial G3Ps can convert raw materials into whatever the cargo bays don’t carry. As part of the ongoing experiment with Dragon-class escorts, the Fleet has also outfitted them with a large parasite contingent to deploy in support of Fleet operations."

> **Errata** (new, 2026-09-28) p261: The ship's own Fuel is 11 Major (110 days), separate from the bulk fuel it carries as Cargo.

> **Errata** (new, 2026-09-25) p261: The printed "300 Major Fuel" is bulk fuel held as Cargo (enough to refuel three frigates), not the ship's own Fuel Resource. Pumping it from the storage tanks into a ship's systems takes an Engineering check.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Space, rank 5 | 180 |
| Body Track | 300 (default 200 + 2×50) | 40 |
| Drive | Major Reaction | 50 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 2 at Major grade | 40 |
| Resource | Fuel, Major ×11 | 165 |
| Bulk fuel stores | Carried as Cargo (below); see errata | 0 |
| Link | Major Refueling ×3 | 150 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×5 | 50 |
| Computer | Major rank 3 (TN 18) | 60 |
| Manufacture | Major | 100 |
| Cargo | Major ×4 | 120 |
| Hangar | Major ×3 | 180 |
| Life Support | Major ×3 | 120 |
| Modifier | Detection +1 | 10 |
| Modifier | Engineering (Starship) +3 | 30 |
| Tag | [Rally and Resupply] | 5 |
| Tag | [High Security] 3 | 15 |
| Tag | [Mothership] | 5 |
| Limitation | Moderate: Crew Requirement (20 skeleton, 40 full) | −20 |
| **Total** | | **1,393** |

**Formula CR:** 9 ✔ matches printed

**Power:** 6 Major (two Major drives); 4 used (3 Refueling Links, Manufacture 1). OK.

#### Arniston (Unique Armed Merchantman)

p. 262 · **Size:** Huge · **Printed CR:** 9 · **CC:** 45

Description: "The Arniston began life several decades ago as a fleet auxiliary in the JESF before being sold off as naval surplus to an outer Colony. It turned up as a tramp freighter plying the Gap trading lines, and its captain, Marcos, was caught smuggling. The Seventh Fleet offered Marcos a deal: sell the Arniston to a Nav Int shell corporation and retire far from the Gap. The ship has since been rebuilt by Nav Int with the intent of investigating the increased pirate attacks in the Gap, but even before the latest Navy refit, the Arniston—especially its engines—had been extensively modified. Nav Int commissioned its previous engineer rather than scrap and rebuild its drives."

> **Errata** (new, 2026-09-28) p262: Fuel reads 6 Major Fuel (60 days/combat rounds), not 6 days.

> **Errata** p262: Power Slots 6 Major, 4 used (was missing); a weapon fitted to the Weapon Link draws a further slot.

> **Errata** (new, 2026-09-27) p262: Manufacture is Major (was Moderate). Adds a Major Weapon Link so the crew can fit a custom weapon besides the missiles. Detection +2 (was +1).

| Row | Detail | BP |
|---|---|---:|
| Anti-Missile | Space 1x | 20 |
| Launcher | Space ×8, 2 increments | 120 |
| Resource | Magazine, Major ×8 | 120 |
| Armor Rating (Shrouded Hull) | Space, rank 6 | 270 |
| Body Track | 300 (default 200 + 2×50) | 40 |
| Drive | Major Reaction | 50 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 1 at Major grade | 20 |
| Resource | Fuel, Major ×6 | 90 |
| Limitation | Minor: Usage Restriction (no maneuver when shrouded) | −10 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×2 | 20 |
| Computer | Major rank 3 (TN 18) | 60 |
| Manufacture | Major | 100 |
| Link | Major Weapon | 50 |
| Cargo | Major ×1 | 30 |
| Hangar | Major | 60 |
| Life Support | Major ×1 | 40 |
| Modifier | Detection +2 | 20 |
| Modifier | Gunnery +1 | 10 |
| Tag | [She's Gone This Far…] | 5 |
| Tag | [Appearances Can Be Deceiving] 2 | 10 |
| Tag | [Go To Rapid Fire!] 2 | 10 |
| Tag | [High Security] 3 | 15 |
| Limitation | Moderate: Crew Requirement (20 skeleton, 40 full) | −20 |
| Limitation | Moderate: Prerequisite ([Only One Woman Can Maintain the Old Girl]) | −20 |
| **Total** | | **1,203** |

**Formula CR:** 9 ✔ matches printed

**Power:** 6 Major; 4 used (Anti-Missile 1, 8 Launchers = 2, Manufacture 1), 5 with a weapon on the Link. OK.


### Space: Free Haven

#### Havenite Lilith Carrier

p. 263 · **Size:** Huge · **Printed CR:** 10 · **CC:** 55

Description: "While the fleets of the Free Haven have a number of more standard designs, they also maintain a number of heavy warships designed to support light raider squadrons. Most carriers lurk in orbit around a system’s outer planets while their escorts prey on TSC shipping, thus minimizing the risk to their Navigators, but they have on occasion made starfall in an inner system to support a raiding squadron."

> **Errata** (new, 2026-09-27) p263: Heavy particle cannon is 7x (was 6x). Armor Rating 5 (was 3). Cargo 2 Major (was "1 Huge"; Cargo has no Huge grade). Adds Manufacture: Major. Unique Fuel (Antimatter) is a Major limitation. Power Slots 6 Major (from its two Major drives), 5 used.

| Row | Detail | BP |
|---|---|---:|
| Attack (heavy particle cannon) | Energy (Space) 7x ×2 mounts (+40 each extra) | 230 |
| Launcher | Space ×4, 1 increment | 60 |
| Resource | Magazine, Major ×4 | 60 |
| Anti-Missile | Space 1x | 20 |
| Armor Rating (Shrouded Hull) | Space, rank 5 | 220 |
| Body Track | 300 (default 200 + 2×50) | 40 |
| Drive | Major Reaction | 50 |
| Drive | Major Gravitic | 50 |
| Maneuver | rank 4 at Major grade | 80 |
| Resource | Fuel, Major ×4 | 60 |
| Limitation | Major: Unique Fuel (Antimatter) | −50 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×5 | 50 |
| Computer | Moderate rank 3 (TN 18) | 15 |
| Manufacture | Major | 100 |
| Cargo | Major ×2 | 60 |
| Hangar | Major ×3 | 180 |
| Life Support | Major ×2 | 80 |
| Modifier | Detection +4 | 40 |
| Modifier | Engineering +3 | 30 |
| Modifier | Gunnery +3 | 30 |
| Modifier | Medicine +2 | 20 |
| Tag | [Now You See Me, Now You Don't] 2 | 10 |
| Tag | [Go to Rapid Fire] 2 | 10 |
| Tag | [High Security] 3 | 15 |
| Limitation | Moderate: Crew Requirement (20 skeleton, 40 full) | −20 |
| Limitation | Moderate: Key Personnel (Navigator) | −20 |
| **Total** | | **1,463** |

**Formula CR:** 10 ✔ matches printed

**Power:** 6 Major (two Major drives); 5 used (2 cannon mounts, 4 Launchers = 1, Anti-Missile 1, Manufacture 1). OK.

- Key Personnel (Navigator) is a Moderate limitation.

#### Havenite Marauder

p. 263 · **Size:** Large · **Printed CR:** 6 · **CC:** 21

Description: "Fast and stealthy, Marauders use their heavy missile loadouts to ambush unsuspecting starships before their motherships move in to claim the prize. The tight crew quarters make the ships uncomfortable for any but a Havenite crew."

> **Errata** (new, 2026-09-28) p263: 8 Launchers (Space), not 6 (launchers come in sets of 4; fits its heavy missile loadout).

> **Errata** (new, 2026-09-28) p263: Magazine reads 6 Major Magazine (60 shots), not 640 shots.

> **Errata** (new, 2026-09-27) p263: Rebuilt from the build notes. Armor Rating 4 (Shrouded Hull), not 5. Reaction Drive is Moderate, not Major; the Major Gravitic Drive is removed (the Marauder has no interstellar drive). Maneuver 4 now runs on the Moderate drive. Adds Power Supply: Major Antimatter, rank 1 (3 Major slots for the Anti-Missile and launchers). Unique Fuel (Antimatter) is a Major limitation. Intrusion Detection task removed.

| Row | Detail | BP |
|---|---|---:|
| Anti-Missile | Space 1x | 20 |
| Launcher | Space ×8, 2 increments | 120 |
| Resource | Magazine, Major ×6 | 90 |
| Armor Rating (Shrouded Hull) | Space, rank 4 | 180 |
| Body Track | 130 (default 50 + 4×20) | 40 |
| Drive | Moderate Reaction | 25 |
| Maneuver | rank 4 at Moderate grade | 40 |
| Power Supply | Major Antimatter rank 1 | 40 |
| Resource | Fuel, Major ×3 | 45 |
| Limitation | Major: Unique Fuel (Antimatter) | −50 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×2 | 20 |
| Computer | Moderate rank 3 (TN 18) | 15 |
| Life Support | Moderate ×1 | 20 |
| Modifier | Detection +2 | 20 |
| Modifier | Gunnery +1 | 10 |
| Tag | [Ambush!] | 5 |
| Tag | [Go to Rapid Fire] 3 | 15 |
| Tag | [Coordinated Fire] 2 | 10 |
| Tag | [Don't Get Too Comfortable] | 5 |
| Limitation | Moderate: Crew Requirement (2 skeleton, 5 full) | −20 |
| **Total** | | **693** |

**Formula CR:** 6 ✔ matches printed

**Power:** 3 Major (Antimatter Power Supply) + 3 Moderate (Reaction Drive); 3 Major used (Anti-Missile 1, 8 Launchers = 2). OK.

**Check:**

- With no interstellar drive, the Marauder relies on a carrier (the Lilith's Major Hangars) to travel between systems. The Ansible keeps it in touch with the carrier.

#### Havenite Lamprey

p. 264 · **Size:** Large · **Printed CR:** 5 · **CC:** 15

Description: "This small boarding craft relies heavily on its stealth technologies to carry it through mission, having little in the way of armament and a small fuel reserve for its hungry in-system drive."

> **Errata** (new, 2026-09-28) p264: Fuel reads 4 Major Fuel (40 days/combat rounds), not 4 days.

> **Errata** (new, 2026-09-27) p264: The drive is a Major Gravitic drive modified for in-system use (like the Phantom's), not a Reactionless drive, with Limitation: Usage Restriction (in-system only; not FTL-capable), Minor. Adds Limitation: One-Time Use (Major); the boarding craft must be reserviced after action.

| Row | Detail | BP |
|---|---|---:|
| Attack (Energy Melee breacher) | Melee (Space) 6x | 70 |
| Anti-Missile | Space 1x | 20 |
| Armor Rating | Space, rank 4 | 140 |
| Body Track | 70 (default 50 + 1×20) | 10 |
| Drive | Major Gravitic (modified in-system grav drive) | 50 |
| Limitation | Minor: Usage Restriction (Gravitic drive works in-system only; not FTL-capable) | −10 |
| Maneuver | rank 4 at Major grade | 80 |
| Resource | Fuel, Major ×4 | 60 |
| Limitation | Minor: Hungry (1 fuel/round in-system travel) | −10 |
| Communication | Moderate Radio | 13 |
| Communication | Major Ansible | 30 |
| Resource | Tangle, Major ×1 | 10 |
| Computer | Moderate rank 3 (TN 18) | 15 |
| Hangar | Moderate ×2 | 60 |
| Life Support | Moderate ×3 | 60 |
| Tag | [Now You See Me, Now You Don't] 2 | 10 |
| Tag | [High Security] 3 | 15 |
| Tag | [Once More into the Breach] | 5 |
| Tag | [Stuck on You] | 5 |
| Limitation | Moderate: Crew Requirement (1 skeleton, 2 full) | −20 |
| Limitation | Major: One-Time Use (boarding craft; must be reserviced after action) | −50 |
| **Total** | | **563** |

**Formula CR:** 5 ✔ matches printed

- [Once More into the Breach]: after a successful breacher attack, the crew can move from the troop deck to the target ship. [Stuck on You]: on a successful Hard Maneuver check, the ship latches on.


### Space: Starship Accessories

#### Heavy Railgun

p. 264 · **Size:** Medium · **Printed CR:** 3 · **CC:** 6

Description: "An aftermarket kinetic weapon for light space combatants."

> **Errata** (new, 2026-09-28) p264: Adds Power Requirement: 1 Major slot (drawn from the host through its Weapon Link), like the Heavy Laser Cannon.

> **Errata** p264: Attack 7x (was 6x); Body 50 (was 10).

| Row | Detail | BP |
|---|---|---:|
| Attack | Kinetic (Space) 7x | 175 |
| Resource | Ammunition, Major ×4 | 60 |
| Body Track | 50 (default 10 + 8×5) | 40 |
| Limitation | Minor: No Combat Reload | −10 |
| Limitation | Moderate: Slave (Weapon Link) | −20 |
| **Total** | | **245** |

**Formula CR:** 3 ✔ matches printed

**Power:** Draws 1 Major slot from its host.

#### Heavy Laser Cannon

p. 264 · **Size:** Medium · **Printed CR:** 4 · **CC:** 10

Description: "The high damage and savings on ammo help make up for this high-quality laser cannon’s high purchase cost."

> **Errata** p264: Attack 8x (was 7x); Body 50 (was 10).

| Row | Detail | BP |
|---|---|---:|
| Attack | Energy (Space) 8x | 250 |
| Body Track | 50 (default 10 + 8×5) | 40 |
| Limitation | Moderate: Slave (Weapon Link) | −20 |
| **Total** | | **270** |

**Formula CR:** 4 ✔ matches printed

**Power:** Draws 1 Major slot from its host.

#### Quad Missile Pack

p. 265 · **Size:** Medium · **Printed CR:** 2 · **CC:** 3

Description: "This four-tube missile pack can be attached to any starship Weapon Link. While the launcher itself is cheaper than other weapons, the individual missiles are not included."

> **Errata** (new, 2026-09-28) p265: Magazine reads 8 Major Magazines (80 shots), not 2.

| Row | Detail | BP |
|---|---|---:|
| Launcher | Space ×4, 1 increment | 60 |
| Resource | Magazine, Major ×8 | 120 |
| Limitation | Minor: No Combat Reload | −10 |
| Limitation | Moderate: Slave (Weapon Link) | −20 |
| **Total** | | **150** |

**Formula CR:** 2 ✔ matches printed

**Power:** Draws 1 Major slot from its host (4 Launchers).


### Programs

#### Social Aggregator

p. 266 · **Size:** Small · **Printed CR:** 2 · **CC:** 3 · **Required Computer Grade:** Minor

Description: "Social Aggregators marry network analysis tools and social data feeds to create context sensitive info feeds for the user. In one sweep over the room, a person may quickly discover numerous tidbits about it occupants from a variety sources."

| Row | Detail | BP |
|---|---|---:|
| Modifier | Social Analysis (Persuade, Discern, Socialize) +3 (counted ×3 skills) | 90 |
| Tag | [Always in the Know] 2 | 10 |
| **Total** | | **100** |

**Formula CR:** 2 ✔ matches printed

- Multi-skill Modifiers are costed per skill: +3 across three skills = 90 BP.

#### Basic Security Software

p. 266 · **Size:** Small · **Printed CR:** 0 · **CC:** 0 · **Required Computer Grade:** Minor

Description: "Most computer systems in the Fourth Population possess at least modicum of security software to ward off malware and other electronic miscreants."

> **Errata** (new, 2026-09-27) p266: A Small item (per the build notes); requires a Minor computer.

| Row | Detail | BP |
|---|---|---:|
| Tasks | Intrusion Detection 15 | 30 |
| Tag | [Under Lock and Key] 2 | 10 |
| **Total** | | **40** |

**Formula CR:** 0 ✔ matches printed

#### Security Software

p. 266 · **Size:** Small · **Printed CR:** 1 · **CC:** 1 · **Required Computer Grade:** Minor

Description: "A more sophisticated option of the security conscious."

> **Errata** (new, 2026-09-27) p266: Adds the Free Tags [This Is A Private Conversation 2] and [I See You 2].

| Row | Detail | BP |
|---|---|---:|
| Tasks | Intrusion Detection 20 | 40 |
| Tag | [Under a Watchful Eye] | 5 |
| Tag | [This Is A Private Conversation] 2 (Free) | 20 |
| Tag | [I See You] 2 (Free) | 20 |
| **Total** | | **85** |

**Formula CR:** 1 ✔ matches printed

#### Traceback

p. 266 · **Size:** Tiny · **Printed CR:** 1 · **CC:** 1 · **Required Computer Grade:** Minor

Description: ""

> **Errata** (new, 2026-09-27) p266: A Tiny add-on module for a larger security suite.

| Row | Detail | BP |
|---|---|---:|
| Tasks | Trace 18 | 36 |
| **Total** | | **36** |

**Formula CR:** 1 ✔ matches printed

#### Honey Pot

p. 266 · **Size:** Tiny · **Printed CR:** 2 · **CC:** 3 · **Required Computer Grade:** Minor

Description: ""

> **Errata** (new, 2026-09-27) p266: A Tiny add-on module for a larger security suite. [The Wages of Sin] is rank 2.

| Row | Detail | BP |
|---|---|---:|
| Tasks | Compromise 18 | 36 |
| Tag | [The Wages of Sin] 2 | 10 |
| **Total** | | **46** |

**Formula CR:** 2 ✔ matches printed

#### Military-Grade Security

p. 267 · **Size:** Small · **Printed CR:** 4 · **CC:** 10 · **Required Computer Grade:** Minor

Description: "Hardened system security that fights back."

> **Errata** (new, 2026-09-27) p267: Compromise task removed. [I See You 3] and [Like Fort Knox 3] are Free Tags (Like Fort Knox was rank 1), and it adds the Free Tag [This Is A Private Conversation 2]. Its TN 20 Tasks run at TN 20 only on a rank 4 or better computer.

| Row | Detail | BP |
|---|---|---:|
| Tasks | Intrusion Detection 20, Trace 20 | 80 |
| Tag | [I See You] 3 (Free) | 30 |
| Tag | [Like Fort Knox] 3 (Free) | 30 |
| Tag | [This Is A Private Conversation] 2 (Free) | 20 |
| **Total** | | **160** |

**Formula CR:** 4 ✔ matches printed

#### Cover Identity

p. 267 · **Size:** Tiny · **Printed CR:** 2 · **CC:** 3 · **Required Computer Grade:** Minor

Description: "Various forged electronic certificates, all proudly proclaiming you are who you are almost certainly not."

> **Errata** (new, 2026-09-25) p267 (clarification): A Tiny item. The identity is stored on a chip (ident card, passport) and runs on whatever computer reads it to spoof that reader.

| Row | Detail | BP |
|---|---|---:|
| Tasks | Spoof ID 15 | 30 |
| Modifier | Credentials +1 | 10 |
| Tag | [Not the Dude You're Looking For] | 5 |
| **Total** | | **45** |

**Formula CR:** 2 ✔ matches printed

#### Good Cover Identity

p. 267 · **Size:** Tiny · **Printed CR:** 4 · **CC:** 10 · **Required Computer Grade:** Minor

Description: "Good enough to fool your own mother—when they release her someday…"

> **Errata** (new, 2026-09-25) p267 (clarification): A Tiny item. The identity is stored on a chip (ident card, passport) and runs on whatever computer reads it to spoof that reader.

| Row | Detail | BP |
|---|---|---:|
| Tasks | Spoof ID 20 | 40 |
| Modifier | Credentials +2 | 20 |
| Tag | [Do You Know Who I Am?] | 5 |
| **Total** | | **65** |

**Formula CR:** 4 ✔ matches printed

**Check:**

- Tiny chip, Minor computer. Its Spoof ID 20 runs at 20 only on a rank 4 or better reader; lower-rank readers cap it at their max TN.


### Shohan: Battlefield

#### Tse Blade

p. 268 · **Size:** Small · **Printed CR:** 4 · **CC:** 10

Description: "The standard weapon of Shohan Warriors, the Tse is known for its Force Field “blade.” However, the Tse Blade also contains a potent, if slow-firing, ranged energy weapon."

> **Errata** p268: Attack multipliers 5x (was 4x).

> **Errata** (new, 2026-09-25) p216: Moderate Power Supplies are allowed on Small items, so the Hyperspace Tap is now legal.

> **Errata** (new, 2026-09-27) p268: [Flexible Geometry Blade] is a Free Tag. [Where Did You Get Your Hands on One?] is a standard Tag (it applies when a character outside the Shohan and Altered carries one). CR 4, CC 10 (was CR 5, CC 15).

| Row | Detail | BP |
|---|---|---:|
| Attack (Tse blade) | Tse/Melee (Battlefield) 5x | 40 |
| Counter | Armor (free) | 0 |
| Limitation | Minor: Usage Restriction (no area attacks against Firefight targets) | −10 |
| Attack (flare gun) | Flare (Firefight) 5x | 70 |
| Area |  | 20 |
| Counter | Armor | 20 |
| Limitation | Minor: Usage Restriction (cannot be fired more than once per round) | −10 |
| Power Supply | Moderate Hyperspace Tap rank 1 | 10 |
| Tag | [Cut Through Anything] 3 | 15 |
| Tag | [Flexible Geometry Blade] (Free) | 10 |
| Tag | [Where Did You Get Your Hands on One?] | 5 |
| Limitation | Moderate: Malfunction [Interested Parties], [Emergent Altered] | −20 |
| **Total** | | **150** |

**Formula CR:** 4 ✔ matches printed

**Power:** 3 Moderate; 2 used (both attacks). OK.

**Check:**

- The no-area restriction is meaningful: a Battlefield-scale attack used against Firefight-scale targets counts as an area attack by default (scaling rule). The limitation removes that, so the blade hits one Firefight target.
- Printed CR/CC shown here are the errata values (the book printed CR 5, CC 15). They apply to Altered characters only (see chapter note).

#### Shohan Personal Armor

p. 268 · **Size:** Medium · **Printed CR:** 5 · **CC:** 15

Description: "The standard Shohan soldier’s armor."

> **Errata** (new, 2026-09-29) p268: Weapons +2 covers two skills, Melee and Heavy Weapons (a Tse Blade combo), costed as a Moderate Modifier. Target On Your Back is a Major limitation, not Moderate: anyone wearing it is visibly in the other side's armor.

> **Errata** (new, 2026-09-28) p268: Body Track 45 (was 40).

> **Errata** (new, 2026-09-28) p268: Its 2 Weapon Links are Moderate. Its Weapons +2 Modifier works only with weapons on those Links (Usage Restriction, Minor). Computer is Minor rank 3 (was Moderate). Athletics +1 (was +2).

> **Errata** p268: Armor is Battlefield, not Firefight.

> **Errata** (new, 2026-09-27) p268: Regeneration grades are Biological 4 at Moderate (4 Body per scene) and Force Field 4 at Major (per round). [Emergent Altered] is a Moderate limitation (Malfunction), and the armor has a second Moderate limitation, Target On Your Back.

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Battlefield, rank 4 | 110 |
| Body Track | 45 (default 10 + 7×5) | 35 |
| Regeneration | Biological 4, Moderate grade | 40 |
| Force Field | Minor ×3 (track 30) | 45 |
| Regeneration | Force Field 4, Major grade | 45 |
| Power Supply | Moderate Hyperspace Tap rank 1 | 10 |
| Link | Moderate Weapon ×2 | 30 |
| Communication | Moderate Radio | 13 |
| Computer | Minor rank 3 (TN 18) | 9 |
| Life Support | Minor ×1 | 5 |
| Modifier | Athletics +1 | 10 |
| Modifier | Detection +2 | 20 |
| Modifier | Weapons (Melee, Heavy Weapons) +2 (counted ×2 skills) | 40 |
| Limitation | Minor: Usage Restriction (Weapons +2 applies only to weapons on its Weapon Links) | −10 |
| Tag | [The Armor Just Ate the Table] | 5 |
| Limitation | Moderate: Malfunction [Emergent Altered] | −20 |
| Limitation | Major: Target On Your Back (visibly wearing enemy armor; not concealable) | −50 |
| **Total** | | **337** |

**Formula CR:** 5 ✔ matches printed

**Power:** 3 Moderate (Hyperspace Tap); 3 used (Force Field 1, a weapon on each Weapon Link 1 + 1). OK.

#### War Drone (Cerberus)

p. 269 · **Size:** Medium · **Printed CR:** — · **CC:** —

Description: "It’s uncertain whether these so-called Cerberuses count as merely equipment, or if select Shohan have used their biotech to warp themselves into an extreme warrior form. The hulking gorilla-sized War Drone serves as the Shohan’s ground-scale heavy weapons platform."

> **Errata** (new, 2026-09-28) p269: Computer is a Moderate Brain rank 4 (20 target), not rank 3, to run its Combat 20 Task.

> **Errata** p269: Body 80, Armor 5 (was lower).

| Row | Detail | BP |
|---|---|---:|
| Attack (heavy flare gun) | Flare (Battlefield) 5x ×2 mounts (+20 each extra) | 100 |
| Area |  | 20 |
| Counter | Armor | 20 |
| Attack (Tse claws) | Tse/Melee (Battlefield) 4x | 25 |
| Counter | Armor (free) | 0 |
| Limitation | Minor: Usage Restriction (no area attacks against Firefight targets) | −10 |
| Armor Rating | Battlefield, rank 5 | 150 |
| Body Track | 80 (default 10 + 14×5) | 70 |
| Regeneration | Biological 5, Moderate grade | 60 |
| Force Field | Minor ×6 (track 60) | 90 |
| Regeneration | Force Field 4, Major grade | 45 |
| Power Supply | Moderate Hyperspace Tap rank 2 | 20 |
| Computer | Moderate Brain rank 4 (TN 20) | 40 |
| Tasks | Athletics 17, Combat 20, Stealth 18, Tactics 18 (Brain: half) | 73 |
| Tag | [Seek And Destroy] 3 | 15 |
| Tag | [Faster than He Looks] 2 | 10 |
| Tag | [Unrelenting Pursuit] | 5 |
| **Total** | | **733** |

**Formula CR:** 13

- No CR: not available for purchase.

**Check:**

- Regeneration grade not given. Force Field Regeneration is Major (Shohan rule); Biological/Mechanical costed as Moderate.

#### Shohan Deployment Pod

p. 269 · **Size:** Large · **Printed CR:** — · **CC:** —

Description: "The Shohan version of the Terran assault shuttle. The Shohan launch dozens of these disposable pods to the surface of a planet when commencing a planetary invasion. Those that survive become both gateways and field fortifications for the arriving Shohan."

| Row | Detail | BP |
|---|---|---:|
| Attack (heavy flare gun) | Flare (Battlefield) 4x ×3 mounts (+20 each extra) | 90 |
| Area |  | 20 |
| Counter | Armor | 20 |
| Armor Rating | Space, rank 4 | 140 |
| Body Track | 150 (default 50 + 5×20) | 50 |
| Regeneration | Mechanical 3, Moderate grade | 25 |
| Force Field | Moderate ×5 (track 100) | 100 |
| Regeneration | Force Field 4, Major grade | 45 |
| Drive | Moderate Reactionless | 25 |
| Limitation | Major: One-Time Use (drive) | −50 |
| Power Supply | Moderate Hyperspace Tap rank 2 | 20 |
| Communication | Major Hypercomms | 25 |
| Hangar | Major | 60 |
| Tag | [They're Here] | 5 |
| Tag | [Rapid Fire] 3 | 15 |
| **Total** | | **590** |

**Formula CR:** 5

- The Hangar is a Hyperspace Teleport Platform: it can bring down many Medium items from distant storage.


### Shohan: Spacecraft

#### Shohan Destroyer

p. 270 · **Size:** Huge · **Printed CR:** — · **CC:** —

Description: "Combining the maneuverability of a cruiser with the firepower of a frigate, Shohan destroyers make up the bulk of the Shohan fleet. Project Leapfrog speculates that Destroyers represent a larval form of the Dreadnoughts."

| Row | Detail | BP |
|---|---|---:|
| Attack (heavy flare cannon array) | Flare (Space) 7x ×4 mounts (+40 each extra) | 310 |
| Counter | Armor | 20 |
| Counter | Missiles | 20 |
| Armor Rating | Space, rank 6 | 230 |
| Body Track | 250 (default 200 + 1×50) | 20 |
| Regeneration | Mechanical 1, Moderate grade | 10 |
| Force Field | Major ×3 (track 150) | 75 |
| Regeneration | Force Field 6, Major grade | 90 |
| Drive | Moderate Reactionless | 25 |
| Drive | Major Jump | 50 |
| Maneuver | rank 4 at Major grade | 80 |
| Power Supply | Major Hyperspace Tap rank 2 | 80 |
| Communication | Moderate Radio | 13 |
| Communication | Major Hypercomms | 25 |
| Computer | Major rank 4 (TN 20) | 80 |
| Tasks | Electronic Warfare 20, Gunnery 20, Piloting 20, Tactics 18 | 156 |
| Tag | [Go to Rapid Fire] 3 | 15 |
| Tag | [A Hawk Amongst Sparrows] 3 | 15 |
| **Total** | | **1,314** |

**Formula CR:** 9

**Power:** 3 Moderate, 9 Major (Jump Drive's tap 3 + 2 taps 6). 7 Major used.

- [Disoriented] comes with the Jump Drive; it isn't a bought Malfunction.

#### Shohan Dreadnought

p. 270 · **Size:** Colossal · **Printed CR:** — · **CC:** —

Description: "If the Shohan merely possessed fleets of Destroyers, they would still be a formidable foe. Unfortunately for the Terran Sphere, the Destroyer is only an escort and raider for the true master of the Shohan fleet: the Dreadnought. These massive vessels’ hyper cannons are the pinnacle of known Shohan weaponry, producing a massive FTL beam with a range beyond anything in the Terran Sphere."

| Row | Detail | BP |
|---|---|---:|
| Attack (hyper cannon) | Hyperspace (Space) 13x | 700 |
| Area | Small Sudden (free, Hyperspace) | 0 |
| Counter | Armor (free) | 0 |
| Limitation | Minor: Usage Restriction (cannot be fired more than once per round) | −10 |
| Attack (heavy flare cannon array) | Flare (Space) 4x ×5 mounts (+40 each extra) | 230 |
| Counter | Armor | 20 |
| Counter | Missiles | 20 |
| Armor Rating | Space, rank 11 | 630 |
| Body Track | 500 (default) | 0 |
| Force Field | Major ×5 (track 250) | 125 |
| Regeneration | Force Field 10, Major grade | 240 |
| Drive | Moderate Reactionless | 25 |
| Drive | Major Jump | 50 |
| Power Supply | Major Hyperspace Tap rank 4 | 160 |
| Communication | Moderate Radio | 13 |
| Communication | Major Hypercomms | 25 |
| Computer | Major rank 4 (TN 20) | 80 |
| Tasks | Computer Subversion 20, Gunnery 20, Piloting 20, Tactics 20 | 160 |
| Tag | [Turret Fire] 3 | 15 |
| Tag | [An Ancient Doom] 3 | 15 |
| Tag | [You're Never Safe] | 5 |
| **Total** | | **2,503** |

**Formula CR:** 12

- The hyper cannon's Counter: Armor and Area: Small Sudden come free with the Hyperspace implementation; they're printed so a GM or player can see what the cannon does without looking it up.


### Resistance Technology

#### Resistance Lumber Mech

p. 271 · **Size:** Medium · **Printed CR:** 4 · **CC:** 10

Description: "Artemis III’s security forces started the Shohan occupation with APCs and hovercrafts designed for use in Sopara’s urban environs. These vehicles have proven less than ideal in the Cathedral Tree forests’ close confines against the Shohan Cerberuses. The Resistance has scavenged lumber mechs, designed to clamber along the forests’ thick canopies, to convert them into crude heavy combatants."

> **Errata** (new, 2026-09-28) p271: Total Power Slots read 3 Minor (0 used), 3 Moderate (1 used), not 2 Minor.

> **Errata** (new, 2026-09-27) p271: Body Track 70 (was 80). The Coil Power Supply's "2 Moderate Fuel" should read 2 Moderate Charge. [Kinetic Feedback Control Rig] is a Free Tag (free Skill switch from Drive to Athletics).

| Row | Detail | BP |
|---|---|---:|
| Armor Rating | Battlefield, rank 4 | 110 |
| Body Track | 70 (default 10 + 12×5) | 60 |
| Attack (modified chainsaw) | Melee (Battlefield) 5x | 40 |
| Counter | Armor | 20 |
| Drive | Minor Ground | 10 |
| Maneuver | rank 2 at Minor grade | 10 |
| Power Supply | Moderate Coil rank 1 | 10 |
| Resource | Charge, Moderate ×2 | 16 |
| Link | Minor Weapon ×2 | 10 |
| Modifier | Detection +1 | 10 |
| Tag | [Security] 2 | 10 |
| Tag | [Climbs Like A Monkey] | 5 |
| Tag | [Death From Above] | 5 |
| Tag | [Kinetic Feedback Control Rig] (Free) | 10 |
| Limitation | Moderate: Partial Armor | −20 |
| Limitation | Minor: Usage Restriction (bulky form increases ground movement difficulty) | −10 |
| **Total** | | **296** |

**Formula CR:** 4 ✔ matches printed

**Power:** 3 Minor (Ground Drive; 0 used) + 3 Moderate (Coil; 1 used). OK.

- [Kinetic Feedback Control Rig]: switch from Drive to Athletics.

#### Resistance Variable Laser Array

p. 271 · **Size:** Small · **Printed CR:** 1 · **CC:** 1

Description: "Artemis III’s Resistance forces includes some of the Colony’s brilliant engineers working with, or themselves becoming, Altered. The Variable Laser Array is the product of that ingenuity and intel, a makeshift but effective counter against Shohan Force Fields. Altered engineers realized that Force Fields have “eddies” in their effectiveness, and the Array was designed to analyze and exploit these weaknesses. As an added bonus, the weapon automatically calibrates its focus to maximize its effect against armor. The current version is too heavy for infantry—the Resistance instead deploys it as a standalone squad weapon or mounts it to vehicles and powered armor."

> **Errata** (new, 2026-09-25) p216: Moderate Power Supplies are allowed on Small items, so this is now legal.

| Row | Detail | BP |
|---|---|---:|
| Attack | Energy (Battlefield) 4x | 50 |
| Counter | Shields | 20 |
| Counter | Armor | 20 |
| Power Supply | Moderate Coil rank 1 | 10 |
| Resource | Charge, Moderate ×1 | 8 |
| Modifier | Heavy Weapons +1 | 10 |
| Limitation | Moderate: Prerequisite (Hard Detection check to lock on; visual contact; Force Field targets may break the lock with a sustained Meditate check) | −20 |
| **Total** | | **98** |

**Formula CR:** 1 ✔ matches printed

**Power:** 3 Moderate; 1 used.

- Alternate form SUIT-MOUNTED VLA: drop the Power Supply and Charge, draw 1 Moderate slot from the host, add Limitation: Slave (unit with a Weapon Link).


### Consumables priced per 10 (not costed with the formula)

Ammunition and missiles are sold in lots of 10 at the printed CR. The Workbench has no
per-unit pricing rule, so store them as consumables with their printed price and the
attributes they add.

| Item | Page | Size | CR (per 10) | CC | Effect on the weapon or missile |
|---|---|---|---:|---:|---|
| Armor-Piercing Rounds | 232 | Tiny | 1 | 0 | Adds Counter: Armor |
| Poisoned/Incendiary Rounds | 232 | Tiny | 1 | 0 | Adds Bleed: Minor 3 |
| Subdual Rounds | 232 | Tiny | 1 | 0 | Adds Limitation: Usage Restriction (Subdual damage only) |
| Hammerhead/KISS, Standard | 265 | — | 2 | 3 | Kinetic Ranged (Space) 5x |
| Hammerhead/KISS, Advanced | 265 | — | 4 | 10 | Kinetic Ranged (Space) 7x |
| Razorback (AP KISS), Standard | 265 | — | 3 | 6 | Kinetic Ranged (Space) 5x, Counter: Armor |
| Razorback (AP KISS), Advanced | 265 | — | 6 | 21 | Kinetic Ranged (Space) 7x, Counter: Armor |
| Plasma Heads (Hot Shots) | 265 | — | 5 | 15 | Plasma Ranged (Space) 7x, Bleed Major 3, Counters: Armor, Force Fields (Shields); Limitation: Restricted Technology (Property of the TSN) |
| Dazzler | 265 | — | 2 | 3 | Tasks: Blind 20, Disrupt 19 (raises a missile's margin of success) |
| Thumper | 265 | — | 2 | 3 | +1 Evasion, Sustained Action (gravitic pulses that divert missile, kinetic, and plasma fire) |
| Stealth Types (Havenite) | 265 | — | +1 | +1 | Adds the Shrouded feature; Limitation: Prerequisite (access to Havenite technology) |

Notes:

- The Stormguard, Plasma Carbine, and Light Plasma Cannon use special ammunition, which
  the errata sets at **CR 1** each (was 3x/5x/5x).
- The quick reference (p. 225) lists the AP Kinetic Strike Missile as "3/10 CC 6" and the
  Advanced as "6/10 CC 21". Those match the entries above.
- No size is printed for missiles. A missile is a Kinetic/Plasma Attack item, so if the app
  builds missiles, they'd be Small or Medium; that choice changes their formula CR.
- Plasma Heads list "Counters: Armor, Force Fields". Plasma already gets Counter (Shields)
  free, so only Counter: Armor costs BP.

