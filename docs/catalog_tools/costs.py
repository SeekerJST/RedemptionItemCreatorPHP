import math
SIZES={'Tiny':(25,10,0,1,None,None),'Small':(50,25,0,5,5,5),'Medium':(100,50,1,10,5,5),
       'Large':(300,100,3,50,20,10),'Huge':(600,200,6,200,50,20),'Colossal':(1200,400,9,500,50,20)}
G={'Minor':0,'Moderate':1,'Major':2}
SC={'Firefight':0,'Battlefield':1,'Space':2}
def cA(base,n): return base+5*n*(n+1)
def cB(base,n): return base+5*n*(n-1)//2
def armor(scale,rank,shroud=False):
    base=120 if shroud else [20,50,80][SC[scale]]
    return (f"Armor Rating{' (Shrouded Hull)' if shroud else ''}", f"{scale}, rank {rank}", cA(base,rank-1))
def atk_cost(scale,m,impl):
    base=[10,20,40][SC[scale]]; up=5*(m-2)*(m-1)
    if 'Anti-Missile' in impl: return base//2, base//2
    mel='Melee' in impl; kin='Kinetic' in impl
    if mel and kin: return base//2+math.ceil(up*0.45), base//2
    if mel: return (base+up)//2, base//2
    if kin: return base+math.ceil(up*0.9), base
    return base+up, base
def attack(scale,m,impl,mounts=1,label=None):
    c,b=atk_cost(scale,m,impl)
    tot=c+b*(mounts-1)
    d=f"{'/'.join(impl) or 'Energy'} ({scale}) {m}x"+(f" ×{mounts} mounts (+{b} each extra)" if mounts>1 else "")
    return (label or "Attack", d, tot)
def am(scale,n=1):
    b=[10,20,40][SC[scale]]//2
    return ("Anti-Missile", f"{scale} 1x"+(f" ×{n}" if n>1 else ""), b*n)
def area(): return ("Area","",20)
def counter(k,free=False): return ("Counter",k+(" (free)" if free else ""),0 if free else 20)
def bleed(mag,d,free=False): return ("Bleed",f"{mag} {d}"+(" (free, Plasma)" if free else ""),0 if free else cB([5,10,20][G[mag]],d))
def body(size,total):
    d=SIZES[size][3]
    if total<=d: return ("Body Track",f"{total} (default)",0)
    inc,cost=SIZES[size][4],SIZES[size][5]
    n=(total-d)/inc
    flag='' if n==int(n) else f" ⚠ not a whole increment ({n:g}); rounded up"
    n=math.ceil(n)
    return ("Body Track",f"{total} (default {d} + {n}×{inc}){flag}",n*cost)
def ff(grade,n): return ("Force Field",f"{grade} ×{n} (track {n*[10,20,50][G[grade]]})",n*[15,20,25][G[grade]])
def regen(grade,pts,impl): return ("Regeneration",f"{impl} {pts}, {grade} grade",cB([5,10,15][G[grade]],pts))
def cargo(grade,n=1): return ("Cargo",f"{grade} ×{n}",n*[5,15,30][G[grade]])
def radio(grade): return ("Communication",f"{grade} Radio",[3,13][G[grade]])
def laser(grade): return ("Communication",f"{grade} Laser Link",[3,13][G[grade]])
def ansible(): return ("Communication","Major Ansible",30)
def hypercomm(): return ("Communication","Major Hypercomms",25)
def computer(grade,rank,kind='Standard'):
    per={'Standard':[3,5,20],'Brain':[5,10,40],'Quantum':[20,40,80]}[kind][G[grade]]
    return ("Computer",f"{grade} {kind if kind!='Standard' else ''} rank {rank} (TN {12+2*rank})".replace('  ',' '),per*rank)
def tasks(lst,brain=False):
    tot=sum(2*t for _,t in lst); 
    if brain: tot//=2
    return ("Tasks",", ".join(f"{n} {t}" for n,t in lst)+(" (Brain: half)" if brain else ""),tot)
def drive(grade,impl): return ("Drive",f"{grade} {impl}",15 if impl=='Light Sail' else [10,25,50][G[grade]])
def maneuver(grade,r): return ("Maneuver",f"rank {r} at {grade} grade",r*[5,10,20][G[grade]])
def launchers(scale,n):
    inc=-(-n//4); per=[5,10,15][SC[scale]]
    d=f"{scale} ×{n}"+("" if n%4==0 else f" (book count; builder buys increments of 4 → {inc*4})")+f", {inc} increment{'s' if inc>1 else ''}"
    return ("Launcher",d,inc*4*per)
def ls(grade,n=1): return ("Life Support",f"{grade} ×{n}",n*[5,20,40][G[grade]])
def eco(grade): return ("Life Support",f"Artificial Ecology, {grade}",[15,30,60][G[grade]])
def link(grade,kind,n=1): return ("Link",f"{grade} {kind}"+(f" ×{n}" if n>1 else ""),n*[5,15,50][G[grade]])
def manuf(grade,n=1): return ("Manufacture",f"{grade}"+(f" ×{n}" if n>1 else ""),n*[25,50,100][G[grade]])
def mod(skill,r,n=1): return ("Modifier",f"{skill} +{r}"+(f" (counted ×{n} skills)" if n>1 else ""),10*r*n)
def ni(grade): return ("Neural Interface",grade,[3,5,10][G[grade]])
def ps(grade,impl,r=1): return ("Power Supply",f"{grade} {impl} rank {r}",r*[5,10,40][G[grade]])
def res(grade,kind,r):
    per=[5,10,15][G[grade]]
    if kind=='Charge': per=[4,8,12][G[grade]]
    if kind=='Tangle': per=10
    return ("Resource",f"{kind}, {grade} ×{r}",per*r)
def grav(grade): return ("Gravity Control",grade,[10,20,40][G[grade]])
def hangar(grade,n=1): return ("Hangar",f"{grade}"+(f" ×{n}" if n>1 else ""),n*[15,30,60][G[grade]])
def tag(name,r=1,free=False): return ("Tag",f"[{name}]"+(f" {r}" if r>1 else "")+(" (Free)" if free else ""),r*(10 if free else 5))
def lim(grade,name): return ("Limitation",f"{grade}: {name}",-[10,20,50][G[grade]])
def other(n,d,bp=0): return (n,d,bp)
def cr_of(size,bp):
    b,inc,base=SIZES[size][:3]; d=bp-b
    cr=base+ (d//inc if d>0 else -((-d)//inc))
    return max(cr,-2)
def cc_of(cr): return 0 if cr<=0 else cr*(cr+1)//2
def bleed_plasma(mag,free_d,total_d):
    base=[5,10,20][G[mag]]
    return ("Bleed",f"{mag} {total_d} (Plasma: {free_d} free + {total_d-free_d} bought)",cB(base,total_d)-cB(base,free_d))
