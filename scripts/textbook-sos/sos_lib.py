import json
def f(n):
    if isinstance(n,str): return n
    if isinstance(n,float) and n!=int(n): return '{:,.2f}'.format(n)
    return '{:,}'.format(int(n))
def JE(*rows):
    """rows: (date, account, debit, credit); use '' for blank. Credit lines are indented."""
    out=['| Date | Account | Debit | Credit |','|---|---|---|---|']
    for d,a,dr,cr in rows:
        acct=(' '+a) if cr not in ('',None) and dr in ('',None) else a
        out.append('| %s | %s | %s | %s |'%(d,acct,f(dr) if dr not in ('',None) else '',f(cr) if cr not in ('',None) else ''))
    return '\n'.join(out)
def T(head,*rows):
    out=['| '+' | '.join(head)+' |','|'+'---|'*len(head)]
    for r in rows: out.append('| '+' | '.join(f(x) if isinstance(x,(int,float)) else str(x) for x in r)+' |')
    return '\n'.join(out)
ITEMS=[]
def add(id,title,prompt,solution):
    assert id not in {i['id'] for i in ITEMS},id
    ITEMS.append(dict(id=id,title=title,prompt=prompt.strip(),solution=solution.strip()))
def check(a,b,msg=''):
    assert abs(a-b)<0.005,(msg,a,b)

CHK={}
def chk(id,*pairs):
    """Key numeric answers a learner can type in to be checked: (label, value)."""
    out=[]
    for p in pairs:
        l,v=p[0],p[1]; assert isinstance(v,(int,float)),(id,l)
        out.append([l,round(float(v),2)]+([p[2]] if len(p)>2 else []))
    CHK.setdefault(id,[]).extend(out)
def attach_checks():
    ids={i['id'] for i in ITEMS}
    for k in CHK: assert k in ids,('check for unknown id',k)
    for i in ITEMS:
        if i['id'] in CHK:
            i['checks']=CHK[i['id']]
            for c in i['checks']:   # every key answer must be visible in the worked solution
                v=c[1]; forms={f(v),'{:,.2f}'.format(v),'{:,.1f}'.format(v),'{:,.2f}'.format(v).rstrip('0').rstrip('.')}
                assert any(x in i['solution'] for x in forms),('check value not in solution',i['id'],c)
