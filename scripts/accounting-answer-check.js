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
