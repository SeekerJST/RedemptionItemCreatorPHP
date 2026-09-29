import errata_data as d
out=[];sec=None
for x in d.E:
    if x['section']!=sec:
        if sec is not None: pass
        out.append(x['section']); out.append(''); sec=x['section']
    pg=f"P{x['p1']}"+(f"-{x['p2']}" if x['p2'] else '')
    out.append(f"{pg}: {x['text']}")
open('/mnt/user-data/outputs/Redemption Errata.txt','w',encoding='utf-8').write('\n'.join(out))
print(len(d.E))
