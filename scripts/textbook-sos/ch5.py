import sys,json; sys.path.insert(0,__import__('os').path.dirname(__file__))
from sos_lib import *

P='Use a perpetual inventory system and the gross method unless told otherwise.'

add('QS-5-1','Recording purchases, returns and discounts',f"""
{P}
Prepare journal entries for Lumen Retail:
- **Mar 3** Bought $4,200 of merchandise on credit from Brightway, terms 2/10, n/30.
- **Mar 6** Returned $700 of defective goods from the Mar 3 purchase.
- **Mar 13** Paid Brightway the balance owed, within the discount period.
""",f"""
Balance owed after the return: 4,200 − 700 = 3,500. Discount: 3,500 × 2% = 70.

{JE(('Mar 3','Merchandise Inventory',4200,''),('','Accounts Payable','',4200),('Mar 6','Accounts Payable',700,''),('','Merchandise Inventory','',700),('Mar 13','Accounts Payable',3500,''),('','Merchandise Inventory','',70),('','Cash','',3430))}

Under a perpetual system the discount reduces the cost of inventory.
""")

add('QS-5-2','Applying merchandising terms',"""
Match each term with its meaning.
1. FOB shipping point
2. Credit terms 3/15, n/45
3. Purchase discount
4. FOB destination
5. Credit period

Meanings:
a. Ownership passes when goods arrive at the buyer; the seller pays freight.
b. The time allowed before full payment is due.
c. A reduction in price the buyer gets for paying early.
d. Ownership passes when goods leave the seller; the buyer pays freight.
e. A 3% discount if paid within 15 days, otherwise the full amount is due in 45 days.
""","""
1 → d, 2 → e, 3 → c, 4 → a, 5 → b.
""")

add('QS-5-4','Identifying inventory costs',"""
Mira Gifts bought a display cabinet of goods for resale. Which of these costs belong in Merchandise Inventory?
1. Invoice price, $6,500
2. Freight paid to bring the goods to the store, $310
3. Insurance on the goods while in transit, $90
4. Import duties, $420
5. Advertising to launch the goods, $250
6. Commission paid to the salesperson who later sold them, $180

Compute the cost recorded in inventory.
""","""
Include costs to bring the goods to a saleable condition and location: 1, 2, 3 and 4.

6,500 + 310 + 90 + 420 = **$7,320**.

Advertising (5) and sales commissions (6) are selling expenses of the period.
""")

add('QS-5-5','Merchandise accounts and computations',f"""
Use the data to compute each missing amount.
{T(['Item','Shop A','Shop B'],['Net sales','$84,000','?'],['Cost of goods sold','?','$61,000'],['Gross profit','$29,400','$39,000'],['Operating expenses','$18,200','?'],['Net income','?','$12,500'])}
""",f"""
{T(['Item','Shop A','Shop B'],['Net sales','$84,000','**$100,000** (61,000 + 39,000)'],['Cost of goods sold','**$54,600** (84,000 − 29,400)','$61,000'],['Gross profit','$29,400','$39,000'],['Operating expenses','$18,200','**$26,500** (39,000 − 12,500)'],['Net income','**$11,200** (29,400 − 18,200)','$12,500'])}
""")

add('QS-5-6','Computing net invoice amounts',f"""
Compute the amount paid for each invoice if payment is made within the discount period.
{T(['Invoice','Amount','Terms'],['A','$2,600','2/10, n/30'],['B','$9,450','3/15, n/45'],['C','$780','1/10, n/60'])}
""",f"""
{T(['Invoice','Discount','Amount paid'],['A','2,600 × 2% = 52','**$2,548**'],['B','9,450 × 3% = 283.50','**$9,166.50**'],['C','780 × 1% = 7.80','**$772.20**'])}
""")

add('QS-5-7','Recording purchases and discounts taken',f"""
{P}
- **Jun 1** Tern Co. buys $5,600 of merchandise on credit, terms 2/10, n/30.
- **Jun 9** Tern pays the invoice in full.

Record both entries.
""",f"""
Paid within 10 days, so the 2% discount applies: 5,600 × 2% = 112.
{JE(('Jun 1','Merchandise Inventory',5600,''),('','Accounts Payable','',5600),('Jun 9','Accounts Payable',5600,''),('','Merchandise Inventory','',112),('','Cash','',5488))}
""")

add('QS-5-8','Recording purchases and discounts missed',f"""
{P}
- **Jun 1** Tern Co. buys $5,600 of merchandise on credit, terms 2/10, n/30.
- **Jun 25** Tern pays the invoice in full.

Record both entries.
""",f"""
Jun 25 is after the 10-day discount period, so the full amount is paid.
{JE(('Jun 1','Merchandise Inventory',5600,''),('','Accounts Payable','',5600),('Jun 25','Accounts Payable',5600,''),('','Cash','',5600))}
""")

add('QS-5-9','Recording sales, returns and discounts taken',f"""
{P}
Pell Outfitters:
- **Apr 2** Sold $3,000 of goods on credit (cost $1,800), terms 2/10, n/30.
- **Apr 5** The customer returned $400 of the goods (cost $240); they can be resold.
- **Apr 11** Received payment of the balance.
""",f"""
Balance after the return: 3,000 − 400 = 2,600. Discount: 2,600 × 2% = 52.
{JE(('Apr 2','Accounts Receivable',3000,''),('','Sales','',3000),('Apr 2','Cost of Goods Sold',1800,''),('','Merchandise Inventory','',1800),('Apr 5','Sales Returns and Allowances',400,''),('','Accounts Receivable','',400),('Apr 5','Merchandise Inventory',240,''),('','Cost of Goods Sold','',240),('Apr 11','Cash',2548,''),('Apr 11','Sales Discounts',52,''),('','Accounts Receivable','',2600))}
""")

add('QS-5-21','Computing and analyzing gross margin ratio',f"""
Compute the gross margin ratio for each company and say which is stronger.
{T(['','North Co.','South Co.'],['Net sales','$420,000','$185,000'],['Cost of goods sold','$302,400','$118,400'])}
""",f"""
- North: (420,000 − 302,400) ÷ 420,000 = 117,600 ÷ 420,000 = **28.0%**
- South: (185,000 − 118,400) ÷ 185,000 = 66,600 ÷ 185,000 = **36.0%**

South keeps more of each sales dollar after cost of goods sold, so its gross margin is stronger.
""")
check(117600/420000,0.28); check(66600/185000,0.36)

add('QS-5-22','Multiple-step income statement',"""
Classify each item for a multiple-step income statement: Net sales, Cost of goods sold, Selling expense, General & administrative expense, or Other revenues and expenses.
1. Sales discounts
2. Office salaries
3. Delivery expense
4. Interest expense
5. Freight-in
6. Gain on sale of equipment
7. Depreciation on store equipment
8. Sales returns and allowances
""","""
1. Net sales (contra revenue)
2. General & administrative expense
3. Selling expense
4. Other revenues and expenses
5. Cost of goods sold (part of inventory cost)
6. Other revenues and expenses
7. Selling expense
8. Net sales (contra revenue)
""")

add('QS-5-23','Closing entries',f"""
Adjusted balances for Vale Store at Dec 31: Sales $150,000; Sales Returns and Allowances $4,000; Sales Discounts $2,500; Cost of Goods Sold $88,000; Selling Expenses $21,000; Administrative Expenses $15,500; R. Vale, Withdrawals $9,000.
Prepare the closing entries.
""",f"""
{JE(('Dec 31','Sales',150000,''),('','Income Summary','',150000),('Dec 31','Income Summary',131000,''),('','Sales Returns and Allowances','',4000),('','Sales Discounts','',2500),('','Cost of Goods Sold','',88000),('','Selling Expenses','',21000),('','Administrative Expenses','',15500),('Dec 31','Income Summary',19000,''),('','R. Vale, Capital','',19000),('Dec 31','R. Vale, Capital',9000,''),('','R. Vale, Withdrawals','',9000))}

Net income = 150,000 − 131,000 = 19,000.
""")
check(4000+2500+88000+21000+15500,131000)

add('QS-5-24','Preparing a multiple-step income statement',f"""
Prepare a multiple-step income statement for Orin Supply for the year.
{T(['Account','Amount'],['Sales','$212,000'],['Sales returns and allowances','$6,000'],['Sales discounts','$3,000'],['Cost of goods sold','$121,000'],['Sales salaries','$27,000'],['Advertising expense','$8,500'],['Office salaries','$19,000'],['Rent expense — office','$7,200'],['Interest expense','$1,800'])}
""",f"""
{T(['Orin Supply — Income Statement','',''],['Sales','','212,000'],['Less: Sales returns and allowances','6,000',''],['Less: Sales discounts','3,000','9,000'],['**Net sales**','','**203,000**'],['Cost of goods sold','','121,000'],['**Gross profit**','','**82,000**'],['Selling expenses: Sales salaries','27,000',''],['Advertising','8,500','35,500'],['General & admin: Office salaries','19,000',''],['Rent — office','7,200','26,200'],['**Income from operations**','','**20,300**'],['Other expenses: Interest','','1,800'],['**Net income**','','**18,500**'])}
""")
check(203000-121000,82000); check(82000-35500-26200,20300)

add('QS-5-25','Preparing a classified balance sheet for a merchandiser',f"""
Prepare the current assets section of Kova Trading's classified balance sheet.
{T(['Account','Amount'],['Cash','$7,400'],['Accounts receivable','$12,300'],['Merchandise inventory','$26,800'],['Prepaid insurance','$1,500'],['Store equipment','$40,000'],['Accumulated depreciation — store equipment','$9,000'],['Accounts payable','$10,200'])}
""",f"""
{T(['Current assets',''],['Cash','7,400'],['Accounts receivable','12,300'],['Merchandise inventory','26,800'],['Prepaid insurance','1,500'],['**Total current assets**','**48,000**'])}

Store equipment is a non-current (plant) asset; accounts payable is a current liability.
""")

add('QS-5-26','Computing and interpreting acid-test ratio',f"""
Compute the acid-test ratio and comment.
{T(['Item','Amount'],['Cash','$5,200'],['Short-term investments','$3,800'],['Accounts receivable','$9,000'],['Merchandise inventory','$22,000'],['Prepaid expenses','$1,400'],['Current liabilities','$20,000'])}
""",f"""
Quick assets = 5,200 + 3,800 + 9,000 = 18,000. Acid-test = 18,000 ÷ 20,000 = **0.90**.

Below 1.0: without selling inventory, the company could not cover all current liabilities right away.
""")

add('QS-5-27A','Contrasting periodic and perpetual systems',"""
For each statement, write Periodic, Perpetual or Both.
1. Cost of goods sold is recorded at the time of each sale.
2. Purchases of merchandise are debited to a Purchases account.
3. A physical count of inventory is taken at year-end.
4. The Merchandise Inventory account is updated only at the end of the period.
5. Purchase discounts are credited to Merchandise Inventory.
""","""
1. Perpetual
2. Periodic
3. Both (to find shrinkage under perpetual; to find ending inventory under periodic)
4. Periodic
5. Perpetual
""")

add('QS-5-28A','Recording purchases, returns and discounts — periodic',f"""
Use a **periodic** system. Lumen Retail:
- **Mar 3** Bought $4,200 of merchandise on credit, terms 2/10, n/30.
- **Mar 6** Returned $700 of defective goods.
- **Mar 13** Paid the balance within the discount period.
""",f"""
{JE(('Mar 3','Purchases',4200,''),('','Accounts Payable','',4200),('Mar 6','Accounts Payable',700,''),('','Purchases Returns and Allowances','',700),('Mar 13','Accounts Payable',3500,''),('','Purchases Discounts','',70),('','Cash','',3430))}
""")

add('QS-5-29A','Recording sales, returns and discounts — periodic',f"""
Use a **periodic** system. Pell Outfitters:
- **Apr 2** Sold $3,000 of goods on credit (cost $1,800), terms 2/10, n/30.
- **Apr 5** The customer returned $400 of goods (cost $240).
- **Apr 11** Received payment of the balance.
""",f"""
Under a periodic system no cost of goods sold entries are made at the time of sale or return.
{JE(('Apr 2','Accounts Receivable',3000,''),('','Sales','',3000),('Apr 5','Sales Returns and Allowances',400,''),('','Accounts Receivable','',400),('Apr 11','Cash',2548,''),('Apr 11','Sales Discounts',52,''),('','Accounts Receivable','',2600))}
""")

add('QS-5-42C','Recording purchases, returns and discounts — net method',f"""
Use the **net method** (perpetual). Lumen Retail:
- **Mar 3** Bought $4,200 of merchandise on credit, terms 2/10, n/30.
- **Mar 6** Returned $700 of the goods.
- **Mar 20** Paid the balance (after the discount period).
""",f"""
Record at net: 4,200 × 98% = 4,116. Return at net: 700 × 98% = 686. Balance at net 3,430; full balance 3,500, so the missed discount is 70.
{JE(('Mar 3','Merchandise Inventory',4116,''),('','Accounts Payable','',4116),('Mar 6','Accounts Payable',686,''),('','Merchandise Inventory','',686),('Mar 20','Accounts Payable',3430,''),('Mar 20','Discounts Lost',70,''),('','Cash','',3500))}
""")

add('QS-5-43B','Recording estimates of future returns',f"""
At Dec 31, Harbor Goods estimates that $2,400 of this year's sales will be returned next year. The goods cost $1,440 and can be resold. Record the adjusting entries.
""",f"""
{JE(('Dec 31','Sales Returns and Allowances',2400,''),('','Sales Refund Payable','',2400),('Dec 31','Inventory Returns Estimated',1440,''),('','Cost of Goods Sold','',1440))}

Revenue is reduced for expected refunds, and the expected returned goods are shown as an asset.
""")

add('QS-5-44C','Recording sales, returns and discounts — net method',f"""
Use the **net method** for sales (perpetual). Pell Outfitters:
- **Apr 2** Sold $3,000 on credit (cost $1,800), terms 2/10, n/30.
- **Apr 5** Customer returned $400 of goods (cost $240).
- **Apr 25** Received payment of the balance (discount period missed).
""",f"""
Sale at net: 3,000 × 98% = 2,940. Return at net: 400 × 98% = 392. Balance at net 2,548; customer pays the gross 2,600, so 52 is Interest Revenue (discounts forfeited).
{JE(('Apr 2','Accounts Receivable',2940,''),('','Sales','',2940),('Apr 2','Cost of Goods Sold',1800,''),('','Merchandise Inventory','',1800),('Apr 5','Sales Returns and Allowances',392,''),('','Accounts Receivable','',392),('Apr 5','Merchandise Inventory',240,''),('','Cost of Goods Sold','',240),('Apr 25','Cash',2600,''),('','Accounts Receivable','',2548),('','Interest Revenue','',52))}
""")

add('E-5-2','Computing revenues, expenses and income',f"""
Fill in the missing amounts for three companies.
{T(['','X','Y','Z'],['Sales','$64,000','$?','$95,500'],['Cost of goods sold','$?','$41,800','$63,200'],['Gross profit','$22,900','$27,600','$?'],['Expenses','$15,400','$?','$24,900'],['Net income (loss)','$?','$9,100','$?'])}
""",f"""
{T(['','X','Y','Z'],['Sales','64,000','**69,400**','95,500'],['Cost of goods sold','**41,100**','41,800','63,200'],['Gross profit','22,900','27,600','**32,300**'],['Expenses','15,400','**18,500**','24,900'],['Net income','**7,500**','9,100','**7,400**'])}
""")

add('E-5-4','Operating cycle for a merchandiser',"""
1. Put these events of a merchandiser's operating cycle in order: (a) collect cash from customers, (b) buy merchandise, (c) sell merchandise on credit, (d) hold inventory.
2. Explain why a merchandiser selling only for cash has a shorter operating cycle.
""","""
1. b → d → c → a.
2. A cash sale turns inventory straight into cash, so there is no waiting period for receivables to be collected.
""")

add('E-5-5','Recording purchases, purchases returns and allowances',f"""
{P}
Nara Home:
- **May 2** Bought $8,000 of merchandise on credit from Ocean Co., terms 2/10, n/30, FOB shipping point.
- **May 3** Paid $260 freight on the May 2 purchase.
- **May 5** Received a $500 allowance for scratched goods (kept the goods).
- **May 11** Paid Ocean Co. the balance due.
""",f"""
Balance: 8,000 − 500 = 7,500. Discount 7,500 × 2% = 150.
{JE(('May 2','Merchandise Inventory',8000,''),('','Accounts Payable','',8000),('May 3','Merchandise Inventory',260,''),('','Cash','',260),('May 5','Accounts Payable',500,''),('','Merchandise Inventory','',500),('May 11','Accounts Payable',7500,''),('','Merchandise Inventory','',150),('','Cash','',7350))}

The discount does not apply to freight paid to a carrier.
""")

add('E-5-6','Recording sales, sales returns and allowances',f"""
{P}
Ocean Co. (the seller in the Nara Home purchase):
- **May 2** Sold $8,000 of goods to Nara Home on credit, terms 2/10, n/30, FOB shipping point; cost $4,800.
- **May 5** Granted Nara a $500 allowance for scratched goods.
- **May 11** Received payment of the balance.
""",f"""
{JE(('May 2','Accounts Receivable',8000,''),('','Sales','',8000),('May 2','Cost of Goods Sold',4800,''),('','Merchandise Inventory','',4800),('May 5','Sales Returns and Allowances',500,''),('','Accounts Receivable','',500),('May 11','Cash',7350,''),('May 11','Sales Discounts',150,''),('','Accounts Receivable','',7500))}

An allowance with no goods returned needs no inventory entry.
""")

add('QS-5-45','Sales transactions',f"""
{P}
Fern Sports:
- **Jul 4** Sold $1,250 of goods for cash (cost $700).
- **Jul 8** Sold $2,200 of goods on credit (cost $1,320), terms 1/10, n/30.
- **Jul 17** Collected the Jul 8 sale in full.
""",f"""
{JE(('Jul 4','Cash',1250,''),('','Sales','',1250),('Jul 4','Cost of Goods Sold',700,''),('','Merchandise Inventory','',700),('Jul 8','Accounts Receivable',2200,''),('','Sales','',2200),('Jul 8','Cost of Goods Sold',1320,''),('','Merchandise Inventory','',1320),('Jul 17','Cash',2178,''),('Jul 17','Sales Discounts',22,''),('','Accounts Receivable','',2200))}
""")

add('E-5-1','Recording purchases, purchases returns and allowances, and discounts',f"""
{P}
Cobalt Shop:
- **Oct 1** Bought $3,600 of merchandise on credit, terms 3/10, n/30.
- **Oct 4** Returned $300 of goods.
- **Oct 7** Bought $2,000 of merchandise on credit, terms 2/15, n/45.
- **Oct 10** Paid for the Oct 1 purchase.
- **Oct 30** Paid for the Oct 7 purchase.
""",f"""
Oct 1 balance 3,300; discount 3% = 99. Oct 7 invoice paid Oct 30 — after 15 days, no discount.
{JE(('Oct 1','Merchandise Inventory',3600,''),('','Accounts Payable','',3600),('Oct 4','Accounts Payable',300,''),('','Merchandise Inventory','',300),('Oct 7','Merchandise Inventory',2000,''),('','Accounts Payable','',2000),('Oct 10','Accounts Payable',3300,''),('','Merchandise Inventory','',99),('','Cash','',3201),('Oct 30','Accounts Payable',2000,''),('','Cash','',2000))}
""")

add('E-5-23','Preparing adjusting and closing entries for a merchandiser',f"""
Selected Dec 31 data for Rook Market (perpetual):
- Merchandise Inventory per ledger $31,600; physical count $30,750.
- Store supplies on hand $420; Store Supplies account $1,180.
- Sales $240,000; Sales Discounts $3,200; Cost of Goods Sold (before adjustment) $143,000; Selling Expenses $38,000 (before supplies); General Expenses $29,500.

1. Prepare the two adjusting entries.
2. Prepare the closing entries (close expenses and contra revenues in one entry).
""",f"""
1. Shrinkage 31,600 − 30,750 = 850. Supplies used 1,180 − 420 = 760.
{JE(('Dec 31','Cost of Goods Sold',850,''),('','Merchandise Inventory','',850),('Dec 31','Store Supplies Expense',760,''),('','Store Supplies','',760))}

2. Debit balances: 3,200 + (143,000 + 850) + 38,000 + 760 + 29,500 = 215,310.
{JE(('Dec 31','Sales',240000,''),('','Income Summary','',240000),('Dec 31','Income Summary',215310,''),('','Sales Discounts','',3200),('','Cost of Goods Sold','',143850),('','Selling Expenses','',38000),('','Store Supplies Expense','',760),('','General Expenses','',29500),('Dec 31','Income Summary',24690,''),('','Owner, Capital','',24690))}
""")
check(3200+143850+38000+760+29500,215310)

add('E-5-7','Recording sales, purchases and cash discounts',f"""
{P}
Prepare entries for both companies.
- **Aug 3** Dune Co. sold $6,000 of goods to Ember Co. on credit, terms 2/10, n/30; cost to Dune $3,700.
- **Aug 12** Ember paid Dune in full.
""",f"""
**Dune Co. (seller)**
{JE(('Aug 3','Accounts Receivable',6000,''),('','Sales','',6000),('Aug 3','Cost of Goods Sold',3700,''),('','Merchandise Inventory','',3700),('Aug 12','Cash',5880,''),('Aug 12','Sales Discounts',120,''),('','Accounts Receivable','',6000))}

**Ember Co. (buyer)**
{JE(('Aug 3','Merchandise Inventory',6000,''),('','Accounts Payable','',6000),('Aug 12','Accounts Payable',6000,''),('','Merchandise Inventory','',120),('','Cash','',5880))}
""")

add('E-5-8','Recording sales, purchases, shipping and returns',f"""
{P}
- **Sep 5** Gale Co. sold $4,500 of goods to Hollis Co. on credit, terms 2/10, n/30, **FOB destination**; cost $2,600.
- **Sep 5** Gale paid $175 freight.
- **Sep 8** Hollis returned $500 of goods (cost $290).
- **Sep 15** Hollis paid the balance.

Record the entries for Gale (seller) and Hollis (buyer).
""",f"""
Balance 4,000; discount 80; cash 3,920.

**Gale Co. (seller)**
{JE(('Sep 5','Accounts Receivable',4500,''),('','Sales','',4500),('Sep 5','Cost of Goods Sold',2600,''),('','Merchandise Inventory','',2600),('Sep 5','Delivery Expense',175,''),('','Cash','',175),('Sep 8','Sales Returns and Allowances',500,''),('','Accounts Receivable','',500),('Sep 8','Merchandise Inventory',290,''),('','Cost of Goods Sold','',290),('Sep 15','Cash',3920,''),('Sep 15','Sales Discounts',80,''),('','Accounts Receivable','',4000))}

**Hollis Co. (buyer)** — no freight entry under FOB destination.
{JE(('Sep 5','Merchandise Inventory',4500,''),('','Accounts Payable','',4500),('Sep 8','Accounts Payable',500,''),('','Merchandise Inventory','',500),('Sep 15','Accounts Payable',4000,''),('','Merchandise Inventory','',80),('','Cash','',3920))}
""")

add('E-5-9','Inventory and cost of goods sold transactions in T-accounts',f"""
Perpetual system. Beginning merchandise inventory is $9,000. During the month:
- Purchases on credit $27,000
- Purchase returns $1,200
- Purchase discounts taken $500
- Freight-in paid $800
- Cost of goods sold to customers $28,400
- Customer returns of resaleable goods, cost $600

Compute the ending balances of Merchandise Inventory and Cost of Goods Sold.
""",f"""
{T(['Merchandise Inventory','Debit','Credit'],['Beginning','9,000',''],['Purchases','27,000',''],['Purchase returns','','1,200'],['Purchase discounts','','500'],['Freight-in','800',''],['Cost of goods sold','','28,400'],['Customer returns','600',''],['**Ending balance**','**7,300**',''])}

Merchandise Inventory: 9,000 + 27,000 − 1,200 − 500 + 800 − 28,400 + 600 = **$7,300**.

Cost of Goods Sold: 28,400 − 600 = **$27,800**.
""")
check(9000+27000-1200-500+800-28400+600,7300)

add('E-5-21','Preparing a multiple-step income statement',f"""
Prepare a multiple-step income statement for Sable Co.
{T(['Account','Amount'],['Sales','$365,000'],['Sales discounts','$5,200'],['Sales returns and allowances','$9,800'],['Cost of goods sold','$214,000'],['Selling expenses','$58,400'],['General & administrative expenses','$41,600'],['Interest revenue','$1,200'],['Interest expense','$3,900'])}
""",f"""
{T(['Sable Co. — Income Statement',''],['Sales','365,000'],['Less: discounts and returns','15,000'],['**Net sales**','**350,000**'],['Cost of goods sold','214,000'],['**Gross profit**','**136,000**'],['Selling expenses','58,400'],['General & administrative','41,600'],['**Income from operations**','**36,000**'],['Interest revenue','1,200'],['Interest expense','(3,900)'],['**Net income**','**33,300**'])}
""")
check(350000-214000-58400-41600+1200-3900,33300)

add('E-5-22','Net sales computation for a multiple-step income statement',"""
Gross sales were $128,500. Customers returned $4,700 of goods and received $1,300 in allowances. Sales discounts taken were $2,150. Compute net sales and gross profit if cost of goods sold was $73,400.
""","""
Net sales = 128,500 − 4,700 − 1,300 − 2,150 = **$120,350**.
Gross profit = 120,350 − 73,400 = **$46,950**.
""")

add('E-5-24','Impacts of inventory error on key accounts',"""
Lark Co.'s ending inventory for Year 1 was **understated** by $3,600 because some goods were missed in the count. The error was never corrected. State the effect (overstated, understated, no effect, and amount) on:
1. Year 1 cost of goods sold
2. Year 1 net income
3. Year 1 ending owner's capital
4. Year 2 cost of goods sold
5. Year 2 net income
6. Year 2 ending owner's capital
""","""
1. Overstated $3,600
2. Understated $3,600
3. Understated $3,600
4. Understated $3,600 (beginning inventory is understated)
5. Overstated $3,600
6. No effect — the two errors cancel out
""")

add('E-5-25','Physical count error and profits',"""
Reported net income: Year 1 $52,000, Year 2 $47,500. The Year 1 ending inventory count included $2,800 of goods held on consignment for another company. Compute the correct net income for each year and the total for both years.
""","""
Including consigned goods overstated Year 1 ending inventory by $2,800.
- Year 1: cost of goods sold understated → income overstated: 52,000 − 2,800 = **$49,200**
- Year 2: beginning inventory overstated → income understated: 47,500 + 2,800 = **$50,300**
- Two-year total unchanged: 99,500.
""")

add('E-5-26','Computing and analyzing acid-test and current ratios',f"""
Compute the current ratio and acid-test ratio for both companies. Which is in the better short-term position?
{T(['','Alpha','Beta'],['Cash','$3,000','$11,000'],['Short-term investments','$0','$2,000'],['Accounts receivable','$6,000','$9,000'],['Merchandise inventory','$31,000','$8,000'],['Prepaid expenses','$1,000','$1,000'],['Current liabilities','$20,000','$15,500'])}
""",f"""
{T(['','Alpha','Beta'],['Current assets','41,000','31,000'],['Current ratio','41,000 ÷ 20,000 = **2.05**','31,000 ÷ 15,500 = **2.00**'],['Quick assets','9,000','22,000'],['Acid-test','9,000 ÷ 20,000 = **0.45**','22,000 ÷ 15,500 = **1.42**'])}

Similar current ratios, but most of Alpha's current assets are inventory. Beta can pay its current debts without selling inventory, so Beta is stronger.
""")

add('E-5-27','Preparing a classified balance sheet for a merchandiser',f"""
Prepare a classified balance sheet for Corvo Supply at Dec 31.
{T(['Account','Amount'],['Cash','$6,900'],['Accounts receivable','$14,100'],['Merchandise inventory','$37,500'],['Prepaid rent','$2,500'],['Office equipment','$48,000'],['Accumulated depreciation — office equipment','$12,000'],['Accounts payable','$15,800'],['Wages payable','$2,200'],['Notes payable (due in 3 years)','$20,000'],['J. Corvo, Capital','$59,000'])}
""",f"""
{T(['Corvo Supply — Balance Sheet, Dec 31',''],['**Current assets**',''],['Cash','6,900'],['Accounts receivable','14,100'],['Merchandise inventory','37,500'],['Prepaid rent','2,500'],['Total current assets','61,000'],['**Plant assets**',''],['Office equipment 48,000 − Acc. depr. 12,000','36,000'],['**Total assets**','**97,000**'],['**Current liabilities**',''],['Accounts payable','15,800'],['Wages payable','2,200'],['Total current liabilities','18,000'],['**Long-term liabilities**',''],['Notes payable','20,000'],['Total liabilities','38,000'],['**Equity**: J. Corvo, Capital','59,000'],['**Total liabilities and equity**','**97,000**'])}
""")
check(6900+14100+37500+2500+36000,97000); check(15800+2200+20000+59000,97000)

add('E-5-28A','Recording purchases, returns and allowances — periodic',f"""
Use a **periodic** system. Nara Home:
- **May 2** Bought $8,000 of merchandise on credit, terms 2/10, n/30, FOB shipping point.
- **May 3** Paid $260 freight.
- **May 5** Received a $500 allowance for scratched goods.
- **May 11** Paid the balance due.
""",f"""
{JE(('May 2','Purchases',8000,''),('','Accounts Payable','',8000),('May 3','Transportation-In',260,''),('','Cash','',260),('May 5','Accounts Payable',500,''),('','Purchases Returns and Allowances','',500),('May 11','Accounts Payable',7500,''),('','Purchases Discounts','',150),('','Cash','',7350))}
""")

add('E-5-29A','Recording sales, purchases and discounts: buyer and seller — periodic',f"""
Use a **periodic** system for both companies.
- **Aug 3** Dune Co. sold $6,000 of goods to Ember Co. on credit, terms 2/10, n/30 (cost $3,700).
- **Aug 12** Ember paid in full.
""",f"""
**Dune Co. (seller)**
{JE(('Aug 3','Accounts Receivable',6000,''),('','Sales','',6000),('Aug 12','Cash',5880,''),('Aug 12','Sales Discounts',120,''),('','Accounts Receivable','',6000))}

**Ember Co. (buyer)**
{JE(('Aug 3','Purchases',6000,''),('','Accounts Payable','',6000),('Aug 12','Accounts Payable',6000,''),('','Purchases Discounts','',120),('','Cash','',5880))}
""")

add('E-5-42B','Recording estimates of future returns',f"""
Quill Co. sold $180,000 of goods this year (cost 60% of sales). It expects 3% of sales to be returned next year. No returns estimate has been recorded.
1. Record the year-end adjusting entries.
2. Next year, customers return $4,900 of goods (cost $2,940) from this year's sales. Record the return.
""",f"""
1. Expected returns 180,000 × 3% = 5,400; cost 5,400 × 60% = 3,240.
{JE(('Dec 31','Sales Returns and Allowances',5400,''),('','Sales Refund Payable','',5400),('Dec 31','Inventory Returns Estimated',3240,''),('','Cost of Goods Sold','',3240))}

2. Returns are charged against the liability set up last year.
{JE(('Next yr','Sales Refund Payable',4900,''),('','Accounts Receivable (or Cash)','',4900),('Next yr','Merchandise Inventory',2940,''),('','Inventory Returns Estimated','',2940))}
""")

add('E-5-43B','Recording estimates of future discounts',f"""
At Dec 31, Ridge Co. has $40,000 of receivables on terms 2/10, n/30. It expects customers owing $25,000 of these to pay within the discount period. Record the adjusting entry.
""",f"""
Expected discounts: 25,000 × 2% = 500.
{JE(('Dec 31','Sales Discounts',500,''),('','Allowance for Sales Discounts','',500))}

The allowance is a contra account to Accounts Receivable.
""")

add('E-5-44B','Recording estimates of future returns',f"""
Tidal Co. expects $3,500 of this year's sales to be returned next year; the goods cost $2,100 and can be resold. The Sales Refund Payable account already has a $900 credit balance and Inventory Returns Estimated a $540 debit balance from unused prior estimates. Record the adjusting entries to bring the accounts to the new estimates.
""",f"""
Increase the liability by 3,500 − 900 = 2,600 and the asset by 2,100 − 540 = 1,560.
{JE(('Dec 31','Sales Returns and Allowances',2600,''),('','Sales Refund Payable','',2600),('Dec 31','Inventory Returns Estimated',1560,''),('','Cost of Goods Sold','',1560))}
""")

add('E-5-45C','Recording sales, purchases, shipping and returns: buyer and seller — net method',f"""
Use the **net method** for both companies (perpetual).
- **Sep 5** Gale Co. sold $4,500 of goods to Hollis Co., terms 2/10, n/30, FOB destination; cost $2,600. Gale paid $175 freight.
- **Sep 8** Hollis returned $500 of goods (cost $290).
- **Sep 15** Hollis paid the balance.
""",f"""
Net amounts: sale 4,410; return 490; balance 3,920 (paid within discount period).

**Gale Co. (seller)**
{JE(('Sep 5','Accounts Receivable',4410,''),('','Sales','',4410),('Sep 5','Cost of Goods Sold',2600,''),('','Merchandise Inventory','',2600),('Sep 5','Delivery Expense',175,''),('','Cash','',175),('Sep 8','Sales Returns and Allowances',490,''),('','Accounts Receivable','',490),('Sep 8','Merchandise Inventory',290,''),('','Cost of Goods Sold','',290),('Sep 15','Cash',3920,''),('','Accounts Receivable','',3920))}

**Hollis Co. (buyer)**
{JE(('Sep 5','Merchandise Inventory',4410,''),('','Accounts Payable','',4410),('Sep 8','Accounts Payable',490,''),('','Merchandise Inventory','',490),('Sep 15','Accounts Payable',3920,''),('','Cash','',3920))}
""")

add('E-5-46C','Recording purchases, sales, returns and discounts — net method',f"""
Use the **net method** (perpetual). Cobalt Shop:
- **Oct 1** Bought $3,600 of merchandise, terms 3/10, n/30.
- **Oct 4** Returned $300 of goods.
- **Oct 10** Paid for the Oct 1 purchase.
- **Oct 7** Bought $2,000 of merchandise, terms 2/15, n/45; paid **Oct 30**.
""",f"""
Oct 1 net 3,492; return net 291; balance net 3,201 paid on time. Oct 7 net 1,960; paid late → full 2,000, discount lost 40.
{JE(('Oct 1','Merchandise Inventory',3492,''),('','Accounts Payable','',3492),('Oct 4','Accounts Payable',291,''),('','Merchandise Inventory','',291),('Oct 7','Merchandise Inventory',1960,''),('','Accounts Payable','',1960),('Oct 10','Accounts Payable',3201,''),('','Cash','',3201),('Oct 30','Accounts Payable',1960,''),('Oct 30','Discounts Lost',40,''),('','Cash','',2000))}
""")

add('E-5-41','Purchasing transactions',f"""
{P}
Pine Hardware:
- **Nov 2** Bought $7,500 of merchandise on credit, terms 1/10, n/30, FOB shipping point.
- **Nov 2** Paid $240 freight.
- **Nov 6** Returned $900 of goods.
- **Nov 12** Paid the balance due.
""",f"""
Balance 6,600; discount 1% = 66.
{JE(('Nov 2','Merchandise Inventory',7500,''),('','Accounts Payable','',7500),('Nov 2','Merchandise Inventory',240,''),('','Cash','',240),('Nov 6','Accounts Payable',900,''),('','Merchandise Inventory','',900),('Nov 12','Accounts Payable',6600,''),('','Merchandise Inventory','',66),('','Cash','',6534))}
""")

PROB_A=("Kite Supply","Mar")
def prob_journal(id,co,mon,sale,cost,ret,retcost,buy,freight,allow,disc_s,disc_b):
    s_bal=sale-ret; s_disc=round(s_bal*disc_s/100,2); b_bal=buy-allow; b_disc=round(b_bal*disc_b/100,2)
    add(id,'Preparing journal entries for merchandising activities',f"""
{P}
Prepare journal entries for {co}:
- **{mon} 2** Bought ${f(buy)} of merchandise on credit from Vendor A, terms {disc_b}/10, n/30, FOB shipping point.
- **{mon} 3** Paid ${f(freight)} freight on the {mon} 2 purchase.
- **{mon} 5** Sold ${f(sale)} of goods on credit to Client B, terms {disc_s}/10, n/30; cost ${f(cost)}.
- **{mon} 7** Received a ${f(allow)} allowance from Vendor A for damaged goods.
- **{mon} 8** Client B returned ${f(ret)} of goods (cost ${f(retcost)}); they can be resold.
- **{mon} 12** Paid Vendor A the balance due.
- **{mon} 15** Received Client B's payment of the balance.
- **{mon} 20** Sold ${f(1500)} of goods for cash; cost ${f(870)}.
""",f"""
Vendor A balance: {f(buy)} − {f(allow)} = {f(b_bal)}; discount {disc_b}% = {f(b_disc)}. Client B balance: {f(sale)} − {f(ret)} = {f(s_bal)}; discount {disc_s}% = {f(s_disc)}.
{JE((mon+' 2','Merchandise Inventory',buy,''),('','Accounts Payable','',buy),(mon+' 3','Merchandise Inventory',freight,''),('','Cash','',freight),(mon+' 5','Accounts Receivable',sale,''),('','Sales','',sale),(mon+' 5','Cost of Goods Sold',cost,''),('','Merchandise Inventory','',cost),(mon+' 7','Accounts Payable',allow,''),('','Merchandise Inventory','',allow),(mon+' 8','Sales Returns and Allowances',ret,''),('','Accounts Receivable','',ret),(mon+' 8','Merchandise Inventory',retcost,''),('','Cost of Goods Sold','',retcost),(mon+' 12','Accounts Payable',b_bal,''),('','Merchandise Inventory','',b_disc),('','Cash','',round(b_bal-b_disc,2)),(mon+' 15','Cash',round(s_bal-s_disc,2),''),(mon+' 15','Sales Discounts',s_disc,''),('','Accounts Receivable','',s_bal),(mon+' 20','Cash',1500,''),('','Sales','',1500),(mon+' 20','Cost of Goods Sold',870,''),('','Merchandise Inventory','',870))}
""")
prob_journal('P-5-2A','Kite Supply','Mar',5400,3240,600,360,9200,310,450,2,2)
prob_journal('P-5-2B','Wren Supply','Jun',6300,3780,800,480,8600,280,350,2,1)

def prob_journal2(id,co,mon,a):
    buy,ret,sale1,cost1,sale2,cost2,freightout=a
    disc=round((buy-ret)*0.03,2)
    add(id,'Preparing journal entries for merchandising activities (several partners)',f"""
{P}
{co}:
- **{mon} 1** Bought ${f(buy)} of goods from Delta Co., terms 3/10, n/60, FOB destination.
- **{mon} 4** Sold ${f(sale1)} of goods to Echo Co. for cash; cost ${f(cost1)}.
- **{mon} 6** Returned ${f(ret)} of the {mon} 1 goods to Delta.
- **{mon} 9** Sold ${f(sale2)} of goods to Fox Co. on credit, terms 2/10, n/30, FOB destination; cost ${f(cost2)}.
- **{mon} 9** Paid ${f(freightout)} freight on the sale to Fox.
- **{mon} 10** Paid Delta the balance due.
- **{mon} 29** Fox paid in full (after the discount period).
""",f"""
Delta balance {f(buy-ret)}, discount 3% = {f(disc)}. Fox paid after 10 days, so no discount.
{JE((mon+' 1','Merchandise Inventory',buy,''),('','Accounts Payable','',buy),(mon+' 4','Cash',sale1,''),('','Sales','',sale1),(mon+' 4','Cost of Goods Sold',cost1,''),('','Merchandise Inventory','',cost1),(mon+' 6','Accounts Payable',ret,''),('','Merchandise Inventory','',ret),(mon+' 9','Accounts Receivable',sale2,''),('','Sales','',sale2),(mon+' 9','Cost of Goods Sold',cost2,''),('','Merchandise Inventory','',cost2),(mon+' 9','Delivery Expense',freightout,''),('','Cash','',freightout),(mon+' 10','Accounts Payable',buy-ret,''),('','Merchandise Inventory','',disc),('','Cash','',round(buy-ret-disc,2)),(mon+' 29','Cash',sale2,''),('','Accounts Receivable','',sale2))}
""")
prob_journal2('P-5-4A','Basil Goods','Jul',(12000,1000,4300,2580,7600,4560,190))
prob_journal2('P-5-4B','Thyme Goods','Aug',(15000,2000,3900,2340,8800,5280,215))

def prob_adj(id,co,d):
    inv_book,inv_count,sup_bal,sup_on,prepaid_bal,prepaid_exp,sales,sret,sdisc,cos,sell,adm=d
    shrink=inv_book-inv_count; supused=sup_bal-sup_on
    netsales=sales-sret-sdisc; cos2=cos+shrink; gp=netsales-cos2; sell2=sell+supused; adm2=adm+prepaid_exp; ni=gp-sell2-adm2
    chk(id,('Net sales',netsales),('Gross profit',gp),('Net income',ni))
    add(id,'Preparing adjusting entries and income statements',f"""
Unadjusted Dec 31 balances for {co} (perpetual):
{T(['Account','Balance'],['Merchandise inventory','$'+f(inv_book)],['Store supplies','$'+f(sup_bal)],['Prepaid insurance','$'+f(prepaid_bal)],['Sales','$'+f(sales)],['Sales returns and allowances','$'+f(sret)],['Sales discounts','$'+f(sdisc)],['Cost of goods sold','$'+f(cos)],['Selling expenses (excl. supplies)','$'+f(sell)],['General & admin expenses (excl. insurance)','$'+f(adm)])}
Additional information:
- Physical count of inventory: ${f(inv_count)}.
- Store supplies on hand: ${f(sup_on)} (a selling expense).
- Expired insurance: ${f(prepaid_exp)} (a general & admin expense).

1. Prepare the adjusting entries.
2. Prepare a multiple-step income statement.
3. Compute the gross margin ratio.
""",f"""
1. Adjusting entries
{JE(('Dec 31','Cost of Goods Sold',shrink,''),('','Merchandise Inventory','',shrink),('Dec 31','Store Supplies Expense',supused,''),('','Store Supplies','',supused),('Dec 31','Insurance Expense',prepaid_exp,''),('','Prepaid Insurance','',prepaid_exp))}

2. Income statement
{T(['Item','Amount'],['Sales',f(sales)],['Less returns and discounts','('+f(sret+sdisc)+')'],['**Net sales**','**'+f(netsales)+'**'],['Cost of goods sold ('+f(cos)+' + '+f(shrink)+')',f(cos2)],['**Gross profit**','**'+f(gp)+'**'],['Selling expenses ('+f(sell)+' + '+f(supused)+')',f(sell2)],['General & admin ('+f(adm)+' + '+f(prepaid_exp)+')',f(adm2)],['**Net income**','**'+f(ni)+'**'])}

3. Gross margin ratio = {f(gp)} ÷ {f(netsales)} = **{gp/netsales*100:.1f}%**.
""")
prob_adj('P-5-1A','Lark Outlet',(41300,40150,2600,780,3600,1500,312000,8500,3500,183000,46200,38400))
prob_adj('P-5-1B','Moss Outlet',(36800,36050,1900,520,2400,1000,268000,6100,1900,154600,39800,31700))

def prob_amounts(id,rows):
    q=[];a=[]
    for name,(bi,pur,pr,pd,fi,ei,ns) in rows:
        cogs=bi+pur-pr-pd+fi-ei; gp=ns-cogs
        q.append([name,f(bi),f(pur),f(pr),f(pd),f(fi),f(ei),f(ns)])
        a.append([name,f(pur-pr-pd+fi),f(bi+pur-pr-pd+fi),f(cogs),f(gp)])
    chk(id,*[(r[0]+' cost of goods sold',float(r[3].replace(',',''))) for r in a],*[(r[0]+' gross profit',float(r[4].replace(',',''))) for r in a])
    add(id,'Computing merchandising amounts and formatting income statements',f"""
Periodic data for two stores. For each, compute net cost of purchases, cost of goods available for sale, cost of goods sold and gross profit.
{T(['Store','Beg. inventory','Purchases','Purch. returns','Purch. discounts','Freight-in','End. inventory','Net sales'],*q)}
""",f"""
{T(['Store','Net cost of purchases','Goods available','Cost of goods sold','Gross profit'],*a)}

Net cost of purchases = purchases − returns − discounts + freight-in. COGS = beginning + net purchases − ending.
""")
prob_amounts('P-5-5A',[('Store 1',(18500,96000,3200,1800,2400,21300,142000)),('Store 2',(7400,58300,1100,900,1300,9600,83500))])
prob_amounts('P-5-5B',[('Store 1',(22600,104500,4100,2000,2700,19900,156300)),('Store 2',(9100,61200,1500,1200,1100,8700,90400))])

def prob_close(id,co,d):
    sales,sret,sdisc,cos,expenses,draw=d
    tot=sret+sdisc+cos+sum(v for _,v in expenses); ni=sales-tot
    chk(id,('Net income',ni),('Change in owner\'s capital',ni-draw))
    add(id,'Preparing closing entries and interpreting information',f"""
Adjusted balances for {co} at Dec 31:
{T(['Account','Balance'],['Sales','$'+f(sales)],['Sales returns and allowances','$'+f(sret)],['Sales discounts','$'+f(sdisc)],['Cost of goods sold','$'+f(cos)],*[[n,'$'+f(v)] for n,v in expenses],['Owner, Withdrawals','$'+f(draw)])}
1. Prepare the closing entries.
2. What is net income, and by how much does owner's capital change?
3. Compute the gross margin ratio.
""",f"""
1.
{JE(('Dec 31','Sales',sales,''),('','Income Summary','',sales),('Dec 31','Income Summary',tot,''),('','Sales Returns and Allowances','',sret),('','Sales Discounts','',sdisc),('','Cost of Goods Sold','',cos),*[('',n,'',v) for n,v in expenses],('Dec 31','Income Summary',ni,''),('','Owner, Capital','',ni),('Dec 31','Owner, Capital',draw,''),('','Owner, Withdrawals','',draw))}

2. Net income = {f(sales)} − {f(tot)} = **{f(ni)}**. Capital increases by {f(ni)} − {f(draw)} = **{f(ni-draw)}**.

3. Net sales = {f(sales-sret-sdisc)}; gross profit = {f(sales-sret-sdisc-cos)}; ratio = **{(sales-sret-sdisc-cos)/(sales-sret-sdisc)*100:.1f}%**.
""")
prob_close('P-5-6A','Fable Store',(275000,7000,4000,158000,[('Salaries Expense',52000),('Rent Expense',18000),('Depreciation Expense',6500),('Utilities Expense',4300)],15000))
prob_close('P-5-6B','Gable Store',(198000,5200,2800,112500,[('Salaries Expense',38600),('Rent Expense',14400),('Depreciation Expense',4900),('Utilities Expense',3100)],9000))

add('QS-5-34','Units in ending inventory',"""
Haze Co. counts 1,240 units in its warehouse at Dec 31. Also:
- 30 of the counted units are damaged and cannot be sold.
- 150 units bought FOB shipping point are in transit to Haze.
- 90 units sold FOB destination are in transit to a customer (not counted).
- 60 units Haze sent to a consignee are not in the warehouse.

How many units should be in Haze's ending inventory?
""","""
1,240 − 30 + 150 + 90 + 60 = **1,510 units**.

- Remove unsaleable goods.
- Add goods Haze already owns in transit (FOB shipping point).
- Add goods still owned until they arrive at the customer (FOB destination).
- Add consigned-out goods (Haze is the consignor).
""")

# ---------- key answers for the self-check boxes ----------
chk('QS-5-1',('Cash paid on Mar 13',3430))
chk('QS-5-4',('Inventory cost',7320))
chk('QS-5-5',('Shop A net income',11200),('Shop B net sales',100000))
chk('QS-5-6',('Invoice A paid',2548),('Invoice B paid',9166.50),('Invoice C paid',772.20))
chk('QS-5-7',('Cash paid on Jun 9',5488))
chk('QS-5-9',('Cash received on Apr 11',2548))
chk('QS-5-21',('North gross margin ratio (%)',28.0,0.1),('South gross margin ratio (%)',36.0,0.1))
chk('QS-5-23',('Net income',19000))
chk('QS-5-24',('Net sales',203000),('Gross profit',82000),('Net income',18500))
chk('QS-5-25',('Total current assets',48000))
chk('QS-5-26',('Acid-test ratio',0.90,0.005))
chk('QS-5-42C',('Discounts lost',70))
chk('QS-5-44C',('Interest revenue (discount forfeited)',52))
chk('E-5-5',('Cash paid on May 11',7350))
chk('E-5-1',('Cash paid on Oct 10',3201))
chk('E-5-23',('Net income',24690))
chk('E-5-9',('Ending Merchandise Inventory',7300),('Cost of Goods Sold',27800))
chk('E-5-21',('Net sales',350000),('Net income',33300))
chk('E-5-22',('Net sales',120350),('Gross profit',46950))
chk('E-5-25',('Correct Year 1 net income',49200),('Correct Year 2 net income',50300))
chk('E-5-26',('Alpha current ratio',2.05,0.005),('Beta current ratio',2.00,0.005),('Alpha acid-test ratio',0.45,0.005),('Beta acid-test ratio',1.42,0.006))
chk('E-5-27',('Total assets',97000))
chk('E-5-42B',('Sales Refund Payable',5400),('Inventory Returns Estimated',3240))
chk('E-5-41',('Cash paid on Nov 12',6534))
chk('QS-5-34',('Units in ending inventory',1510))

attach_checks()
json.dump(ITEMS,open(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..','data','textbook-sos','ch5.json'),'w'),ensure_ascii=False,separators=(',',':'))
print(len(ITEMS))
