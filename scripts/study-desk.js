/* Study OS Desk display: pure helpers (no DOM, no network, no storage access).
   Used by desk.html / scripts/study-desk-ui.js and by tests.
   Own storage key (backed up): studyos.desk.v1 = { events, city, aq, auto, awake }.
   Everything shown on the desk besides weather and air quality is read from keys that already exist
   (studyos.today.v1 exams + timetable, studyos.home.v1 tasks). */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudyDesk = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var KEY = 'studyos.desk.v1', TZ = 7 * 3600000, DAY = 86400000;
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DEFAULT_CITY = Object.freeze({ name: 'Sathorn', lat: 13.72, lon: 100.529 });
  var DEFAULT_AQ = Object.freeze([
    { name: 'Sathorn', lat: 13.72, lon: 100.529 },
    { name: 'Yan Nawa', lat: 13.699, lon: 100.544 },
    { name: 'Sam Yan', lat: 13.733, lon: 100.529 },
    { name: 'Pathum Wan', lat: 13.744, lon: 100.534 },
    { name: 'Saphan Sung', lat: 13.767, lon: 100.687 },
    { name: 'Mae Klong', lat: 13.41, lon: 100.002 },
    { name: 'Chiang Rai', lat: 19.907, lon: 99.831 },
    { name: 'Si Racha', lat: 13.173, lon: 100.931 },
    { name: 'Phuket', lat: 7.88, lon: 98.392 }
  ]);
  var AUTO_CHOICES = [0, 15, 30, 60];
  var ISO = /^(\d{4})-(\d{2})-(\d{2})$/, HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* Bangkok wall clock from epoch ms (the site uses UTC+7 everywhere). */
  function parts(ms) {
    var d = new Date(ms + TZ);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), dow: d.getUTCDay(), hh: d.getUTCHours(), mm: d.getUTCMinutes() };
  }
  function ymd(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function todayKey(ms) { var p = parts(ms); return ymd(p.y, p.m, p.d); }
  function valid(iso) {
    var m = ISO.exec(String(iso || '')); if (!m) return false;
    var t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return t.getUTCFullYear() === +m[1] && t.getUTCMonth() === +m[2] - 1 && t.getUTCDate() === +m[3];
  }
  function utc(iso) { var m = ISO.exec(iso); return Date.UTC(+m[1], +m[2] - 1, +m[3]); }
  function addDays(iso, n) { var d = new Date(utc(iso) + n * DAY); return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); }
  function dowOf(iso) { return new Date(utc(iso)).getUTCDay(); }
  function diffDays(a, b) { return Math.round((utc(b) - utc(a)) / DAY); }
  function dayLabel(iso) { var m = ISO.exec(iso); return DOW[dowOf(iso)] + ' ' + (+m[3]) + ' ' + MON[+m[2] - 1]; }
  function monthLabel(y, m) { return MON[m - 1] + ' ' + y; }
  function clock(ms) { var p = parts(ms); return pad(p.hh) + ':' + pad(p.mm); }

  /* ---------- saved state ---------- */
  function cityOk(c) {
    return c && typeof c === 'object' && typeof c.name === 'string' && c.name.trim() &&
      Number.isFinite(c.lat) && Number.isFinite(c.lon) && c.lat >= -90 && c.lat <= 90 && c.lon >= -180 && c.lon <= 180;
  }
  function cleanCity(c) { return { name: String(c.name).trim().slice(0, 40), lat: Math.round(c.lat * 1000) / 1000, lon: Math.round(c.lon * 1000) / 1000 }; }
  function eventOk(e) {
    return e && typeof e === 'object' && typeof e.id === 'string' && e.id && e.id.length <= 40 && valid(e.date) &&
      typeof e.title === 'string' && e.title.trim() && (e.time === '' || e.time === undefined || HHMM.test(e.time));
  }
  function cleanEvent(e) { return { id: e.id, date: e.date, title: e.title.trim().slice(0, 80), time: e.time || '' }; }
  function normalizeState(raw) {
    var v = raw;
    if (typeof raw === 'string') { try { v = JSON.parse(raw); } catch (e) { v = null; } }
    if (!v || typeof v !== 'object' || Array.isArray(v)) v = {};
    var aq = Array.isArray(v.aq) ? v.aq.filter(cityOk).slice(0, 12).map(cleanCity) : DEFAULT_AQ.map(function (c) { return Object.assign({}, c); });
    return {
      events: Array.isArray(v.events) ? v.events.filter(eventOk).slice(0, 300).map(cleanEvent) : [],
      city: cityOk(v.city) ? cleanCity(v.city) : Object.assign({}, DEFAULT_CITY),
      aq: aq,
      auto: AUTO_CHOICES.indexOf(v.auto) >= 0 ? v.auto : 0,
      awake: v.awake !== false
    };
  }
  function newId(ms, rnd) { return 'e' + ms.toString(36) + Math.floor(rnd * 1296).toString(36); }

  /* ---------- agenda: exams + open tasks + classes + own events ---------- */
  var KIND_ORDER = { exam: 0, task: 1, event: 2, class: 3 };
  function buildAgenda(o) {
    var today = o.today, days = o.days == null ? 60 : o.days, end = addDays(today, days), out = [], i;
    var inWin = function (d) { return d >= today && d <= end; };
    (o.exams || []).forEach(function (e) {
      if (e && valid(e.date) && inWin(e.date)) out.push({ date: e.date, time: '', title: String(e.title || 'Exam'), kind: 'exam', id: 'x:' + e.id });
    });
    (o.tasks || []).forEach(function (t) {
      if (!t || t.done || !valid(t.date)) return;
      var late = t.date < today, d = late ? today : t.date;
      if (inWin(d)) out.push({ date: d, time: '', title: String(t.title || 'Task'), kind: 'task', late: late, id: 't:' + t.id });
    });
    (o.events || []).forEach(function (e) {
      if (e && valid(e.date) && inWin(e.date)) out.push({ date: e.date, time: e.time || '', title: e.title, kind: 'event', id: e.id, own: true });
    });
    var tt = o.classes || [];
    for (i = 0; i <= days; i++) {
      var iso = addDays(today, i), dw = dowOf(iso);
      tt.forEach(function (c) { if (c.day === dw && !c.skip) out.push({ date: iso, time: c.start, end: c.end, title: String(c.name || 'Class'), kind: 'class', id: 'c:' + c.id + ':' + iso }); });
    }
    return out.sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 :
        (a.time || '') < (b.time || '') ? -1 : (a.time || '') > (b.time || '') ? 1 :
        KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    });
  }
  /* Dots in the month grid: anything except the weekly classes. */
  function dotDates(items) { var s = {}; items.forEach(function (x) { if (x.kind !== 'class') s[x.date] = true; }); return s; }
  /* Month grid, Sunday first. Cells outside the month are null. */
  function monthGrid(y, m) {
    var first = new Date(Date.UTC(y, m - 1, 1)), lead = first.getUTCDay(), n = new Date(Date.UTC(y, m, 0)).getUTCDate(), cells = [], i;
    for (i = 0; i < lead; i++) cells.push(null);
    for (i = 1; i <= n; i++) cells.push({ d: i, iso: ymd(y, m, i), dow: (lead + i - 1) % 7 });
    while (cells.length % 7) cells.push(null);
    return cells;
  }
  function shiftMonth(y, m, n) { var t = y * 12 + (m - 1) + n; return { y: Math.floor(t / 12), m: (t % 12) + 1 }; }

  /* ---------- air quality: PM2.5 (µg/m³) bands of the Thai Pollution Control Department, 24 h basis ---------- */
  var PM_BANDS = [
    { max: 15, key: 'vgood', label: 'Very good' },
    { max: 25, key: 'good', label: 'Good' },
    { max: 37.5, key: 'mod', label: 'Moderate' },
    { max: 75, key: 'sens', label: 'Unhealthy for sensitive' },
    { max: Infinity, key: 'bad', label: 'Unhealthy' }
  ];
  function pmLevel(v) {
    if (!Number.isFinite(v)) return { key: 'na', label: 'No data', idx: -1 };
    var x = Math.round(v);
    for (var i = 0; i < PM_BANDS.length; i++) if (x <= PM_BANDS[i].max) return { key: PM_BANDS[i].key, label: PM_BANDS[i].label, idx: i };
    return { key: 'bad', label: 'Unhealthy', idx: 4 };
  }

  /* ---------- weather codes (WMO, as returned by Open-Meteo) ---------- */
  function wmo(code, isDay) {
    var day = isDay !== 0 && isDay !== false;
    if (code === 0) return { label: day ? 'Clear' : 'Clear night', icon: day ? 'sun' : 'moon' };
    if (code === 1) return { label: 'Mostly clear', icon: day ? 'sun' : 'moon' };
    if (code === 2) return { label: 'Partly cloudy', icon: 'partly' };
    if (code === 3) return { label: 'Cloudy', icon: 'cloud' };
    if (code === 45 || code === 48) return { label: 'Fog', icon: 'fog' };
    if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: 'rain' };
    if (code >= 61 && code <= 67) return { label: 'Rain', icon: 'rain' };
    if (code >= 80 && code <= 82) return { label: 'Showers', icon: 'rain' };
    if (code >= 95) return { label: 'Thunderstorm', icon: 'storm' };
    return { label: 'Cloudy', icon: 'cloud' };
  }
  /* The cat's mood and one line, from what is outside right now. */
  function catLine(c) {
    var pm = c.pm, rain = c.rain, t = c.temp;
    if (Number.isFinite(pm) && pm > 37.5) return { mood: 'mask', text: 'Dusty air. Mask up outside.' };
    if (c.code >= 95) return { mood: 'rain', text: 'Thunder out there. I am staying in.' };
    if (rain >= 60) return { mood: 'rain', text: 'Rain is likely. Take an umbrella.' };
    if (t >= 35) return { mood: 'hot', text: 'So hot. I am melting.' };
    if (c.isDay === 0 || c.isDay === false) return { mood: 'sleepy', text: 'Late already. Sleep soon.' };
    if (rain >= 30) return { mood: 'sun', text: 'Maybe rain later. Pack light.' };
    return { mood: 'sun', text: 'Nice out. Study somewhere sunny?' };
  }

  /* Air-quality API gives hourly arrays; pick the value at the current hour and a few later ones. */
  function pmNow(air, nowIso) {
    if (!air) return null;
    var cur = air.current && Number.isFinite(air.current.pm2_5) ? air.current.pm2_5 : null;
    var h = air.hourly, series = [];
    if (h && Array.isArray(h.time) && Array.isArray(h.pm2_5)) {
      var idx = -1, key = nowIso.slice(0, 13);
      for (var i = 0; i < h.time.length; i++) if (h.time[i].slice(0, 13) === key) { idx = i; break; }
      if (idx < 0) idx = 0;
      for (var k = 0; k < 5; k++) { var v = h.pm2_5[idx + k * 3]; series.push(Number.isFinite(v) ? v : null); }
      if (cur === null && Number.isFinite(h.pm2_5[idx])) cur = h.pm2_5[idx];
    }
    return { value: cur, series: series };
  }

  return {
    KEY: KEY, DEFAULT_CITY: DEFAULT_CITY, DEFAULT_AQ: DEFAULT_AQ, AUTO_CHOICES: AUTO_CHOICES, PM_BANDS: PM_BANDS, DOW: DOW, MON: MON,
    parts: parts, ymd: ymd, todayKey: todayKey, valid: valid, addDays: addDays, dowOf: dowOf, diffDays: diffDays,
    dayLabel: dayLabel, monthLabel: monthLabel, clock: clock, normalizeState: normalizeState, newId: newId,
    eventOk: eventOk, cityOk: cityOk, buildAgenda: buildAgenda, dotDates: dotDates, monthGrid: monthGrid, shiftMonth: shiftMonth,
    pmLevel: pmLevel, wmo: wmo, catLine: catLine, pmNow: pmNow
  };
});
