/* WordNest daily goal, shared by Today (index.html) and WordNest (vocabloom/).
   Read-only: it only reads keys that already exist and are backed up:
   - vocabloom_mvp_v1: settings.goal (WordNest daily goal, default 10) and days[YYYY-MM-DD].answered (English games
     and English flashcards, all devices after a sync);
   - eng-vocab-v1-srs / zh-vocab-v1-srs: flashcard schedules ({s: {id: {due, ts, …}}}). Entries starting "vb/" are
     WordNest sync shadows, not cards, and are skipped.
   Done today = English answers today + Chinese cards reviewed today (flashcards and Chinese games). */
(function (root) {
  'use strict';
  var DAY = 864e5, TZ = 7 * 36e5;
  function startOfDay(now) { return Math.floor((now + TZ) / DAY) * DAY - TZ; }      // Bangkok day, like the flashcards
  function dayKey(now) { return new Date(now + TZ).toISOString().slice(0, 10); }
  function obj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function parse(raw) { try { var o = JSON.parse(raw || 'null'); return obj(o) ? o : {}; } catch (e) { return {}; } }
  function cards(srs) { var s = obj(srs) && obj(srs.s) ? srs.s : {}; return Object.keys(s).filter(function (k) { return k.indexOf('vb/') !== 0 && obj(s[k]); }).map(function (k) { return s[k]; }); }
  function due(srs, now) { return cards(srs).filter(function (c) { return Number(c.due || 0) <= now; }).length; }
  function reviewedToday(srs, now) { var t0 = startOfDay(now); return cards(srs).filter(function (c) { return Number(c.ts || 0) >= t0; }).length; }
  /* vocab, eng, zh: parsed objects (or raw JSON strings) */
  function daily(vocab, eng, zh, now) {
    now = now || Date.now();
    vocab = typeof vocab === 'string' ? parse(vocab) : obj(vocab) ? vocab : {};
    eng = typeof eng === 'string' ? parse(eng) : eng; zh = typeof zh === 'string' ? parse(zh) : zh;
    var goal = Math.max(1, Math.round(Number(vocab.settings && vocab.settings.goal) || 10));
    var d = obj(vocab.days) && obj(vocab.days[dayKey(now)]) ? vocab.days[dayKey(now)] : {};
    var en = Math.max(0, Number(d.answered) || 0), cn = reviewedToday(zh, now);
    var dueEn = due(eng, now), dueZh = due(zh, now);
    return { goal: goal, done: en + cn, en: en, zh: cn, met: en + cn >= goal, due: dueEn + dueZh, dueEn: dueEn, dueZh: dueZh,
      started: !!(Object.keys(obj(vocab.progress) ? vocab.progress : {}).length || cards(eng).length || cards(zh).length) };
  }
  function read(now) {
    var g = function (k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } };
    return daily(g('vocabloom_mvp_v1'), g('eng-vocab-v1-srs'), g('zh-vocab-v1-srs'), now);
  }
  var api = { daily: daily, read: read, startOfDay: startOfDay, dayKey: dayKey };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.StudyWordNest = api;
})(typeof window !== 'undefined' ? window : null);
