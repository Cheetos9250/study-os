"use strict";
// Isolated browser QA: localhost files, synthetic storage, external requests blocked.
const { chromium, webkit } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const output = process.env.STUDY_OS_QA_OUTPUT || "/tmp/study-os-browser-qa";
async function main() {
  await fs.mkdir(output, {recursive:true});
  const server = http.createServer(async (request,response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url,"http://localhost").pathname);
      const file = path.resolve(root, "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname));
      if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
      const types = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json"};
      response.writeHead(200,{"Content-Type":types[path.extname(file)]||"text/plain"});
      response.end(await fs.readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0,"127.0.0.1",resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const evidence = [];
  try {
    for (const [engine,type] of Object.entries({chromium,webkit})) {
      const browser = await type.launch({headless:true});
      try {
        for (const [width,height] of [[390,844],[820,1180],[1180,820],[1440,900]]) {
          for (const colorScheme of ["light","dark"]) {
            const context = await browser.newContext({viewport:{width,height},colorScheme,hasTouch:true});
            await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", error => errors.push(error.message));
            await page.goto(base);
            assert.equal(await page.locator('[data-course]').count(),3);
            await page.locator("#read-progress").click();
            assert.match(await page.locator("#progress-results").innerText(),/ยังไม่มีข้อมูล/);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`${engine} ${width} overflow`);
            await page.evaluate(() => {
              localStorage.setItem("study-acc",JSON.stringify({ans:{q1:0,q2:1},known:[]}));
              localStorage.setItem("acc-flashcards-v1-srs",JSON.stringify({s:{c1:{due:123}}}));
              localStorage.setItem("study-sync-key","SYNTHETIC-DO-NOT-READ");
              window.__storageBefore = JSON.stringify({...localStorage});
              window.__reads = [];
              const original = Storage.prototype.getItem;
              Storage.prototype.getItem = function(key) { window.__reads.push(key); return original.call(this,key); };
            });
            await page.locator("#read-progress").click();
            assert.match(await page.locator("#progress-results").innerText(),/ข้อที่เคยตอบ: 2/);
            assert.equal(await page.evaluate(() => JSON.stringify({...localStorage}) === window.__storageBefore),true);
            assert.equal(await page.evaluate(() => window.__reads.includes("study-sync-key")),false);
            await page.evaluate(() => localStorage.setItem("study-acc","malformed"));
            await page.locator("#read-progress").click();
            assert.match(await page.locator("#progress-status").innerText(),/2 จาก 3/);
            // Keyboard activation and rerender must also work.
            await page.locator("#read-progress").focus();
            await page.keyboard.press("Enter");
            assert.equal(await page.locator(".progress-row").count(),3);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
            await page.screenshot({path:path.join(output,`${engine}-${width}-${colorScheme}.png`),fullPage:true});
            assert.deepEqual(errors,[]);
            evidence.push({engine,width,height,colorScheme,dashboard:"passed; synthetic storage"});
            await context.close();
          }
        }
        // Fresh synthetic profile per subject; no user/browser data is used.
        for (const subject of ["acc","eco","math","eng","zh"]) {
          const context = await browser.newContext({viewport:{width:820,height:1180},hasTouch:true});
          await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror", error => errors.push(error.message));
          await page.goto(`${base}/${subject}.html`);
          if (["acc","eco","math"].includes(subject)) {
          await page.locator('[data-tab="sum"]').click();
          assert.ok((await page.locator("#sumBody").innerText()).trim().length > 0);
          await page.locator('[data-tab="prac"]').click();
          await page.locator(".opt").first().click();
          assert.equal(await page.locator(".explain").count(),1);
          } else {
            assert.equal(await page.locator('[data-tab="sum"]').isVisible(),false);
            assert.equal(await page.locator('[data-tab="prac"]').isVisible(),false);
          }
          await page.locator('[data-tab="cards"]').click();
          await page.locator("#stage .card").click();
          assert.equal(await page.locator("#stage .card.flipped").count(),1);
          assert.deepEqual(errors,[],`${engine} ${subject} runtime errors`);
          evidence.push({engine,subject,legacyCourse:"passed; external APIs blocked; synthetic answers only"});
          await context.close();
        }
        const noJS = await browser.newContext({javaScriptEnabled:false});
        const page = await noJS.newPage();
        await page.goto(base);
        assert.equal(await page.locator('[data-course="acc"]').getAttribute("href"),"acc.html");
        assert.equal(await page.locator("#read-progress").isVisible(),false);
        await noJS.close();
      } finally { await browser.close(); }
    }
    await fs.writeFile(path.join(output,"results.json"),JSON.stringify({scope:"local browser; mock storage; no live sync; WebKit is not physical iPad Safari",evidence},null,2));
    console.log(`Passed ${evidence.length} browser scenarios plus JavaScript-disabled checks`);
  } finally { await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => {console.error(error);process.exitCode=1;});
