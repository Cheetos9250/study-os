'use strict';
/* Desk display page (desk.html): agenda merge, month grid, PM2.5 bands, saved state, backup/restore, source rules. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const D = require('../scripts/study-desk.js');

test('Bangkok clock helpers and date maths', () => {
  const t = Date.UTC(2026, 10, 22, 4, 11); // 11:11 in Bangkok
  assert.equal(D.clock(t), '11:11');
  assert.equal(D.todayKey(Date.UTC(2026, 10, 21, 18, 0)), '2026-11-22'); // 01:00 next day in Bangkok
  assert.equal(D.addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(D.dowOf('2026-11-22'), 0);
  assert.equal(D.diffDays('2026-11-22', '2026-11-26'), 4);
  assert.equal(D.dayLabel('2026-11-23'), 'Mon 23 Nov');
  assert.equal(D.valid('2026-02-30'), false);
  assert.equal(D.valid('2026-11-30'), true);
});

test('month grid starts on Sunday and has no stray cells', () => {
  const g = D.monthGrid(2026, 11); // Nov 2026 starts on Sunday
  assert.equal(g.length % 7, 0);
  assert.equal(g[0].d, 1);
  assert.equal(g[0].dow, 0);
  assert.equal(g.filter(Boolean).length, 30);
  const feb = D.monthGrid(2026, 2); // Feb 2026 starts on Sunday, 28 days
  assert.equal(feb.length, 28);
  const dec = D.monthGrid(2026, 12); // starts on Tuesday: two blanks first
  assert.equal(dec[0], null); assert.equal(dec[1], null); assert.equal(dec[2].d, 1);
  assert.deepEqual(D.shiftMonth(2026, 12, 1), { y: 2027, m: 1 });
  assert.deepEqual(D.shiftMonth(2026, 1, -1), { y: 2025, m: 12 });
});

test('agenda merges exams, open tasks, classes and own events in date and time order', () => {
  const items = D.buildAgenda({
    today: '2026-11-22', days: 10,
    exams: [{ id: 'a', title: 'Accounting final', date: '2026-11-26' }, { id: 'old', title: 'Old', date: '2026-11-01' }],
    tasks: [{ id: '1', title: 'Late task', date: '2026-11-20', done: false }, { id: '2', title: 'Done', date: '2026-11-23', done: true }, { id: '3', title: 'Soon', date: '2026-11-24' }],
    classes: [{ id: 'c', day: 0, start: '08:30', end: '11:30', name: 'Accounting' }, { id: 'g', day: 5, start: '09:00', end: '10:00', name: 'Global', skip: true }],
    events: [{ id: 'e', date: '2026-11-22', title: 'Lunch', time: '12:00' }, { id: 'e2', date: '2026-12-30', title: 'Far away', time: '' }]
  });
  const titles = items.map(x => x.date + ' ' + (x.time || '--') + ' ' + x.title);
  assert.deepEqual(titles.slice(0, 4), ['2026-11-22 -- Late task', '2026-11-22 08:30 Accounting', '2026-11-22 12:00 Lunch', '2026-11-24 -- Soon']);
  assert.ok(items.some(x => x.title === 'Accounting final' && x.kind === 'exam'));
  assert.ok(items.find(x => x.title === 'Late task').late);
  assert.ok(!items.some(x => x.title === 'Done' || x.title === 'Old' || x.title === 'Far away' || x.title === 'Global'));
  assert.equal(items.filter(x => x.kind === 'class').length, 2); // Sundays 22 Nov and 29 Nov
  const dots = D.dotDates(items);
  assert.ok(dots['2026-11-22'] && dots['2026-11-24'] && dots['2026-11-26']);
  assert.ok(!dots['2026-11-29']); // only a class that day
});

test('PM2.5 bands follow the Thai 24 h scale and the air series reads the current hour', () => {
  assert.equal(D.pmLevel(15).label, 'Very good');
  assert.equal(D.pmLevel(16).label, 'Good');
  assert.equal(D.pmLevel(25.4).label, 'Good');
  assert.equal(D.pmLevel(26).label, 'Moderate');
  assert.equal(D.pmLevel(40).label, 'Unhealthy for sensitive');
  assert.equal(D.pmLevel(120).label, 'Unhealthy');
  assert.equal(D.pmLevel(null).label, 'No data');
  const time = [], vals = [];
  for (let i = 0; i < 48; i++) { time.push('2026-11-22T' + String(i % 24).padStart(2, '0') + ':00'); vals.push(i); }
  time.splice(24, 24, ...Array.from({ length: 24 }, (_, i) => '2026-11-23T' + String(i).padStart(2, '0') + ':00'));
  const r = D.pmNow({ current: { pm2_5: 16.4 }, hourly: { time, pm2_5: vals } }, '2026-11-22T11:00');
  assert.equal(r.value, 16.4);
  assert.deepEqual(r.series, [11, 14, 17, 20, 23]);
  assert.equal(D.pmNow(null, '2026-11-22T11:00'), null);
});

test('weather codes and the cat line', () => {
  assert.equal(D.wmo(0, 1).icon, 'sun'); assert.equal(D.wmo(0, 0).icon, 'moon'); assert.equal(D.wmo(61, 1).icon, 'rain');
  assert.equal(D.wmo(95, 1).icon, 'storm'); assert.equal(D.wmo(2, 1).icon, 'partly'); assert.equal(D.wmo(45, 1).icon, 'fog');
  assert.equal(D.catLine({ pm: 50, rain: 0, temp: 30, code: 0, isDay: 1 }).mood, 'mask');
  assert.equal(D.catLine({ pm: 10, rain: 70, temp: 30, code: 61, isDay: 1 }).mood, 'rain');
  assert.equal(D.catLine({ pm: 10, rain: 10, temp: 36, code: 0, isDay: 1 }).mood, 'hot');
  assert.equal(D.catLine({ pm: 10, rain: 10, temp: 26, code: 0, isDay: 0 }).mood, 'sleepy');
  assert.equal(D.catLine({ pm: 10, rain: 10, temp: 28, code: 0, isDay: 1 }).mood, 'sun');
});

test('saved state is validated and defaults are filled in', () => {
  const d = D.normalizeState(null);
  assert.equal(d.city.name, 'Sathorn'); assert.equal(d.aq.length, 9); assert.deepEqual(d.events, []); assert.equal(d.auto, 0); assert.equal(d.awake, true);
  const s = D.normalizeState(JSON.stringify({
    events: [{ id: 'a', date: '2026-11-22', title: ' Hello ', time: '09:30' }, { id: 'b', date: 'nope', title: 'x' }, { id: 'c', date: '2026-11-22', title: '', time: '' }, { id: 'd', date: '2026-11-22', title: 'x', time: '25:00' }],
    city: { name: 'Chiang Rai', lat: 19.9072, lon: 99.831 }, aq: [{ name: 'X', lat: 200, lon: 0 }, { name: 'Y', lat: 1, lon: 2 }], auto: 45, awake: false
  }));
  assert.deepEqual(s.events, [{ id: 'a', date: '2026-11-22', title: 'Hello', time: '09:30' }]);
  assert.equal(s.city.name, 'Chiang Rai'); assert.deepEqual(s.aq, [{ name: 'Y', lat: 1, lon: 2 }]);
  assert.equal(s.auto, 0); assert.equal(s.awake, false);
  assert.equal(D.normalizeState('{not json').events.length, 0);
  assert.match(D.newId(1700000000000, 0.5), /^e[a-z0-9]+$/);
});

test('desk key is backed up, labelled and validated on restore', () => {
  const B = require('../scripts/study-progress-backup.js'); assert.ok(B.keys.includes('studyos.desk.v1'));
  assert.equal(B.labelForKey('studyos.desk.v1'), 'Desk display events and settings');
  assert.match(rd('progress-restore.html'), /studyos\.desk\.v1"\) return "Desk display events and settings"/);
  const R = require('../scripts/study-progress-restore.js'), ORIGIN = 'https://cheetos9250.github.io';
  const snap = raw => B.createSnapshot({ getItem: k => k === 'studyos.desk.v1' ? raw : null }, ORIGIN, new Date('2026-11-22T12:00:00Z'));
  const mem = () => { const m = {}; return { getItem: k => k in m ? m[k] : null, setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; };
  const ok = JSON.stringify({ events: [{ id: 'e1', date: '2026-11-23', title: 'Exam prep', time: '09:00' }], city: { name: 'Sathorn', lat: 13.72, lon: 100.529 }, aq: [{ name: 'Phuket', lat: 7.88, lon: 98.392 }], auto: 30, awake: true });
  const s1 = mem(); assert.deepEqual(R.restoreMissing(s1, snap(ok), ORIGIN), { restored: 1, alreadyPresent: 0 }); assert.equal(s1.getItem('studyos.desk.v1'), ok);
  for (const bad of [{ events: [{ id: 'e', date: '2026-13-01', title: 'x' }] }, { events: [{ id: 'e', date: '2026-11-23', title: '' }] }, { city: { name: 'x', lat: 99, lon: 0 } }, { aq: [{ name: 'x', lat: 0, lon: 0 }, 5] }, { auto: 7 }, { awake: 'yes' }, { events: 'no' }])
    assert.throws(() => R.restoreMissing(mem(), snap(JSON.stringify(bad)), ORIGIN), JSON.stringify(bad));
});

test('desk page: English UI, own keys only, Open-Meteo only, separate manifest, cached offline', () => {
  const html = rd('desk.html'), ui = rd('scripts/study-desk-ui.js'), pure = rd('scripts/study-desk.js');
  for (const f of [html, ui, pure]) assert.doesNotMatch(f, /[฀-๿]/);
  assert.match(html, /<link rel="manifest" href="desk\.webmanifest">/);
  const m = JSON.parse(rd('desk.webmanifest'));
  assert.equal(m.start_url, './desk.html'); assert.equal(m.display, 'standalone'); assert.notEqual(m.id, JSON.parse(rd('manifest.webmanifest')).id);
  for (const i of m.icons) assert.ok(fs.existsSync(path.join(ROOT, i.src)), i.src);
  assert.deepEqual([...ui.matchAll(/\bwr\(([^,]+),/g)].map(x => x[1]).sort(), ['CK', 'D.KEY']);
  assert.equal((ui.match(/localStorage\.setItem/g) || []).length, 1); assert.match(ui, /var wr = function \(k, v\) \{ try \{ localStorage\.setItem\(k, v\)/);
  assert.doesNotMatch(ui, /localStorage\.removeItem|sessionStorage\.setItem\((?!'studyos\.desk\.page')/);
  const hosts = new Set([...(ui.match(/https:\/\/[a-z.-]+/g) || [])]);
  assert.deepEqual([...hosts].sort(), ['https://air-quality-api.open-meteo.com', 'https://api.open-meteo.com', 'https://geocoding-api.open-meteo.com']);
  assert.doesNotMatch(ui, /method:\s*['"](POST|PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(pure, /localStorage|sessionStorage|fetch\(|document\./);
  assert.match(rd('sw.js'), /'desk\.html', 'desk\.webmanifest'/);
  assert.match(rd('scripts/study-nav.js'), /href:'desk\.html'/);
  for (const id of ['p0', 'p1', 'p2', 'p3', 'p4', 'bLeft', 'bNext', 'evDlg', 'setDlg', 'grid', 'agList']) assert.match(html, new RegExp('id="' + id + '"'), id);
});
