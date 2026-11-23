/**
 * Study OS → Google Doc (for the Gemini app).
 * Runs in YOUR Google account (script.google.com). Every 15 minutes it reads your Study OS summary
 * from the read-only Worker and writes it into a Google Doc called "Study OS live".
 * In Gemini, ask e.g. "@Google Drive read my Study OS live doc and tell me what to study today".
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
var DOC_NAME = 'Study OS live';

function setup() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('STUDY_OS_TOKEN')) throw new Error('Add the script property STUDY_OS_TOKEN first (Project Settings → Script properties).');
  if (!props.getProperty('DOC_ID')) props.setProperty('DOC_ID', DocumentApp.create(DOC_NAME).getId());
  stop();
  ScriptApp.newTrigger('refresh').timeBased().everyMinutes(15).create();
  refresh();
  Logger.log('Done. Doc: ' + DocumentApp.openById(props.getProperty('DOC_ID')).getUrl());
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
}

function stop() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refresh') ScriptApp.deleteTrigger(t);
  });
}
