import json,re,collections
Q=json.load(open('/tmp/qs.json'))
def sig(t):
    t=re.sub(r'#\d+','#N',t); t=re.sub(r'\$?\d[\d,]*(\.\d+)?','N',t)
    t=re.sub(r'\b(rent|utilities|advertising|repairs|delivery|insurance)\b','EXP',t,flags=re.I)
    t=re.sub(r'\b(a supplier|a creditor)\b','PAYEE',t)
    return t.strip()
def concept(q):
    t=q['q']; s=sig(t)
    if q['case']: return 'CASE:'+q['id'], s   # each case item is distinct
    calc=re.search(r'adjusted bank balance|reconciled bank balance',t,re.I)
    calcb=re.search(r'adjusted book balance|adjusted (cash )?balance per (the )?books|correct(ed)? (cash |book )?balance',t,re.I)
    bankerr=re.search(r'bank (paid and )?recorded (it|our|the company)|recorded by the bank as|belongs to another company|another company\'s (check|deposit)|written by another company|twice by mistake|bank (erroneously|wrongly|mistakenly)',t,re.I)
    bookerr=re.search(r'recorded (in the (company\'s )?books )?as \$|recorded in the books as',t,re.I) and not bankerr
    if (calc or calcb) and re.search(r'\d',t):
        return ('CALC-BANK' if calc else 'CALC-BOOK'), s
    if bankerr: return 'BANKERR',s
    if re.search(r'inventory',t,re.I) and re.search(r'(over|under)stat',t,re.I) and not re.search(r'transit|consign|^Beginning inventory is overstated',t,re.I): return 'INV-ERR',s
    if bookerr:
        if re.search(r'entry',t,re.I): return 'BOOKERR-ENTRY',s
        return 'BOOKERR-TREAT',s
    return s,s
pri=lambda i:(2 if re.fullmatch(r'err-b(\d+)',i) and int(i[5:])>20 else (1 if i.startswith('err-b') else 0))
G=collections.defaultdict(list)
for q in Q:
    c,s=concept(q); G[c].append((pri(q['id']),s,q['id']))
hide=[]; report=[]
seen={}
for q in Q:
    if q['case']: continue
    k=re.sub(r'\s+',' ',q['q'].strip().lower())
    if k in seen: hide.append(q['id']); print('exact dup',q['id'],'=',seen[k])
    else: seen[k]=q['id']
G={c:[m for m in mem if m[2] not in hide] for c,mem in G.items()}
for c,mem in G.items():
    if len(mem)<=6: continue
    # round-robin across sub-signatures, preferring hand-written sources
    subs=collections.OrderedDict()
    for p,s,i in sorted(mem,key=lambda x:x[0]): subs.setdefault(s,[]).append((p,i))
    order=[]; lists=sorted(subs.values(),key=lambda l:l[0][0])
    while any(lists):
        for l in lists:
            if l: order.append(l.pop(0)[1])
    if c=='INV-ERR': order=['err-1','94','77','err-3','154','err-6']+[i for i in order if i not in ('err-1','94','77','err-3','154','err-6')]
    keep=order[:6]; hide+=order[6:]; report.append((c[:70],len(mem),keep))
for r in report: print(r)
print('hide',len(hide),'of',len(Q))
json.dump(hide,open('/tmp/gen/hide.json','w'))
