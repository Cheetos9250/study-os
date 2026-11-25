/* Accounting topic filter (owner, 20 Nov 2026): under one chapter, practice questions can be narrowed to a topic.
   Topics are worked out in the browser from the question text and explanation; nothing is stored.
   Rules run in order and the first match wins, so a topic is only a study aid, not a grade. */
(function(root){
  const T={
    c5:[['Returns, freight & FOB',/\breturns?\b|allowance|\bfob\b|freight|shipping|delivery|damaged/],
        ['Discounts & credit terms',/discount|2\/10|n\/30|\bterms\b/],
        ['Perpetual vs periodic',/perpetual|periodic|physical (count|inventory)|shrink|closing|beginning inventory|purchases account/],
        ['Statements, cycle & ratios',/gross profit|multiple-step|single-step|income statement|profit margin|operating expense|net sales|cost of goods|cogs|from operations|non-?operating|\brate\b|operating cycle|acid-test|revenue|balance sheet|classified|selling expense|administrative/]],
    c6:[['Errors & ownership',/overstat|understat|\berror|consign|\bfob\b|ownership|\btitle\b|in transit|bill-and-hold|physical count|counted too|too high|too low/],
        ['Lower of cost or NRV',/\bnrv\b|net realizable|lower.of.cost|lcnrv/],
        ['Turnover & analysis',/turnover|days in inventory|operating cycle|current ratio|\bratio\b/],
        ['Estimating inventory',/retail (inventory )?method|gross profit method|estimat|\bfire\b|flood|markup|gross profit rate/],
        ['Costing methods',/fifo|lifo|average|specific identification|cost flow|weighted|moving|costing/],
        ['Periodic system & COGS',/periodic|purchase|merchandise inventory|which system|cost of goods|defective/]],
    c7:[['Ledgers & control accounts',/subsidiary|control account|ledger|trial balance/],
        ['Special journals',/journal|cross-?foot|\bcolumn|posting reference|\bref\b/],
        ['Systems & documents',/system|\berp\b|software|audit trail|document|invoice|voucher|three-way|computer|phase|principle|register/]],
    c8:[['Petty cash',/petty|imprest|cash over and short|replenish/],
        ['Bank reconciliation',/reconcil|outstanding|in transit|\bnsf\b|bank (statement|service|error|charge)|\beft\b|credit memo|debit memo/],
        ['Internal control & fraud',/fraud|segregation|internal control|lapping|kiting|bond|vacation|\bsox\b|sarbanes|collusion|responsibility|physical control|verification|documentation|skimming|blind|control over|same employee|cash receipts|cash payments/],
        ['Cash reporting',/cash equivalent|restricted|compensating|overdraft|balance sheet|reported|liquid/],
        ['Bank reconciliation',/\bbank\b|deposit|\bcheck\b|collected|electronic|interest|balance/]],
    c9:[['Credit cards & factoring',/credit card|visa|mastercard|factor|pledg|assign|holdback/],
        ['Analysis & reporting',/turnover|collection period|classif|disclos|credit risk|noncurrent|balance sheet/],
        ['Notes receivable',/\bnotes?\b|interest|maturity|dishonor|honor|promissory/],
        ['Allowance & bad debts',/allowance|bad debt|uncollect|write-?off|direct write|aging|doubtful|realizable/]]
  };
  const text=q=>String((q&&q.q)||'')+' '+String((q&&q.exp)||'')+' '+String((q&&q.case)||'');
  function topicOf(q){
    const rules=T[q&&q.cat]; if(!rules) return '';
    const t=text(q).toLowerCase();
    for(const [name,re] of rules) if(re.test(t)) return name;
    return 'Other';
  }
  /* Final 1201101 study guide (owner, 20 Nov 2026): 'out' = not in the guide, 'in' = in it, '' = not an exam chapter.
     The guide covers perpetual merchandising, FIFO and weighted average, AIS, cash/fraud/internal control and receivables. */
  const OUT=/\blifo\b|last-in|retail (inventory )?method|gross profit method|specific identification|plant asset|depreciation|land improvement|\b(fire|flood)\b[^.]*inventory|inventory[^.]*\b(fire|flood)\b/;
  function guideOf(q){
    const c=q&&q.cat; if(!/^c[5-9]$/.test(c||'')) return '';
    const t=(String(q.q||'')+' '+String(q.case||'')+' '+String((q.opts&&q.opts[q.right])||'')).toLowerCase();
    if(OUT.test(t)) return 'out';
    if(/\bperiodic\b/.test(t)&&!/weighted|average/.test(t)) return 'out';
    return 'in';
  }
  const API={ guide:guideOf, topics:cat=>[...new Set((T[cat]||[]).map(r=>r[0]))].concat(T[cat]?['Other']:[]), of:topicOf, has:cat=>!!T[cat] };
  if(typeof module!=='undefined'&&module.exports) module.exports=API; else root.StudyAccTopics=API;
})(typeof window!=='undefined'?window:globalThis);
