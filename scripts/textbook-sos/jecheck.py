import json,sys,re
bad=0
for path in sys.argv[1:]:
    for it in json.load(open(path)):
        lines=it['solution'].split('\n')
        i=0
        while i<len(lines):
            if lines[i].startswith('| Date | Account | Debit | Credit |'):
                i+=2; dr=cr=0; groups=[]; cur=None
                while i<len(lines) and lines[i].startswith('|'):
                    c=[x.strip() for x in lines[i].strip('|').split('|')]
                    if c[0]:
                        if cur and abs(cur[0]-cur[1])>0.005: groups.append(cur)
                        cur=[0,0,c[0]]
                    n=lambda s: float(s.replace(',','')) if s else 0
                    dr+=n(c[2]); cr+=n(c[3])
                    if cur: cur[0]+=n(c[2]); cur[1]+=n(c[3])
                    i+=1
                # per-entry check: consecutive same-date debit lines may continue (multi-debit) so only flag table totals
                if abs(dr-cr)>0.005: print('UNBALANCED',it['id'],dr,cr); bad+=1
            else: i+=1
print('bad',bad)
