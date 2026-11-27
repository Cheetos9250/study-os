'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('WordNest page carries the PWA tags so Home Screen opens stay in app mode', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'vocabloom', 'index.html'), 'utf8');
  assert.match(html, /<link rel="manifest" href="\.\.\/manifest\.webmanifest"/);
  assert.match(html, /<link rel="apple-touch-icon"[^>]*href="\.\.\/assets\/apple-touch-icon\.png"/);
  assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes"/);
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'apple-touch-icon.png')));
});
