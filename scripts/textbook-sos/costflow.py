"""Cost-flow calculators used to build and verify the chapter 6 practice solutions."""
from sos_lib import f, T
from decimal import Decimal, ROUND_HALF_UP
def r2(x): return float(Decimal(repr(x)).quantize(Decimal("0.01"),rounding=ROUND_HALF_UP))

def money(x): return '$'+f(round(x,2))

def periodic(beg, buys, sold):
    """beg=(units,cost); buys=[(label,units,cost)]; returns dict per method with ending, cogs and working text."""
    layers=[('Beginning',)+tuple(beg)]+[tuple(b) for b in buys]
    units=sum(l[1] for l in layers); total=sum(l[1]*l[2] for l in layers); end_u=units-sold
    out={'units':units,'total':total,'end_units':end_u}
    def take(order,n):
        parts=[];left=n
        for lab,u,c in order:
            if left<=0: break
            k=min(u,left); parts.append((lab,k,c)); left-=k
        return parts
    fifo_end=take(list(reversed(layers)),end_u); lifo_end=take(layers,end_u)
    fe=sum(k*c for _,k,c in fifo_end); le=sum(k*c for _,k,c in lifo_end)
    avg=round(total/units,4); we=round(end_u*avg,2)
    desc=lambda parts:' + '.join('%s × %s'%(f(k),money(c)) for _,k,c in parts)
    out['FIFO']=dict(end=fe,cogs=total-fe,work='Ending = newest %s units: %s = %s'%(f(end_u),desc(fifo_end),money(fe)))
    out['LIFO']=dict(end=le,cogs=total-le,work='Ending = oldest %s units: %s = %s'%(f(end_u),desc(lifo_end),money(le)))
    out['WA']=dict(end=we,cogs=round(total-we,2),avg=avg,work='Average cost = %s ÷ %s = %s per unit; ending = %s × %s = %s'%(money(total),f(units),money(round(avg,2)) if abs(avg-round(avg,2))<1e-9 else '$%.4f'%avg,f(end_u),('$%.4f'%avg) if abs(avg-round(avg,2))>1e-9 else money(avg),money(we)))
    out['layers']=layers
    return out

def avail_table(layers):
    rows=[[l[0],f(l[1]),money(l[2]),money(l[1]*l[2])] for l in layers]
    rows.append(['**Total**','**'+f(sum(l[1] for l in layers))+'**','','**'+money(sum(l[1]*l[2] for l in layers))+'**'])
    return T(['Layer','Units','Unit cost','Cost'],*rows)

def perpetual(beg, events, method):
    """events: list of ('buy',date,units,cost) or ('sell',date,units). Returns cogs, ending, rows (text)."""
    stock=[['Beginning',beg[0],beg[1]]]; cogs=0; rows=[]
    if method=='AVG':
        u=beg[0]; tot=beg[0]*beg[1]; avg=beg[1]
        for e in events:
            if e[0]=='buy':
                u+=e[2]; tot=r2(tot+e[2]*e[3]); avg=r2(tot/u)
                rows.append([e[1],'Buy %s @ %s'%(f(e[2]),money(e[3])),'',f(u)+' units, '+money(tot)+' (avg '+money(avg)+')'])
            else:
                c=r2(e[2]*avg); cogs=r2(cogs+c); u-=e[2]; tot=r2(tot-c)
                rows.append([e[1],'Sell %s'%f(e[2]),'%s × %s = %s'%(f(e[2]),money(avg),money(c)),f(u)+' units, '+money(tot)])
        return dict(cogs=cogs,end=tot,rows=rows)
    for e in events:
        if e[0]=='buy':
            stock.append([e[1],e[2],e[3]]); rows.append([e[1],'Buy %s @ %s'%(f(e[2]),money(e[3])),'',' + '.join('%s@%s'%(f(s[1]),money(s[2])) for s in stock if s[1])])
        else:
            need=e[2]; parts=[]
            order=stock if method=='FIFO' else list(reversed(stock))
            for s in order:
                if need<=0: break
                k=min(s[1],need)
                if k: parts.append((k,s[2])); s[1]-=k; need-=k
            c=sum(k*p for k,p in parts); cogs+=c
            rows.append([e[1],'Sell %s'%f(e[2]),' + '.join('%s × %s'%(f(k),money(p)) for k,p in parts)+' = '+money(c),' + '.join('%s@%s'%(f(s[1]),money(s[2])) for s in stock if s[1])])
    end=sum(s[1]*s[2] for s in stock)
    return dict(cogs=cogs,end=end,rows=rows)

def perp_table(res):
    return T(['Date','Event','Cost of goods sold','Inventory on hand'],*res['rows'])
