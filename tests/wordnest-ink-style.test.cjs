"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path");
const R=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("WordNest loads the Study OS theme and ink look, in this order",()=>{
  const h=R("vocabloom/index.html");
  const a=h.indexOf("../scripts/study-theme.js"),b=h.indexOf("../assets/study-world.css"),c=h.indexOf("./wordnest-ink.css");
  assert.ok(a>0&&b>a&&c>b,"theme script, then study-world.css, then wordnest-ink.css");
  assert.ok(h.indexOf("</style>")<b,"WordNest's own CSS comes first so the ink look wins");
  assert.match(h,/Kaisei\+Decol/);
  assert.match(h,/Zen\+Maru\+Gothic/);
});
test("WordNest colours follow the Study OS theme, not a private dark switch",()=>{
  const h=R("vocabloom/index.html");
  assert.doesNotMatch(h,/toggle-theme/);
  assert.doesNotMatch(h,/classList\.toggle\('dark'/);
  assert.match(h,/classList\.remove\('dark'\)/);
  const css=R("vocabloom/wordnest-ink.css");
  assert.match(css,/var\(--panel\)/);
  assert.match(css,/var\(--ink\)/);
  assert.doesNotMatch(css,/#5b53d7|#4f47c8/i,"old WordNest purple is gone");
});
test("the old settings.theme value stays in saved data (no migration, nothing lost)",()=>{
  const h=R("vocabloom/index.html");
  assert.match(h,/settings:\{goal:10,thai:true,theme:'light'\}/);
});
