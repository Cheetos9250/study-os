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
