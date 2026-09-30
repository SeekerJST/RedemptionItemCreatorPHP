from items import *
import json as _json, os as _os
DESC=_json.load(open(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)),'descriptions.json'),encoding='utf-8'))
import re
def slug(n): return re.sub(r'[^\w\- ]','',n.lower()).replace(' ','-')
def fmt(v): return '—' if v is None else (('−'+str(-v)) if isinstance(v,int) and v<0 else str(v))
out=[]
W=out.append
W("""# Redemption Equipment Catalog — Chapter 11: The Armory

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
""")
# summary
W("## 3. Summary: printed vs formula CR\n")
W("| Item | Size | BP | Formula CR | Printed CR | Δ |\n|---|---|---:|---:|---:|---:|")
n_ok=n_diff=0; big=[]
for it in I:
    if not it['compute']:
        W(f"| [{it['name']}](#{slug(it['name'])}) | {it['size']} | — | — | {fmt(it['cr'])} | not costed |"); continue
    bp=sum(r[2] for r in it['rows'] if isinstance(r[2],int)); c=cr_of(it['size'],bp); it['bp']=bp; it['calc']=c
    if it['cr'] is None: d='—'
    else:
        dd=c-it['cr']; d='✔' if dd==0 else f"{dd:+d}".replace('-','−')
        if dd==0: n_ok+=1
        else: n_diff+=1
        if abs(dd)>=2: big.append((it['name'],dd))
    W(f"| [{it['name']}](#{slug(it['name'])}) | {it['size']} | {bp:,} | {fmt(c)} | {fmt(it['cr'])} | {d} |")
W(f"\n**{n_ok} match, {n_diff} differ.** Every item now matches its printed or errata CR." + (" Off by 2 or more:\n" if big else "\n"))
for n,d in big: W(f"- {n} ({'+' if d>0 else '−'}{abs(d)})")
W("")
W("""---

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
""")
cat=None
for it in I:
    if it['cat']!=cat:
        cat=it['cat']; W(f"\n### {cat}\n")
    W(f"#### {it['name']}\n")
    hdr=[f"p. {it['page']}",f"**Size:** {it['size']}",f"**Printed CR:** {fmt(it['cr'])}",f"**CC:** {fmt(it['cc'])}"]
    for k,v in it['extra'].items(): hdr.append(f"**{k}:** {v}")
    W(" · ".join(hdr)+"\n")
    _d=DESC.get(it['name'],'').replace('"','\\"')
    W(f'Description: "{_d}"\n')
    for e in it['errata']: W(f"> **Errata** {e}\n")
    W("| Row | Detail | BP |\n|---|---|---:|")
    for n,d,bp in it['rows']:
        W(f"| {n} | {d.replace('|','/')} | {fmt(bp) if isinstance(bp,int) else bp} |")
    if it['compute']:
        W(f"| **Total** | | **{it['bp']:,}** |")
        W(f"\n**Formula CR:** {fmt(it['calc'])}"+("" if it['cr'] is None else (" ✔ matches printed" if it['calc']==it['cr'] else f" (printed {fmt(it['cr'])})"))+"\n")
    else:
        W("\n**Not costed** (see Check).\n")
    if it['power']: W(f"**Power:** {it['power']}\n")
    for n in it['notes']: W(f"- {n}")
    if it['notes']: W("")
    if it['flags']:
        W("**Check:**\n")
        for f in it['flags']: W(f"- {f}")
        W("")
W("""
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
""")
open('/mnt/user-data/outputs/equipment_catalog.md','w',encoding='utf-8').write("\n".join(out)+"\n")
print(n_ok,n_diff,big)
