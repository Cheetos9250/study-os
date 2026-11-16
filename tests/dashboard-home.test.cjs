const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),nav=read('scripts/study-nav.js');
test('navigation (Today · Flashcards · Practice · Lessons · Calendar) reaches every main destination',()=>{
 for(const h of ['index.html','flashcards.html','practice.html','hub.html','calendar.html','progress-backup.html','progress-restore.html'])assert.match(nav,new RegExp("href:'"+h.replace('.','\\.')+"'"),h);
 for(const f of ['index.html','flashcards.html','practice.html','hub.html','calendar.html','progress-backup.html','progress-restore.html','accounting-textbook.html','acc.html','eco.html','math.html','eng.html','zh.html'])assert.match(read(f),/scripts\/study-nav\.js/,f);
 const practice=read('practice.html');
 for(const h of ['accounting-textbook.html','vocabloom/'])assert.ok(practice.includes('href="'+h),h);
 assert.match(read('flashcards.html'),/T\.LANGS\.map/);assert.match(read('flashcards.html'),/l\.app/);
 const T=require('../scripts/study-today.js');assert.deepEqual(T.LANGS.map(l=>l.app),['vocabloom/?lang=en','vocabloom/?lang=zh']);
 assert.match(html,/T\.LANGS\[1\]\.app/);
 for(const f of ['index.html','practice.html','hub.html','flashcards.html'])assert.doesNotMatch(read(f),/VocaBloom|href="zh\.html"/,f);
 assert.match(html,/id="welcome-title"/);
 assert.match(read('today.html'),/url=calendar\.html/);
 assert.doesNotMatch(nav,/localStorage|sessionStorage|fetch\(/);
});
test('home answers: today, exams, tasks, subjects (calendar has its own page)',()=>{
 for(const s of ['Today','Exams','Tasks','Subjects'])assert.ok(html.includes('<h2>'+s),s);
 for(const id of ['planBox','exams','tasks','taskForm','subjects','chips','pStart'])assert.match(html,new RegExp('id="'+id+'"'),id);
 assert.match(html,/d left/);assert.match(html,/d late/);
 const cal=read('calendar.html');for(const id of ['cal','dayList','examList','addExam'])assert.match(cal,new RegExp('id="'+id+'"'),id);
});
test('main pages use English UI text',()=>{
 for(const f of ['practice.html','flashcards.html','calendar.html','hub.html','scripts/study-nav.js'])assert.doesNotMatch(read(f),/[\u0E00-\u0E7F]/,f);
 assert.deepEqual([...html.matchAll(/[\u0E00-\u0E7F]+/g)].map(m=>m[0]),['บัญชี','เศรษฐ','คณิต']); // only the task subject matcher
});
test('profile and cover images accept animated GIFs within a size cap',()=>{
 assert.match(html,/GIF_MAX=1\.5\*1024\*1024/);assert.match(html,/readAsDataURL/);
});
test('removed sections stay removed (no Quick Launch, no start/end checklists)',()=>{
 assert.doesNotMatch(html,/Quick Launch|START THE DAY|END THE DAY|Daily Focus/i);
});
test('home writes only its own key and the shared Today settings key',()=>{
 const writes=[...html.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]).sort();
 assert.deepEqual(writes,['BK_META','KEY','POMO_KEY','T.SETTINGS_KEY']);
 assert.match(html,/POMO_KEY='studyos\.pomo\.v1'/);assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('studyos.pomo.v1'));
 assert.match(html,/BK_META='studyos\.backup-meta\.v1'/);
 assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('studyos.backup-meta.v1'));
 assert.match(html,/KEY='studyos\.home\.v1'/);
 assert.doesNotMatch(html,/study-sync-key|\.removeItem|\.clear\(|method:\s*['"]PUT|method:\s*['"]POST/);
 assert.doesNotMatch(html,/<img[^>]+src="https?:/i);
});
test('home has iPad-friendly rules',()=>{
 // Theme tokens live in the shared stylesheet the page links.
 const themed=html+(/assets\/study-world\.css/.test(html)?read('assets/study-world.css'):'');
 assert.match(html,/min-height:4[4-8]px/);assert.match(themed,/prefers-color-scheme:dark/);assert.match(html,/prefers-reduced-motion/);
});
test('English and Chinese are separate decks with their own card images',()=>{
 const T=require('../scripts/study-today.js');assert.deepEqual(T.LANGS.map(l=>l.page),['eng.html','zh.html']);
 assert.match(html,/'voc','🇬🇧'/);assert.match(html,/'zh','🇨🇳'/);
 assert.match(read('scripts/study-progress-restore.js'),/"voc", "zh"/);
});
test('sidebar colour extends past the viewport for Safari overscroll',()=>{
 assert.match(nav,/#studyNav::before,#studyNav::after/);assert.match(nav,/100lvh/);
});
test('images: GIF detected by file bytes, iPad-converted GIF warning, safe https image links',()=>{
 assert.match(html,/head\.startsWith\('GIF8'\)/);assert.match(html,/sent this GIF as a still image/);
 const m=html.match(/LINK=(\/\^https:[^\n;]+\/);/);assert.ok(m);const LINK=eval(m[1]);
 assert.ok(LINK.test('https://media.giphy.com/media/abc/giphy.gif'));
 for(const bad of ['javascript:alert(1)','http://x.com/a.gif','https://x.com/a.gif") ; color:red','https://x.com/a b.gif','https://x.com/(a).gif'])assert.ok(!LINK.test(bad),bad);
 assert.match(html,/data-img="cover"/);assert.match(html,/data-img="avatar"/);
 assert.match(read('scripts/study-progress-restore.js'),/\^https:/);
});
test('course pages highlight the section matching their mode',()=>{
 assert.match(nav,/\{cards:'cards',sum:'lessons',prac:'practice'\}/);
});
test('Google Drive share links become direct image addresses',()=>{
 const LINK=eval(html.match(/LINK=(\/\^https:[^\n;]+\/);/)[1]);
 const fns=html.match(/function driveId[\s\S]*?\n(?=function tryLoad)/)[0];const {driveId,imageCandidates}=new Function('LINK',fns+';return {driveId,imageCandidates};')(LINK);
 const id='1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
 assert.equal(driveId('https://drive.google.com/file/d/'+id+'/view?usp=sharing'),id);
 assert.equal(driveId('https://drive.google.com/open?id='+id),id);
 assert.deepEqual(imageCandidates('https://drive.google.com/file/d/'+id+'/view'),['https://lh3.googleusercontent.com/d/'+id,'https://drive.google.com/uc?export=view&id='+id]);
 assert.deepEqual(imageCandidates('https://evil.example/drive.google.com/file/d/'+id),['https://evil.example/drive.google.com/file/d/'+id]);
 assert.deepEqual(imageCandidates('javascript:alert(1)'),[]);
});
