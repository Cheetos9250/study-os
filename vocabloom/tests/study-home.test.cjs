"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m => m[1]);

test("academic homepage has accessible English document metadata", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="viewport"/);
  assert.doesNotMatch(html, /[\u0e00-\u0e7f]/, "homepage copy and accessibility labels must be English");
  assert.match(html, /<main>/);
  assert.match(html, /<h1 id="welcome-title">/);
});

test("academic dashboard links to all three original subject pages", () => {
  for (const href of ["acc.html", "eco.html", "math.html"]) {
    assert.ok(links.includes(href), `missing academic route: ${href}`);
    assert.ok(fs.existsSync(path.join(root, href)), `missing target file: ${href}`);
  }
});

test("VocaBloom is a separate language destination", () => {
  assert.ok(links.includes("vocabloom/"));
  assert.ok(fs.existsSync(path.join(root, "vocabloom", "index.html")));
  assert.doesNotMatch(html, /All-in-One Study OS|แฟลชการ์ด 5 วิชา/);
});

test("all homepage links are local and resolve within repository", () => {
  for (const href of links) {
    assert.doesNotMatch(href, /^(https?:|javascript:|data:|\/\/)/i);
    const resolved = path.resolve(root, href);
    assert.ok(resolved.startsWith(root + path.sep), `path escape: ${href}`);
    assert.ok(fs.existsSync(resolved), `broken route: ${href}`);
  }
});

test("homepage has responsive, focus, dark-mode, and reduced-motion rules", () => {
  assert.match(html, /@media\(max-width:760px\)/);
  assert.match(html, /prefers-color-scheme:dark/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /:focus-visible/);
});

test("homepage is navigation-only and cannot mutate progress", () => {
  assert.doesNotMatch(html, /<script\b|localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|<form\b/i);
});

test("academic cards have self-contained decorative SVG subject icons", () => {
  const icons=[...html.matchAll(/<span class="symbol" aria-hidden="true">(<svg[\s\S]*?<\/svg>)<\/span>/g)];
  assert.equal(icons.length,3);
  for (const [,svg] of icons) {
    assert.match(svg,/viewBox="0 0 24 24"/);
    assert.match(svg,/stroke="currentColor"/);
    assert.match(svg,/focusable="false"/);
    assert.doesNotMatch(svg,/<script|foreignObject|<image|href=/i);
  }
});
