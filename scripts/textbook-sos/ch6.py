import sys,os,json; sys.path.insert(0,os.path.dirname(__file__))
from sos_lib import *
from costflow import *

def wt(r):
    """Tolerance for periodic weighted-average answers when the unit cost is not a whole number of cents."""
    return 0.01 if abs(r['WA']['avg']*100-round(r['WA']['avg']*100))<1e-9 else 2.0

# ---------- ownership and costs ----------
add('QS-6-1','Inventory ownership',"""
Ridge Outfitters counted 2,150 units in its store at Dec 31. Decide how many units belong in ending inventory:
- 40 counted units are broken and cannot be sold.
- 300 units bought FOB destination are still on the truck (not counted).
- 120 units sold FOB shipping point left the store on Dec 30 (not counted).
- 75 units Ridge placed with a consignee are not in the store.
- 200 counted units are held for another company on consignment.
""","""
2,150 − 40 (unsaleable) − 200 (consigned **in**, owned by the consignor) + 75 (consigned **out**, still Ridge's) = **1,985 units**.

- FOB destination purchases in transit belong to the seller until they arrive: not added.
- FOB shipping point sales left Ridge's ownership when shipped: not added.
""")

add('E-6-1','Inventory ownership',"""
For each item, say whether it belongs in Pax Co.'s Dec 31 inventory.
1. Goods Pax bought FOB shipping point, shipped Dec 29, arriving Jan 3.
2. Goods Pax sold FOB shipping point, shipped Dec 30.
3. Goods Pax sold FOB destination, shipped Dec 30, arriving Jan 2.
4. Goods held by Pax on consignment from Rho Co.
5. Goods Pax sent on consignment to Sigma Co., unsold at Dec 31.
6. Goods in Pax's warehouse that a customer bought and paid for, waiting to be picked up.
""","""
1. Yes — ownership passed at shipment.
2. No — ownership passed to the buyer at shipment.
3. Yes — Pax owns them until they arrive.
4. No — they belong to Rho (consignor).
5. Yes — Pax is the consignor.
6. No — the sale is complete; the goods belong to the customer.
""")

add('QS-6-2','Inventory costs',"""
Vela Motors bought a used van for resale. Compute its inventory cost.
- Purchase price $16,500
- Transportation-in $380
- Insurance during shipping $240
- Import duties $1,100
- Advertising the van for sale $210
- Salesperson's commission when sold $650
- Car wash before display (normal preparation) $60
""","""
Include costs to buy the van and bring it to a saleable condition and location:
16,500 + 380 + 240 + 1,100 + 60 = **$18,280**.

Advertising and the commission are selling expenses.
""")

add('QS-6-29','Inventory costs',"""
Under IAS 2, which costs are part of inventory cost and which are expensed?
1. Purchase price less trade discounts
2. Freight to bring goods to the shop
3. Storage after goods are ready for sale
4. Abnormal waste of materials
5. Import duties that cannot be recovered
6. Selling costs
""","""
Inventory cost: 1, 2, 5.
Expense: 3, 4, 6.
""")

add('E-6-2','Inventory costs',"""
Oriel Imports' records show the following for goods bought this month:
| Item | Amount |
|---|---|
| Invoice price | $42,000 |
| Trade discount received | $2,100 |
| Freight-in | $1,350 |
| Insurance in transit | $420 |
| Import duties | $2,600 |
| Warehouse rent for the month | $1,800 |
| Advertising | $950 |

Compute the cost assigned to inventory.
""","""
42,000 − 2,100 + 1,350 + 420 + 2,600 = **$44,270**.

Warehouse rent after arrival and advertising are period expenses.
""")

# ---------- periodic data set A (QS) ----------
A_beg=(200,12.00); A_buys=[('Mar 10',300,13.00),('Jul 22',250,14.00),('Oct 5',150,15.00)]; A_sold=620
A=periodic(A_beg,A_buys,A_sold)
CASE_A=f"""Ozark Lamps uses a **periodic** system. Data for the year:
{avail_table(A['layers'])}
It sold **{f(A_sold)} units** during the year."""

add('QS-6-9','Computing goods available for sale',CASE_A+"\n\nCompute the units and cost of goods available for sale, and the units in ending inventory.",
f"""Goods available: **{f(A['units'])} units** costing **{money(A['total'])}**.
{avail_table(A['layers'])}
Ending inventory: {f(A['units'])} − {f(A_sold)} = **{f(A['end_units'])} units**.""")

for qid,m,name in [('QS-6-5A','FIFO','FIFO'),('QS-6-6A','LIFO','LIFO'),('QS-6-7A','WA','weighted average')]:
    r=A[m]
    add(qid,'Periodic: inventory costing with '+name,CASE_A+f"\n\nCompute ending inventory and cost of goods sold using **{name}** (periodic).",
    f"""{r['work']}.

Cost of goods sold = {money(A['total'])} − {money(r['end'])} = **{money(r['cogs'])}**.""")

add('QS-6-15A','Periodic: inventory costing with specific identification',CASE_A+"\n\nThe 280 units in ending inventory are 60 from beginning inventory, 120 from Jul 22 and 100 from Oct 5. Compute ending inventory and cost of goods sold.",
f"""Ending = 60 × $12 + 120 × $14 + 100 × $15 = 720 + 1,680 + 1,500 = **$3,900**.

Cost of goods sold = {money(A['total'])} − 3,900 = **{money(A['total']-3900)}**.""")
check(A['end_units'],280)

add('QS-6-16','Contrasting inventory costing methods',f"""
Use the Ozark Lamps results. Purchase costs rose during the year.
{T(['Method','Ending inventory','Cost of goods sold'],['FIFO',money(A['FIFO']['end']),money(A['FIFO']['cogs'])],['LIFO',money(A['LIFO']['end']),money(A['LIFO']['cogs'])],['Weighted average',money(A['WA']['end']),money(A['WA']['cogs'])])}
1. Which method gives the highest gross profit?
2. Which gives the lowest taxable income?
3. Which shows the balance sheet inventory closest to current cost?
4. Which of these methods may Ozark use under IFRS?
""","""
1. FIFO — lowest cost of goods sold when prices rise.
2. LIFO — highest cost of goods sold.
3. FIFO — ending inventory uses the newest costs.
4. FIFO and weighted average (and specific identification). LIFO is not permitted under IFRS.
""")

# ---------- periodic set B (QS-6-11.. A suffix) ----------
B_beg=(80,30.00); B_buys=[('Feb 3',120,32.00),('Jun 18',100,35.00)]; B_sold=210
B=periodic(B_beg,B_buys,B_sold)
CASE_B=f"""Tamsin Gear uses a **periodic** system.
{avail_table(B['layers'])}
Units sold: **{f(B_sold)}**."""
add('QS-6-14A','Periodic: inventory costing with LIFO',CASE_B+"\n\nCompute ending inventory and cost of goods sold using LIFO.",f"{B['LIFO']['work']}.\n\nCost of goods sold = {money(B['total'])} − {money(B['LIFO']['end'])} = **{money(B['LIFO']['cogs'])}**.")
add('QS-6-13A','Periodic: inventory costing with weighted average',CASE_B+"\n\nCompute ending inventory and cost of goods sold using weighted average.",f"{B['WA']['work']}.\n\nCost of goods sold = {money(B['total'])} − {money(B['WA']['end'])} = **{money(B['WA']['cogs'])}**.")

# ---------- perpetual set C ----------
C_beg=(150,8.00); C_ev=[('buy','Jan 8',250,8.60),('sell','Jan 12',300),('buy','Jan 20',200,9.20),('sell','Jan 27',180)]
CASE_C="""Corin Books uses a **perpetual** system. January activity:
| Date | Activity | Units | Unit cost |
|---|---|---|---|
| Jan 1 | Beginning inventory | 150 | $8.00 |
| Jan 8 | Purchase | 250 | $8.60 |
| Jan 12 | Sale | 300 | |
| Jan 20 | Purchase | 200 | $9.20 |
| Jan 27 | Sale | 180 | |"""
for qid,m,name in [('QS-6-18','FIFO','FIFO'),('QS-6-4','LIFO','LIFO'),('QS-6-3','AVG','weighted average (moving average)')]:
    r=perpetual(C_beg,C_ev,m)
    add(qid,'Perpetual: inventory costing with '+name,CASE_C+f"\n\nCompute cost of goods sold for January and ending inventory using **{name}**.",
    f"""{perp_table(r)}

Cost of goods sold = **{money(r['cogs'])}**. Ending inventory = **{money(r['end'])}**.{' Unit costs are rounded to cents after each purchase.' if m=='AVG' else ''}""")
tot_C=150*8+250*8.6+200*9.2
for m in ['FIFO','LIFO']:
    r=perpetual(C_beg,C_ev,m); check(r['cogs']+r['end'],tot_C,m)

add('QS-6-19','Perpetual: inventory costing with specific identification',CASE_C+"\n\nThe Jan 12 sale was 100 units from beginning inventory and 200 from Jan 8. The Jan 27 sale was 30 from beginning inventory, 50 from Jan 8 and 100 from Jan 20. Compute cost of goods sold and ending inventory.",
f"""- Jan 12: 100 × $8.00 + 200 × $8.60 = 800 + 1,720 = 2,520
- Jan 27: 30 × $8.00 + 50 × $8.60 + 100 × $9.20 = 240 + 430 + 920 = 1,590

Cost of goods sold = **$4,110**. Ending inventory = {money(tot_C)} − 4,110 = **{money(tot_C-4110)}** (20 × $8.00 + 0 × $8.60 + 100 × $9.20 = 160 + 920 = 1,080).""")
check(tot_C-4110,1080)

add('QS-6-11','Perpetual: inventory costing with LIFO',"""
Perpetual system. Nora Pens: beginning 60 units @ $5.00; Mar 2 purchase 90 @ $5.40; Mar 9 sale 100 units; Mar 15 purchase 70 @ $5.80; Mar 22 sale 50 units.
Compute cost of goods sold and ending inventory using LIFO.
""",(lambda r: f"""{perp_table(r)}

Cost of goods sold = **{money(r['cogs'])}**. Ending inventory = **{money(r['end'])}**.""")(perpetual((60,5.00),[('buy','Mar 2',90,5.40),('sell','Mar 9',100),('buy','Mar 15',70,5.80),('sell','Mar 22',50)],'LIFO')))

add('QS-6-12','Perpetual: inventory costing with weighted average',"""
Perpetual system. Nora Pens: beginning 60 units @ $5.00; Mar 2 purchase 90 @ $5.40; Mar 9 sale 100 units; Mar 15 purchase 70 @ $5.80; Mar 22 sale 50 units.
Compute cost of goods sold and ending inventory using weighted average (moving average; round unit costs to cents).
""",(lambda r: f"""{perp_table(r)}

Cost of goods sold = **{money(r['cogs'])}**. Ending inventory = **{money(r['end'])}**.""")(perpetual((60,5.00),[('buy','Mar 2',90,5.40),('sell','Mar 9',100),('buy','Mar 15',70,5.80),('sell','Mar 22',50)],'AVG')))

# ---------- LCNRV ----------
add('QS-6-17','Applying lower of cost and NRV to inventories',"""
Apply the lower of cost and net realizable value item by item.
| Item | Units | Cost per unit | NRV per unit |
|---|---|---|---|
| Helmets | 40 | $55 | $50 |
| Gloves | 120 | $12 | $15 |
| Jackets | 25 | $140 | $132 |
""","""
| Item | Total cost | Total NRV | Lower |
|---|---|---|---|
| Helmets | 2,200 | 2,000 | 2,000 |
| Gloves | 1,440 | 1,800 | 1,440 |
| Jackets | 3,500 | 3,300 | 3,300 |
| **Total** | **7,140** | **7,100** | **6,740** |

Inventory is reported at **$6,740**; write-down 7,140 − 6,740 = **$400** (debit Cost of Goods Sold, credit Merchandise Inventory).
""")

# ---------- ratios / estimates ----------
add('QS-6-21','Analyzing inventory',"""
Two retailers report:
| | Arden | Belmont |
|---|---|---|
| Cost of goods sold | $328,500 | $219,000 |
| Beginning inventory | $41,000 | $52,000 |
| Ending inventory | $49,000 | $44,000 |

Compute inventory turnover and days' sales in inventory (365 days, using ending inventory). Which manages inventory better?
""","""
| | Arden | Belmont |
|---|---|---|
| Average inventory | 45,000 | 48,000 |
| Turnover | 328,500 ÷ 45,000 = **7.3** | 219,000 ÷ 48,000 = **4.6** |
| Days' sales in inventory | 49,000 ÷ 328,500 × 365 = **54.4 days** | 44,000 ÷ 219,000 × 365 = **73.3 days** |

Arden sells its inventory faster and holds fewer days of stock.
""")
check(328500/45000,7.3); check(round(49000/328500*365,1),54.4); check(round(44000/219000*365,1),73.3)

add('QS-6-22B','Estimating inventories — gross profit method',"""
A storm destroyed Cove Store's inventory on May 31. Records show: beginning inventory $34,000; purchases to May 31 $96,000; net sales to May 31 $150,000. The normal gross profit ratio is 35%. Estimate the inventory lost.
""","""
Estimated cost of goods sold = 150,000 × (1 − 35%) = 97,500.
Goods available = 34,000 + 96,000 = 130,000.
Estimated inventory lost = 130,000 − 97,500 = **$32,500**.
""")

add('QS-6-28','Inventory errors',"""
Ending inventory at the end of Year 1 was **overstated** by $5,200. The error was not corrected. Give the effect on each item.
| Item | Year 1 | Year 2 |
|---|---|---|
| Cost of goods sold | ? | ? |
| Net income | ? | ? |
| Ending equity | ? | ? |
""","""
| Item | Year 1 | Year 2 |
|---|---|---|
| Cost of goods sold | Understated 5,200 | Overstated 5,200 |
| Net income | Overstated 5,200 | Understated 5,200 |
| Ending equity | Overstated 5,200 | No effect |
""")

add('E-6-3A','Periodic: income effects of inventory methods',CASE_B+"""

Sales were 210 units at $60 each and operating expenses were $3,200. Prepare a short income statement for each method: FIFO, LIFO and weighted average. Which gives the highest net income?""",
(lambda: f"""Sales = 210 × $60 = 12,600.
{T(['','FIFO','LIFO','Weighted avg'],['Sales','12,600','12,600','12,600'],['Cost of goods sold',f(B['FIFO']['cogs']),f(B['LIFO']['cogs']),f(B['WA']['cogs'])],['Gross profit',f(12600-B['FIFO']['cogs']),f(12600-B['LIFO']['cogs']),f(round(12600-B['WA']['cogs'],2))],['Operating expenses','3,200','3,200','3,200'],['**Net income**','**'+f(12600-B['FIFO']['cogs']-3200)+'**','**'+f(12600-B['LIFO']['cogs']-3200)+'**','**'+f(round(12600-B['WA']['cogs']-3200,2))+'**'])}

FIFO gives the highest net income because costs were rising.""")())

D_beg=(500,4.00); D_buys=[('Apr 2',700,4.40),('Aug 9',600,4.70),('Nov 14',400,5.00)]; D_sold=1650
D=periodic(D_beg,D_buys,D_sold)
CASE_D=f"""Hale Hardware (periodic):
{avail_table(D['layers'])}
Units sold: **{f(D_sold)}**."""
add('E-6-4A','Periodic: inventory costing',CASE_D+"\n\nCompute ending inventory and cost of goods sold under FIFO, LIFO and weighted average.",
f"""- FIFO: {D['FIFO']['work']}; COGS = **{money(D['FIFO']['cogs'])}**
- LIFO: {D['LIFO']['work']}; COGS = **{money(D['LIFO']['cogs'])}**
- Weighted average: {D['WA']['work']}; COGS = **{money(D['WA']['cogs'])}**""")

E_beg=(100,20.00); E_ev=[('buy','May 3',160,21.00),('sell','May 9',190),('buy','May 17',120,22.50),('sell','May 26',140)]
CASE_E="""Lyle Audio (perpetual), May:
| Date | Activity | Units | Unit cost |
|---|---|---|---|
| May 1 | Beginning | 100 | $20.00 |
| May 3 | Purchase | 160 | $21.00 |
| May 9 | Sale | 190 | |
| May 17 | Purchase | 120 | $22.50 |
| May 26 | Sale | 140 | |"""
rF=perpetual(E_beg,E_ev,'FIFO'); rL=perpetual(E_beg,E_ev,'LIFO'); rA=perpetual(E_beg,E_ev,'AVG')
add('E-6-5','Perpetual: inventory costing methods — FIFO and LIFO',CASE_E+"\n\nCompute cost of goods sold and ending inventory using (a) FIFO and (b) LIFO.",
f"""**(a) FIFO**
{perp_table(rF)}
COGS **{money(rF['cogs'])}**; ending **{money(rF['end'])}**.

**(b) LIFO**
{perp_table(rL)}
COGS **{money(rL['cogs'])}**; ending **{money(rL['end'])}**.""")
add('E-6-9','Perpetual: inventory costing methods — weighted average',CASE_E+"\n\nCompute cost of goods sold and ending inventory using weighted average (moving average; round unit costs to cents).",
f"""{perp_table(rA)}

COGS **{money(rA['cogs'])}**; ending **{money(rA['end'])}**.""")

add('E-6-6','Specific identification',CASE_E+"\n\nThe May 9 sale came from 80 beginning units and 110 May 3 units. The May 26 sale came from 20 beginning units, 30 May 3 units and 90 May 17 units. Compute cost of goods sold and ending inventory.",
"""- May 9: 80 × $20 + 110 × $21 = 1,600 + 2,310 = 3,910
- May 26: 20 × $20 + 30 × $21 + 90 × $22.50 = 400 + 630 + 2,025 = 3,055

Cost of goods sold = **$6,965**.
Ending: 20 × $21 + 30 × $22.50 = 420 + 675 = **$1,095**.

Check: goods available 2,000 + 3,360 + 2,700 = 8,060 = 6,965 + 1,095.""")
check(2000+3360+2700,6965+1095)

add('E-6-11','Comparing LIFO numbers to FIFO numbers; ratio analysis',f"""
Hale Hardware (E-6-4A data) had net sales of $9,900 and operating expenses of $1,600.
1. Compute gross profit and net income under FIFO and LIFO.
2. Compute the gross margin ratio under each method.
3. Explain the difference.
""",f"""
{T(['','FIFO','LIFO'],['Net sales','9,900','9,900'],['Cost of goods sold',f(D['FIFO']['cogs']),f(D['LIFO']['cogs'])],['Gross profit',f(9900-D['FIFO']['cogs']),f(9900-D['LIFO']['cogs'])],['Net income',f(9900-D['FIFO']['cogs']-1600),f(9900-D['LIFO']['cogs']-1600)],['Gross margin ratio','%.1f%%'%((9900-D['FIFO']['cogs'])/99),'%.1f%%'%((9900-D['LIFO']['cogs'])/99)])}

Unit costs rose during the year. LIFO puts the newest, higher costs into cost of goods sold, so profit and the margin are lower than under FIFO.
""")

add('E-6-12','Analyzing inventory errors',"""
Reported results for Quay Co.:
| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Cost of goods sold | $124,000 | $131,500 | $127,800 |
| Net income | $36,000 | $33,400 | $38,900 |

Year 1 ending inventory was **understated** by $4,500. Year 2 ending inventory was correct. Compute the correct cost of goods sold and net income for each year.
""","""
| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Correct COGS | 124,000 − 4,500 = **119,500** | 131,500 + 4,500 = **136,000** | **127,800** |
| Correct net income | 36,000 + 4,500 = **40,500** | 33,400 − 4,500 = **28,900** | **38,900** |

The Year 1 error reverses in Year 2; Year 3 is not affected.
""")

add('E-6-18','Lower of cost and NRV',"""
Apply the lower of cost and NRV item by item and compute the write-down.
| Item | Units | Unit cost | Unit NRV |
|---|---|---|---|
| Blenders | 30 | $68 | $72 |
| Toasters | 45 | $34 | $29 |
| Kettles | 60 | $22 | $20 |
| Mixers | 15 | $120 | $125 |
""","""
| Item | Cost | NRV | Lower |
|---|---|---|---|
| Blenders | 2,040 | 2,160 | 2,040 |
| Toasters | 1,530 | 1,305 | 1,305 |
| Kettles | 1,320 | 1,200 | 1,200 |
| Mixers | 1,800 | 1,875 | 1,800 |
| **Total** | **6,690** | **6,540** | **6,345** |

Write-down = 6,690 − 6,345 = **$345**: Dr Cost of Goods Sold 345, Cr Merchandise Inventory 345.
""")

add('E-6-19','Inventory turnover and days’ sales in inventory',"""
| | Year 2 | Year 1 |
|---|---|---|
| Cost of goods sold | $511,000 | $468,000 |
| Ending inventory | $63,000 | $67,000 |

Compute Year 2 inventory turnover and days' sales in inventory for both years (365 days). Did inventory management improve?
""","""
- Year 2 turnover = 511,000 ÷ ((63,000 + 67,000) ÷ 2) = 511,000 ÷ 65,000 = **7.86 times**
- Days' sales, Year 2 = 63,000 ÷ 511,000 × 365 = **45.0 days**
- Days' sales, Year 1 = 67,000 ÷ 468,000 × 365 = **52.3 days**

Yes — Year 2 holds fewer days of inventory while selling more.
""")
check(round(511000/65000,2),7.86); check(round(63000/511000*365,1),45.0); check(round(67000/468000*365,1),52.3)

add('E-6-7A','Periodic: inventory costing',CASE_A+"\n\nCompute ending inventory and cost of goods sold under FIFO, LIFO and weighted average, and say which gives the lowest gross profit.",
f"""- FIFO: ending {money(A['FIFO']['end'])}, COGS {money(A['FIFO']['cogs'])}
- LIFO: ending {money(A['LIFO']['end'])}, COGS {money(A['LIFO']['cogs'])}
- Weighted average: ending {money(A['WA']['end'])}, COGS {money(A['WA']['cogs'])}

LIFO has the highest COGS, so it gives the lowest gross profit.""")

add('E-6-13B','Estimating ending inventory — retail method',"""
Use the retail inventory method to estimate Juniper Store's ending inventory at cost.
| | At cost | At retail |
|---|---|---|
| Beginning inventory | $27,600 | $46,000 |
| Net purchases | $86,400 | $144,000 |
| Net sales | | $151,000 |
""","""
Goods available: cost 114,000; retail 190,000. Cost-to-retail ratio = 114,000 ÷ 190,000 = **60%**.
Ending inventory at retail = 190,000 − 151,000 = 39,000.
Ending inventory at cost = 39,000 × 60% = **$23,400**.
""")

add('E-6-14A','Periodic: cost flow assumptions',CASE_D+"\n\nWithout computing amounts first, rank FIFO, LIFO and weighted average from highest to lowest ending inventory. Then confirm with numbers.",
f"""Costs rose during the year, so ending inventory: FIFO > weighted average > LIFO.
- FIFO {money(D['FIFO']['end'])} > weighted average {money(D['WA']['end'])} > LIFO {money(D['LIFO']['end'])}""")

add('E-6-15B','Estimating ending inventory — gross profit method',"""
Fenn Co. needs a quarterly estimate of inventory. Beginning inventory $58,000; purchases $212,000; purchase returns $4,000; freight-in $3,000; sales $310,000; sales returns $10,000. The gross profit ratio is 30%. Estimate ending inventory.
""","""
Goods available = 58,000 + 212,000 − 4,000 + 3,000 = 269,000.
Net sales = 310,000 − 10,000 = 300,000; estimated COGS = 300,000 × 70% = 210,000.
Estimated ending inventory = 269,000 − 210,000 = **$59,000**.
""")

F_beg=(40,50.00); F_ev=[('buy','Feb 6',60,52.00),('sell','Feb 10',70),('buy','Feb 18',50,55.00),('sell','Feb 25',45)]
rF2=perpetual(F_beg,F_ev,'FIFO'); rL2=perpetual(F_beg,F_ev,'LIFO'); rA2=perpetual(F_beg,F_ev,'AVG')
add('E-6-16','Perpetual inventory costing',"""
Perpetual system. Pella Bikes, February:
| Date | Activity | Units | Unit cost |
|---|---|---|---|
| Feb 1 | Beginning | 40 | $50 |
| Feb 6 | Purchase | 60 | $52 |
| Feb 10 | Sale | 70 | |
| Feb 18 | Purchase | 50 | $55 |
| Feb 25 | Sale | 45 | |

Compute cost of goods sold and ending inventory under FIFO, LIFO and weighted average.
""",f"""
{T(['Method','Cost of goods sold','Ending inventory'],['FIFO',money(rF2['cogs']),money(rF2['end'])],['LIFO',money(rL2['cogs']),money(rL2['end'])],['Weighted average',money(rA2['cogs']),money(rA2['end'])])}

**FIFO working**
{perp_table(rF2)}

**LIFO working**
{perp_table(rL2)}

**Weighted average working**
{perp_table(rA2)}
""")

G=periodic((40,50.00),[('Feb 6',60,52.00),('Feb 18',50,55.00)],115)
add('E-6-17A','Periodic inventory costing',"""
Use the Pella Bikes data (E-6-16), but assume a **periodic** system: 150 units available, 115 sold. Compute ending inventory and cost of goods sold under FIFO, LIFO and weighted average. Which methods give the same answers as the perpetual system?
""",f"""
{T(['Method','Ending inventory','Cost of goods sold'],['FIFO',money(G['FIFO']['end']),money(G['FIFO']['cogs'])],['LIFO',money(G['LIFO']['end']),money(G['LIFO']['cogs'])],['Weighted average',money(G['WA']['end']),money(G['WA']['cogs'])])}

FIFO always gives the same result under both systems. LIFO and weighted average usually differ because the perpetual system costs each sale using only the units on hand at that date.
""")

# ---------- Problems A and B ----------
def p_alt(id,co,beg,ev,price,expenses,suffix):
    rf=perpetual(beg,ev,'FIFO'); rl=perpetual(beg,ev,'LIFO'); ra=perpetual(beg,ev,'AVG')
    units_sold=sum(e[2] for e in ev if e[0]=='sell'); sales=units_sold*price
    rows=''.join('| %s | %s | %s | %s |\n'%(e[1],'Purchase' if e[0]=='buy' else 'Sale',f(e[2]),money(e[3]) if e[0]=='buy' else money(price)+' selling price') for e in ev)
    ni=lambda c: round(sales-c-expenses,2)
    chk(id,('FIFO cost of goods sold',rf['cogs']),('FIFO ending inventory',rf['end']),('LIFO cost of goods sold',rl['cogs']),('LIFO ending inventory',rl['end']),('Weighted average cost of goods sold',ra['cogs']),('Weighted average ending inventory',ra['end']),('FIFO net income',ni(rf['cogs'])))
    add(id,'Perpetual: alternative cost flows',f"""
{co} uses a **perpetual** system. Data for the quarter:
| Date | Activity | Units | Unit cost / price |
|---|---|---|---|
| Start | Beginning inventory | {f(beg[0])} | {money(beg[1])} |
{rows}
Operating expenses were {money(expenses)}.
1. Compute cost of goods sold and ending inventory under FIFO, LIFO and weighted average (round unit costs to cents).
2. Prepare a short income statement under each method.
3. Which method gives the highest net income, and why?
""",f"""
1.
**FIFO**
{perp_table(rf)}
**LIFO**
{perp_table(rl)}
**Weighted average**
{perp_table(ra)}

{T(['Method','Cost of goods sold','Ending inventory'],['FIFO',money(rf['cogs']),money(rf['end'])],['LIFO',money(rl['cogs']),money(rl['end'])],['Weighted average',money(ra['cogs']),money(ra['end'])])}

2. Sales = {f(units_sold)} × {money(price)} = {money(sales)}.
{T(['','FIFO','LIFO','Weighted avg'],['Sales',f(sales),f(sales),f(sales)],['Cost of goods sold',f(rf['cogs']),f(rl['cogs']),f(ra['cogs'])],['Gross profit',f(round(sales-rf['cogs'],2)),f(round(sales-rl['cogs'],2)),f(round(sales-ra['cogs'],2))],['Operating expenses',f(expenses),f(expenses),f(expenses)],['**Net income**','**'+f(ni(rf['cogs']))+'**','**'+f(ni(rl['cogs']))+'**','**'+f(ni(ra['cogs']))+'**'])}

3. FIFO — purchase costs rose, and FIFO charges the older, lower costs to cost of goods sold.
""")
p_alt('P-6-1A','Garnet Tools',(300,14.00),[('buy','Jan 15',500,15.00),('sell','Feb 2',600),('buy','Feb 20',400,16.00),('sell','Mar 12',450)],32.00,9800,'A')
p_alt('P-6-1B','Topaz Tools',(250,22.00),[('buy','Apr 10',400,23.00),('sell','May 3',500),('buy','May 21',350,24.50),('sell','Jun 15',380)],45.00,11200,'B')
p_alt('P-6-9A','Indigo Shoes',(120,40.00),[('buy','Oct 4',180,42.00),('sell','Oct 11',200),('buy','Oct 19',150,45.00),('sell','Oct 28',170)],79.00,5400,'A')
p_alt('P-6-9B','Violet Shoes',(90,60.00),[('buy','Nov 3',140,63.00),('sell','Nov 12',160),('buy','Nov 20',110,66.00),('sell','Nov 29',120)],110.00,4700,'B')

def p_periodic(id,co,beg,buys,sold,price,exp):
    r=periodic(beg,buys,sold); sales=sold*price
    chk(id,('FIFO ending inventory',r['FIFO']['end']),('FIFO cost of goods sold',r['FIFO']['cogs']),('LIFO ending inventory',r['LIFO']['end']),('LIFO cost of goods sold',r['LIFO']['cogs']),('Weighted average ending inventory',r['WA']['end'],wt(r)),('Weighted average cost of goods sold',r['WA']['cogs'],wt(r)))
    add(id,'Periodic: alternative cost flows',f"""
{co} uses a **periodic** system.
{avail_table(r['layers'])}
It sold {f(sold)} units at {money(price)} each. Operating expenses were {money(exp)}.
1. Compute ending inventory and cost of goods sold under FIFO, LIFO and weighted average.
2. Compute gross profit and net income under each method.
""",f"""
1.
- FIFO: {r['FIFO']['work']}; COGS **{money(r['FIFO']['cogs'])}**
- LIFO: {r['LIFO']['work']}; COGS **{money(r['LIFO']['cogs'])}**
- Weighted average: {r['WA']['work']}; COGS **{money(r['WA']['cogs'])}**

2. Sales = {money(sales)}.
{T(['','FIFO','LIFO','Weighted avg'],['Gross profit',f(round(sales-r['FIFO']['cogs'],2)),f(round(sales-r['LIFO']['cogs'],2)),f(round(sales-r['WA']['cogs'],2))],['Net income',f(round(sales-r['FIFO']['cogs']-exp,2)),f(round(sales-r['LIFO']['cogs']-exp,2)),f(round(sales-r['WA']['cogs']-exp,2))])}
""")
p_periodic('P-6-2A','Cedar Paint',(400,9.00),[('Feb 1',600,9.50),('May 1',800,10.00),('Sep 1',500,11.00)],1800,19.00,8200)
p_periodic('P-6-2B','Maple Paint',(350,12.00),[('Mar 1',500,12.80),('Jun 1',650,13.50),('Oct 1',400,14.00)],1500,25.00,9600)
p_periodic('P-6-5A','Orchid Tea',(1000,3.00),[('Jan 20',1500,3.20),('Apr 15',2000,3.30),('Aug 30',1200,3.50)],4500,6.00,5100)
p_periodic('P-6-5B','Lotus Tea',(800,4.00),[('Feb 10',1400,4.15),('May 25',1600,4.40),('Sep 12',1000,4.60)],3900,7.50,4800)

def p_err(id,co,rep,err_y1,err_y2):
    (c1,c2,c3),(n1,n2,n3)=rep
    cc=[c1-err_y1,c2+err_y1-err_y2,c3+err_y2]; nn=[n1+err_y1,n2-err_y1+err_y2,n3-err_y2]
    d=lambda e,w: ('understated' if e>0 else 'overstated')+' by '+money(abs(e))
    chk(id,('Correct Year 1 net income',nn[0]),('Correct Year 2 net income',nn[1]),('Correct Year 3 net income',nn[2]))
    add(id,'Analysis of inventory errors',f"""
{co} reported:
{T(['','Year 1','Year 2','Year 3'],['Cost of goods sold',money(c1),money(c2),money(c3)],['Net income',money(n1),money(n2),money(n3)])}
An audit finds: Year 1 ending inventory was {d(err_y1,1)}; Year 2 ending inventory was {d(err_y2,2)}. Year 3 ending inventory is correct.
1. Compute the correct cost of goods sold and net income for each year.
2. What is the total net income error over the three years?
""",f"""
An understated ending inventory overstates COGS that year and understates COGS the next year (and the reverse for overstatement).
{T(['','Year 1','Year 2','Year 3'],['Correct COGS',money(cc[0]),money(cc[1]),money(cc[2])],['Correct net income',money(nn[0]),money(nn[1]),money(nn[2])])}

2. Zero: {money(n1+n2+n3)} reported = {money(sum(nn))} correct. Inventory errors counterbalance.
""")
    check(sum(nn),n1+n2+n3)
p_err('P-6-3A','Ivy Co.',((205000,212000,219500),(48000,51500,55000)),6000,-3500)
p_err('P-6-3B','Elm Co.',((168000,175400,181200),(39200,42800,45100)),-4200,2800)

def p_lcnrv(id,co,items):
    rows=[];tc=tn=tl=0
    for n,u,c,v in items:
        a=u*c;b=u*v;l=min(a,b);tc+=a;tn+=b;tl+=l;rows.append([n,f(u),money(c),money(v),f(a),f(b),f(l)])
    chk(id,('Inventory, item by item',tl),('Inventory, whole inventory',min(tc,tn)),('Write-down (item by item)',tc-tl))
    add(id,'Lower of cost and NRV',f"""
{co} inventory at year-end:
{T(['Item','Units','Unit cost','Unit NRV'],*[[r[0],r[1],r[2],r[3]] for r in rows])}
1. Compute inventory at the lower of cost and NRV, applied item by item.
2. Compute it applied to the inventory as a whole (total cost vs total NRV).
3. Record the item-by-item write-down.
""",f"""
1.
{T(['Item','Units','Unit cost','Unit NRV','Total cost','Total NRV','Lower'],*rows,['**Total**','','','','**'+f(tc)+'**','**'+f(tn)+'**','**'+f(tl)+'**'])}
Item by item: **{money(tl)}**.

2. Whole inventory: lower of {money(tc)} and {money(tn)} = **{money(min(tc,tn))}**.

3. Write-down {money(tc-tl)}:
{JE(('Dec 31','Cost of Goods Sold',tc-tl,''),('','Merchandise Inventory','',tc-tl))}
""")
p_lcnrv('P-6-4A','Bramble Sports',[('Tents',20,210,185),('Sleeping bags',45,80,92),('Stoves',30,64,58),('Lanterns',70,18,21),('Backpacks',25,96,90)])
p_lcnrv('P-6-4B','Heather Sports',[('Rackets',35,88,79),('Shoes',50,62,70),('Bags',40,45,41),('Balls (cases)',90,12,13),('Nets',12,150,138)])

def p_income(id,co,beg,buys,sold,price,exp,tax):
    r=periodic(beg,buys,sold); sales=sold*price
    def col(m):
        c=r[m]['cogs']; gp=round(sales-c,2); pre=round(gp-exp,2); t=round(pre*tax,2); return [f(c),f(gp),f(pre),f(t),f(round(pre-t,2))]
    cols={m:col(m) for m in ['FIFO','LIFO','WA']}
    chk(id,*[(n+' net income',float(cols[m][4].replace(',','')))+((wt(r),) if m=='WA' else ()) for m,n in [('FIFO','FIFO'),('LIFO','LIFO'),('WA','Weighted average')]])
    add(id,'Periodic: income comparisons and cost flows',f"""
{co} (periodic):
{avail_table(r['layers'])}
Sales: {f(sold)} units at {money(price)}. Operating expenses {money(exp)}. Income tax rate {int(tax*100)}%.
1. Prepare comparative income statements under FIFO, LIFO and weighted average.
2. Which method minimizes income tax? Which may the company use under IFRS?
""",f"""
1. Sales = {money(sales)}.
{T(['','FIFO','LIFO','Weighted avg'],['Cost of goods sold',*[cols[m][0] for m in cols]],['Gross profit',*[cols[m][1] for m in cols]],['Income before tax',*[cols[m][2] for m in cols]],['Income tax',*[cols[m][3] for m in cols]],['**Net income**',*['**'+cols[m][4]+'**' for m in cols]])}

2. LIFO gives the lowest taxable income when costs rise, but IFRS does not allow LIFO; the company may use FIFO or weighted average.
""")
p_income('P-6-6A','Saffron Electronics',(150,80.00),[('Mar 5',250,84.00),('Jul 9',300,88.00),('Nov 2',200,92.00)],720,150.00,21000,0.30)
p_income('P-6-6B','Indigo Electronics',(120,95.00),[('Feb 8',220,99.00),('Jun 4',260,104.00),('Oct 1',180,108.00)],640,170.00,24500,0.25)

def p_retail(id,co,bc,br,pc,pr,ns,count_r):
    gc=bc+pc; gr=br+pr; ratio=gc/gr; er=gr-ns; ec=round(er*ratio,2); cc=round(count_r*ratio,2)
    chk(id,('Estimated ending inventory at cost',ec),('Physical count at cost',cc),('Shrinkage at cost',round(ec-cc,2)))
    add(id,'Retail inventory method',f"""
{co} uses the retail method.
{T(['','At cost','At retail'],['Beginning inventory',money(bc),money(br)],['Net purchases',money(pc),money(pr)],['Net sales','',money(ns)])}
1. Estimate ending inventory at cost.
2. A physical count at retail prices shows {money(count_r)}. Convert it to cost and compute inventory shrinkage at cost.
""",f"""
1. Goods available: cost {money(gc)}, retail {money(gr)}. Cost ratio = {money(gc)} ÷ {money(gr)} = **{ratio*100:.1f}%**.
Ending at retail = {money(gr)} − {money(ns)} = {money(er)}; at cost = {money(er)} × {ratio*100:.1f}% = **{money(ec)}**.

2. Count at cost = {money(count_r)} × {ratio*100:.1f}% = **{money(cc)}**. Shrinkage at cost = {money(ec)} − {money(cc)} = **{money(round(ec-cc,2))}**.
""")
p_retail('P-6-7A','Clover Mart',36000,60000,174000,290000,281000,66500)
p_retail('P-6-7B','Poppy Mart',29700,54000,151800,276000,262500,64800)

def p_gp(id,co,beg,pur,pret,fi,sales,sret,gpr,salv):
    ga=beg+pur-pret+fi; ns=sales-sret; cogs=round(ns*(1-gpr),2); end=round(ga-cogs,2)
    chk(id,('Estimated cost of goods sold',cogs),('Estimated inventory on the fire date',end),('Inventory destroyed',round(end-salv,2)))
    add(id,'Gross profit method',f"""
A fire destroyed {co}'s inventory on Sep 30. From the records:
{T(['Item','Amount'],['Beginning inventory, Jan 1',money(beg)],['Purchases',money(pur)],['Purchase returns',money(pret)],['Freight-in',money(fi)],['Sales',money(sales)],['Sales returns',money(sret)])}
The gross profit ratio has been {int(gpr*100)}% for several years. Goods costing {money(salv)} were saved undamaged.
Estimate the cost of inventory destroyed.
""",f"""
- Goods available = {f(beg)} + {f(pur)} − {f(pret)} + {f(fi)} = {money(ga)}
- Net sales = {f(sales)} − {f(sret)} = {money(ns)}
- Estimated COGS = {money(ns)} × {int((1-gpr)*100)}% = {money(cogs)}
- Estimated inventory on Sep 30 = {money(ga)} − {money(cogs)} = {money(end)}
- Inventory destroyed = {money(end)} − {money(salv)} = **{money(round(end-salv,2))}**
""")
p_gp('P-6-18A','Sorrel Books',62000,248000,5000,4000,380000,12000,0.35,9500)
p_gp('P-6-18B','Fennel Books',48500,193000,3500,2900,295000,9000,0.32,7200)

# ---------- key answers for the self-check boxes ----------
chk('QS-6-1',('Units in ending inventory',1985))
chk('QS-6-2',('Inventory cost',18280))
chk('E-6-2',('Inventory cost',44270))
chk('QS-6-9',('Units available',A['units']),('Cost of goods available',A['total']),('Units in ending inventory',A['end_units']))
for qid,m in [('QS-6-5A','FIFO'),('QS-6-6A','LIFO'),('QS-6-7A','WA')]: chk(qid,('Ending inventory',A[m]['end'],wt(A) if m=='WA' else 0.01),('Cost of goods sold',A[m]['cogs'],wt(A) if m=='WA' else 0.01))
chk('QS-6-15A',('Ending inventory',3900),('Cost of goods sold',A['total']-3900))
chk('QS-6-14A',('Ending inventory',B['LIFO']['end']),('Cost of goods sold',B['LIFO']['cogs']))
chk('QS-6-13A',('Ending inventory',B['WA']['end'],wt(B)),('Cost of goods sold',B['WA']['cogs'],wt(B)))
for qid,m in [('QS-6-18','FIFO'),('QS-6-4','LIFO'),('QS-6-3','AVG')]:
    r=perpetual(C_beg,C_ev,m); chk(qid,('Cost of goods sold',r['cogs']),('Ending inventory',r['end']))
chk('QS-6-19',('Cost of goods sold',4110),('Ending inventory',tot_C-4110))
for qid,m in [('QS-6-11','LIFO'),('QS-6-12','AVG')]:
    r=perpetual((60,5.00),[('buy','Mar 2',90,5.40),('sell','Mar 9',100),('buy','Mar 15',70,5.80),('sell','Mar 22',50)],m); chk(qid,('Cost of goods sold',r['cogs']),('Ending inventory',r['end']))
chk('QS-6-17',('Inventory at lower of cost and NRV',6740),('Write-down',400))
chk('QS-6-21',('Arden inventory turnover',7.3,0.06),('Belmont inventory turnover',4.56,0.06),('Arden days\' sales in inventory',54.4,0.1),('Belmont days\' sales in inventory',73.3,0.1))
chk('QS-6-22B',('Estimated inventory lost',32500))
chk('E-6-3A',('FIFO net income',12600-B['FIFO']['cogs']-3200),('LIFO net income',12600-B['LIFO']['cogs']-3200),('Weighted average net income',round(12600-B['WA']['cogs']-3200,2),wt(B)))
chk('E-6-4A',('FIFO cost of goods sold',D['FIFO']['cogs']),('LIFO cost of goods sold',D['LIFO']['cogs']),('Weighted average cost of goods sold',D['WA']['cogs'],wt(D)))
chk('E-6-5',('FIFO cost of goods sold',rF['cogs']),('FIFO ending inventory',rF['end']),('LIFO cost of goods sold',rL['cogs']),('LIFO ending inventory',rL['end']))
chk('E-6-9',('Cost of goods sold',rA['cogs']),('Ending inventory',rA['end']))
chk('E-6-6',('Cost of goods sold',6965),('Ending inventory',1095))
chk('E-6-11',('FIFO net income',9900-D['FIFO']['cogs']-1600),('LIFO net income',9900-D['LIFO']['cogs']-1600))
chk('E-6-12',('Correct Year 1 net income',40500),('Correct Year 2 net income',28900),('Correct Year 3 net income',38900))
chk('E-6-18',('Inventory at lower of cost and NRV',6345),('Write-down',345))
chk('E-6-19',('Year 2 inventory turnover',7.86,0.06),('Year 2 days\' sales in inventory',45.0,0.1),('Year 1 days\' sales in inventory',52.3,0.1))
chk('E-6-7A',('FIFO ending inventory',A['FIFO']['end']),('LIFO ending inventory',A['LIFO']['end']),('Weighted average ending inventory',A['WA']['end'],wt(A)))
chk('E-6-13B',('Estimated ending inventory at cost',23400))
chk('E-6-15B',('Estimated ending inventory',59000))
chk('E-6-16',('FIFO cost of goods sold',rF2['cogs']),('LIFO cost of goods sold',rL2['cogs']),('Weighted average cost of goods sold',rA2['cogs']))
chk('E-6-17A',('FIFO ending inventory',G['FIFO']['end']),('LIFO ending inventory',G['LIFO']['end']),('Weighted average ending inventory',G['WA']['end'],wt(G)))

order=[i['id'] for i in json.load(open(os.path.join(os.path.dirname(__file__),'..','..','data','accounting-textbook-index.json')))['items'] if i['chapter']=='6' and not i['id'].startswith('SEC')]
ITEMS.sort(key=lambda x:order.index(x['id']))
assert [i['id'] for i in ITEMS]==order,(set(order)-{i['id'] for i in ITEMS},{i['id'] for i in ITEMS}-set(order))
attach_checks()
json.dump(ITEMS,open(os.path.join(os.path.dirname(__file__),'..','..','data','textbook-sos','ch6.json'),'w'),ensure_ascii=False,separators=(',',':'))
print(len(ITEMS))
