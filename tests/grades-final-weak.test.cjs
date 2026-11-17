"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../scripts/study-grades.js'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const course=items=>G.load(JSON.stringify({courses:[{name:'Accounting',items}]})).courses[0];
test('final score needed per letter: final is the open item named final; other open items at the rate so far',()=>{
 const c=course([{name:'Quizzes',weight:40,got:32,max:40},{name:'Midterm',weight:30,got:21,max:30},{name:'Final exam',weight:30,got:null,max:60}]);
 const f=G.finalNeeds(c);assert.equal(f.item.name,'Final exam');assert.equal(f.assumedPct,null);
 const A=f.needs.find(n=>n.letter==='A');assert.ok(Math.abs(A.pct-(80-53)/30*100)<1e-9);assert.ok(Math.abs(A.score-54)<1e-9);
 const c2=course([{name:'Quiz',weight:20,got:15,max:20},{name:'HW',weight:20,got:null},{name:'Final',weight:60,got:null}]);
 const f2=G.finalNeeds(c2);assert.equal(f2.assumedPct,75);
 assert.ok(Math.abs(f2.needs[0].pct-(80-15-15)/60*100)<1e-9);
 assert.equal(G.finalNeeds(course([{name:'A',weight:50,got:null},{name:'B',weight:50,got:null}])),null,'no final and two open items');
 assert.equal(G.finalNeeds(course([{name:'Only',weight:100,got:null}])).item.name,'Only');
});
test('grades page shows final targets and a weakest-chapter practice link; course pages open ?cat=',()=>{
 const s=read('grades.html');
 assert.match(s,/\+finalHtml\(c\)\+weakHtml\(c\);/);
 assert.match(s,/const href=w\.C\.page\+'\?tab=prac&cat='\+encodeURIComponent\(w\.p\.id\);/);
 assert.match(s,/<script src="scripts\/study-today\.js/);
 assert.match(read('scripts/study-course-nav.js'),/cat=p\.get\('cat'\)/,'course pages open the chapter from ?cat=');
});
