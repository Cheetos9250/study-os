import sys,os,json; sys.path.insert(0,os.path.dirname(__file__))
from sos_lib import *

def bankrec(bank_bal,book_bal,bank_items,book_items):
    """bank_items/book_items: list of (label, signed amount). Returns (table_md, adjusted)."""
    ab=round(bank_bal+sum(a for _,a in bank_items),2); ak=round(book_bal+sum(a for _,a in book_items),2)
    assert abs(ab-ak)<0.005,(ab,ak)
    rows=[['**Bank statement balance**',f(bank_bal)]]+[[('Add: ' if a>0 else 'Deduct: ')+l,f(abs(a)) if a>0 else '('+f(abs(a))+')'] for l,a in bank_items]+[['**Adjusted bank balance**','**'+f(ab)+'**'],['',''],['**Book balance**',f(book_bal)]]+[[('Add: ' if a>0 else 'Deduct: ')+l,f(abs(a)) if a>0 else '('+f(abs(a))+')'] for l,a in book_items]+[['**Adjusted book balance**','**'+f(ak)+'**']]
    return T(['Bank reconciliation',''],*rows),ab

add('QS-8-1','Internal control objectives',"""
Name the internal control objective each statement supports: protect assets, ensure reliable accounting, promote efficient operations, or urge adherence to company policies.
1. Cash is kept in a locked safe.
2. A second employee checks every journal entry over $5,000.
3. Staff are trained to use the point-of-sale system quickly.
4. Managers must follow the travel-expense policy.
""","""
1. Protect assets
2. Ensure reliable accounting
3. Promote efficient operations
4. Urge adherence to company policies
""")

add('QS-8-2','COSO internal control components',"""
Match each example with a COSO component: control environment, risk assessment, control activities, information and communication, monitoring.
1. Management sets a strong tone of honesty and ethics.
2. The company identifies which assets are most likely to be stolen.
3. Two signatures are required on large checks.
4. Monthly reports are sent to managers on time.
5. Internal auditors review controls each quarter.
""","""
1. Control environment
2. Risk assessment
3. Control activities
4. Information and communication
5. Monitoring
""")

add('QS-8-3','Cash and cash equivalents',"""
Which items are reported as cash and cash equivalents?
1. Coins and currency in the till, $640
2. Checking account balance, $12,300
3. Customer's postdated check, $500
4. Treasury bill bought 60 days before maturity, $5,000
5. Certificate of deposit with a 1-year maturity, $8,000
6. Petty cash fund, $200
7. Postage stamps, $45

Compute the total.
""","""
Included: 1, 2, 4, 6. Total = 640 + 12,300 + 5,000 + 200 = **$18,140**.

- Postdated check: a receivable until its date.
- 1-year CD: maturity longer than 3 months, so it is a short-term investment.
- Stamps: a prepaid expense (supplies).
""")

add('QS-8-4','Internal control for cash',"""
State the control weakness and suggest a fix.
1. The cashier who receives mail payments also records them in the accounts receivable ledger.
2. Cash receipts are deposited once a week.
3. The person who approves invoices also signs the checks.
4. Blank checks are kept in an unlocked drawer.
""","""
1. Custody and recordkeeping are combined. Have one person list receipts and another record them.
2. Cash is exposed to theft. Deposit all receipts intact each day.
3. Approval and payment are combined. Separate them, or require a second signature.
4. Checks can be stolen. Lock them up and prenumber them.
""")

add('QS-8-5','Cash over and short',f"""
At the end of the day, the register tape for Aster Café shows cash sales of $1,860. The cash count is $1,852. Record the day's sales.
""",f"""
{JE(('Day','Cash',1852,''),('Day','Cash Over and Short',8,''),('','Sales','',1860))}

A debit balance in Cash Over and Short is reported as a miscellaneous expense.
""")

add('QS-8-6','Petty cash accounting',f"""
1. On May 1 Aster Café sets up a $250 petty cash fund.
2. On May 31 the fund has $37 cash and receipts for postage $64, supplies $92 and delivery $55. Record the replenishment.
""",f"""
1.
{JE(('May 1','Petty Cash',250,''),('','Cash','',250))}

2. Receipts 211 + cash 37 = 248, so the fund is $2 short. Replenish 250 − 37 = 213.
{JE(('May 31','Postage Expense',64,''),('May 31','Office Supplies',92,''),('May 31','Delivery Expense',55,''),('May 31','Cash Over and Short',2,''),('','Cash','',213))}
""")

t,_=bankrec(14200,13475,[('Deposit in transit',1650),('Outstanding checks',-2195)],[('Note collected by bank',1500),('NSF check',-560),('Service charge',-40),('Error: check #227 recorded as $1,190 instead of $1,910',-720)])
add('QS-8-7','Bank reconciliation',f"""
Prepare Juno Co.'s June 30 bank reconciliation.
- Bank statement balance $14,200; book balance $13,475.
- Deposit in transit $1,650; outstanding checks $2,195.
- The bank collected a $1,500 note for Juno (no interest).
- A customer's $560 check was returned NSF.
- Bank service charge $40.
- Check #227 for rent was written for $1,910 but recorded in the books as $1,190.
""",f"""
{t}
""")

add('QS-8-8','Bank reconciliation — adjusting entries',f"""
Using Juno Co.'s bank reconciliation (QS-8-7), prepare the journal entries the company must record.
""",f"""
Only book-side items are journalized.
{JE(('Jun 30','Cash',1500,''),('','Notes Receivable','',1500),('Jun 30','Accounts Receivable',560,''),('','Cash','',560),('Jun 30','Bank Service Charge Expense',40,''),('','Cash','',40),('Jun 30','Rent Expense',720,''),('','Cash','',720))}
""")

add('E-8-3','Analyzing internal control',"""
For each case, name the internal control principle that was violated.
1. One employee orders goods, receives them and approves the invoice.
2. A clerk takes cash from the register and no one notices for months because nobody reviews daily totals.
3. The same bookkeeper has done all cash work for six years and never takes vacations.
4. Sales slips are not prenumbered, so missing slips go unnoticed.
""","""
1. Separate recordkeeping from custody / divide responsibility for related transactions.
2. Perform regular and independent reviews.
3. Apply human resource controls (mandatory vacations, job rotation).
4. Maintain adequate records (prenumbered documents).
""")

add('E-8-4','Applying internal control principles',"""
Suggest one control for each risk at Lark Cinema.
1. Ticket sellers could keep cash and not issue tickets.
2. Staff could let friends in free.
3. The manager could write checks to herself.
4. Cash could be lost on the way to the bank.
""","""
1. Use a register that issues prenumbered tickets; reconcile tickets issued with cash daily.
2. Have a separate employee collect and tear tickets at the door.
3. Require two signatures or owner approval for checks; reconcile the bank monthly by someone else.
4. Deposit daily, use a bonded courier or night deposit, and compare deposit slips with register totals.
""")

add('QS-8-33A','Documents in a voucher system',"""
Put these voucher-system documents in the order they are prepared: invoice approval, purchase order, voucher, receiving report, purchase requisition, invoice.
""","""
1. Purchase requisition
2. Purchase order
3. Invoice (from the supplier)
4. Receiving report
5. Invoice approval
6. Voucher
""")

add('QS-8-35','Days’ sales uncollected',"""
| | Year 2 | Year 1 |
|---|---|---|
| Accounts receivable | $41,000 | $36,500 |
| Net sales | $498,000 | $472,000 |

Compute days' sales uncollected for both years (365 days). Is collection improving?
""","""
- Year 2: 41,000 ÷ 498,000 × 365 = **30.1 days**
- Year 1: 36,500 ÷ 472,000 × 365 = **28.2 days**

No — customers are taking about 2 days longer to pay.
""")
check(round(41000/498000*365,1),30.1); check(round(36500/472000*365,1),28.2)

add('E-8-5','Cash and cash equivalents',"""
Compute cash and cash equivalents for Brio Co. at Dec 31.
| Item | Amount |
|---|---|
| Currency and coins | $1,350 |
| Checking accounts | $26,400 |
| Petty cash | $300 |
| Money market fund (withdraw any time) | $9,000 |
| 6-month certificate of deposit | $15,000 |
| 90-day Treasury bill bought Dec 10 | $10,000 |
| Customer IOU | $800 |
""","""
1,350 + 26,400 + 300 + 9,000 + 10,000 = **$47,050**.

Excluded: the 6-month CD (short-term investment) and the IOU (receivable).
""")

add('E-8-6','Control of cash receipts',"""
Pell Books receives cash both over the counter and by mail. Describe a good control procedure for each.
""","""
**Over the counter:** ring every sale on a register visible to the customer; issue a receipt; lock the register tape; at day-end a supervisor counts cash, compares it with the tape and deposits it intact; record differences in Cash Over and Short.

**By mail:** two people open the mail together and list every receipt; one copy goes with the cash to the cashier for deposit, one to the bookkeeper for recording, one to a third person who compares the list with the deposit slip and the records.
""")

add('E-8-7','Voucher system and control of cash payments',"""
Explain how a voucher system helps control cash payments, and which documents must agree before a check is signed.
""","""
Every payment needs an approved voucher, so no check is written without authority. Before signing, the purchase order (what was ordered), receiving report (what arrived) and supplier invoice (what is billed) are compared for quantity, price and terms. Different people prepare each document, so one person cannot order, receive and pay alone.
""")

add('E-8-8','Petty cash fund with a shortage',f"""
Tilda Studio:
- **Jul 1** Established a $300 petty cash fund.
- **Jul 31** The fund contains $46 cash and receipts: taxi $58, office supplies $97, postage $41, coffee for clients (entertainment) $52.

Record the entries. Reimburse the fund on Jul 31.
""",f"""
Receipts 248 + cash 46 = 294, so $6 short. Reimburse 300 − 46 = 254.
{JE(('Jul 1','Petty Cash',300,''),('','Cash','',300),('Jul 31','Travel Expense',58,''),('Jul 31','Office Supplies',97,''),('Jul 31','Postage Expense',41,''),('Jul 31','Entertainment Expense',52,''),('Jul 31','Cash Over and Short',6,''),('','Cash','',254))}
""")

add('E-8-9','Petty cash fund with an overage',f"""
Tilda Studio's $300 fund on Aug 31 contains $71 cash and receipts: delivery $84, office supplies $66, postage $77. Reimburse the fund and **increase it to $400**.
""",f"""
Receipts 227 + cash 71 = 298, so $2 over. Reimburse 300 − 71 = 229, plus 100 to enlarge the fund.
{JE(('Aug 31','Delivery Expense',84,''),('Aug 31','Office Supplies',66,''),('Aug 31','Postage Expense',77,''),('Aug 31','Petty Cash',100,''),('','Cash Over and Short','',2),('','Cash','',325))}
""")

t,_=bankrec(22640,20688,[('Deposits in transit',3215),('Outstanding checks',-4180),('Bank error: another company\'s check charged to us',150)],[('EFT collection from customer',2400),('Interest earned',22),('NSF check',-1340),('Check printing charge',-35),('Error: deposit recorded as $1,780 instead of $1,870',90)])
add('E-8-11','Bank reconciliation and adjusting entries',f"""
Prepare Cleo Co.'s Sep 30 bank reconciliation and the required journal entries.
- Bank balance $22,640; book balance $20,688.
- Deposits in transit $3,215; outstanding checks $4,180.
- The bank charged Cleo $150 for a check written by Clea Co.
- A customer paid $2,400 by electronic transfer (not yet recorded).
- Interest earned $22; check printing charge $35.
- A customer's $1,340 check was returned NSF.
- A $1,870 deposit was recorded in the books as $1,780.
""",f"""
{t}

Entries (book side only):
{JE(('Sep 30','Cash',2400,''),('','Accounts Receivable','',2400),('Sep 30','Cash',22,''),('','Interest Revenue','',22),('Sep 30','Accounts Receivable',1340,''),('','Cash','',1340),('Sep 30','Bank Service Charge Expense',35,''),('','Cash','',35),('Sep 30','Cash',90,''),('','Accounts Receivable','',90))}

The $1,870 deposit is assumed to be a collection on account. The bank error needs no entry; Cleo notifies the bank.
""")

def simple_rec(id,co,mon,bank,book,dit,oc,bank_extra,book_items,entries,note=''):
    t,adj=bankrec(bank,book,[('Deposits in transit',dit),('Outstanding checks',-oc)]+bank_extra,book_items)
    chk(id,('Adjusted cash balance',adj))
    add(id,'Bank reconciliation',f"""
Prepare {co}'s {mon} bank reconciliation.
- Bank statement balance ${f(bank)}; book balance ${f(book)}.
- Deposits in transit ${f(dit)}; outstanding checks ${f(oc)}.
"""+'\n'.join('- '+l for l,_ in bank_extra+book_items)+("\n"+note if note else ''),f"""
{t}
"""+(f"\nEntries:\n{JE(*entries)}" if entries else ''))
simple_rec('E-8-12','Pax Co.','Oct 31',18350,16271,2470,3610,[],[('Collection of note by bank, $1,800 plus $45 interest',1845),('Bank service charge',-25),('NSF check from a customer',-890),('Check #512 for supplies written for $367 but recorded as $376',9)],[])
add('E-8-13','Adjusting entries from bank reconciliation',f"""
Record the journal entries required by Pax Co.'s Oct 31 bank reconciliation (E-8-12).
""",f"""
{JE(('Oct 31','Cash',1845,''),('','Notes Receivable','',1800),('','Interest Revenue','',45),('Oct 31','Bank Service Charge Expense',25,''),('','Cash','',25),('Oct 31','Accounts Receivable',890,''),('','Cash','',890),('Oct 31','Cash',9,''),('','Office Supplies','',9))}
""")
simple_rec('E-8-14','Rhea Co.','Nov 30',9875,10422,1960,1540,[('Bank error: deposit of another company credited to Rhea',-300)],[('EFT payment of utilities not recorded',-240),('Service charge',-18),('Error: check #88 for $645 recorded as $465',-180),('Interest earned',11)],[('Nov 30','Utilities Expense',240,''),('','Cash','',240),('Nov 30','Bank Service Charge Expense',18,''),('','Cash','',18),('Nov 30','Accounts Payable',180,''),('','Cash','',180),('Nov 30','Cash',11,''),('','Interest Revenue','',11)],'Check #88 was a payment to a supplier on account.')

add('E-8-15','Liquid assets and accounts receivable',"""
Compute days' sales uncollected for two competitors (365 days). Which collects faster?
| | Orca | Puffin |
|---|---|---|
| Accounts receivable | $52,600 | $31,900 |
| Net sales | $640,000 | $485,000 |
""","""
- Orca: 52,600 ÷ 640,000 × 365 = **30.0 days**
- Puffin: 31,900 ÷ 485,000 × 365 = **24.0 days**

Puffin collects its receivables faster.
""")
check(round(52600/640000*365,1),30.0); check(round(31900/485000*365,1),24.0)

add('E-8-16A','Documents in a voucher system',"""
For each document, say who prepares it and why it matters.
1. Purchase requisition
2. Purchase order
3. Receiving report
4. Invoice approval
5. Voucher
""","""
1. The department needing goods — requests the purchase.
2. The purchasing department — orders goods from the supplier on agreed terms.
3. The receiving department — shows what actually arrived.
4. Accounting — checks the invoice against the order and receiving report.
5. Accounting — collects the documents and authorizes payment; a check is written only for an approved voucher.
""")

def p_ic(id,co,cases):
    add(id,'Analyzing internal control',f"""
{co}. For each situation, identify the internal control problem and suggest an improvement.
"""+'\n'.join(f'{i+1}. {c}' for i,(c,_) in enumerate(cases)),'\n'.join(f'{i+1}. {a}' for i,(_,a) in enumerate(cases)))
p_ic('P-8-1A','Sage Bakery',[('The owner\'s nephew handles all cash: he takes in sales, deposits them and reconciles the bank.','No separation of duties. Have another person reconcile the bank and compare deposits with register totals.'),('Customers pay cash and no receipt is given.','Sales can go unrecorded. Ring every sale on a register and give receipts.'),('Supplies are bought by any employee and reimbursed from the till.','No authorization. Use a petty cash fund with a custodian and receipts, or purchase orders.'),('Records of checks written are kept only on the check stubs; numbers are not tracked.','Use prenumbered checks and account for every number.')])
p_ic('P-8-1B','Birch Hardware',[('The same clerk orders inventory, receives it and approves payment.','Divide responsibility: purchasing, receiving and accounts payable should be different people.'),('Inventory counts are done by the employee responsible for the stockroom.','Use independent counts by someone not responsible for the stock.'),('Large cash receipts are left in the office overnight.','Deposit daily or use a safe and night deposit.'),('Nobody reviews the bank statement.','Have someone independent of cash handling reconcile the bank monthly.')])

def p_petty(id,co,fund,cash1,r1,cash2,r2,newfund,adjust):
    s1=sum(v for _,v in r1); o1=round(fund-cash1-s1,2); re1=fund-cash1
    s2=sum(v for _,v in r2); o2=round(fund-cash2-s2,2); re2=fund-cash2
    def ent(date,r,over,amt,extra=0):
        rows=[(date,n,v,'') for n,v in r]
        if over>0: rows.append((date,'Cash Over and Short',over,''))
        if extra>0: rows.append((date,'Petty Cash',extra,''))
        if over<0: rows.append(('','Cash Over and Short','',-over))
        if extra<0: rows.append(('','Petty Cash','',-extra))
        rows.append(('','Cash','',amt+extra))
        return JE(*rows)
    chk(id,('Mar 15 cash paid to reimburse',re1),('Mar 31 cash paid (incl. fund change)',re2+newfund-fund))
    add(id,'Establishing, reimbursing and '+('increasing' if newfund>fund else 'adjusting')+' petty cash',f"""
{co}:
- **Mar 1** Established a petty cash fund of ${f(fund)}.
- **Mar 15** The fund has ${f(cash1)} cash and receipts: """+', '.join(f'{n.lower()} ${f(v)}' for n,v in r1)+f""". It was reimbursed.
- **Mar 31** The fund has ${f(cash2)} cash and receipts: """+', '.join(f'{n.lower()} ${f(v)}' for n,v in r2)+f""". It was reimbursed and the fund changed to ${f(newfund)}.

Prepare the journal entries.
""",f"""
{JE(('Mar 1','Petty Cash',fund,''),('','Cash','',fund))}

Mar 15: receipts {f(s1)} + cash {f(cash1)} = {f(s1+cash1)}; {'short' if o1>0 else 'over'} by {f(abs(o1))}. Reimburse {f(re1)}.
{ent('Mar 15',r1,o1,re1)}

Mar 31: receipts {f(s2)} + cash {f(cash2)} = {f(s2+cash2)}; {'short' if o2>0 else 'over'} by {f(abs(o2))}. Reimburse {f(re2)} and {'add' if newfund>fund else 'remove'} {f(abs(newfund-fund))}.
{ent('Mar 31',r2,o2,re2,newfund-fund)}
""")
p_petty('P-8-2A','Fable Design',200,23,[('Postage Expense',48),('Office Supplies',61),('Delivery Expense',67)],31,[('Postage Expense',39),('Office Supplies',72),('Repairs Expense',59)],150,True)
p_petty('P-8-2B','Gable Design',250,28,[('Postage Expense',57),('Office Supplies',74),('Delivery Expense',89)],35,[('Postage Expense',44),('Office Supplies',91),('Repairs Expense',83)],200,True)
p_petty('P-8-3A','Haven Florist',300,42,[('Delivery Expense',116),('Office Supplies',83),('Miscellaneous Expense',62)],18,[('Delivery Expense',135),('Office Supplies',97),('Miscellaneous Expense',47)],450,False)
p_petty('P-8-3B','Iris Florist',350,51,[('Delivery Expense',138),('Office Supplies',94),('Miscellaneous Expense',70)],26,[('Delivery Expense',152),('Office Supplies',108),('Miscellaneous Expense',61)],500,False)

def p_rec(id,co,mon,bank,book,bank_items,book_items,entries,extra=''):
    t,adj=bankrec(bank,book,bank_items,book_items)
    chk(id,('Adjusted cash balance',adj))
    add(id,'Preparing a bank reconciliation and recording adjustments',f"""
{co} — {mon}.
- Cash per bank statement: ${f(bank)}. Cash per books: ${f(book)}.
"""+'\n'.join('- '+d for d in extra.split('|') if d)+"""

1. Prepare the bank reconciliation.
2. Prepare the journal entries needed.
3. What amount of cash is reported on the balance sheet?
""",f"""
1.
{t}

2.
{JE(*entries)}

3. **${f(adj)}** — the adjusted balance.
""")
p_rec('P-8-4A','Moss & Co.','May 31',31480,29577,
 [('Deposit in transit',4320),('Outstanding checks (#871 $1,240; #874 $2,115; #879 $865)',-4220)],
 [('Note collected: $3,000 principal + $90 interest, less $15 fee',3075),('NSF check from L. Ruiz',-1180),('Check printing charge',-45),('Check #866 for repairs written for $463 but recorded as $436',-27),('Error: check #842 recorded as $970 instead of $790',180)],
 [('May 31','Cash',3075,''),('May 31','Bank Service Charge Expense',15,''),('','Notes Receivable','',3000),('','Interest Revenue','',90),('May 31','Accounts Receivable — L. Ruiz',1180,''),('','Cash','',1180),('May 31','Bank Service Charge Expense',45,''),('','Cash','',45),('May 31','Repairs Expense',27,''),('','Cash','',27),('May 31','Cash',180,''),('','Accounts Payable','',180)],
 'A May 31 deposit of $4,320 is not on the statement.|Checks #871 ($1,240), #874 ($2,115) and #879 ($865) are outstanding.|The bank collected a $3,000 note plus $90 interest for Moss and charged a $15 fee.|A $1,180 check from customer L. Ruiz was returned NSF.|The bank charged $45 for printing checks.|Check #866 for repairs was written for $463 but recorded in the books as $436.|Check #842, paid to a supplier on account, was written for $790 but recorded in the books as $970.')
p_rec('P-8-4B','Reed & Co.','Aug 31',26950,24825,
 [('Deposit in transit',3780),('Outstanding checks (#432 $980; #437 $1,605; #440 $2,310)',-4895)],
 [('Note collected: $2,500 principal + $75 interest, less $20 fee',2555),('NSF check from P. Grant',-940),('Check printing charge',-38),('Check #426 for utilities written for $518 but recorded as $581',63),('Error: deposit of $1,290 recorded as $1,920 (collection on account)',-630)],
 [('Aug 31','Cash',2555,''),('Aug 31','Bank Service Charge Expense',20,''),('','Notes Receivable','',2500),('','Interest Revenue','',75),('Aug 31','Accounts Receivable — P. Grant',940,''),('','Cash','',940),('Aug 31','Bank Service Charge Expense',38,''),('','Cash','',38),('Aug 31','Cash',63,''),('','Utilities Expense','',63),('Aug 31','Accounts Receivable',630,''),('','Cash','',630)],
 'An Aug 31 deposit of $3,780 is not on the statement.|Checks #432 ($980), #437 ($1,605) and #440 ($2,310) are outstanding.|The bank collected a $2,500 note plus $75 interest and charged a $20 fee.|A $940 check from customer P. Grant was returned NSF.|The bank charged $38 for printing checks.|Check #426 for utilities was written for $518 but recorded as $581.|A $1,290 deposit (collection on account) was recorded as $1,920.')
p_rec('P-8-5A','Talon Co.','Jun 30',15620,14916,
 [('Deposit in transit',2840),('Outstanding checks',-3375),('Bank error: check of Talen Co. charged to Talon',260)],
 [('EFT receipt from customer',1500),('Interest earned',19),('NSF check',-410),('Service charge',-30),('EFT payment of insurance not recorded',-650)],
 [('Jun 30','Cash',1500,''),('','Accounts Receivable','',1500),('Jun 30','Cash',19,''),('','Interest Revenue','',19),('Jun 30','Accounts Receivable',410,''),('','Cash','',410),('Jun 30','Bank Service Charge Expense',30,''),('','Cash','',30),('Jun 30','Insurance Expense',650,''),('','Cash','',650)],
 'Deposit in transit $2,840; outstanding checks $3,375.|The bank charged Talon $260 for a check written by Talen Co.|A customer paid $1,500 by EFT; interest earned was $19.|A customer\'s $410 check was returned NSF; service charge $30.|The bank paid a $650 insurance premium by EFT that Talon has not recorded.')
p_rec('P-8-5B','Unity Co.','Jul 31',19340,17697,
 [('Deposit in transit',3110),('Outstanding checks',-4260),('Bank error: deposit of Unita Co. credited to Unity',-500)],
 [('EFT receipt from customer',1250),('Interest earned',23),('NSF check',-695),('Service charge',-25),('EFT payment of utilities not recorded',-560)],
 [('Jul 31','Cash',1250,''),('','Accounts Receivable','',1250),('Jul 31','Cash',23,''),('','Interest Revenue','',23),('Jul 31','Accounts Receivable',695,''),('','Cash','',695),('Jul 31','Bank Service Charge Expense',25,''),('','Cash','',25),('Jul 31','Utilities Expense',560,''),('','Cash','',560)],
 'Deposit in transit $3,110; outstanding checks $4,260.|The bank credited Unity with a $500 deposit made by Unita Co.|A customer paid $1,250 by EFT; interest earned was $23.|A customer\'s $695 check was returned NSF; service charge $25.|The bank paid a $560 utility bill by EFT that Unity has not recorded.')

add('QS-8-16','Bank reconciliation items',"""
For each item, say whether it is added to or deducted from the bank balance or the book balance, and whether a journal entry is needed.
1. Deposit in transit
2. Outstanding check
3. Bank service charge
4. Interest earned
5. NSF check
6. Bank collected a note for the company
7. Company recorded a $250 check as $520
8. Bank charged the company for another firm's check
""","""
| Item | Side | Add / deduct | Entry? |
|---|---|---|---|
| 1 | Bank | Add | No |
| 2 | Bank | Deduct | No |
| 3 | Book | Deduct | Yes |
| 4 | Book | Add | Yes |
| 5 | Book | Deduct | Yes |
| 6 | Book | Add | Yes |
| 7 | Book | Add 270 | Yes |
| 8 | Bank | Add | No |
""")

# ---------- key answers for the self-check boxes ----------
chk('QS-8-3',('Cash and cash equivalents',18140))
chk('QS-8-5',('Cash Over and Short (debit)',8))
chk('QS-8-6',('Cash paid to replenish',213),('Cash Over and Short (debit)',2))
chk('QS-8-7',('Adjusted cash balance',13655))
chk('QS-8-35',('Year 2 days\' sales uncollected',30.1,0.1),('Year 1 days\' sales uncollected',28.2,0.1))
chk('E-8-5',('Cash and cash equivalents',47050))
chk('E-8-8',('Cash paid to reimburse',254),('Cash Over and Short (debit)',6))
chk('E-8-9',('Total cash paid',325),('Cash Over and Short (credit)',2))
chk('E-8-11',('Adjusted cash balance',21825))
chk('E-8-13',('Cash debited for the note collection',1845))
chk('E-8-15',('Orca days\' sales uncollected',30.0,0.1),('Puffin days\' sales uncollected',24.0,0.1))

order=[i['id'] for i in json.load(open(os.path.join(os.path.dirname(__file__),'..','..','data','accounting-textbook-index.json')))['items'] if i['chapter']=='8' and not i['id'].startswith('SEC')]
ITEMS.sort(key=lambda x:order.index(x['id']))
assert [i['id'] for i in ITEMS]==order,(set(order)-{i['id'] for i in ITEMS})
attach_checks()
json.dump(ITEMS,open(os.path.join(os.path.dirname(__file__),'..','..','data','textbook-sos','ch8.json'),'w'),ensure_ascii=False,separators=(',',':'))
print(len(ITEMS))
