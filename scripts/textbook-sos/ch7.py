import sys,os,json; sys.path.insert(0,os.path.dirname(__file__))
from sos_lib import *

JOURNALS="Special journals available: Sales journal (S), Purchases journal (P), Cash receipts journal (R), Cash payments journal (D) and General journal (G). Perpetual inventory."

add('QS-7-1','Accounting information system components',"""
Match each item with the AIS component it belongs to: source document, input device, information processor, information storage, or output device.
1. A supplier's invoice
2. A barcode scanner at the till
3. The accounting software that posts entries
4. A cloud database of transactions
5. A printed monthly income statement
6. A computer keyboard
""","""
1. Source document
2. Input device
3. Information processor
4. Information storage
5. Output device
6. Input device
""")

add('QS-7-2','Accounting information system principles',"""
Name the AIS principle described.
1. Benefits from the system should be greater than its cost.
2. The system should help managers protect assets and monitor operations.
3. Reports should give timely, useful information to decision makers.
4. The system should fit the company's activities, people and structure.
5. The system should be able to change as the business grows.
""","""
1. Cost-benefit principle
2. Control principle
3. Relevance principle
4. Compatibility principle
5. Flexibility principle
""")

add('QS-7-3','Identifying general and subsidiary ledgers',"""
For each account, say whether it is found in the general ledger (G), the accounts receivable ledger (AR) or the accounts payable ledger (AP).
1. Accounts Receivable
2. Customer — Lina Park
3. Supplier — Delta Wholesale
4. Sales
5. Accounts Payable
6. Customer — Orbit Café
""","""
1. G (controlling account)
2. AR
3. AP
4. G
5. G (controlling account)
6. AR
""")

add('QS-7-4','Controlling accounts and subsidiary ledgers',f"""
At month-end the accounts receivable subsidiary ledger shows:
{T(['Customer','Balance'],['Amos Co.','$2,340'],['Bree Ltd.','$1,875'],['Coda Inc.','$960'],['Dell Studio','$3,125'])}
The Accounts Receivable controlling account shows $8,600.
1. What should the controlling account show?
2. Give one possible reason for the difference.
""","""
1. 2,340 + 1,875 + 960 + 3,125 = **$8,300**.
2. The controlling account is $300 too high. Possible causes: a $300 collection posted to a customer's account but not included in the Accounts Receivable total, a sale posted twice to the controlling account, or an addition error in a journal column.
""")

add('QS-7-5','Identifying the special journal of entry',JOURNALS+"""

Name the journal used for each transaction.
1. Sold merchandise on credit.
2. Bought merchandise on credit.
3. Paid a supplier on account.
4. Received cash from a customer on account.
5. Owner invested cash.
6. A customer returned goods bought on credit.
7. Sold merchandise for cash.
8. Recorded depreciation.
""","""
1. S  2. P  3. D  4. R  5. R  6. G  7. R  8. G
""")

add('QS-7-6','Sales journal',f"""
{JOURNALS}
Wilder Books made these credit sales in March (terms n/30):
{T(['Date','Customer','Invoice','Sale','Cost'],['Mar 3','Ivy Moss','#311','$720','$430'],['Mar 9','Joel Tan','#312','$1,150','$690'],['Mar 18','Ivy Moss','#313','$480','$290'],['Mar 27','Kai Lund','#314','$905','$540'])}
1. Record them in a sales journal with the columns Accounts Receivable Dr / Sales Cr and Cost of Sales Dr / Inventory Cr.
2. What is posted at month-end?
""",f"""
1.
{T(['Date','Account debited','Invoice','PR','AR Dr / Sales Cr','Cost of Sales Dr / Inventory Cr'],['Mar 3','Ivy Moss','311','✓','720','430'],['Mar 9','Joel Tan','312','✓','1,150','690'],['Mar 18','Ivy Moss','313','✓','480','290'],['Mar 27','Kai Lund','314','✓','905','540'],['**Totals**','','','','**3,255**','**1,950**'])}

2. Each amount is posted daily to the customer's subsidiary account (✓). At month-end: Dr Accounts Receivable 3,255, Cr Sales 3,255; Dr Cost of Sales 1,950, Cr Merchandise Inventory 1,950.
""")

add('QS-7-7','Cash receipts journal',f"""
{JOURNALS}
Record these April receipts for Wilder Books in a cash receipts journal with columns Cash Dr, Sales Discounts Dr, Accounts Receivable Cr, Sales Cr, Other Accounts Cr, Cost of Sales Dr / Inventory Cr.
- **Apr 4** Cash sales $1,320 (cost $790).
- **Apr 8** Collected Joel Tan's $1,150 invoice less a 2% discount.
- **Apr 15** Owner invested $5,000 cash.
- **Apr 22** Borrowed $3,000 from the bank, signing a note payable.
""",f"""
{T(['Date','Account credited','Cash Dr','Sales Disc. Dr','AR Cr','Sales Cr','Other Cr','COS Dr / Inv. Cr'],['Apr 4','Sales','1,320','','','1,320','','790'],['Apr 8','Joel Tan','1,127','23','1,150','','',''],['Apr 15','Owner, Capital','5,000','','','','5,000',''],['Apr 22','Notes Payable','3,000','','','','3,000',''],['**Totals**','','**10,447**','**23**','**1,150**','**1,320**','**8,000**','**790**'])}

Check: debits 10,447 + 23 = 10,470 = credits 1,150 + 1,320 + 8,000.
""")
check(10447+23,1150+1320+8000)

add('QS-7-8','Purchases journal',f"""
{JOURNALS}
Wilder Books bought on credit in March:
- **Mar 5** Merchandise from Paper Mill, $2,600, terms 2/10, n/30.
- **Mar 12** Office supplies from Desk Depot, $340, n/30.
- **Mar 20** Merchandise from Ink House, $1,480, terms 1/10, n/30.
- **Mar 26** Store supplies from Desk Depot, $215, n/30.

Record them in a purchases journal with columns Accounts Payable Cr, Merchandise Inventory Dr, Office Supplies Dr, Store Supplies Dr.
""",f"""
{T(['Date','Account credited','PR','AP Cr','Inventory Dr','Office Supplies Dr','Store Supplies Dr'],['Mar 5','Paper Mill','✓','2,600','2,600','',''],['Mar 12','Desk Depot','✓','340','','340',''],['Mar 20','Ink House','✓','1,480','1,480','',''],['Mar 26','Desk Depot','✓','215','','','215'],['**Totals**','','','**4,635**','**4,080**','**340**','**215**'])}

Credits to Accounts Payable (4,635) equal debits (4,080 + 340 + 215).
""")

add('QS-7-9','Identifying journal of entry',JOURNALS+"""

Name the journal for each transaction.
1. Paid cash for store supplies.
2. Bought office equipment on credit (purchases journal has only Inventory, Office Supplies and Store Supplies columns).
3. Returned merchandise to a supplier for credit.
4. Paid wages.
5. Collected interest on a note receivable.
6. Wrote off an uncollectible account.
""","""
1. D  2. G  3. G  4. D  5. R  6. G
""")

add('E-7-1','Sales journal',f"""
{JOURNALS}
Halo Gifts' June credit sales (terms 2/10, n/30):
{T(['Date','Customer','Invoice','Sale','Cost'],['Jun 2','Nell Rao','#801','$1,640','$980'],['Jun 7','Otto Fry','#802','$2,250','$1,350'],['Jun 15','Nell Rao','#803','$870','$520'],['Jun 21','Pia Holm','#804','$1,415','$850'],['Jun 29','Otto Fry','#805','$660','$395'])}
1. Prepare the sales journal and total it.
2. Show the accounts receivable subsidiary ledger balances at Jun 30 (no collections yet).
""",f"""
1.
{T(['Date','Customer','Invoice','AR Dr / Sales Cr','COS Dr / Inv. Cr'],['Jun 2','Nell Rao','801','1,640','980'],['Jun 7','Otto Fry','802','2,250','1,350'],['Jun 15','Nell Rao','803','870','520'],['Jun 21','Pia Holm','804','1,415','850'],['Jun 29','Otto Fry','805','660','395'],['**Totals**','','','**6,835**','**4,095**'])}

2. Nell Rao 2,510; Otto Fry 2,910; Pia Holm 1,415. Total **6,835** = Accounts Receivable controlling account.
""")
check(1640+2250+870+1415+660,6835); check(980+1350+520+850+395,4095)

add('QS-7-11','Entries in the general journal',f"""
{JOURNALS}
Halo Gifts records these in the general journal. Prepare the entries, showing postings to subsidiary ledgers.
- **Jun 18** Nell Rao returned $240 of goods (cost $145) bought on credit.
- **Jun 24** Halo returned $300 of merchandise to Ink House, a supplier, for credit.
""",f"""
{JE(('Jun 18','Sales Returns and Allowances',240,''),('','Accounts Receivable — Nell Rao','',240),('Jun 18','Merchandise Inventory',145,''),('','Cost of Sales','',145),('Jun 24','Accounts Payable — Ink House',300,''),('','Merchandise Inventory','',300))}

The receivable and payable credits/debits are posted twice: to the controlling account and to the customer's or supplier's subsidiary account (PR shows e.g. 106/✓).
""")

add('QS-7-12','Accounts receivable ledger; posting to accounts',f"""
Using the Halo Gifts sales journal (E-7-1) and the return on Jun 18 (QS-7-11), Nell Rao paid $1,640 on Jun 12, less 2%.
Show Nell Rao's subsidiary ledger account for June.
""",f"""
{T(['Date','Explanation','Debit','Credit','Balance'],['Jun 2','Invoice 801','1,640','','1,640'],['Jun 12','Collection (invoice 801)','','1,640','0'],['Jun 15','Invoice 803','870','','870'],['Jun 18','Return','','240','630'])}

The customer's account is credited for the full invoice (1,640); the 32.80 discount goes to Sales Discounts and cash received is 1,607.20.
""")

add('QS-7-13','Days’ payable outstanding',"""
| | This year | Last year |
|---|---|---|
| Accounts payable | $38,400 | $31,500 |
| Cost of sales | $467,200 | $420,000 |

Compute days' payable outstanding for both years (365 days). Is the company paying suppliers faster or slower?
""","""
- This year: 38,400 ÷ 467,200 × 365 = **30.0 days**
- Last year: 31,500 ÷ 420,000 × 365 = **27.4 days**

It is taking about 2.6 days longer to pay suppliers.
""")
check(round(38400/467200*365,1),30.0); check(round(31500/420000*365,1),27.4)

add('E-7-2','Identifying journal of entry',JOURNALS+"""

1. Sold merchandise for cash. 2. Paid rent. 3. Bought merchandise on credit. 4. Customer paid an account less discount. 5. Granted a customer an allowance on account. 6. Owner withdrew cash. 7. Sold merchandise on credit. 8. Recorded accrued salaries at year-end.
""","""
1. R  2. D  3. P  4. R  5. G  6. D  7. S  8. G
""")

add('E-7-3','Cash receipts journal',f"""
{JOURNALS}
Record Halo Gifts' July receipts (terms on sales 2/10, n/30):
- **Jul 1** Owner invested $8,000.
- **Jul 5** Cash sales $2,030 (cost $1,220).
- **Jul 7** Otto Fry paid invoice #805 ($660) within the discount period.
- **Jul 16** Pia Holm paid invoice #804 ($1,415) after the discount period.
- **Jul 20** Received $95 interest on a note receivable.
- **Jul 28** Cash sales $1,780 (cost $1,070).

Prepare the journal and prove the column totals.
""",f"""
{T(['Date','Account credited','Cash Dr','Sales Disc. Dr','AR Cr','Sales Cr','Other Cr','COS Dr / Inv. Cr'],['Jul 1','Owner, Capital','8,000','','','','8,000',''],['Jul 5','Sales','2,030','','','2,030','','1,220'],['Jul 7','Otto Fry','646.80','13.20','660','','',''],['Jul 16','Pia Holm','1,415','','1,415','','',''],['Jul 20','Interest Revenue','95','','','','95',''],['Jul 28','Sales','1,780','','','1,780','','1,070'],['**Totals**','','**13,966.80**','**13.20**','**2,075**','**3,810**','**8,095**','**2,290**'])}

Proof: 13,966.80 + 13.20 = 13,980 = 2,075 + 3,810 + 8,095.
""")
check(8000+2030+646.8+1415+95+1780,13966.8); check(13966.8+13.2,2075+3810+8095)

add('E-7-4','Identifying journal of entry',JOURNALS+"""

Halo Gifts:
1. Paid a supplier's invoice less a discount.
2. Bought store supplies on credit.
3. Sold old equipment for cash at book value.
4. Issued a credit memo to a customer for returned goods.
5. Paid cash for merchandise.
6. Recorded expired insurance.
""","""
1. D  2. P (Store Supplies column)  3. R  4. G  5. D  6. G
""")

add('E-7-5','Controlling accounts and subsidiary ledgers',f"""
The accounts payable subsidiary ledger and the controlling account for Halo Gifts at Jul 31:
{T(['Supplier','Balance'],['Paper Mill','$3,410'],['Ink House','$1,260'],['Desk Depot','$575'],['Gift Source','$2,945'])}
Accounts Payable (controlling) shows $8,280.
1. Prepare a schedule of accounts payable.
2. Find the error and correct the schedule. A check shows a $90 credit purchase from Ink House was included in the purchases journal total but never posted to Ink House's account.
""","""
1. Schedule of accounts payable: Paper Mill 3,410; Ink House 1,260; Desk Depot 575; Gift Source 2,945. Total **8,190**, which is $90 less than the controlling account (8,280).

2. Post the missing $90 to Ink House: its balance becomes 1,350. Corrected schedule total = **8,280**, which agrees with the controlling account.
""")

add('E-7-6','Purchases journal',f"""
{JOURNALS}
Halo Gifts' July credit purchases:
- **Jul 2** Merchandise from Gift Source, $3,180, terms 2/10, n/30.
- **Jul 9** Office supplies from Desk Depot, $260.
- **Jul 14** Merchandise from Paper Mill, $1,940, terms 1/10, n/30.
- **Jul 19** Store supplies from Desk Depot, $185.
- **Jul 25** Merchandise from Gift Source, $2,210, terms 2/10, n/30.

Prepare the purchases journal and total it. What is posted at month-end?
""",f"""
{T(['Date','Account credited','AP Cr','Inventory Dr','Office Supplies Dr','Store Supplies Dr'],['Jul 2','Gift Source','3,180','3,180','',''],['Jul 9','Desk Depot','260','','260',''],['Jul 14','Paper Mill','1,940','1,940','',''],['Jul 19','Desk Depot','185','','','185'],['Jul 25','Gift Source','2,210','2,210','',''],['**Totals**','','**7,775**','**7,330**','**260**','**185**'])}

Month-end: Dr Merchandise Inventory 7,330, Dr Office Supplies 260, Dr Store Supplies 185, Cr Accounts Payable 7,775. Each line is also posted daily to the supplier's account.
""")
check(3180+260+1940+185+2210,7775)

add('E-7-7','Cash payments journal',f"""
{JOURNALS}
Halo Gifts' July cash payments:
- **Jul 3** Paid rent, $1,500 (check #401).
- **Jul 11** Paid Gift Source for the Jul 2 invoice ($3,180) less 2% (check #402).
- **Jul 18** Bought merchandise for cash, $640 (check #403).
- **Jul 24** Paid Paper Mill for the Jul 14 invoice ($1,940) — after the discount period (check #404).
- **Jul 30** Paid salaries, $2,300 (check #405).

Use columns Cash Cr, Inventory Cr (discounts), Other Accounts Dr, Accounts Payable Dr.
""",f"""
{T(['Date','Ck','Account debited','Cash Cr','Inventory Cr','Other Dr','AP Dr'],['Jul 3','401','Rent Expense','1,500','','1,500',''],['Jul 11','402','Gift Source','3,116.40','63.60','','3,180'],['Jul 18','403','Merchandise Inventory','640','','640',''],['Jul 24','404','Paper Mill','1,940','','','1,940'],['Jul 30','405','Salaries Expense','2,300','','2,300',''],['**Totals**','','','**9,496.40**','**63.60**','**4,440**','**5,120**'])}

Proof: debits 4,440 + 5,120 = 9,560 = credits 9,496.40 + 63.60.
""")
check(9496.4+63.6,4440+5120)

add('E-7-11','Special journal transactions',JOURNALS+"""

Ridgeway Co. uses the special journals above. For each transaction, name the journal and the accounts debited and credited.
1. Sold goods on credit, $900 (cost $540).
2. Collected $900 less 2%.
3. Bought merchandise on credit, $1,200.
4. Paid the $1,200 less 1%.
5. Customer returned $150 of goods (cost $90).
""","""
1. S — Dr Accounts Receivable 900, Cr Sales 900; Dr Cost of Sales 540, Cr Inventory 540.
2. R — Dr Cash 882, Dr Sales Discounts 18, Cr Accounts Receivable 900.
3. P — Dr Merchandise Inventory 1,200, Cr Accounts Payable 1,200.
4. D — Dr Accounts Payable 1,200, Cr Merchandise Inventory 12, Cr Cash 1,188.
5. G — Dr Sales Returns and Allowances 150, Cr Accounts Receivable 150; Dr Inventory 90, Cr Cost of Sales 90.
""")

add('E-7-12','Posting to subsidiary ledger',f"""
From these journal lines, post to the accounts receivable subsidiary ledger and prepare a schedule of accounts receivable at Aug 31.
- Sales journal: Aug 4 Lee Ward $1,260; Aug 10 Mia Cole $830; Aug 19 Lee Ward $540; Aug 26 Ned Ruiz $1,095.
- Cash receipts journal: Aug 14 Lee Ward paid $1,260; Aug 29 Mia Cole paid $500.
- General journal: Aug 22 Mia Cole returned goods, $80.
""","""
| Customer | Debits | Credits | Balance |
|---|---|---|---|
| Lee Ward | 1,260 + 540 | 1,260 | 540 |
| Mia Cole | 830 | 500 + 80 | 250 |
| Ned Ruiz | 1,095 | — | 1,095 |
| **Total** | | | **1,885** |

The Accounts Receivable controlling account should also show 1,885.
""")

add('E-7-8','Identifying journal of entry',JOURNALS+"""

1. Paid a note payable and interest. 2. Bought merchandise on credit. 3. Sold a used truck on credit (not merchandise). 4. Received a supplier's credit memo for an allowance. 5. Customer paid an account. 6. Closed the revenue accounts.
""","""
1. D  2. P  3. G  4. G  5. R  6. G
""")

add('E-7-9','Entries in the general journal',f"""
Prepare general journal entries for Ridgeway Co. (perpetual):
- **Sep 6** Granted a $120 allowance to customer Ada Pine for scratched goods (no goods returned).
- **Sep 12** Returned $410 of defective merchandise to supplier Bolt Co.
- **Sep 30** Recorded depreciation of $750.
""",f"""
{JE(('Sep 6','Sales Returns and Allowances',120,''),('','Accounts Receivable — Ada Pine','',120),('Sep 12','Accounts Payable — Bolt Co.',410,''),('','Merchandise Inventory','',410),('Sep 30','Depreciation Expense',750,''),('','Accumulated Depreciation','',750))}
""")

add('E-7-13','Days’ payable outstanding',"""
Two companies report:
| | Atlas | Borealis |
|---|---|---|
| Accounts payable | $54,000 | $27,600 |
| Cost of sales | $657,000 | $503,700 |

Compute days' payable outstanding (365 days). Which pays suppliers sooner?
""","""
- Atlas: 54,000 ÷ 657,000 × 365 = **30.0 days**
- Borealis: 27,600 ÷ 503,700 × 365 = **20.0 days**

Borealis pays its suppliers sooner.
""")
check(round(54000/657000*365,1),30.0); check(round(27600/503700*365,1),20.0)

def p_sales_cash(id,co,mon,sales,collect,cashsales,other):
    srows=[];tar=tcos=0
    for d,c,inv,amt,cost in sales:
        srows.append([mon+' '+d,c,inv,f(amt),f(cost)]); tar+=amt; tcos+=cost
    rrows=[];tc=td=tarc=ts=to=tcc=0
    for d,c,amt,disc in collect:
        dd=round(amt*disc/100,2); rrows.append([mon+' '+d,c,f(round(amt-dd,2)),f(dd) if dd else '',f(amt),'','','']); tc+=amt-dd; td+=dd; tarc+=amt
    for d,amt,cost in cashsales:
        rrows.append([mon+' '+d,'Sales',f(amt),'','',f(amt),'',f(cost)]); tc+=amt; ts+=amt; tcc+=cost
    for d,acct,amt in other:
        rrows.append([mon+' '+d,acct,f(amt),'','','',f(amt),'']); tc+=amt; to+=amt
    rrows.sort(key=lambda r:int(r[0].split()[1]))
    tc=round(tc,2); td=round(td,2)
    bal={}
    for _,c,_,amt,_ in sales: bal[c]=bal.get(c,0)+amt
    for _,c,amt,_ in collect: bal[c]=bal.get(c,0)-amt
    lines='\n'.join(f'- **{mon} {d}** Sold ${f(a)} on credit to {c}, invoice {inv}; cost ${f(k)}.' for d,c,inv,a,k in sales)
    lines+='\n'+'\n'.join(f'- **{mon} {d}** Collected {c}\'s ${f(a)} invoice'+(f' less {p}% discount.' if p else ' (no discount).') for d,c,a,p in collect)
    lines+='\n'+'\n'.join(f'- **{mon} {d}** Cash sales ${f(a)}; cost ${f(k)}.' for d,a,k in cashsales)
    lines+='\n'+'\n'.join(f'- **{mon} {d}** Received ${f(a)} — {acct}.' for d,acct,a in other)
    chk(id,('Cash receipts journal — Cash Dr total',tc),('Schedule of accounts receivable total',sum(bal.values())))
    add(id,'Special journals, subsidiary ledgers and schedule of accounts receivable',f"""
{co} sells on terms 2/10, n/30 and uses a perpetual system. Its {mon} transactions are listed by date within each type:
{lines}

1. Record the transactions in a sales journal and a cash receipts journal.
2. Total and prove the cash receipts journal.
3. Prepare a schedule of accounts receivable at month-end.
""",f"""
1. **Sales journal**
{T(['Date','Customer','Invoice','AR Dr / Sales Cr','COS Dr / Inv. Cr'],*srows,['**Totals**','','','**'+f(tar)+'**','**'+f(tcos)+'**'])}

**Cash receipts journal**
{T(['Date','Account credited','Cash Dr','Sales Disc. Dr','AR Cr','Sales Cr','Other Cr','COS Dr / Inv. Cr'],*rrows,['**Totals**','','**'+f(tc)+'**','**'+f(td)+'**','**'+f(tarc)+'**','**'+f(ts)+'**','**'+f(to)+'**','**'+f(tcc)+'**'])}

2. Debits {f(tc)} + {f(td)} = {f(round(tc+td,2))}; credits {f(tarc)} + {f(ts)} + {f(to)} = {f(tarc+ts+to)}. ✓

3. Schedule of accounts receivable
{T(['Customer','Balance'],*[[c,f(b)] for c,b in bal.items() if b],['**Total**','**'+f(sum(bal.values()))+'**'])}
This equals the controlling account: {f(tar)} − {f(tarc)} = {f(tar-tarc)}.
""")
    check(round(tc+td,2),tarc+ts+to)
p_sales_cash('P-7-1A','Nimbus Crafts','Apr',[('2','Ava Lin','#201',2400,1440),('6','Ben Ort','#202',1350,810),('13','Cy Diaz','#203',3100,1860),('20','Ava Lin','#204',980,590),('27','Ben Ort','#205',1720,1030)],[('11','Ava Lin',2400,2),('22','Cy Diaz',3100,2),('28','Ben Ort',1350,0)],[('9',1860,1115),('24',2240,1345)],[('15','owner investment (Owner, Capital)',6000),('30','note payable from bank (Notes Payable)',4000)])
p_sales_cash('P-7-1B','Stratus Crafts','May',[('3','Dee Fox','#301',1850,1110),('8','Eli Gant','#302',2700,1620),('14','Fay Ho','#303',1420,850),('21','Dee Fox','#304',1160,700),('28','Eli Gant','#305',2050,1230)],[('12','Dee Fox',1850,2),('23','Fay Ho',1420,2),('29','Eli Gant',2700,0)],[('10',2120,1270),('25',1960,1175)],[('16','owner investment (Owner, Capital)',5000),('31','interest on note (Interest Revenue)',120)])

def p_purch_pay(id,co,mon,purch,pays,cashpays):
    prow=[];tap=tinv=tos=tss=0
    for d,s,acct,amt in purch:
        inv=amt if acct=='inv' else 0; os_=amt if acct=='off' else 0; ss=amt if acct=='store' else 0
        prow.append([mon+' '+d,s,f(amt),f(inv) if inv else '',f(os_) if os_ else '',f(ss) if ss else '']); tap+=amt; tinv+=inv; tos+=os_; tss+=ss
    drow=[];tc=tic=to=tapd=0; ck=500
    for d,s,amt,disc in pays:
        ck+=1; dd=round(amt*disc/100,2); drow.append([mon+' '+d,str(ck),s,f(round(amt-dd,2)),f(dd) if dd else '','',f(amt)]); tc+=amt-dd; tic+=dd; tapd+=amt
    for d,acct,amt in cashpays:
        ck+=1; drow.append([mon+' '+d,str(ck),acct,f(amt),'',f(amt),'']); tc+=amt; to+=amt
    drow.sort(key=lambda r:int(r[0].split()[1]))
    for i,r in enumerate(drow): r[1]=str(501+i)
    tc=round(tc,2); tic=round(tic,2)
    bal={}
    for _,s,_,amt in purch: bal[s]=bal.get(s,0)+amt
    for _,s,amt,_ in pays: bal[s]=bal.get(s,0)-amt
    names={'inv':'merchandise','off':'office supplies','store':'store supplies'}
    lines='\n'.join(f'- **{mon} {d}** Bought {names[a]} on credit from {s}, ${f(x)}'+(' (terms 2/10, n/30).' if a=='inv' else ' (n/30).') for d,s,a,x in purch)
    lines+='\n'+'\n'.join(f'- **{mon} {d}** Paid {s} ${f(x)}'+(f' less {p}% discount.' if p else ' (discount period missed).') for d,s,x,p in pays)
    lines+='\n'+'\n'.join(f'- **{mon} {d}** Paid ${f(x)} — {a}.' for d,a,x in cashpays)
    chk(id,('Cash payments journal — Cash Cr total',tc),('Schedule of accounts payable total',sum(bal.values())))
    add(id,'Special journals, subsidiary ledgers and schedule of accounts payable',f"""
{co} uses a perpetual system. Its {mon} transactions:
{lines}

1. Record them in a purchases journal and a cash payments journal (checks start at #501).
2. Total and prove the cash payments journal.
3. Prepare a schedule of accounts payable at month-end.
""",f"""
1. **Purchases journal**
{T(['Date','Supplier','AP Cr','Inventory Dr','Office Supplies Dr','Store Supplies Dr'],*prow,['**Totals**','','**'+f(tap)+'**','**'+f(tinv)+'**','**'+f(tos)+'**','**'+f(tss)+'**'])}

**Cash payments journal**
{T(['Date','Ck','Account debited','Cash Cr','Inventory Cr','Other Dr','AP Dr'],*drow,['**Totals**','','','**'+f(tc)+'**','**'+f(tic)+'**','**'+f(to)+'**','**'+f(tapd)+'**'])}

2. Debits {f(to)} + {f(tapd)} = {f(to+tapd)}; credits {f(tc)} + {f(tic)} = {f(round(tc+tic,2))}. ✓

3. Schedule of accounts payable
{T(['Supplier','Balance'],*[[s,f(b)] for s,b in bal.items() if b],['**Total**','**'+f(sum(bal.values()))+'**'])}
Equals the controlling account: {f(tap)} − {f(tapd)} = {f(tap-tapd)}.
""")
    check(round(tc+tic,2),to+tapd)
p_purch_pay('P-7-2A','Harbor Bikes','Jun',[('1','Spoke Co.','inv',5200),('4','Desk Depot','off',380),('9','Gear Hub','inv',3650),('15','Spoke Co.','inv',2900),('22','Desk Depot','store',260)],[('10','Spoke Co.',5200,2),('19','Gear Hub',3650,2),('30','Desk Depot',380,0)],[('2','Rent Expense',2100),('14','Merchandise Inventory (cash purchase)',760),('28','Salaries Expense',3400)])
p_purch_pay('P-7-2B','Summit Bikes','Jul',[('2','Chain Ltd.','inv',4800),('5','Desk Depot','off',310),('11','Wheel Works','inv',4100),('17','Chain Ltd.','inv',2350),('24','Desk Depot','store',195)],[('11','Chain Ltd.',4800,2),('20','Wheel Works',4100,2),('31','Desk Depot',310,0)],[('3','Rent Expense',2400),('16','Merchandise Inventory (cash purchase)',820),('29','Salaries Expense',3600)])

def p_all(id,co,inv0,vendor,pamt,cust1,s1amt,c1,ret,rentamt,csamt,c2,cust2,s2amt,c3,salamt,days):
    disc=round((pamt-ret)*0.02,2); sdisc=round(s1amt*0.02,2)
    paycash=round(pamt-ret-disc,2); colcash=round(s1amt-sdisc,2)
    cash=round(inv0-rentamt-paycash+colcash+csamt-salamt,2); inv=round(pamt-ret-disc-c1-c2-c3,2)
    sales=s1amt+csamt+s2amt; cos=c1+c2+c3
    tdr=round(cash+s2amt+inv+sdisc+cos+rentamt+salamt,2); tcr=inv0+sales
    check(tdr,tcr,id)
    d=days
    chk(id,('Month-end Cash',cash),('Month-end Merchandise Inventory',inv),('Trial balance totals',tdr))
    add(id,'Special journals, subsidiary ledgers and trial balance',f"""
{co} uses all five journals (perpetual; terms 2/10, n/30). Its first month:
- **Day {d[0]}** Owner invested ${f(inv0)} cash.
- **Day {d[1]}** Bought merchandise on credit from {vendor}, ${f(pamt)}.
- **Day {d[2]}** Sold merchandise on credit to {cust1}, ${f(s1amt)} (cost ${f(c1)}).
- **Day {d[3]}** Returned ${f(ret)} of the Day {d[1]} merchandise to {vendor}.
- **Day {d[4]}** Paid rent, ${f(rentamt)}.
- **Day {d[5]}** Paid {vendor} the balance less 2%.
- **Day {d[6]}** Collected {cust1}'s invoice less 2%.
- **Day {d[7]}** Cash sales ${f(csamt)} (cost ${f(c2)}).
- **Day {d[8]}** Sold merchandise on credit to {cust2}, ${f(s2amt)} (cost ${f(c3)}).
- **Day {d[9]}** Paid salaries, ${f(salamt)}.

1. Name the journal for each transaction.
2. Compute the month-end balances of Cash, Accounts Receivable, Merchandise Inventory and Accounts Payable.
3. Prepare the trial balance.
""",f"""
1. Day {d[0]} R; Day {d[1]} P; Day {d[2]} S; Day {d[3]} G; Day {d[4]} D; Day {d[5]} D; Day {d[6]} R; Day {d[7]} R; Day {d[8]} S; Day {d[9]} D.

2.
- Cash = {f(inv0)} − {f(rentamt)} − {f(paycash)} + {f(colcash)} + {f(csamt)} − {f(salamt)} = **{f(cash)}**
- Accounts Receivable = {f(s1amt)} − {f(s1amt)} + {f(s2amt)} = **{f(s2amt)}** ({cust2})
- Merchandise Inventory = {f(pamt)} − {f(ret)} − {f(disc)} − {f(c1)} − {f(c2)} − {f(c3)} = **{f(inv)}**
- Accounts Payable = {f(pamt)} − {f(ret)} − {f(pamt-ret)} = **0**

3.
{T(['Account','Debit','Credit'],['Cash',f(cash),''],['Accounts Receivable',f(s2amt),''],['Merchandise Inventory',f(inv),''],['Owner, Capital','',f(inv0)],['Sales','',f(sales)],['Sales Discounts',f(sdisc),''],['Cost of Sales',f(cos),''],['Rent Expense',f(rentamt),''],['Salaries Expense',f(salamt),''],['**Totals**','**'+f(tdr)+'**','**'+f(tcr)+'**'])}
""")
p_all('P-7-3A','Lumen Outfitters',20000,'Vale Supply',6000,'Kim Ross',3500,2100,400,1200,2800,1680,'Lou Sato',1900,1140,1600,(1,2,4,6,8,11,13,18,24,28))
p_all('P-7-3B','Prism Outfitters',15000,'Pike Traders',5000,'Rae Quinn',2600,1560,500,1000,2200,1320,'Sol Vega',1500,900,1400,(1,3,5,7,9,12,14,19,25,29))

order=[i['id'] for i in json.load(open(os.path.join(os.path.dirname(__file__),'..','..','data','accounting-textbook-index.json')))['items'] if i['chapter']=='7' and not i['id'].startswith('SEC')]
ITEMS.sort(key=lambda x:order.index(x['id']))
assert [i['id'] for i in ITEMS]==order,(set(order)-{i['id'] for i in ITEMS})
# ---------- key answers for the self-check boxes ----------
chk('QS-7-4',('Correct controlling account balance',8300))
chk('QS-7-6',('Sales journal total (AR Dr / Sales Cr)',3255),('Cost of sales column total',1950))
chk('QS-7-7',('Cash Dr column total',10447))
chk('QS-7-8',('Accounts Payable Cr total',4635))
chk('E-7-1',('Sales journal total',6835),('Cost of sales column total',4095))
chk('QS-7-13',('Days\' payable outstanding, this year',30.0,0.1),('Days\' payable outstanding, last year',27.4,0.1))
chk('E-7-3',('Cash Dr column total',13966.80))
chk('E-7-6',('Accounts Payable Cr total',7775))
chk('E-7-7',('Cash Cr column total',9496.40))
chk('E-7-12',('Schedule of accounts receivable total',1885))
chk('E-7-13',('Atlas days\' payable outstanding',30.0,0.1),('Borealis days\' payable outstanding',20.0,0.1))

attach_checks()
json.dump(ITEMS,open(os.path.join(os.path.dirname(__file__),'..','..','data','textbook-sos','ch7.json'),'w'),ensure_ascii=False,separators=(',',':'))
print(len(ITEMS))
