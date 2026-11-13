"use strict";
// Isolated synthetic Chromium/WebKit exercise; never connects to production.
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const { chromium, webkit } = require("playwright");

const root = process.cwd();
const output = process.env.QA_OUTPUT || path.join(root, ".tmp-restore-qa");
const ACC = JSON.stringify({ known: ["01-1"], ans: { "01-1": true } });
const SRS = JSON.stringify({ s: {}, m: { day: 0, newDone: 0 }, lim: 20 });
const VOC = JSON.stringify({ progress: { word: { seen: true } }, days: {}, custom: [], notion: [], settings: { goal: 10 } });
const seed = {
  "study-acc": ACC,
  "acc-flashcards-v1-srs": SRS,
  "acc-flashcards-v1-typ": "1",
  "vocabloom_mvp_v1": VOC,
  "study-sync-key": "SYNTHETIC-NEVER-EXPORT"
};
async function serve() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const file = path.resolve(root, "." + (url.pathname === "/" ? "/index.html" : url.pathname));
      if (!file.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const body = await fs.readFile(file);
      res.writeHead(200, { "Content-Type": ({".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".ico":"image/x-icon"})[path.extname(file)] || "text/html; charset=utf-8" }).end(body);
    } catch (_) {
      res.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return { server, origin: "http://127.0.0.1:" + server.address().port };
}
async function runEngine(name, engine, origin) {
  const browser = await engine.launch({ headless: true });
  const reports = [];
  try {
    async function context() {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 }, colorScheme: "light", acceptDownloads: true
      });
      await ctx.route("**/*", route => {
        const u = new URL(route.request().url());
        return route.request().method() === "GET" && (u.origin === origin || ["fonts.googleapis.com","fonts.gstatic.com"].includes(u.hostname)) ? route.continue() : route.abort();
      });
      return ctx;
    }
    const ctx = await context();
    const page = await ctx.newPage(), errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(origin + "/progress-backup.html");
    await page.evaluate(data => {
      for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value);
    }, seed);
    await page.reload();
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const pendingDownload = page.waitForEvent("download");
    await page.locator("#download").click();
    const download = await pendingDownload;
    assert.match(download.suggestedFilename(), /^study-os-progress-\d{4}-\d{2}-\d{2}\.json$/);
    const json = await fs.readFile(await download.path(), "utf8");
    const backup = JSON.parse(json);
    assert.equal(backup.format, "study-os-progress-local-backup");
    assert.deepEqual(Object.keys(backup.entries), Object.keys(seed).filter(k => k !== "study-sync-key"));
    assert.equal(json.includes("SYNTHETIC-NEVER-EXPORT"), false);
    await page.locator("#backupFile").setInputFiles({ name: "safe-backup.json", mimeType: "application/json", buffer: Buffer.from(json) });
    await assert.doesNotReject(async () => {
      await page.locator("#checkStatus").getByText(/File structure is valid/).waitFor();
    });
    await page.screenshot({ path: path.join(output, name + "-backup-390.png"), fullPage: true });
    assert.deepEqual(errors, []);
    reports.push({ engine: name, test: "backup/download/validate", status: "pass" });
    await ctx.close();

    const clean = await context(), recovery = await clean.newPage(), recErrors = [];
    recovery.on("pageerror", error => recErrors.push(error.message));
    await recovery.goto(origin + "/progress-restore.html");
    await recovery.evaluate(async json=>{
      const input=document.getElementById('file');let finish;
      const older=new Promise(resolve=>{finish=resolve;});
      Object.defineProperty(input,'files',{configurable:true,value:[{name:'older.json',size:json.length,text:()=>older}]});
      input.dispatchEvent(new Event('change'));
      Object.defineProperty(input,'files',{configurable:true,value:[{name:'latest.json',size:1,text:async()=>'{'}]});
      input.dispatchEvent(new Event('change'));
      await new Promise(resolve=>setTimeout(resolve,0));finish(json);
      await new Promise(resolve=>setTimeout(resolve,0));
    },json);
    await recovery.locator('#status').getByText(/Backup check failed/).waitFor();
    assert.equal(await recovery.locator('#restore').isDisabled(),true);
    assert.equal(await recovery.evaluate(()=>localStorage.length),0);
    reports.push({engine:name,test:'latest-file-selection-wins',status:'pass'});
    await recovery.reload();
    await recovery.locator("#file").setInputFiles({ name: "safe-backup.json", mimeType: "application/json", buffer: Buffer.from(json) });
    await recovery.locator("#status").getByText(/4 missing data sets can be restored/).waitFor();
    assert.equal(await recovery.locator("#restore").isEnabled(), true);
    assert.equal(await recovery.locator('#preview li').count(),4);
    assert.equal(await recovery.evaluate(()=>localStorage.length),0);
    recovery.once('dialog',dialog=>dialog.dismiss());
    await recovery.locator('#restore').click();
    assert.equal(await recovery.evaluate(()=>localStorage.length),0);
    assert.equal(await recovery.locator('#restore').isEnabled(),true);
    reports.push({engine:name,test:'preview-and-cancel-do-not-write',status:'pass'});
    recovery.once("dialog", dialog => dialog.accept());
    await recovery.locator("#restore").click();
    await recovery.locator("#status").getByText(/Restored 4 missing data sets/).waitFor();
    const saved = await recovery.evaluate(() => ({
      study: localStorage.getItem("study-acc"),
      srs: localStorage.getItem("acc-flashcards-v1-srs"),
      vocab: localStorage.getItem("vocabloom_mvp_v1"),
      secret: localStorage.getItem("study-sync-key")
    }));
    assert.equal(saved.study, ACC);
    assert.equal(saved.srs, SRS);
    assert.equal(saved.vocab, VOC);
    assert.equal(saved.secret, null);
    assert.equal(await recovery.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await recovery.evaluate(()=>document.fonts.ready);
    await recovery.screenshot({ path: path.join(output, name + "-restored-390.png"), fullPage: true });
    await recovery.reload();
    assert.equal(await recovery.evaluate(()=>localStorage.getItem('study-acc')),ACC);
    assert.equal(await recovery.locator('#restore').isDisabled(),true);
    assert.deepEqual(recErrors, []);
    reports.push({ engine: name, test: "empty-profile/restore/no-secret", status: "pass" });
    await clean.close();

    const conflicting = await context(), blocked = await conflicting.newPage();
    await blocked.goto(origin + "/progress-restore.html");
    await blocked.evaluate(() => localStorage.setItem("study-acc", "PRESERVE-EXISTING"));
    await blocked.locator("#file").setInputFiles({ name: "safe-backup.json", mimeType: "application/json", buffer: Buffer.from(json) });
    await blocked.locator("#status").getByText(/Blocked: 1 existing data sets differ/).waitFor();
    assert.equal(await blocked.locator("#restore").isDisabled(), true);
    assert.equal(await blocked.evaluate(() => localStorage.getItem("study-acc")), "PRESERVE-EXISTING");
    reports.push({ engine: name, test: "conflict/deny-no-overwrite", status: "pass" });
    await conflicting.close();
    return reports;
  } finally {
    await browser.close();
  }
}
(async () => {
  await fs.mkdir(output, { recursive: true });
  const { server, origin } = await serve();
  try {
    const results = [];
    for (const [name, engine] of [["chromium", chromium], ["webkit", webkit]]) {
      results.push(...await runEngine(name, engine, origin));
    }
    await fs.writeFile(path.join(output, "results.json"), JSON.stringify({
      scope: "synthetic localhost only: no Cloudflare, Notion, real progress, or iPad device",
      results
    }, null, 2));
    console.log("PASS: " + results.length + " isolated browser backup/restore safety scenarios");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
