import re, items
GI={'Minor':0,'Moderate':1,'Major':2}; SCG={'Firefight':0,'Battlefield':1,'Space':2}
GN=['Minor','Moderate','Major']
def audit(it):
    av=[0,0,0]; use=[0,0,0]; notes=[]; links=[]
    for lab,d,bp in it['rows']:
        w=d.split()
        if lab=='Power Supply':
            r=int(re.search(r'rank (\d+)',d).group(1)) if 'rank' in d else 1
            av[GI[w[0]]]+=3*r
        elif lab=='Drive' and w and w[0] in GI: av[GI[w[0]]]+=3
        elif lab.startswith('Attack'):
            m=re.search(r'\((Firefight|Battlefield|Space)\)',d); g=SCG[m.group(1)]
            n=int(re.search(r'×(\d+) mounts',d).group(1)) if 'mounts' in d else 1
            impl=d.split(' (')[0]
            if 'self-powered' in d: notes.append(f'self-powered ({lab}): no power counted')
            elif 'Plasma' in impl: use[g]+=2*n
            elif 'Kinetic' in impl and 'Melee' not in impl and SCG[m.group(1)]>0: use[g]+=n; notes.append(f'rail {m.group(1)} ({lab}) counted as powered')
            elif impl=='Melee': notes.append(f'kinetic melee ({lab}): no power counted')
            else: use[g]+=n
        elif lab=='Anti-Missile':
            g=SCG[w[0]]; n=int(re.search(r'×(\d+)',d).group(1)) if '×' in d else 1; use[g]+=n
        elif lab=='Launcher':
            g=SCG[w[0]]; n=int(re.search(r'(\d+) increment',d).group(1)); use[g]+=n
        elif lab=='Force Field': use[GI[w[0]]]+=1
        elif lab=='Manufacture':
            n=int(re.search(r'×(\d+)',d).group(1)) if '×' in d else 1; use[GI[w[0]]]+=n
        elif lab=='Gravity Control': use[GI[w[0]]]+=1
        elif lab=='Link' and 'Weapon' in d:
            n=int(re.search(r'×(\d+)',d).group(1)) if '×' in d else 1; links.append((w[0],n))
    # cascade check
    short=[]
    for g in (2,1,0):
        a=sum(av[g:]); u=sum(use[g:])
        if u>a: short.append((GN[g],u-a))
    spare=[av[g]-use[g] for g in range(3)]
    return av,use,short,links,notes
host=lambda it:(it['power'] or '').startswith('Draws')
for it in items.I:
    if not it['compute'] if 'compute' in it else False: continue
    av,use,short,links,notes=audit(it)
    if host(it): continue
    if sum(use)==0 and not links: continue
    tot_spare=sum(av)-sum(use)
    flag=[]
    if short: flag.append('SHORT '+', '.join(f'{g} by {n}' for g,n in short))
    if links:
        need=sum(n for _,n in links)
        # spare slots at grade >= link grade? link grade Minor hosts <=Medium (Battlefield?)
        flag.append(f'links {links}, spare {dict(zip(GN,[av[g]-use[g] for g in range(3)]))}')
    if short or links:
        print(f"{it['name']} [{it['size']}] avail {dict(zip(GN,av))} use {dict(zip(GN,use))} :: {' | '.join(flag)}")
        for n in notes: print('     ',n)
