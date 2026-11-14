const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('dashboard keeps all main destinations',()=>{
 for(const h of ['today.html','hub.html','acc.html','eco.html','math.html','eng.html','zh.html','accounting-textbook.html','progress-backup.html','progress-restore.html','vocabloom/','classic.html'])assert.ok(html.includes('href="'+h),h);
 assert.match(html,/id="welcome-title"/);assert.match(html,/403 indexed exercises · Chapters 1–9/);
});
test('dashboard has Notion-style sections',()=>{
 for(const s of ['Quick Launch','Daily Focus','Tasks','Review','Subjects','Calendar and Database','START THE DAY'.toLowerCase().replace('start the day','Start the day')])assert.ok(html.toLowerCase().includes(s.toLowerCase()),s);
 assert.match(html,/id="pStart"/);assert.match(html,/id="taskForm"/);
});
test('dashboard writes only its own key, never course progress or secrets',()=>{
 const writes=[...html.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]);
 assert.deepEqual(writes,['KEY']);
 assert.match(html,/KEY='studyos\.home\.v1'/);
 assert.doesNotMatch(html,/study-sync-key|\.removeItem|\.clear\(|method:\s*['"]PUT|method:\s*['"]POST/);
 assert.doesNotMatch(html,/<img[^>]+src="https?:/i);
});
test('dashboard keeps the classic home and iPad-friendly rules',()=>{
 assert.ok(fs.existsSync(path.join(root,'classic.html')));
 assert.match(html,/min-height:4[4-8]px/);assert.match(html,/prefers-color-scheme:dark/);assert.match(html,/prefers-reduced-motion/);
});
