/* Study OS question inbox — Google Apps Script (runs in the owner's own Google account; no token is shared with GitHub or Cloudflare).
 *
 * What it does: reads the Markdown/text files (and Google Docs) changed in the last DAYS days in the Drive folder "Study OS Questions",
 * turns the questions into rows with the same parser the site uses, keeps the newest MAX_ROWS rows, and serves them as JSON from a web
 * app. A copy of the JSON is kept in the file _inbox-cache.json in the same folder and refreshed every 10 minutes by a trigger, so the
 * site's page loads stay fast. The course pages fetch the JSON each time they open and add the questions to Practice.
 * Questions are not personal data; only the folder's files are read.
 *
 * Setup (once, ~3 minutes, on any device with a browser):
 *  1. script.google.com → New project → paste this whole file → Save.
 *  2. Pick the function  setup  and press Run. Allow access to Drive and to run on a schedule. It creates the Drive folder
 *     "Study OS Questions", starts the 10-minute refresh and logs the folder link. Put Gemini's daily files in that folder.
 *  3. Deploy → New deployment → type Web app → Execute as: Me → Who has access: Anyone → Deploy. Copy the Web app URL.
 *  4. On the site: Share with Gemini → Daily questions from Drive → paste the URL → Save → Test.
 *  After you change this file later: Deploy → Manage deployments → pencil → Version: New version → Deploy (the URL stays),
 *  then run  setup  once more if this version added a trigger.
 *
 * The URL is the only thing that opens the questions, so do not post it. It exposes only question text. Remove access
 * any time: Deploy → Manage deployments → Archive.
 */
var FOLDER_NAME = 'Study OS Questions';
var MAX_FILES = 400;
var DAYS = 7;               // only files changed in the last DAYS days are read
var MAX_ROWS = 3000;        // newest questions first; the site keeps the same number on the device
var CACHE_NAME = '_inbox-cache.json';
var CACHE_MINUTES = 15;     // a cached answer older than this is rebuilt when someone asks

// === Parser: a copy of scripts/study-inbox.js (tests/inbox-script-sync.test.cjs keeps them identical). Do not edit here. ===
// PARSER-COPY-START
var SUBJECTS = { acc: 'Accounting', accounting: 'Accounting', eco: 'Economics', econ: 'Economics', economics: 'Economics',
  math: 'Math for Life', 'math for life': 'Math for Life' };
function subjectName(t) { return SUBJECTS[String(t || '').toLowerCase().replace(/\s+/g, ' ').trim()] || ''; }
function norm(t) { return String(t || '').toLowerCase().replace(/\*\*/g, '').replace(/[^a-z0-9฀-๿]+/g, ' ').trim(); }
function hash(t) {
  var a = 5381, b = 52711, i, c;
  for (i = 0; i < t.length; i++) { c = t.charCodeAt(i); a = ((a * 33) ^ c) >>> 0; b = ((b * 31) + c) >>> 0; }
  return a.toString(36) + b.toString(36);
}
function clean(l) { return String(l).replace(/\r/g, '').replace(/^\s*(?:#{1,6}\s+|[-*+]\s+|>\s*)/, '').replace(/\*\*/g, '').replace(/__/g, '').trim(); }
/* text: one Markdown file. defaults: {Subject, Chapter} (for example from the file name). → {rows, errors} */
function parse(text, defaults) {
  var lines = String(text || '').split('\n'), rows = [], errors = [], seen = {};
  var subj = subjectName(defaults && defaults.Subject) || '', chap = (defaults && defaults.Chapter) || '';
  var cur = null, field = '', m, i, raw, l;
  function finish() {
    if (!cur) return;
    var q = cur; cur = null; field = '';
    var label = (q.q || '').slice(0, 60);
    var letters = Object.keys(q.opts).sort(), idx = 'ABCDEF'.indexOf(q.ans);
    if (!q.q) return;
    if (!q.subject) { errors.push('No Subject for: ' + label); return; }
    if (!q.chapter) { errors.push('No Chapter for: ' + label); return; }
    if (letters.length < 2) { errors.push('Fewer than 2 options: ' + label); return; }
    if (letters.length > 4) { errors.push('More than 4 options: ' + label); return; }
    if (idx < 0 || !q.opts[q.ans]) { errors.push('Answer missing or not an option: ' + label); return; }
    var k = q.subject + '|' + norm(q.q);
    if (seen[k]) return;
    seen[k] = 1;
    var right = q.opts[q.ans].trim(), wrong = letters.filter(function (x) { return x !== q.ans; }).map(function (x) { return q.opts[x].trim(); });
    var row = { Subject: q.subject, Chapter: q.chapter, Question: q.q.trim(), Correct: right,
      Explanation: (q.exp || '').trim(), Status: 'Verified', page_id: 'in' + hash(k) };
    for (var w = 0; w < wrong.length; w++) row['Wrong ' + (w + 1)] = wrong[w];
    rows.push(row);
  }
  for (i = 0; i < lines.length; i++) {
    raw = lines[i]; l = clean(raw);
    if (!l || /^-{3,}$/.test(l) || /^={3,}$/.test(l)) { if (cur && field === 'exp' && l === '') cur.exp += '\n'; continue; }
    if ((m = /^subject\s*[:：]\s*(.+)$/i.exec(l))) { subj = subjectName(m[1]) || m[1].trim(); if (cur && !cur.q) cur.subject = subj; continue; }
    if ((m = /^chapter\s*[:：]\s*(.+)$/i.exec(l))) { chap = m[1].trim(); continue; }
    if ((m = /^(?:question|q)\s*\d*\s*[:：.)]\s*(.*)$/i.exec(l))) {
      finish(); cur = { q: m[1], opts: {}, ans: '', exp: '', subject: subj, chapter: chap }; field = 'q'; continue;
    }
    if (!cur) continue;
    if ((m = /^\(?([A-F])\s*[).:：]\s*(.+)$/.exec(l))) { cur.opts[m[1]] = m[2]; field = m[1]; continue; }
    if ((m = /^(?:correct\s+)?answer\s*[:：]\s*\(?([A-F1-6])\b/i.exec(l))) {
      var a = m[1].toUpperCase(); cur.ans = /\d/.test(a) ? 'ABCDEF'.charAt(Number(a) - 1) : a; field = ''; continue;
    }
    if ((m = /^explanation\s*[:：]\s*(.*)$/i.exec(l))) { cur.exp = m[1]; field = 'exp'; continue; }
    if (field === 'q') cur.q += ' ' + l;
    else if (field === 'exp') cur.exp += (cur.exp && !/\n$/.test(cur.exp) ? ' ' : '') + l;
    else if (field && cur.opts[field] !== undefined) cur.opts[field] += ' ' + l;
  }
  finish();
  return { rows: rows, errors: errors };
}
/* chapter text from the file → the course's [id, label] pair; exact label, then name, then chapter number */
function matchChapter(cats, text) {
  var t = norm(text), n, i, lab, num;
  if (!t) return null;
  for (i = 0; i < cats.length; i++) if (norm(cats[i][1]) === t) return cats[i];
  for (i = 0; i < cats.length; i++) { lab = norm(cats[i][1]).replace(/^(?:micro|macro) /, '').replace(/^\d+ /, ''); if (lab && (t.indexOf(lab) >= 0 || lab.indexOf(t) >= 0)) return cats[i]; }
  num = /(?:^|[^0-9])0*(\d{1,3})(?:[^0-9]|$)/.exec(String(text));
  if (num) { n = Number(num[1]); for (i = 0; i < cats.length; i++) { var x = /(?:^|[^0-9])0*(\d{1,3})(?:[^0-9]|$)/.exec(cats[i][1]); if (x && Number(x[1]) === n) return cats[i]; } }
  return null;
}
// PARSER-COPY-END

function folder_() {
  var it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function setup() {
  var f = folder_();
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'refresh') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('refresh').timeBased().everyMinutes(10).create();
  Logger.log('Put the Markdown files in: ' + f.getUrl());
}

function readFile_(file) {
  var mime = file.getMimeType();
  if (mime === MimeType.GOOGLE_DOCS) return DocumentApp.openById(file.getId()).getBody().getText();
  if (/^text\//.test(mime) || /\.(md|markdown|txt)$/i.test(file.getName())) return file.getBlob().getDataAsString('UTF-8');
  return '';
}

function build_() {
  var cutoff = Date.now() - DAYS * 86400000, files = [], it = folder_().getFiles(), f;
  while (it.hasNext()) {
    f = it.next();
    if (f.getName() === CACHE_NAME || f.getLastUpdated().getTime() < cutoff) continue;
    files.push(f);
    if (files.length >= MAX_FILES) break;
  }
  files.sort(function (a, b) { return b.getLastUpdated().getTime() - a.getLastUpdated().getTime(); });   // newest file first
  var rows = [], errors = [], seen = {};
  files.forEach(function (file) {
    var res;
    try { res = parse(readFile_(file), {}); } catch (e) { errors.push(file.getName() + ': ' + e); return; }
    res.errors.forEach(function (m) { errors.push(file.getName() + ': ' + m); });
    res.rows.forEach(function (r) { if (!seen[r.page_id]) { seen[r.page_id] = 1; rows.push(r); } });
  });
  return { updated: new Date().toISOString(), files: files.length, rows: rows.slice(0, MAX_ROWS), total: rows.length, errors: errors.slice(0, 50) };
}

function cacheFile_(dir) {
  var it = dir.getFilesByName(CACHE_NAME);
  return it.hasNext() ? it.next() : null;
}

function rebuild_() {
  var json = JSON.stringify(build_()), dir = folder_(), c = cacheFile_(dir);
  if (c) c.setContent(json); else dir.createFile(CACHE_NAME, json, MimeType.PLAIN_TEXT);
  return json;
}

/* run by the 10-minute trigger */
function refresh() { rebuild_(); }

/* ?fresh=1 skips the cache (the site's Test button uses it) */
function doGet(e) {
  var json;
  try {
    var c = cacheFile_(folder_());
    if (!(e && e.parameter && e.parameter.fresh) && c && Date.now() - c.getLastUpdated().getTime() < CACHE_MINUTES * 60000) json = c.getBlob().getDataAsString('UTF-8');
    else json = rebuild_();
  } catch (err) { json = JSON.stringify({ updated: new Date().toISOString(), rows: [], errors: [String(err)] }); }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
