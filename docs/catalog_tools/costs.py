import math

# ---- structured rows -------------------------------------------------------------------------
# Every helper returns a Row: the (label, detail, BP) triple gen.py prints, plus `spec`, the same
# row in the app's terms for gen_catalog_json.py. A spec is one of:
#   {'attr': name, 'grade': 1-3|None, 'rank': n, 'impl': key|None, 'sub': bool, 'children': [...],
#    'skill': text, 'task': text}   an attribute row; `sub` = may nest under the row above it
#   {'tag': text, 'rank': n, 'free': bool}  /  {'limit': text, 'grade': 1-3}  /  {'skip': reason}
# `name` is the app's attribute name (the `attribute` table); `impl` is the app's rule key.
class Row(tuple):
    def __new__(cls, label, detail, bp, spec=None):
        row = super().__new__(cls, (label, detail, bp))
        row.spec = spec
        return row

def A(name, grade=None, rank=1, impl=None, sub=False, children=None, **extra):
    spec = {'attr': name, 'grade': grade, 'rank': rank, 'impl': impl, 'sub': sub, 'children': children or []}
    spec.update(extra)
    return spec

GN = {'Minor': 1, 'Moderate': 2, 'Major': 3}
SN = {'Firefight': 1, 'Battlefield': 2, 'Space': 3}
SIZES={'Tiny':(25,10,0,1,None,None),'Small':(50,25,0,5,5,5),'Medium':(100,50,1,10,5,5),
       'Large':(300,100,3,50,20,10),'Huge':(600,200,6,200,50,20),'Colossal':(1200,400,9,500,50,20)}
G={'Minor':0,'Moderate':1,'Major':2}
SC={'Firefight':0,'Battlefield':1,'Space':2}
def cA(base,n): return base+5*n*(n+1)
def cB(base,n): return base+5*n*(n-1)//2
def armor(scale,rank,shroud=False):
    base=120 if shroud else [20,50,80][SC[scale]]
    kids = [A('Shrouded Hull', None, 1, sub=True)] if shroud else []
    return Row(f"Armor Rating{' (Shrouded Hull)' if shroud else ''}", f"{scale}, rank {rank}", cA(base,rank-1),
               A('Armor Rating', SN[scale], rank, children=kids))
def atk_cost(scale,m,impl):
    base=[10,20,40][SC[scale]]; up=5*(m-2)*(m-1)
    if 'Anti-Missile' in impl: return base//2, base//2
    mel='Melee' in impl; kin=any(w.startswith('Kinetic') for w in impl)  # Kinetic or Kinetic (self-powered)
    if mel and kin: return base//2+math.ceil(up*0.45), base//2
    if mel: return (base+up)//2, base//2
    if kin: return base+math.ceil(up*0.9), base
    return base+up, base
# The catalog's implementation words -> the app's Attack Multiplier rule keys.
MULT_IMPL = {'Energy': 'energy', 'Kinetic': 'kinetic', 'Kinetic (self-powered)': 'kineticSelfPowered',
             'Plasma': 'plasma', 'Plasma (self-powered)': 'plasmaSelfPowered', 'Flare': 'flare',
             'Hyperspace': 'hyperspace', 'Tse': 'tse'}
def attack(scale,m,impl,mounts=1,label=None):
    c,b=atk_cost(scale,m,impl)
    tot=c+b*(mounts-1)
    d=f"{'/'.join(impl) or 'Energy'} ({scale}) {m}x"+(f" ×{mounts} mounts (+{b} each extra)" if mounts>1 else "")
    # In the app: an Attack (2x, rank = mounts) plus an Attack Multiplier sub-row (rank = m - 2)
    # that carries the implementation. A 2x non-Energy attack gets a rank-0 Multiplier (0 BP) for it.
    kind = [w for w in impl if w != 'Melee']
    key = MULT_IMPL[kind[0]] if kind else 'energy'
    kids = [A('Attack Multiplier', SN[scale], m - 2, key, sub=True)] if m > 2 or key != 'energy' else []
    name = 'Attack (Melee)' if 'Melee' in impl else 'Attack'
    return Row(label or "Attack", d, tot, A(name, SN[scale], mounts, children=kids, label=label, multiplier=m))
def am(scale,n=1):
    b=[10,20,40][SC[scale]]//2
    return Row("Anti-Missile", f"{scale} 1x"+(f" ×{n}" if n>1 else ""), b*n, A('Anti-Missile', SN[scale], n))
def area(): return Row("Area","",20, A('Area', None, 1, sub=True))
COUNTER_IMPL = {'Armor': 'armor', 'Shields': 'shields', 'Missiles': 'missiles', 'Detection': 'detection',
                'Disabling': 'disabling', 'Strike': 'strike'}
def counter(k,free=False): return Row("Counter",k+(" (free)" if free else ""),0 if free else 20, A('Counter', None, 1, COUNTER_IMPL.get(k, 'general'), sub=True))
def bleed(mag,d,free=False): return Row("Bleed",f"{mag} {d}"+(" (free, Plasma)" if free else ""),0 if free else cB([5,10,20][G[mag]],d), A('Bleed', GN[mag], d, sub=True))
def body(size,total):
    d=SIZES[size][3]
    if total<=d: return Row("Body Track",f"{total} (default)",0, {'skip': 'default Body'})
    inc,cost=SIZES[size][4],SIZES[size][5]
    n=(total-d)/inc
    flag='' if n==int(n) else f" ⚠ not a whole increment ({n:g}); rounded up"
    n=math.ceil(n)
    return Row("Body Track",f"{total} (default {d} + {n}×{inc}){flag}",n*cost, A('Body', None, n))
def ff(grade,n): return Row("Force Field",f"{grade} ×{n} (track {n*[10,20,50][G[grade]]})",n*[15,20,25][G[grade]], A('Force Field', GN[grade], n))
REGEN_IMPL = {'Biological': 'biological', 'Force Field': 'forceField', 'Mechanical': 'mechanical', 'Strain': 'strain'}
def regen(grade,pts,impl): return Row("Regeneration",f"{impl} {pts}, {grade} grade",cB([5,10,15][G[grade]],pts), A('Regeneration', GN[grade], pts, REGEN_IMPL[impl], sub=True))
def cargo(grade,n=1): return Row("Cargo",f"{grade} ×{n}",n*[5,15,30][G[grade]], A('Cargo', GN[grade], n))
def radio(grade): return Row("Communication",f"{grade} Radio",[3,13][G[grade]], A('Communication (Radio)', GN[grade]))
def laser(grade): return Row("Communication",f"{grade} Laser Link",[3,13][G[grade]], A('Communication (Laser Link)', GN[grade]))
def ansible(): return Row("Communication","Major Ansible",30, A('Communication (Ansible)', 3))
def hypercomm(): return Row("Communication","Major Hypercomms",25, A('Communication (Hypercomms)', 3))
def computer(grade,rank,kind='Standard'):
    per={'Standard':[3,5,20],'Brain':[5,10,40],'Quantum':[20,40,80]}[kind][G[grade]]
    return Row("Computer",f"{grade} {kind if kind!='Standard' else ''} rank {rank} (TN {12+2*rank})".replace('  ',' '),per*rank,
               A('Computer', GN[grade], rank, {'Standard': 'standard', 'Brain': 'brain', 'Quantum': 'quantum'}[kind]))
def tasks(lst,brain=False):
    tot=sum(2*t for _,t in lst); 
    if brain: tot//=2
    return Row("Tasks",", ".join(f"{n} {t}" for n,t in lst)+(" (Brain: half)" if brain else ""),tot,
               {'group': [A('Task', None, t, sub=True, task=n) for n, t in lst]})
DRIVE_IMPL = {'Air': 'air', 'Ground': 'ground', 'Sea': 'sea', 'Sea/Submersible': 'sea', 'Reaction': 'reaction',
              'Reactionless': 'reactionless', 'Gravitic': 'gravitic', 'Light Sail': 'lightSail', 'Jump': 'jump',
              'Land (legs)': 'biological'}
def drive_impl(text):
    # "Gravitic (modified in-system)" is a Gravitic drive with a note.
    return DRIVE_IMPL.get(text) or DRIVE_IMPL[text.split(' (')[0]]
def drive(grade,impl): return Row("Drive",f"{grade} {impl}",15 if impl=='Light Sail' else [10,25,50][G[grade]], A('Drive', GN[grade], 1, drive_impl(impl)))
def maneuver(grade,r): return Row("Maneuver",f"rank {r} at {grade} grade",r*[5,10,20][G[grade]], A('Maneuver', GN[grade], r, sub=True))
def launchers(scale,n):
    inc=-(-n//4); per=[5,10,15][SC[scale]]
    d=f"{scale} ×{n}"+("" if n%4==0 else f" (book count; builder buys increments of 4 → {inc*4})")+f", {inc} increment{'s' if inc>1 else ''}"
    return Row("Launcher",d,inc*4*per, A('Launchers', SN[scale], inc))
def ls(grade,n=1): return Row("Life Support",f"{grade} ×{n}",n*[5,20,40][G[grade]], A('Life Support', GN[grade], n, 'standard'))
def eco(grade): return Row("Life Support",f"Artificial Ecology, {grade}",[15,30,60][G[grade]], A('Life Support', GN[grade], 1, 'artificialEcology'))
LINK_IMPL = {'Data': 'data', 'Psi': 'psi', 'Weapon': 'weapon', 'Refueling': 'refueling'}
def link(grade,kind,n=1): return Row("Link",f"{grade} {kind}"+(f" ×{n}" if n>1 else ""),n*[5,15,50][G[grade]], A('Link', GN[grade], n, LINK_IMPL.get(kind) or LINK_IMPL[kind.split(' (')[0]]))
def manuf(grade,n=1): return Row("Manufacture",f"{grade}"+(f" ×{n}" if n>1 else ""),n*[25,50,100][G[grade]], A('Manufacture', GN[grade], n))
# Modifier grade = how many skills it covers (ruling 2026-09-28): Minor 1, Moderate 2, Major 3+.
def mod(skill,r,n=1): return Row("Modifier",f"{skill} +{r}"+(f" (counted ×{n} skills)" if n>1 else ""),10*r*n, A('Modifier', min(n, 3), r, skill=skill))
def ni(grade): return Row("Neural Interface",grade,[3,5,10][G[grade]], A('Neural Interface', GN[grade]))
PS_IMPL = {'Fusion': 'fusion', 'Antimatter': 'antimatter', 'Coil': 'coil', 'Environmental': 'environmental', 'Hyperspace Tap': 'hyperspaceTap'}
def ps(grade,impl,r=1): return Row("Power Supply",f"{grade} {impl} rank {r}",r*[5,10,40][G[grade]], A('Power Supply', GN[grade], r, PS_IMPL.get(impl) or PS_IMPL[impl.split(' (')[0]]))
def res(grade,kind,r):
    per=[5,10,15][G[grade]]
    if kind=='Charge': per=[4,8,12][G[grade]]
    if kind=='Tangle': per=10
    return Row("Resource",f"{kind}, {grade} ×{r}",per*r, A('Resource', GN[grade], r, kind.lower(), sub=True))
def grav(grade): return Row("Gravity Control",grade,[10,20,40][G[grade]], A('Gravity Control', GN[grade]))
def hangar(grade,n=1): return Row("Hangar",f"{grade}"+(f" ×{n}" if n>1 else ""),n*[15,30,60][G[grade]], A('Hangar', GN[grade], n))
def tag(name,r=1,free=False): return Row("Tag",f"[{name}]"+(f" {r}" if r>1 else "")+(" (Free)" if free else ""),r*(10 if free else 5), {'tag': name, 'rank': r, 'free': free})
def lim(grade,name): return Row("Limitation",f"{grade}: {name}",-[10,20,50][G[grade]], {'limit': name, 'grade': GN[grade]})
# A row no helper covers; `spec` says what it is in the app (or {'skip': why}).
def other(n,d,bp=0,spec=None): return Row(n,d,bp, spec or {'skip': 'not an app row'})
def cr_of(size,bp):
    b,inc,base=SIZES[size][:3]; d=bp-b
    cr=base+ (d//inc if d>0 else -((-d)//inc))
    return max(cr,-2)
def cc_of(cr): return 0 if cr<=0 else cr*(cr+1)//2
def bleed_plasma(mag,free_d,total_d):
    base=[5,10,20][G[mag]]
    return Row("Bleed",f"{mag} {total_d} (Plasma: {free_d} free + {total_d-free_d} bought)",cB(base,total_d)-cB(base,free_d), A('Bleed', GN[mag], total_d, sub=True))
