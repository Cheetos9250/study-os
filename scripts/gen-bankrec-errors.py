import random, json
R=random.Random(20261115)
def money(n): return '${:,}'.format(n)
def num(n): return '{:,}'.format(n)
def transpose(n):
    s=str(n)
    for _ in range(50):
        i=R.randrange(len(s)-1)
        if s[i]!=s[i+1] and not (i==0 and s[i+1]=='0'):
            t=s[:i]+s[i+1]+s[i]+s[i+2:]; return int(t)
    return n+90
def amt(lo,hi):
    while True:
        n=R.randrange(lo,hi)
        if len(set(str(n)))>=3 and str(n)[-1]!='0': return n
Q=[]
def treat(side,add,d):  # returns options with correct first
    opts=[(side,add),(side,not add),('bank' if side=='book' else 'book',add),('bank' if side=='book' else 'book',not add)]
    f=lambda o:('Add ' if o[1] else 'Deduct ')+money(d)+(' to' if o[1] else ' from')+' the '+o[0]+' balance'
    return [f(o) for o in opts]
EXP=['Rent Expense','Utilities Expense','Advertising Expense','Repairs Expense','Delivery Expense','Insurance Expense']
SUP=['a supplier','a creditor']
# book-error scenarios
def book_case():
    kind=R.choice(['ar','sales','exp','ap','ap','ar','exp'])
    actual=amt(120,4900); rec=transpose(actual)
    if R.random()<0.15: rec=actual*10 if R.random()<.5 else actual//10*1  # slide
    if rec==actual: rec=transpose(actual+11)
    d=abs(actual-rec)
    if kind=='ar':
        what=f'A {money(actual)} collection from a customer on account was recorded in the books as {money(rec)}.'
        add=rec<actual; acct='Accounts Receivable'
        ent=(f'Dr Cash {num(d)}, Cr {acct} {num(d)}',f'Dr {acct} {num(d)}, Cr Cash {num(d)}')
    elif kind=='sales':
        what=f'A {money(actual)} deposit of cash sales was recorded in the books as {money(rec)}.'
        add=rec<actual; acct='Sales Revenue'
        ent=(f'Dr Cash {num(d)}, Cr {acct} {num(d)}',f'Dr {acct} {num(d)}, Cr Cash {num(d)}')
    elif kind=='exp':
        acct=R.choice(EXP)
        what=f'Check for {acct.replace(" Expense","").lower()} of {money(actual)} was recorded in the books as {money(rec)}.'
        what=what[0].upper()+what[1:]
        what='A c'+what[1:]
        add=rec>actual
        ent=(f'Dr Cash {num(d)}, Cr {acct} {num(d)}',f'Dr {acct} {num(d)}, Cr Cash {num(d)}')
    else:
        acct='Accounts Payable'
        what=f'A {money(actual)} check paid to {R.choice(SUP)} on account was recorded in the books as {money(rec)}.'
        add=rec>actual
        ent=(f'Dr Cash {num(d)}, Cr {acct} {num(d)}',f'Dr {acct} {num(d)}, Cr Cash {num(d)}')
    good,bad=(ent[0],ent[1]) if add else (ent[1],ent[0])
    why=f"The books show {money(d)} too {'little' if add else 'much'} cash ({num(max(actual,rec))} − {num(min(actual,rec))})."
    if R.random()<0.5:
        Q.append(['c8',what+' Bank reconciliation treatment?',treat('book',add,d),0,why+' Correct it on the book side with a journal entry.'])
    else:
        wrongamt=num(max(actual,rec))
        o=[good,bad,good.replace(num(d),wrongamt) if wrongamt!=num(d) else 'No entry — it is a bank error','No entry — it is a bank error']
        if o[2]==o[3]: o[2]=bad.replace(num(d),wrongamt)
        Q.append(['c8',what+' Correcting entry?',o,0,why+f" Entry: {good}."])
def bank_case():
    kind=R.choice(['dep','chk','other_dep','other_chk','dup'])
    if kind in('dep','chk'):
        actual=amt(150,6000); rec=transpose(actual); d=abs(actual-rec)
        if kind=='dep':
            what=f"The company's {money(actual)} deposit was recorded by the bank as {money(rec)}."
            add=rec<actual; why=f"The bank shows {money(d)} too {'little' if add else 'much'}. The company's books are correct, so no journal entry."
        else:
            n=R.randrange(101,999)
            what=f"The company correctly wrote check #{n} for {money(actual)}, but the bank paid and recorded it as {money(rec)}."
            add=rec>actual; why=f"The bank deducted {money(d)} too {'much' if add else 'little'}, so its balance is too {'low' if add else 'high'}. No journal entry."
    elif kind=='other_dep':
        d=amt(100,3000); add=False
        what=f"The bank credited the company's account with a {money(d)} deposit that belongs to another company."
        why="The bank balance is overstated. Correct it on the bank side and notify the bank; no journal entry."
    elif kind=='other_chk':
        d=amt(100,3000); add=True
        what=f"The bank charged the company's account {money(d)} for a check written by another company."
        why="The bank balance is understated. Add it back on the bank side; no journal entry."
    else:
        d=R.choice([15,20,25,30,35,40,45,50,60]); add=True
        what=f"The bank deducted the same {money(d)} service charge twice by mistake."
        why="One charge is real (book side). The duplicate is a bank error: add it back to the bank balance."
    Q.append(['c8',what+' Bank reconciliation treatment?',treat('bank',add,d),0,why])
def calc_bank():
    b=R.randrange(40,250)*100+R.choice([0,50]); dit=amt(300,3000); oc=amt(300,3000)
    e=amt(100,900); kind=R.choice(['other_dep','other_chk','dep_hi','chk_lo'])
    if kind=='other_dep': txt=f'the bank credited us with another company\'s {money(e)} deposit'; sgn=-1
    elif kind=='other_chk': txt=f'the bank charged us {money(e)} for another company\'s check'; sgn=1
    elif kind=='dep_hi':
        a=amt(500,3000); r=a+e; txt=f'the bank recorded our {money(a)} deposit as {money(r)}'; sgn=-1
    else:
        a=amt(500,3000); r=a-e if a-e>0 else a+e; 
        if r>a: txt=f'the bank recorded our {money(a)} check as {money(r)}'; sgn=1
        else: txt=f'the bank recorded our {money(a)} check as {money(r)}'; sgn=-1
    ans=b+dit-oc+sgn*e
    o=[ans,b+dit-oc-sgn*e,b+dit-oc,b-dit+oc+sgn*e]
    if len(set(o))<4: o[3]=ans+2*e+dit
    Q.append(['c8',f'Bank balance {money(b)}; deposits in transit {money(dit)}; outstanding checks {money(oc)}; {txt}. Adjusted bank balance?',[money(x) for x in o],0,f"{num(b)} + {num(dit)} − {num(oc)} {'+' if sgn>0 else '−'} {num(e)} = {num(ans)}."])
def calc_book():
    b=R.randrange(30,200)*100+R.choice([0,25,75]); items=[]; total=b; parts=[num(b)]
    nsf=amt(100,900); sc=R.choice([15,20,25,30,35,40]); col=R.choice([0,amt(500,2500)])
    actual=amt(120,2000); rec=transpose(actual); d=abs(actual-rec)
    kind=R.choice(['exp','ar'])
    if kind=='exp':
        txt=f'a {money(actual)} check for supplies was recorded as {money(rec)}'; sgn=1 if rec>actual else -1
    else:
        txt=f'a {money(actual)} collection on account was recorded as {money(rec)}'; sgn=1 if rec<actual else -1
    desc=f'Book balance {money(b)}; NSF check {money(nsf)}; service charge {money(sc)}; '+(f'note collected by the bank {money(col)}; ' if col else '')+txt+'.'
    ans=b-nsf-sc+col+sgn*d
    o=[ans,b-nsf-sc+col-sgn*d,b-nsf-sc+col,b+nsf+sc+col+sgn*d]
    if len(set(o))<4: o[3]=ans-nsf
    expl=f"{num(b)} − {num(nsf)} − {num(sc)}"+(f" + {num(col)}" if col else '')+f" {'+' if sgn>0 else '−'} {num(d)} = {num(ans)}."
    Q.append(['c8',desc+' Adjusted book balance?',[money(x) for x in o],0,expl])
plan=['book']*36+['bank']*24+['cb']*10+['ck']*10
R.shuffle(plan)
seen0=set()
for p in plan:
    while True:
        {'book':book_case,'bank':bank_case,'cb':calc_bank,'ck':calc_book}[p]()
        k=Q[-1][1]
        if k in seen0 or len(set(Q[-1][2]))<4: Q.pop(); continue
        seen0.add(k); break
# checks
seen=set()
for q in Q:
    assert len(set(q[2]))==4,q
    assert q[1] not in seen,q[1]; seen.add(q[1])
print(len(Q))
open('/tmp/gen/q.json','w').write(json.dumps(Q,ensure_ascii=False))
