const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('home keeps every main destination reachable',()=>{
 for(const h of ['today.html','hub.html','acc.html','eco.html','math.html','eng.html','zh.html','accounting-textbook.html','progress-backup.html','progress-restore.html','vocabloom/'])assert.ok(html.includes('href="'+h)||html.includes("'"+h)||html.includes('c.page'),h);
 for(const h of ['hub.html','accounting-textbook.html','progress-backup.html','progress-restore.html','vocabloom/','eng.html','zh.html','today.html'])assert.ok(html.includes('href="'+h),h);
 assert.match(html,/id="welcome-title"/);assert.match(html,/403 indexed exercises · Chapters 1–9/);
});
test('home answers: what to do today, deadlines, exams, subjects, calendar',()=>{
 for(const s of ['วันนี้ต้องทำ','สอบและเดดไลน์','วิชา','ปฏิทิน'])assert.ok(html.includes('<h2>'+s)||html.includes('<h2>'+s+' '),s);
 for(const id of ['planBox','exams','tasks','taskForm','subjects','cal','dayList','chips','pStart'])assert.match(html,new RegExp('id="'+id+'"'),id);
 assert.match(html,/อีก ' ?\+ ?d/);assert.match(html,/เลยกำหนด/);
});
test('removed sections stay removed (no Quick Launch, no start/end checklists)',()=>{
 assert.doesNotMatch(html,/Quick Launch|START THE DAY|END THE DAY|Daily Focus/i);
});
test('home writes only its own key and the shared Today settings key',()=>{
 const writes=[...html.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]).sort();
 assert.deepEqual(writes,['KEY','T.SETTINGS_KEY']);
 assert.match(html,/KEY='studyos\.home\.v1'/);
 assert.doesNotMatch(html,/study-sync-key|\.removeItem|\.clear\(|method:\s*['"]PUT|method:\s*['"]POST/);
 assert.doesNotMatch(html,/<img[^>]+src="https?:/i);
});
test('home has iPad-friendly rules',()=>{
 assert.match(html,/min-height:4[4-8]px/);assert.match(html,/prefers-color-scheme:dark/);assert.match(html,/prefers-reduced-motion/);
});
