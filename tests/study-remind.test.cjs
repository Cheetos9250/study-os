"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const R=require('../scripts/study-remind.js'),read=f=>fs.readFileSync(__dirname+'/../'+f,'utf8');
const at=(iso)=>Date.parse(iso);
test('shouldNotify: on + granted + something due + once a day + daytime Bangkok only',()=>{
  const on={on:true,last:''},noon=at('2026-11-27T05:00:00Z');// 12:00 Bangkok
  assert.equal(R.shouldNotify(on,'granted',3,noon),true);
  assert.equal(R.shouldNotify({on:false,last:''},'granted',3,noon),false,'off');
  assert.equal(R.shouldNotify(on,'default',3,noon),false,'no permission');
  assert.equal(R.shouldNotify(on,'granted',0,noon),false,'nothing due');
  assert.equal(R.shouldNotify({on:true,last:'2026-11-27'},'granted',3,noon),false,'already today');
  assert.equal(R.shouldNotify({on:true,last:'2026-11-26'},'granted',3,noon),true,'new day');
  assert.equal(R.shouldNotify(on,'granted',3,at('2026-11-26T22:00:00Z')),false,'05:00 Bangkok');
  assert.equal(R.shouldNotify(on,'granted',3,at('2026-11-27T15:00:00Z')),false,'22:00 Bangkok');
});
test('text counts cards and questions',()=>{
  assert.match(R.text(5,3,2).body,/3 cards and 2 questions/);assert.match(R.text(1,1,0).body,/^1 card due/);assert.equal(R.text(5,3,2).title,'Study OS: 5 to review');
});
test('update with stubbed browser: notifies once, sets badge, enable asks permission',async()=>{
  const store={},calls=[];
  const root={localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;}},
    Notification:Object.assign(function(t){calls.push(['n',t]);},{permission:'default',requestPermission:async()=>{root.Notification.permission='granted';return 'granted';}}),
    navigator:{setAppBadge:n=>calls.push(['badge',n]),clearAppBadge:()=>calls.push(['clear'])}};
  global.window=undefined;
  const load=()=>{const m={exports:{}};new Function('module','root','globalThis',read('scripts/study-remind.js').replace('typeof window !== \'undefined\' ? window : globalThis','root'))(m,root,root);return m.exports;};
  const X=load();
  assert.equal(X.update(2,1,at('2026-11-27T05:00:00Z')),false,'off by default');
  assert.equal(await X.enable(),'granted');assert.equal(JSON.parse(store[X.KEY]).on,true);
  assert.equal(X.update(2,1,at('2026-11-27T05:00:00Z')),true);
  assert.equal(X.update(2,1,at('2026-11-27T06:00:00Z')),false,'once a day');
  assert.ok(calls.some(c=>c[0]==='badge'&&c[1]===3));
  X.disable();assert.equal(JSON.parse(store[X.KEY]).on,false);assert.ok(calls.some(c=>c[0]==='clear'));
});
test('device setting: not backed up, wired on Today, service worker opens Today on tap',()=>{
  assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('studyos.remind.v1'));
  assert.match(read('index.html'),/study-remind\.js/);assert.match(read('index.html'),/id="remindBox"/);
  assert.match(read('sw.js'),/addEventListener\('notificationclick'/);
});
