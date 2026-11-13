/* Local, deterministic final-answer checks. No PDF, answer or credential uploads. */
(function(root){
  'use strict';
  // Reviewed against the owner's QS-6-1 screenshot (2026-11-13), not a publisher key.
  // Damaged units have no sale value; FOB destination and consignment remain owned.
  const rules=Object.freeze({
    'QS-6-1':Object.freeze({
      expected:1300-20+350+80,
      explanation:'1,300 − 20 + 350 + 80 = 1,710 units. Exclude the 20 unsaleable damaged units. Include the 350 units awaiting FOB destination delivery and the 80 units out on consignment: ownership remains with Emma.',
      source:'Reviewed calculation from the original QS-6-1 question; not an official publisher answer key.'
    })
  });
  function supports(id){return Object.prototype.hasOwnProperty.call(rules,id);}
  function check(id,answer){
    if(!supports(id))return {status:'unavailable',message:'Automatic checking is not available for this question yet. Your answer is still saved; use manual review.'};
    if(typeof answer!=='string'||!answer.trim())return {status:'empty',message:'Enter your final quantity before checking.'};
    // Full-string match only: never guess from a number buried in journal entries,
    // arithmetic, unrelated prose, currency, multiple answers or malformed grouping.
    const match=answer.trim().match(/^((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.0+)?)(?:\s*(?:units?|หน่วย))?$/i);
    if(!match)return {status:'format',message:'Enter one final quantity, for example 1,710 units. Calculations, journal entries and written reasoning are not graded automatically.'};
    const value=Number(match[1].replace(/,/g,'')),rule=rules[id];
    if(!Number.isSafeInteger(value))return {status:'format',message:'Enter a valid whole-number quantity.'};
    return {status:value===rule.expected?'correct':'incorrect',message:value===rule.expected?'Correct final quantity: 1,710 units.':'Your final quantity does not match the reviewed answer: 1,710 units.',explanation:rule.explanation,source:rule.source};
  }
  const api=Object.freeze({supports,check,count:Object.keys(rules).length});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.StudyAccountingCheck=api;
})(typeof globalThis!=='undefined'?globalThis:this);
