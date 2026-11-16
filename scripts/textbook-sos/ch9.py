import sys,os,json; sys.path.insert(0,os.path.dirname(__file__))
from sos_lib import *

def interest(p,rate,days,basis=360): return round(p*rate*days/basis,2)

add('QS-9-2','Credit card sales',f"""
Opal Boutique sells $3,600 of goods (cost $2,050) to customers using bank credit cards. The card company charges a 2.5% fee, and cash is deposited immediately. Record the sale.
""",f"""
Fee = 3,600 × 2.5% = 90.
{JE(('Day','Cash',3510,''),('Day','Credit Card Expense',90,''),('','Sales','',3600),('Day','Cost of Sales',2050,''),('','Merchandise Inventory','',2050))}
""")

add('QS-9-3','Direct write-off method',f"""
Opal Boutique uses the direct write-off method. On Apr 12 it decides that a $740 account owed by T. Vance is uncollectible. Record the write-off.
""",f"""
{JE(('Apr 12','Bad Debts Expense',740,''),('','Accounts Receivable — T. Vance','',740))}
""")

add('QS-9-4','Recovering a bad debt',f"""
Direct write-off method. On Aug 3, T. Vance unexpectedly pays the $740 that Opal wrote off on Apr 12 of the same year. Record the recovery.
""",f"""
{JE(('Aug 3','Accounts Receivable — T. Vance',740,''),('','Bad Debts Expense','',740),('Aug 3','Cash',740,''),('','Accounts Receivable — T. Vance','',740))}

Reinstating the account first leaves a record that the customer paid.
""")

add('QS-9-5','Distinguishing between allowance method and direct write-off method',"""
For each statement, write Allowance, Direct write-off or Both.
1. Bad debts expense is recorded when a specific account is found uncollectible.
2. Bad debts are estimated at the end of each period.
3. Matches bad debts expense with the sales that caused it.
4. Accounts receivable is reported at net realizable value.
5. Acceptable only when bad debts are immaterial.
6. Uncollectible accounts are eventually removed from Accounts Receivable.
""","""
1. Direct write-off
2. Allowance
3. Allowance
4. Allowance
5. Direct write-off
6. Both
""")

add('QS-9-6','Allowance method for bad debts',f"""
Opal uses the allowance method.
1. Dec 31: bad debts are estimated at $2,800. Record the adjusting entry (the allowance had a zero balance).
2. Feb 9: write off J. Nash's $430 account.
3. What is the effect of the Feb 9 entry on net accounts receivable?
""",f"""
{JE(('Dec 31','Bad Debts Expense',2800,''),('','Allowance for Doubtful Accounts','',2800),('Feb 9','Allowance for Doubtful Accounts',430,''),('','Accounts Receivable — J. Nash','',430))}

3. No effect — receivables and the allowance both fall by $430.
""")

add('QS-9-7','Reporting allowance for doubtful accounts',f"""
At Dec 31, Opal's Accounts Receivable is $58,400 and the Allowance for Doubtful Accounts has a $3,150 credit balance after adjustment. Show how receivables appear on the balance sheet.
""",f"""
{T(['Current assets',''],['Accounts receivable','58,400'],['Less: Allowance for doubtful accounts','(3,150)'],['**Accounts receivable, net**','**55,250**'])}
""")

add('QS-9-8','Percent of accounts receivable method',f"""
At Dec 31, Accounts Receivable is $96,000 and 3% is expected to be uncollectible.
1. Record bad debts if the allowance has a $1,240 **credit** balance before adjustment.
2. Record bad debts if the allowance has a $460 **debit** balance before adjustment.
""",f"""
Required ending allowance = 96,000 × 3% = 2,880.

1. 2,880 − 1,240 = 1,640.
{JE(('Dec 31','Bad Debts Expense',1640,''),('','Allowance for Doubtful Accounts','',1640))}

2. 2,880 + 460 = 3,340.
{JE(('Dec 31','Bad Debts Expense',3340,''),('','Allowance for Doubtful Accounts','',3340))}
""")

add('QS-9-1','Aging of receivables method',f"""
Opal's aging schedule at Dec 31:
{T(['Age','Balance','Estimated % uncollectible'],['Not yet due','$48,000','1%'],['1–30 days past due','$17,500','4%'],['31–60 days past due','$6,200','12%'],['Over 60 days past due','$3,300','35%'])}
The allowance has a $960 credit balance before adjustment. Record bad debts expense.
""",f"""
{T(['Age','Balance','Rate','Estimated uncollectible'],['Not yet due','48,000','1%','480'],['1–30','17,500','4%','700'],['31–60','6,200','12%','744'],['Over 60','3,300','35%','1,155'],['**Total**','**75,000**','','**3,079**'])}

Adjustment = 3,079 − 960 = 2,119.
{JE(('Dec 31','Bad Debts Expense',2119,''),('','Allowance for Doubtful Accounts','',2119))}
""")
check(480+700+744+1155,3079)

add('QS-9-22','Note receivable',f"""
On Mar 14, Opal accepts a $4,500, 120-day, 8% note from customer R. Bell in exchange for her past-due account.
1. Compute the maturity date.
2. Compute interest (360-day year) and the maturity value.
3. Record the receipt of the note.
""",f"""
1. March 17 days left + April 30 + May 31 + June 30 = 108; 12 more days → **July 12**.
2. Interest = 4,500 × 8% × 120/360 = **$120**; maturity value **$4,620**.
3.
{JE(('Mar 14','Notes Receivable',4500,''),('','Accounts Receivable — R. Bell','',4500))}
""")

add('QS-9-23','Note receivable honored',f"""
R. Bell pays the $4,500, 120-day, 8% note (QS-9-22) in full at maturity on Jul 12. Record the collection.
""",f"""
{JE(('Jul 12','Cash',4620,''),('','Notes Receivable','',4500),('','Interest Revenue','',120))}
""")

add('QS-9-24','Note receivable interest and maturity',f"""
On Nov 16, Opal accepts a $7,200, 90-day, 10% note. Use a 360-day year.
1. Record accrued interest at Dec 31.
2. Record collection of the note at maturity (Feb 14).
""",f"""
1. Nov 16 to Dec 31 = 45 days. Interest = 7,200 × 10% × 45/360 = **$90**.
{JE(('Dec 31','Interest Receivable',90,''),('','Interest Revenue','',90))}

2. Total interest = 7,200 × 10% × 90/360 = 180; 90 already accrued, 90 earned this year.
{JE(('Feb 14','Cash',7380,''),('','Interest Revenue','',90),('','Interest Receivable','',90),('','Notes Receivable','',7200))}
""")
check(interest(7200,.10,45),90); check(interest(7200,.10,90),180)

add('QS-9-25','Factoring receivables',f"""
On Sep 1, Opal factors (sells) $24,000 of accounts receivable to a finance company that charges a 3% fee. Record the sale.
""",f"""
Fee = 24,000 × 3% = 720.
{JE(('Sep 1','Cash',23280,''),('Sep 1','Factoring Fee Expense',720,''),('','Accounts Receivable','',24000))}
""")

add('QS-9-26','Preparing an income statement',f"""
Prepare a single-step income statement for Opal Boutique for the year.
{T(['Account','Amount'],['Sales','$248,000'],['Interest revenue','$1,450'],['Cost of sales','$139,000'],['Salaries expense','$46,500'],['Rent expense','$18,000'],['Credit card expense','$3,720'],['Bad debts expense','$2,980'],['Factoring fee expense','$720'])}
""",f"""
{T(['Opal Boutique — Income Statement',''],['Revenues: Sales','248,000'],['Interest revenue','1,450'],['**Total revenues**','**249,450**'],['Expenses: Cost of sales','139,000'],['Salaries','46,500'],['Rent','18,000'],['Credit card','3,720'],['Bad debts','2,980'],['Factoring fee','720'],['**Total expenses**','**210,920**'],['**Net income**','**38,530**'])}
""")
check(139000+46500+18000+3720+2980+720,210920)

add('QS-9-27','Preparing a balance sheet',f"""
Prepare the current assets section for Opal Boutique at Dec 31.
{T(['Account','Amount'],['Cash','$11,600'],['Accounts receivable','$58,400'],['Allowance for doubtful accounts','$3,150'],['Notes receivable (due in 90 days)','$7,200'],['Interest receivable','$90'],['Merchandise inventory','$34,700'],['Prepaid rent','$1,500'])}
""",f"""
{T(['Current assets',''],['Cash','11,600'],['Accounts receivable 58,400 − allowance 3,150','55,250'],['Notes receivable','7,200'],['Interest receivable','90'],['Merchandise inventory','34,700'],['Prepaid rent','1,500'],['**Total current assets**','**110,340**'])}
""")
check(11600+55250+7200+90+34700+1500,110340)

add('QS-9-9','Percent of sales method',f"""
Opal's credit sales for the year are $410,000. Past experience shows bad debts of 0.75% of credit sales. The allowance has a $1,240 credit balance before adjustment. Record bad debts expense.
""",f"""
Bad debts expense = 410,000 × 0.75% = **3,075** (the existing balance is ignored under the percent-of-sales method).
{JE(('Dec 31','Bad Debts Expense',3075,''),('','Allowance for Doubtful Accounts','',3075))}

The allowance ends at 1,240 + 3,075 = 4,315.
""")

add('E-9-2','Accounts receivable subsidiary ledger; schedule of accounts receivable',f"""
Mira Supply's October credit sales and collections:
- Oct 3 sold to Ash Co. $2,700; Oct 9 sold to Bay Ltd. $1,950; Oct 15 sold to Ash Co. $1,100; Oct 22 sold to Cove Inc. $3,400.
- Oct 18 collected $2,700 from Ash Co.; Oct 29 collected $1,000 from Cove Inc.

1. Compute each customer's Oct 31 balance.
2. Prepare a schedule of accounts receivable and compare it with the controlling account.
""",f"""
{T(['Customer','Debits','Credits','Balance'],['Ash Co.','2,700 + 1,100','2,700','1,100'],['Bay Ltd.','1,950','—','1,950'],['Cove Inc.','3,400','1,000','2,400'],['**Total**','','','**5,450**'])}

Controlling account: sales 9,150 − collections 3,700 = **5,450**, which agrees with the schedule.
""")
check(2700+1950+1100+3400-2700-1000,5450)

add('E-9-3','Accounting for credit card sales',f"""
Mira Supply:
- **Jun 4** Sold $5,200 of goods (cost $3,100) on bank cards with a 2% fee; cash deposited immediately.
- **Jun 6** Sold $2,800 of goods (cost $1,680) on a card that pays the seller later, less a 3% fee.
- **Jun 20** Received payment for the Jun 6 sales.
""",f"""
{JE(('Jun 4','Cash',5096,''),('Jun 4','Credit Card Expense',104,''),('','Sales','',5200),('Jun 4','Cost of Sales',3100,''),('','Merchandise Inventory','',3100),('Jun 6','Accounts Receivable — Card Co.',2716,''),('Jun 6','Credit Card Expense',84,''),('','Sales','',2800),('Jun 6','Cost of Sales',1680,''),('','Merchandise Inventory','',1680),('Jun 20','Cash',2716,''),('','Accounts Receivable — Card Co.','',2716))}
""")

add('E-9-4','Sales on store credit card',f"""
Mira Supply has its own store card.
- **Jul 1** Sold $1,800 of goods (cost $1,050) on the store card.
- **Jul 31** Charged the customer 1.5% interest on the unpaid balance.
- **Aug 10** Collected the full balance.
""",f"""
Interest = 1,800 × 1.5% = 27.
{JE(('Jul 1','Accounts Receivable',1800,''),('','Sales','',1800),('Jul 1','Cost of Sales',1050,''),('','Merchandise Inventory','',1050),('Jul 31','Accounts Receivable',27,''),('','Interest Revenue','',27),('Aug 10','Cash',1827,''),('','Accounts Receivable','',1827))}
""")

add('E-9-5','Direct write-off method',f"""
Mira Supply uses the direct write-off method.
- **Mar 5** Wrote off P. Lowe's $1,260 account.
- **Nov 18** P. Lowe paid $1,260 in full.
""",f"""
{JE(('Mar 5','Bad Debts Expense',1260,''),('','Accounts Receivable — P. Lowe','',1260),('Nov 18','Accounts Receivable — P. Lowe',1260,''),('','Bad Debts Expense','',1260),('Nov 18','Cash',1260,''),('','Accounts Receivable — P. Lowe','',1260))}
""")

add('E-9-6','Writing off receivables',f"""
Mira Supply uses the allowance method.
- **Jan 20** Wrote off Q. Dunn's $880 account.
- **Jun 2** Q. Dunn paid the $880.
Before Jan 20, Accounts Receivable was $64,000 and the allowance $3,200. Record the entries and give net receivables before and after the write-off.
""",f"""
{JE(('Jan 20','Allowance for Doubtful Accounts',880,''),('','Accounts Receivable — Q. Dunn','',880),('Jun 2','Accounts Receivable — Q. Dunn',880,''),('','Allowance for Doubtful Accounts','',880),('Jun 2','Cash',880,''),('','Accounts Receivable — Q. Dunn','',880))}

Net receivables: before 64,000 − 3,200 = 60,800; after 63,120 − 2,320 = **60,800** — unchanged.
""")

add('QS-9-28','Accounts receivable turnover',"""
| | Year 2 | Year 1 |
|---|---|---|
| Net sales | $612,000 | $540,000 |
| Accounts receivable, end of year | $54,000 | $48,000 |
| Accounts receivable, beginning of Year 1 | | $42,000 |

Compute accounts receivable turnover for both years. Is collection improving?
""","""
- Year 2: 612,000 ÷ ((54,000 + 48,000) ÷ 2) = 612,000 ÷ 51,000 = **12.0 times**
- Year 1: 540,000 ÷ ((48,000 + 42,000) ÷ 2) = 540,000 ÷ 45,000 = **12.0 times**

No change — receivables are collected about 12 times a year in both years.
""")

add('E-9-1','Percent of receivables method',f"""
At Dec 31, Tate Co. has Accounts Receivable of $142,000 and expects 2.5% to be uncollectible. Before adjustment, the allowance has a $1,580 credit balance.
1. Record the adjusting entry.
2. What is the net realizable value of receivables?
""",f"""
Required allowance 142,000 × 2.5% = 3,550; adjustment 3,550 − 1,580 = 1,970.
{JE(('Dec 31','Bad Debts Expense',1970,''),('','Allowance for Doubtful Accounts','',1970))}

2. 142,000 − 3,550 = **$138,450**.
""")

add('E-9-55','Estimating bad debts',f"""
Tate Co.: credit sales $780,000; Accounts Receivable $142,000; allowance before adjustment $620 **debit**.
Compute bad debts expense and the ending allowance using (a) 1% of credit sales and (b) 3% of receivables.
""",f"""
{T(['','(a) % of sales','(b) % of receivables'],['Bad debts expense','780,000 × 1% = **7,800**','4,260 + 620 = **4,880**'],['Ending allowance','7,800 − 620 = **7,180** credit','142,000 × 3% = **4,260** credit'])}
""")

add('E-9-56','Aging of receivables schedule',f"""
Tate Co.'s receivables at Dec 31:
{T(['Customer','Total','Not due','1–30','31–60','61–90','Over 90'],['Ark','8,000','8,000','','','',''],['Bly','5,600','2,000','3,600','','',''],['Coe','4,300','','','4,300','',''],['Dyn','2,700','','','','2,700',''],['Eko','1,400','','','','','1,400'])}
Rates: not due 1%, 1–30 3%, 31–60 8%, 61–90 20%, over 90 50%. The allowance has a $410 credit balance before adjustment.
Prepare the aging analysis and the adjusting entry.
""",f"""
{T(['Age','Amount','Rate','Estimate'],['Not due','10,000','1%','100'],['1–30','3,600','3%','108'],['31–60','4,300','8%','344'],['61–90','2,700','20%','540'],['Over 90','1,400','50%','700'],['**Total**','**22,000**','','**1,792**'])}

Adjustment = 1,792 − 410 = 1,382.
{JE(('Dec 31','Bad Debts Expense',1382,''),('','Allowance for Doubtful Accounts','',1382))}
""")
check(100+108+344+540+700,1792)

add('E-9-23','Notes receivable transactions',"""
Compute interest (360-day year) and the maturity date for each note.
| Note | Date | Principal | Rate | Term |
|---|---|---|---|---|
| A | Jan 10 | $6,000 | 9% | 90 days |
| B | May 5 | $12,500 | 6% | 60 days |
| C | Oct 20 | $8,400 | 10% | 120 days |
""","""
| Note | Interest | Maturity date |
|---|---|---|
| A | 6,000 × 9% × 90/360 = **135** | Jan 21 + Feb 28 + Mar 31 = 80 → **Apr 10** |
| B | 12,500 × 6% × 60/360 = **125** | May 26 + 30 = 56 → **Jul 4** |
| C | 8,400 × 10% × 120/360 = **280** | Oct 11 + Nov 30 + Dec 31 + Jan 31 = 103 → **Feb 17** |

(Assumes a non-leap year.)
""")
check(interest(6000,.09,90),135); check(interest(12500,.06,60),125); check(interest(8400,.10,120),280)

add('E-9-24','Notes receivable transactions',f"""
Tate Co.:
- **Dec 1** Accepted a $9,000, 60-day, 8% note from L. Ford for an overdue account.
- **Dec 31** Accrued interest.
- **Jan 30** L. Ford paid the note.
""",f"""
Dec interest = 9,000 × 8% × 30/360 = 60; total interest 120.
{JE(('Dec 1','Notes Receivable',9000,''),('','Accounts Receivable — L. Ford','',9000),('Dec 31','Interest Receivable',60,''),('','Interest Revenue','',60),('Jan 30','Cash',9120,''),('','Interest Revenue','',60),('','Interest Receivable','',60),('','Notes Receivable','',9000))}
""")

add('E-9-25','Honoring a note',f"""
On Apr 3, Tate accepts a $5,400, 45-day, 10% note from M. Gill. M. Gill pays at maturity. Record the note and the collection (360-day year).
""",f"""
Interest = 5,400 × 10% × 45/360 = 67.50. Maturity: Apr 27 days + 18 = **May 18**.
{JE(('Apr 3','Notes Receivable',5400,''),('','Accounts Receivable — M. Gill','',5400),('May 18','Cash',5467.50,''),('','Notes Receivable','',5400),('','Interest Revenue','',67.50))}
""")

add('E-9-26','Dishonoring a note',f"""
Tate holds a $5,400, 45-day, 10% note from M. Gill. On the maturity date (May 18), M. Gill dishonors the note.
1. Record the dishonor.
2. On Dec 31 Tate decides the account is uncollectible (allowance method). Record the write-off.
""",f"""
1.
{JE(('May 18','Accounts Receivable — M. Gill',5467.50,''),('','Interest Revenue','',67.50),('','Notes Receivable','',5400))}

2.
{JE(('Dec 31','Allowance for Doubtful Accounts',5467.50,''),('','Accounts Receivable — M. Gill','',5467.50))}
""")

add('E-9-27','Selling and pledging accounts receivable',f"""
Tate Co.:
- **Jul 1** Sold $30,000 of receivables to a factor charging a 2% fee.
- **Jul 9** Borrowed $40,000 from the bank, pledging $55,000 of receivables as security.

Record the entries and explain how the pledge is reported.
""",f"""
{JE(('Jul 1','Cash',29400,''),('Jul 1','Factoring Fee Expense',600,''),('','Accounts Receivable','',30000),('Jul 9','Cash',40000,''),('','Notes Payable','',40000))}

Pledged receivables stay on the balance sheet; the pledge is disclosed in the notes so readers know they secure the loan.
""")

add('E-9-28','Accounts receivable turnover',"""
| | Lyra | Mako |
|---|---|---|
| Net sales | $486,000 | $322,000 |
| Average accounts receivable | $40,500 | $35,000 |

Compute accounts receivable turnover. Which company collects faster?
""","""
- Lyra: 486,000 ÷ 40,500 = **12.0 times**
- Mako: 322,000 ÷ 35,000 = **9.2 times**

Lyra collects its receivables faster.
""")

def p_card(id,co,cardsales,fee,ar_sales,cost_pct,store,storeint):
    fee_amt=round(cardsales*fee/100,2)
    add(id,'Sales on account and credit card sales',f"""
{co} (perpetual; cost of sales is {cost_pct}% of sales):
- **Day 3** Sold ${f(cardsales)} of goods on bank credit cards, fee {fee}%; cash received immediately.
- **Day 8** Sold ${f(ar_sales)} of goods to customer Nova on account, n/30.
- **Day 12** Sold ${f(store)} of goods on the company's own store card.
- **Day 30** Charged {storeint}% interest on the unpaid store-card balance.
- **Day 38** Nova paid in full.

Prepare the journal entries.
""",f"""
Card fee = {f(cardsales)} × {fee}% = {f(fee_amt)}. Store-card interest = {f(store)} × {storeint}% = {f(round(store*storeint/100,2))}.
{JE(('Day 3','Cash',round(cardsales-fee_amt,2),''),('Day 3','Credit Card Expense',fee_amt,''),('','Sales','',cardsales),('Day 3','Cost of Sales',round(cardsales*cost_pct/100,2),''),('','Merchandise Inventory','',round(cardsales*cost_pct/100,2)),('Day 8','Accounts Receivable — Nova',ar_sales,''),('','Sales','',ar_sales),('Day 8','Cost of Sales',round(ar_sales*cost_pct/100,2),''),('','Merchandise Inventory','',round(ar_sales*cost_pct/100,2)),('Day 12','Accounts Receivable',store,''),('','Sales','',store),('Day 12','Cost of Sales',round(store*cost_pct/100,2),''),('','Merchandise Inventory','',round(store*cost_pct/100,2)),('Day 30','Accounts Receivable',round(store*storeint/100,2),''),('','Interest Revenue','',round(store*storeint/100,2)),('Day 38','Cash',ar_sales,''),('','Accounts Receivable — Nova','',ar_sales))}
""")
p_card('P-9-2A','Sable Sports',8400,3,5600,60,2400,1.5)
p_card('P-9-2B','Tulip Sports',7200,2.5,4800,55,3200,2)

def p_bad(id,co,y1,y2):
    out_p=[];out_s=[]
    allow=0
    for yr,(sales,wo,rec,ar,pct) in enumerate([y1,y2],1):
        before=allow-wo+rec
        need=round(ar*pct/100,2); exp=round(need-before,2); allow=need
        out_p.append(f"- **Year {yr}:** credit sales ${f(sales)}; accounts written off ${f(wo)}; recoveries ${f(rec)}; Dec 31 accounts receivable ${f(ar)}; estimated uncollectible {pct}% of receivables.")
        out_s.append(f"""**Year {yr}**: allowance before adjustment = {('credit '+f(before)) if before>=0 else ('debit '+f(-before))}. Required = {f(ar)} × {pct}% = {f(need)}. Bad debts expense = **{f(exp)}**.
{JE(('Dec 31','Bad Debts Expense',exp,''),('','Allowance for Doubtful Accounts','',exp))}
Balance sheet: receivables {f(ar)} − allowance {f(need)} = **{f(round(ar-need,2))}**.""")
    add(id,'Estimating and reporting bad debts',f"""
{co} began operations in Year 1 and uses the allowance method based on a percent of receivables.
"""+'\n'.join(out_p)+"""

For each year, compute the allowance balance before adjustment, record bad debts expense, and show net receivables.
""",'\n\n'.join(out_s))
p_bad('P-9-3A','Quill Co.',(620000,4100,0,88000,4),(705000,5300,600,96500,4))
p_bad('P-9-3B','Raven Co.',(540000,3600,0,74000,5),(598000,4200,450,81200,5))

def p_aging(id,co,buckets,rates,before_credit,wo):
    est=[round(a*r/100,2) for a,r in zip(buckets,rates)]; total=sum(est); exp=round(total-before_credit,2)
    names=['Not yet due','1–30 days past due','31–60 days past due','61–90 days past due','Over 90 days past due']
    add(id,'Aging accounts receivable and accounting for bad debts',f"""
{co} ages its receivables at Dec 31:
{T(['Age','Balance','Estimated % uncollectible'],*[[n,'$'+f(a),f(r)+'%'] for n,a,r in zip(names,buckets,rates)])}
The allowance has a ${f(before_credit)} credit balance before adjustment.
1. Compute the required allowance.
2. Record the adjusting entry.
3. On Feb 15 next year, a ${f(wo)} account is written off. Record it and state the effect on net receivables.
""",f"""
1.
{T(['Age','Balance','Rate','Estimate'],*[[n,f(a),f(r)+'%',f(e)] for n,a,r,e in zip(names,buckets,rates,est)],['**Total**','**'+f(sum(buckets))+'**','','**'+f(round(total,2))+'**'])}

2. {f(round(total,2))} − {f(before_credit)} = {f(exp)}.
{JE(('Dec 31','Bad Debts Expense',exp,''),('','Allowance for Doubtful Accounts','',exp))}

3.
{JE(('Feb 15','Allowance for Doubtful Accounts',wo,''),('','Accounts Receivable','',wo))}
No effect on net receivables.
""")
p_aging('P-9-4A','Sorrel Co.',[124000,41000,18500,7200,3800],[1,3,10,25,60],2150,1450)
p_aging('P-9-4B','Thistle Co.',[98000,36500,14200,6400,2900],[1,4,12,30,55],1780,1120)

add('P-9-5A','Accounts receivable transactions and bad debts',f"""
Umber Co. (allowance method; 360-day year). Beginning balances: Accounts Receivable $72,000; Allowance $3,100 credit.
- **Jan 15** Sales on account $46,000 (ignore cost of sales).
- **Feb 3** Collections on account $51,000.
- **Mar 9** Wrote off W. Kerr's $1,350 account.
- **Apr 2** Accepted a $6,000, 90-day, 8% note from Y. Lane for her overdue account.
- **Jul 1** Y. Lane paid the note.
- **Sep 12** W. Kerr paid the $1,350 written off on Mar 9.
- **Dec 31** Bad debts are estimated at 6% of the ending Accounts Receivable.

1. Record the transactions.
2. Compute ending Accounts Receivable and record bad debts expense.
""",f"""
Lane note interest = 6,000 × 8% × 90/360 = 120.
{JE(('Jan 15','Accounts Receivable',46000,''),('','Sales','',46000),('Feb 3','Cash',51000,''),('','Accounts Receivable','',51000),('Mar 9','Allowance for Doubtful Accounts',1350,''),('','Accounts Receivable — W. Kerr','',1350),('Apr 2','Notes Receivable',6000,''),('','Accounts Receivable — Y. Lane','',6000),('Jul 1','Cash',6120,''),('','Notes Receivable','',6000),('','Interest Revenue','',120),('Sep 12','Accounts Receivable — W. Kerr',1350,''),('','Allowance for Doubtful Accounts','',1350),('Sep 12','Cash',1350,''),('','Accounts Receivable — W. Kerr','',1350))}

2. Accounts Receivable = 72,000 + 46,000 − 51,000 − 1,350 − 6,000 + 1,350 − 1,350 = **59,650**.
Required allowance = 59,650 × 6% = 3,579. Allowance before adjustment = 3,100 − 1,350 + 1,350 = 3,100 credit. Bad debts expense = 3,579 − 3,100 = **479**.
{JE(('Dec 31','Bad Debts Expense',479,''),('','Allowance for Doubtful Accounts','',479))}
""")
check(72000+46000-51000-1350-6000+1350-1350,59650)

def p_notes(id,co,notes):
    lines=[];sol=[]
    for (d,maker,p,r,days,mat,outcome,accr) in notes:
        i=interest(p,r,days); lines.append(f"- **{d}** Accepted a ${f(p)}, {days}-day, {int(r*100)}% note from {maker} (maturity {mat}); at maturity it is {outcome}.")
        rows=[(d,'Notes Receivable',p,''),('','Accounts Receivable — '+maker,'',p)]
        if accr:
            ai=interest(p,r,accr); rows+=[('Dec 31','Interest Receivable',ai,''),('','Interest Revenue','',ai)]
        else: ai=0
        if outcome=='honored':
            rows+=[(mat,'Cash',round(p+i,2),''),('','Notes Receivable','',p),('','Interest Revenue','',round(i-ai,2))]+([('','Interest Receivable','',ai)] if ai else [])
        else:
            rows+=[(mat,'Accounts Receivable — '+maker,round(p+i,2),''),('','Notes Receivable','',p),('','Interest Revenue','',round(i-ai,2))]+([('','Interest Receivable','',ai)] if ai else [])
        sol.append(f"**{maker}** — interest {f(p)} × {int(r*100)}% × {days}/360 = {f(i)}"+(f"; accrued at Dec 31: {accr} days = {f(ai)}" if accr else '')+f".\n{JE(*rows)}")
    add(id,'Analyzing and journalizing notes receivable',f"""
{co} (360-day year):
"""+'\n'.join(lines)+"""

Record all entries, including any Dec 31 interest accrual.
""",'\n\n'.join(sol))
p_notes('P-9-6A','Vesper Co.',[('Mar 1','A. Hale',8000,0.09,90,'May 30','honored',0),('Jun 10','B. Ivers',5000,0.06,60,'Aug 9','dishonored',0),('Nov 1','C. Jett',12000,0.10,120,'Mar 1','honored',60)])
p_notes('P-9-5B','Willow Co.',[('Feb 5','D. Knox',7500,0.08,90,'May 6','honored',0),('Jul 15','E. Lund',4800,0.075,60,'Sep 13','dishonored',0),('Dec 1','F. Moss',9600,0.09,90,'Mar 1','honored',30)])


order=[i['id'] for i in json.load(open(os.path.join(os.path.dirname(__file__),'..','..','data','accounting-textbook-index.json')))['items'] if i['chapter']=='9' and not i['id'].startswith('SEC')]
ITEMS.sort(key=lambda x:order.index(x['id']))
assert [i['id'] for i in ITEMS]==order,(set(order)-{i['id'] for i in ITEMS})
json.dump(ITEMS,open(os.path.join(os.path.dirname(__file__),'..','..','data','textbook-sos','ch9.json'),'w'),ensure_ascii=False,separators=(',',':'))
print(len(ITEMS))
