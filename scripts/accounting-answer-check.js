/* Local, deterministic final-answer checks. No PDF, answer or credential uploads. */
(function(root){
  'use strict';
  // Calculations reviewed from the owner's original-question screenshots,
  // 2026-11-13. These are not an official publisher answer key.
  const rules=Object.freeze({
    'QS-6-1':Object.freeze({
      kind:'quantity',expected:1300-20+350+80,display:'1,710 units',example:'1,710 units',
      explanation:'1,300 − 20 + 350 + 80 = 1,710 units. Exclude the 20 unsaleable damaged units. Include the 350 units awaiting FOB destination delivery and the 80 units out on consignment: ownership remains with Emma.',
      source:'Reviewed calculation from the original QS-6-1 question; not an official publisher answer key.'
    }),
    'QS-6-2':Object.freeze({
      kind:'money',expected:(14000+250+300+900)*100,display:'$15,450.00',example:'$15,450.00',
      explanation:'$14,000 purchase price + $250 transportation-in + $300 shipping insurance + $900 import duties = $15,450 inventory cost. Include costs to acquire and bring the car to its saleable location and condition. Advertising ($150), sales staff salaries ($1,250) and shrub trimming ($180) are period expenses, not inventory cost.',
      source:'Reviewed calculation from the original QS-6-2 question; not an official publisher answer key.'
    }),
    'QS-6-4':Object.freeze({
      kind:'money',expected:45000,display:'$450.00',example:'$450.00',
      explanation:'Jan. data: 320 units @ $3.00, 80 @ $3.20 (Jan. 9), 100 @ $3.34 (Jan. 25); 350 units sold Jan. 26. Perpetual LIFO: the sale takes the latest costs first: 100 × $3.34 + 80 × $3.20 + 170 × $3.00 = $334 + $256 + $510 = $1,100 cost of goods sold. Ending inventory = 150 units × $3.00 = $450.',
      source:'Reviewed calculation from the original question (data read from the printed page); not an official publisher answer key.'
    }),
    'QS-6-3':Object.freeze({
      kind:'money',expected:46500,display:'$465.00',example:'$465.00',
      explanation:'Jan. data: 320 units @ $3.00, 80 @ $3.20 (Jan. 9), 100 @ $3.34 (Jan. 25); 350 units sold Jan. 26. Perpetual weighted average (all purchases come before the sale): ($960 + $256 + $334) ÷ 500 units = $3.10 per unit. Cost of goods sold = 350 × $3.10 = $1,085; ending inventory = 150 × $3.10 = $465.',
      source:'Reviewed calculation from the original question (data read from the printed page); not an official publisher answer key.'
    }),
    'QS-6-18':Object.freeze({
      kind:'money',expected:39000,display:'$390.00',example:'$390.00',
      explanation:'Dec. data: 10 units @ $6 (Dec. 7), 20 @ $12 (Dec. 14), 15 @ $14 (Dec. 21); 15 units sold Dec. 15. Perpetual FIFO: the Dec. 15 sale takes 10 × $6 + 5 × $12 = $120 cost of goods sold. Left: 15 × $12 = $180, plus the Dec. 21 purchase 15 × $14 = $210. Ending inventory = $180 + $210 = $390.',
      source:'Reviewed calculation from the original question (data read from the printed page); not an official publisher answer key.'
    }),
    'QS-6-11':Object.freeze({
      kind:'money',expected:33000,display:'$330.00',example:'$330.00',
      explanation:'Dec. data: 10 units @ $6 (Dec. 7), 20 @ $12 (Dec. 14), 15 @ $14 (Dec. 21); 15 units sold Dec. 15. Perpetual LIFO: the Dec. 15 sale takes the latest costs available then: 15 × $12 = $180 cost of goods sold (the Dec. 21 units are not yet bought). Left: 10 × $6 + 5 × $12 = $120, plus 15 × $14 = $210. Ending inventory = $120 + $210 = $330.',
      source:'Reviewed calculation from the original question (data read from the printed page); not an official publisher answer key.'
    }),
    'QS-6-12':Object.freeze({
      kind:'money',expected:36000,display:'$360.00',example:'$360.00',
      explanation:'Dec. data: 10 units @ $6 (Dec. 7), 20 @ $12 (Dec. 14), 15 @ $14 (Dec. 21); 15 units sold Dec. 15. Perpetual weighted average (recomputed after each purchase): on Dec. 15, ($60 + $240) ÷ 30 units = $10.00; cost of goods sold = 15 × $10 = $150, leaving 15 × $10 = $150. Add the Dec. 21 purchase $210. Ending inventory = $150 + $210 = $360.',
      source:'Reviewed calculation from the original question (data read from the printed page); not an official publisher answer key.'
    }),
    'QS-6-19':Object.freeze({
      kind:'money',expected:37800,display:'$378.00',example:'$378.00',
      explanation:'Dec. data: 10 units @ $6 (Dec. 7), 20 @ $12 (Dec. 14), 15 @ $14 (Dec. 21); 15 units sold Dec. 15. Perpetual specific identification: 8 units sold from the Dec. 7 purchase and 7 from Dec. 14, so cost of goods sold = 8 × $6 + 7 × $12 = $48 + $84 = $132. Goods available = $60 + $240 + $210 = $510. Ending inventory = $510 − $132 = $378.',
      source:'Reviewed calculation from the original question (data read from the printed page); not an official publisher answer key.'
    }),
    'E-8-12':Object.freeze({
      kind:'money',expected:1158200,display:'$11,582.00',example:'$11,582.00',
      explanation:'Bank side: $10,555 + $2,856 deposit in transit − $1,829 outstanding checks = $11,582. Book side: $11,589 − $16 service charge + $9 (check No. 919 was drawn for $467 but recorded as $476, so cash was understated by $9) = $11,582. The two adjusted balances agree.',
      source:'Reviewed calculation from the original question; matches the check figure printed beside it in the textbook. Not an official publisher answer key.'
    }),
    'E-8-14':Object.freeze({
      kind:'money',expected:2680000,display:'$26,800.00',example:'$26,800.00',
      explanation:'Bank side: $25,800 + $6,200 deposit in transit − $5,600 outstanding checks + $400 (a check written by Smith Company was wrongly charged to this account) = $26,800. Book side: $27,500 − $100 service charge − $600 NSF check = $26,800. The two adjusted balances agree.',
      source:'Reviewed calculation from the original question; matches the check figure printed beside it in the textbook. Not an official publisher answer key.'
    }),
    'P-8-4A':Object.freeze({
      kind:'money',expected:3460200,display:'$34,602.00',example:'$34,602.00',
      explanation:'Bank side: $27,233 + $11,514 deposit in transit − ($1,482 + $382 + $2,281 = $4,145 outstanding checks) = $34,602. Book side: $27,497 − $20 (check No. 3056 drawn for $1,270 but recorded as $1,250) + $7,955 note collected by the bank − $805 NSF check − $25 service charge = $34,602. The two adjusted balances agree.',
      source:'Reviewed calculation from the original question; matches the check figure printed beside it in the textbook. Not an official publisher answer key.'
    }),
    'P-8-5A':Object.freeze({
      kind:'money',expected:1827100,display:'$18,271.00',example:'$18,271.00',
      explanation:'Bank side: $18,453 + $1,682 deposit in transit (Sep. 30) − ($494 + $982 + $388 = $1,864 outstanding checks: Nos. 5893, 5906, 5908) = $18,271. Book side: $17,404 − $30 (check No. 5904 cleared at $2,090 but was recorded as $2,060) − $600 NSF check + $1,485 note collected + $12 interest = $18,271. The two adjusted balances agree.',
      source:'Reviewed calculation from the original question; matches the check figure printed beside it in the textbook. Not an official publisher answer key.'
    })
  });
  const ids=Object.freeze(Object.keys(rules));
  function supports(id){return Object.prototype.hasOwnProperty.call(rules,id);}
  function describe(id){return supports(id)?{kind:rules[id].kind,example:rules[id].example}:null;}
  function solution(id){return supports(id)?{status:'solution',message:'Reviewed answer: '+rules[id].display,explanation:rules[id].explanation,source:rules[id].source}:{status:'unavailable',message:'No reviewed answer is available for this question yet.'};}
  function finalText(answer){
    const text=answer.trim(),lines=text.split(/\r?\n/);
    const label=/^\s*(?:Final answer|คำตอบสุดท้าย)\s*:\s*(.+)$/i;
    const last=lines[lines.length-1].match(label);
    if(last){
      // Require one explicit final line. Do not choose between competing finals.
      if(lines.slice(0,-1).some(line=>/^\s*(?:Final answer|คำตอบสุดท้าย)\s*:/i.test(line)))return null;
      return last[1].trim();
    }
    return lines.length===1?text:null;
  }
  function parse(text,kind){
    if(text===null)return null;
    const amount='(?:\\d{1,3}(?:,\\d{3})+|\\d+)';
    if(kind==='quantity'){
      const m=text.match(new RegExp('^('+amount+')(?:\\.0+)?(?:\\s*(?:units?|หน่วย))?$','i'));
      if(!m)return null;const n=Number(m[1].replace(/,/g,''));return Number.isSafeInteger(n)?n:null;
    }
    const m=text.match(new RegExp('^(?:(US\\$|\\$|USD)\\s*)?('+amount+')(?:\\.(\\d{1,2}))?(?:\\s+(USD))?$','i'));
    if(!m||m[1]&&m[4])return null;
    // Parse cents as integers; never round an imprecise/extra-decimal answer.
    const whole=Number(m[2].replace(/,/g,'')),cents=whole*100+Number((m[3]||'').padEnd(2,'0'));
    return Number.isSafeInteger(cents)?cents:null;
  }
  function check(id,answer){
    if(!supports(id))return {status:'unavailable',message:'Automatic checking is not available for this question yet. Your answer is still saved; use manual review.'};
    const rule=rules[id];
    if(typeof answer!=='string'||!answer.trim())return {status:'empty',message:'Enter your final answer before checking.'};
    const value=parse(finalText(answer),rule.kind);
    if(value===null)return {status:'format',message:'Enter one final answer, for example '+rule.example+'. To keep working above it, add a last line: Final answer: '+rule.example+'. Working and reasoning are not graded automatically.'};
    const correct=value===rule.expected,label=rule.kind==='quantity'?'quantity':'amount';
    return {status:correct?'correct':'incorrect',message:correct?'Correct final '+label+': '+rule.display+'.':'Your final '+label+' does not match the reviewed answer: '+rule.display+'.',explanation:rule.explanation,source:rule.source};
  }
  const api=Object.freeze({supports,describe,solution,check,ids,count:ids.length});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.StudyAccountingCheck=api;
})(typeof globalThis!=='undefined'?globalThis:this);
