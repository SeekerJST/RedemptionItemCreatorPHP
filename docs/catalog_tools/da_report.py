import da
def body():
    out=[]
    order=['TSA','Resistance','Haven & Auxiliaries','Covert','Experimental','Shohan']
    for o in order:
        rows=[b for b in da.B if b[1].endswith(o)]
        ok=sum(1 for b in rows if b[7]=='OK'); tot=sum(1 for b in rows if isinstance(b[6],int))
        out+= [f"## {o} ({ok} of {tot} match)","","| Item | Page | Size | BP | Formula CR | Target CR (one item) | Gap |","|---|---:|---|---:|---:|---:|---|"]
        for name,cat,page,size,bp,c,pr,gap,note,r in rows:
            out.append(f"| {name} | {page} | {size} | {bp} | {c} | {pr if pr is not None else '—'} | {gap or '—'} |")
        out.append("")
        for name,cat,page,size,bp,c,pr,gap,note,r in rows:
            out.append(f"### {name} (p{page}, {size}): {bp} BP, CR {c}"+(f"; target {pr}" if pr is not None else ""))
            if note: out.append(f"*{note}*")
            out.append("")
            for x in r: out.append(f"- {x[0]}: {x[1]} — {x[2]}")
            out.append("")
    return out
p='/mnt/user-data/outputs/decisive_action_reconciliation.md'
s=open(p,encoding='utf-8').read()
head=s[:s.index("## TSA")]
open(p,'w',encoding='utf-8').write(head+"\n".join(body())+"\n")
