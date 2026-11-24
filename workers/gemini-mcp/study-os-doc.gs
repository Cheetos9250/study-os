/**
 * Study OS → Google Doc + Google Sheet (for the Gemini app).
 * Runs in YOUR Google account (script.google.com). Every 15 minutes it reads your Study OS data
 * from the read-only Worker and writes:
 *   - a Google Doc "Study OS live" (summary: exams, chapter scores, wrong questions, today's classes)
 *   - a Google Sheet "Study OS data" with tabs Summary, Questions (every question with options, answer,
 *     explanation, your answer and result), Notes, Tasks, Grades, Exams, Classes.
 * In Gemini, ask e.g. "@Google Drive read my Study OS live doc and tell me what to study today"
 * or "@Google Drive in my Study OS data sheet, check the Accounting questions in chapter 08 Cash".
 *
 * Setup (once):
 * 1. script.google.com → New project → paste this file.
 * 2. Project Settings (gear) → Script properties → Add: STUDY_OS_TOKEN = your GEMINI_MCP_TOKEN.
 *    (The token stays in your Google account. Never paste it into a chat.)
 * 3. Choose the function "setup" and press Run. Allow the permissions it asks for
 *    (Google Docs, Drive file it creates, external requests, triggers).
 * To stop: run "stop". To revoke: change the GitHub secret GEMINI_MCP_TOKEN and redeploy the Worker.
 * Source code too: after setup, run "setupCode" once (see the code section at the end of this file).
 */
var SUMMARY_URL = 'https://study-os-gemini-mcp.kasidit09022550.workers.dev/summary?wrong=10';
var EXPORT_URL = 'https://study-os-gemini-mcp.kasidit09022550.workers.dev/export';
var DOC_NAME = 'Study OS live';
var SHEET_NAME = 'Study OS data';

function setup() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('STUDY_OS_TOKEN')) throw new Error('Add the script property STUDY_OS_TOKEN first (Project Settings → Script properties).');
  if (!props.getProperty('DOC_ID')) props.setProperty('DOC_ID', DocumentApp.create(DOC_NAME).getId());
  if (!props.getProperty('SHEET_ID')) props.setProperty('SHEET_ID', SpreadsheetApp.create(SHEET_NAME).getId());
  stop();
  ScriptApp.newTrigger('refresh').timeBased().everyMinutes(15).create();
  refresh();
  Logger.log('Done. Doc: ' + DocumentApp.openById(props.getProperty('DOC_ID')).getUrl() +
    '  Sheet: ' + SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getUrl());
}

function refresh() {
  var props = PropertiesService.getScriptProperties();
  var res = UrlFetchApp.fetch(SUMMARY_URL, {
    headers: { Authorization: 'Bearer ' + props.getProperty('STUDY_OS_TOKEN') },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Study OS answered HTTP ' + res.getResponseCode());
  var doc = DocumentApp.openById(props.getProperty('DOC_ID'));
  var stamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm');
  doc.getBody().setText('Study OS live progress (updated ' + stamp + ' Bangkok, refreshes every 15 minutes)\n\n' + res.getContentText());
  doc.saveAndClose();
  refreshSheet();
}

function refreshSheet() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SHEET_ID')) props.setProperty('SHEET_ID', SpreadsheetApp.create(SHEET_NAME).getId());
  var res = UrlFetchApp.fetch(EXPORT_URL, {
    headers: { Authorization: 'Bearer ' + props.getProperty('STUDY_OS_TOKEN') },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Study OS export answered HTTP ' + res.getResponseCode());
  var sheets = JSON.parse(res.getContentText()).sheets;
  var ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  Object.keys(sheets).forEach(function (name) {
    var rows = sheets[name];
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.clearContents();
    if (!rows.length) return;
    var width = rows.reduce(function (w, r) { return Math.max(w, r.length); }, 1);
    var data = rows.map(function (r) { var x = r.slice(); while (x.length < width) x.push(''); return x; });
    sh.getRange(1, 1, data.length, width).setNumberFormat('@').setValues(data);
    sh.setFrozenRows(name === 'Summary' ? 0 : 1);
  });
  // remove the empty default tab ("Sheet1" / "ชีต1"), never a tab with content
  ss.getSheets().forEach(function (sh) {
    if (!sheets[sh.getName()] && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
}

function stop() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refresh') ScriptApp.deleteTrigger(t);
  });
}

/* ---------- Study OS code → Google Docs (owner, 24 Nov 2026) ----------
 * Lets Gemini read the site's source code too. Once a day it copies the public repo
 * github.com/cheetos9250/study-os (no token needed: the code is public and holds no personal data)
 * into Google Docs named "Study OS code – <part>", plus "Study OS code – index" that says which Doc
 * holds which file. Course data files, tests, images and the design-tool folder are left out.
 * In Gemini: "@Google Drive read Study OS code – index, then explain scripts/study-review.js".
 * Setup (once, after the steps above): choose the function "setupCode" and press Run.
 * To stop the daily copy: run "stopCode".
 */
var CODE_REPO = 'cheetos9250/study-os';
var CODE_PREFIX = 'Study OS code – ';
var CODE_MAX = 800000; // characters per Doc (Google Docs hold about 1,000,000)
var CODE_GROUPS = [
  ['pages', /^[^\/]+\.html$/],
  ['scripts', /^scripts\/study-[^\/]+\.(js|cjs)$/],
  ['scripts (other)', /^scripts\/[^\/]+\.(js|cjs)$/],
  ['wordnest', /^vocabloom\/[^\/]+\.(html|js|css)$/],
  ['styles, workers and CI', /^(assets\/[^\/]+\.css|workers\/[^\/]+\/[^\/]+\.(mjs|gs|jsonc)|\.github\/workflows\/[^\/]+\.yml)$/],
  ['docs and service worker', /^[^\/]+\.(md|js|webmanifest)$/]
];
var CODE_SKIP = /(^|\/)(CHANGELOG|NEXT_STEPS)\.md$|eco-practice-mcq\.js$|study-decks\.json$|\.min\.js$/;

/* which part a repo path belongs to ('' = not copied) */
function codeGroupOf(path) {
  if (CODE_SKIP.test(path)) return '';
  for (var i = 0; i < CODE_GROUPS.length; i++) if (CODE_GROUPS[i][1].test(path)) return CODE_GROUPS[i][0];
  return '';
}

/* files [{path, text}] of one group → Docs [{name, paths, text}], each under CODE_MAX, split between files */
function codeParts(group, files) {
  var parts = [], cur = null;
  files.forEach(function (f) {
    var block = '\n\n===== FILE: ' + f.path + ' =====\n' + f.text;
    if (!cur || (cur.text.length + block.length > CODE_MAX && cur.paths.length)) { cur = { paths: [], text: '' }; parts.push(cur); }
    cur.paths.push(f.path); cur.text += block;
  });
  parts.forEach(function (p, i) { p.name = CODE_PREFIX + group + (parts.length > 1 ? ' (' + (i + 1) + '/' + parts.length + ')' : ''); });
  return parts;
}

function setupCode() {
  stopCode();
  ScriptApp.newTrigger('refreshCode').timeBased().everyDays(1).atHour(4).create();
  PropertiesService.getScriptProperties().deleteProperty('CODE_SHA');
  refreshCode();
  Logger.log('Done. Index: ' + DocumentApp.openById(JSON.parse(PropertiesService.getScriptProperties().getProperty('CODE_DOCS'))[CODE_PREFIX + 'index']).getUrl());
}

function refreshCode() {
  var props = PropertiesService.getScriptProperties();
  var tree = JSON.parse(UrlFetchApp.fetch('https://api.github.com/repos/' + CODE_REPO + '/git/trees/main?recursive=1').getContentText());
  if (tree.sha && tree.sha === props.getProperty('CODE_SHA')) return; // nothing changed since the last copy
  var paths = tree.tree.filter(function (t) { return t.type === 'blob' && codeGroupOf(t.path); }).map(function (t) { return t.path; }).sort();
  var texts = [];
  for (var i = 0; i < paths.length; i += 25) {
    var batch = paths.slice(i, i + 25).map(function (p) {
      return { url: 'https://raw.githubusercontent.com/' + CODE_REPO + '/main/' + p.split('/').map(encodeURIComponent).join('/'), muteHttpExceptions: true };
    });
    UrlFetchApp.fetchAll(batch).forEach(function (r) { texts.push(r.getResponseCode() === 200 ? r.getContentText() : '(could not read this file: HTTP ' + r.getResponseCode() + ')'); });
  }
  var docs = JSON.parse(props.getProperty('CODE_DOCS') || '{}'), index = [], stamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm');
  CODE_GROUPS.forEach(function (g) {
    var files = [];
    paths.forEach(function (p, k) { if (codeGroupOf(p) === g[0]) files.push({ path: p, text: texts[k] }); });
    codeParts(g[0], files).forEach(function (part) {
      if (!docs[part.name]) docs[part.name] = DocumentApp.create(part.name).getId();
      var d = DocumentApp.openById(docs[part.name]);
      d.getBody().setText('Study OS source code: ' + part.name.slice(CODE_PREFIX.length) + ' (copied ' + stamp + ' Bangkok from github.com/' + CODE_REPO + ')' + part.text);
      d.saveAndClose();
      index.push(part.name + ':\n' + part.paths.map(function (p) { return '  ' + p; }).join('\n'));
    });
  });
  var name = CODE_PREFIX + 'index';
  if (!docs[name]) docs[name] = DocumentApp.create(name).getId();
  var d = DocumentApp.openById(docs[name]);
  d.getBody().setText('Study OS code index (copied ' + stamp + ' Bangkok from github.com/' + CODE_REPO + ', ' + paths.length + ' files).\n' +
    'Each Doc below holds the full text of the files listed under it. Project guide for AI agents: AGENTS.md in "' + CODE_PREFIX + 'docs and service worker".\n\n' + index.join('\n\n'));
  d.saveAndClose();
  props.setProperty('CODE_DOCS', JSON.stringify(docs));
  if (tree.sha) props.setProperty('CODE_SHA', tree.sha);
}

function stopCode() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshCode') ScriptApp.deleteTrigger(t);
  });
}
