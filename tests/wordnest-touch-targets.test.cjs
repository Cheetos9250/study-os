"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path");
const R=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("WordNest controls are at least 44px for iPad touch",()=>{
  const html=R("vocabloom/index.html"),js=R("vocabloom/wordnest.js");
  const m=html.match(/iPad touch targets[\s\S]*?<\/style>/);
  assert.ok(m,"touch-target block present");
  for(const sel of [".mobile-nav button",".icon-btn",".text-link",".btn",".pill","main button"])assert.ok(m[0].includes(sel),sel);
  assert.match(m[0],/min-height:44px/);
  assert.match(js,/\.wn-switch a\{[^}]*min-height:44px/);
  assert.match(js,/\.wn-back\{[^}]*min-height:44px/);
  assert.doesNotMatch(js,/min-height:40px/);
});
test("WordNest storage keys are untouched by the layout change",()=>{
  assert.match(R("scripts/study-progress-backup.js"),/vocabloom_mvp_v1/);
});
