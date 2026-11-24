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
