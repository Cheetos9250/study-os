/* Study OS Desk display: rendering, weather/air fetch (Open-Meteo, no key), own events, settings.
   Reads: studyos.today.v1 (exams, timetable), studyos.home.v1 (tasks, goal), quiz answers, WordNest, Pomodoro log.
   Writes: studyos.home.v1 (only ticking a task, through StudyDesk.tickTask; everything else in it is kept),
           studyos.desk.v1 (own events, city, air-quality list, pages, options; backed up) and
           studyos.desk.cache.v1 (last weather/air answer so the page works offline; not backed up).
   Network: GET only, to api.open-meteo.com, air-quality-api.open-meteo.com and geocoding-api.open-meteo.com
   (no keys, nothing from the study data is ever sent; only the chosen coordinates). */
(function () {
  'use strict';
  var D = window.StudyDesk, T = window.StudyToday, CK = 'studyos.desk.cache.v1', HOMEK = 'studyos.home.v1';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var rd = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var wr = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };

  var S = D.normalizeState(rd(D.KEY));
  var cache = (function () { try { var c = JSON.parse(rd(CK) || '{}'); return c && typeof c === 'object' ? c : {}; } catch (e) { return {}; } })();
  var page = 0, sel = D.todayKey(Date.now()), view = (function () { var p = D.parts(Date.now()); return { y: p.y, m: p.m }; })();
  var editing = null, lastMin = '', lastDay = '', refreshing = false, autoTimer = null, wl = null, status = '';
  try { var sp = +sessionStorage.getItem('studyos.desk.page'); if (sp >= 0) page = sp; } catch (e) {}

  function saveState() { wr(D.KEY, JSON.stringify(S)); }
  function saveCache() { wr(CK, JSON.stringify(cache)); }

  /* ---------- icons ---------- */
  var IC = {
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    cloud: '<path d="M7 19h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 10.2 4.4 4.4 0 0 0 7 19z"/>',
    partly: '<path d="M12 2.5v1.8M4.4 5.6l1.3 1.3M19.6 5.6l-1.3 1.3M2.5 12h1.8"/><path d="M8.2 11.6A4.2 4.2 0 0 1 16 9.6"/><path d="M7 20h10a3.6 3.6 0 0 0 .5-7.2A5.2 5.2 0 0 0 7.8 12.3 3.9 3.9 0 0 0 7 20z"/>',
    rain: '<path d="M7 15h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 6.2 4.4 4.4 0 0 0 7 15z"/><path d="M8 18.2l-1 2.6M12 18.2l-1 2.6M16 18.2l-1 2.6"/>',
    storm: '<path d="M7 14h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 5.2 4.4 4.4 0 0 0 7 14z"/><path d="M12.8 14l-2.6 4h3.2l-1.6 4"/>',
    fog: '<path d="M5 8h14M3 12h18M6 16h12M9 20h6"/>',
    pin: '<path d="M12 21s6-5.6 6-10.5a6 6 0 0 0-12 0C6 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/>'
  };
  function ic(n) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || IC.cloud) + '</svg>'; }

  /* The cat: an original line drawing, mood chosen by D.catLine. */
  function cat(mood) {
    var eyes = '<circle cx="41" cy="42" r="2.6" fill="currentColor" stroke="none"/><circle cx="59" cy="42" r="2.6" fill="currentColor" stroke="none"/>';
    var mouth = '<path d="M50 48v2.5M50 50.5q-3.5 3.5-7 1.4M50 50.5q3.5 3.5 7 1.4"/>';
    var extra = '';
    if (mood === 'sleepy') { eyes = '<path d="M37 42q4 3.4 8 0M55 42q4 3.4 8 0"/>'; extra = '<text x="72" y="26" font-size="13" font-weight="700" fill="currentColor" stroke="none">z</text><text x="80" y="16" font-size="10" font-weight="700" fill="currentColor" stroke="none">z</text>'; }
    if (mood === 'hot') { mouth = '<path d="M45 50q5 7 10 0z" fill="currentColor"/>'; extra = '<path d="M26 28q-3 5 0 7q3-2 0-7zM74 30q-3 5 0 7q3-2 0-7z"/>'; }
    if (mood === 'mask') { mouth = '<rect x="37" y="46" width="26" height="12" rx="4" fill="var(--panel)"/><path d="M37 49l-8-3M37 55l-8 3M63 49l8-3M63 55l8 3M43 52h14"/>'; }
    var umb = '';
    if (mood === 'rain') umb = '<path d="M8 4Q50-34 92 4Q71-2 50 4Q29-2 8 4z" fill="var(--halftone)"/><path d="M50 4v18"/><path d="M8 18l-2 6M94 24l-2 6M12 50l-2 6M92 54l-2 6"/>';
    return '<svg viewBox="0 -26 100 150" class="ic" style="stroke-width:2.4" role="img" aria-label="Cat">' +
      '<path d="M70 100C94 100 96 72 84 66"/>' +
      '<rect x="30" y="62" width="40" height="52" rx="18" fill="var(--panel)"/>' +
      '<path d="M42 114v6M58 114v6"/>' + umb +
      '<path d="M27 32L30 10L45 23zM73 32L70 10L55 23z" fill="var(--panel)"/>' +
      '<ellipse cx="50" cy="42" rx="26" ry="22" fill="var(--panel)"/>' + eyes +
      '<path d="M47.5 45.5h5l-2.5 3z" fill="currentColor"/>' + mouth +
      '<path d="M30 44l-9-2M30 48l-9 2M70 44l9-2M70 48l9 2"/>' + extra + '</svg>';
  }

  /* ---------- data ---------- */
  function nowIsoHour() { var p = D.parts(Date.now()); return D.ymd(p.y, p.m, p.d) + 'T' + pad(p.hh) + ':00'; }
  function cityKey(c) { return c.lat + ',' + c.lon; }
  function aqPlaces() { return [S.city].concat(S.aq); }
  function aqKey() { return aqPlaces().map(cityKey).join(';'); }
  function wxData() { return cache.wx && cache.wx.key === cityKey(S.city) ? cache.wx.data : null; }
  function aqData() { return cache.aq && cache.aq.key === aqKey() && Array.isArray(cache.aq.data) ? cache.aq.data : null; }
  function homePm() { var a = aqData(); return a ? D.pmNow(a[0], nowIsoHour()) : null; }

  function agenda(days) {
    var st = T.loadSettings(rd(T.SETTINGS_KEY)), home = {};
    try { home = JSON.parse(rd(HOMEK) || '{}') || {}; } catch (e) {}
    var tasks = Array.isArray(home.tasks) ? home.tasks : [];
    return { items: D.buildAgenda({ exams: st.exams, tasks: tasks, classes: st.timetable, events: S.events, today: D.todayKey(Date.now()), days: days || 60 }), tasks: tasks, exams: st.exams };
  }

  function getJSON(url) {
    var c = new AbortController(), t = setTimeout(function () { c.abort(); }, 12000);
    return fetch(url, { signal: c.signal }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).finally(function () { clearTimeout(t); });
  }
  function refresh(force) {
    if (refreshing) return Promise.resolve();
    var fresh = cache.at && Date.now() - cache.at < 9 * 60000 && wxData() && aqData();
    if (!force && fresh) return Promise.resolve();
    refreshing = true; setStatus('Updating…');
    var c = S.city, places = aqPlaces();
    var wxU = 'https://api.open-meteo.com/v1/forecast?latitude=' + c.lat + '&longitude=' + c.lon +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=4';
    var aqU = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + places.map(function (p) { return p.lat; }).join(',') +
      '&longitude=' + places.map(function (p) { return p.lon; }).join(',') + '&current=pm2_5&hourly=pm2_5&timezone=Asia%2FBangkok&forecast_days=2';
    var key = cityKey(c), akey = aqKey();
    return Promise.all([getJSON(wxU).then(function (d) { return { ok: d }; }, function () { return {}; }), getJSON(aqU).then(function (d) { return { ok: d }; }, function () { return {}; })]).then(function (r) {
      var got = 0;
      if (r[0].ok && r[0].ok.current) { cache.wx = { key: key, data: r[0].ok }; got++; }
      if (r[1].ok) { cache.aq = { key: akey, data: Array.isArray(r[1].ok) ? r[1].ok : [r[1].ok] }; got++; }
      if (got) { cache.at = Date.now(); saveCache(); }
      setStatus(got === 2 ? 'Updated ' + D.clock(Date.now()) : got ? 'Partly updated ' + D.clock(Date.now()) : 'Offline · data from ' + (cache.at ? D.clock(cache.at) : 'never'));
    }).catch(function () { setStatus('Offline'); }).then(function () { refreshing = false; paint(); });
  }
  function setStatus(s) { status = s; var e = $('#stale'); if (e) e.textContent = s; }

  /* ---------- pages ---------- */
  var recent = {};
  function readHome() { try { var h = JSON.parse(rd(HOMEK) || '{}'); return h && typeof h === 'object' && !Array.isArray(h) ? h : {}; } catch (e) { return {}; } }
  function tickTask(id, done) {
    wr(HOMEK, JSON.stringify(D.tickTask(readHome(), id, done, D.todayKey(Date.now()))));
    try { if (window.StudyCloud && window.StudyCloud.dirty) window.StudyCloud.dirty(); } catch (e) {}
  }
  function dayWord(iso, today) { var n = D.diffDays(today, iso); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : D.dayLabel(iso); }
  function evRow(x) {
    var tag = x.kind === 'exam' ? '<span class="k">Exam</span>' : x.late ? '<span class="k late">Late</span>' : x.kind === 'task' ? '<span class="k">Due</span>' : '';
    return '<div class="ev">' + (x.time ? '<span class="t">' + x.time + '</span>' : '') + '<span class="n">' + esc(x.title) + '</span>' + tag + '</div>';
  }

  function renderHome() {
    var w = wxData(), p = D.parts(Date.now()), today = D.todayKey(Date.now());
    $('#time').textContent = pad(p.hh) + ':' + pad(p.mm);
    if (w) {
      var c = w.current, info = D.wmo(c.weather_code, c.is_day);
      $('#wxLine').innerHTML = ic(info.icon) + '<span>Outside ' + Math.round(c.temperature_2m) + '° · Feels ' + Math.round(c.apparent_temperature) + '° · Humidity ' + Math.round(c.relative_humidity_2m) + '%</span>';
    } else $('#wxLine').innerHTML = ic('cloud') + '<span class="muted">Weather not loaded yet</span>';
    var pm = homePm(), lv = D.pmLevel(pm && pm.value), bars = '';
    var ser = pm && pm.series.length ? pm.series : [null, null, null, null, null], mx = Math.max.apply(null, ser.filter(Number.isFinite).concat([25]));
    ser.forEach(function (v, i) { bars += '<b' + (i === 0 ? ' class="now"' : '') + ' style="height:' + (Number.isFinite(v) ? Math.max(18, Math.round(v / mx * 100)) : 18) + '%"></b>'; });
    $('#pmCard').innerHTML = '<div class="where">' + ic('pin') + '<span>' + esc(S.city.name) + ' · PM2.5</span></div>' +
      '<div><span id="pmBadge">' + esc(lv.label) + '</span><div class="pmUnit" style="margin-top:calc(var(--u)*1.4)">µg/m³</div><div class="pmUnit">' + (pm && pm.value !== null ? 'Hour ' + nowIsoHour().slice(11) : '') + '</div></div>' +
      '<div id="pmNum" class="num">' + (pm && Number.isFinite(pm.value) ? Math.round(pm.value) : '--') + '</div><div id="pmBars" aria-label="PM2.5 now and the next 12 hours">' + bars + '</div>';
    var up = agenda(60).items.filter(function (x) { return x.kind !== 'class'; }), html = '<div class="sech">Upcoming</div>', last = '', n = 0;
    up.some(function (x) {
      if (n >= 6) return true;
      if (x.date !== last) { html += '<div class="dh">' + esc(dayWord(x.date, today)) + '</div>'; last = x.date; }
      html += evRow(x); n++; return false;
    });
    if (!n) html += '<div class="empty">Nothing coming up. Add an event on the calendar page.</div>';
    $('#upBox').innerHTML = html; fitBox($('#upBox'));
  }

  /* Hide the children of a box that run past its bottom edge (and a heading left alone at the end). */
  function fitBox(box, all) {
    var kids = Array.prototype.slice.call(box.children).slice(all ? 0 : 1), lim = box.clientHeight - 6, over = false;
    kids.forEach(function (k) { k.style.display = ''; });
    kids.forEach(function (k) { if (!over && k.offsetTop + k.offsetHeight > lim) over = true; if (over) k.style.display = 'none'; });
    for (var i = kids.length - 1; i >= 0; i--) { if (kids[i].style.display !== 'none') { if (kids[i].className === 'dh') kids[i].style.display = 'none'; break; } }
  }

  function renderAir() {
    var a = aqData(), nowIso = nowIsoHour(), html = '';
    S.aq.forEach(function (pl, i) {
      var pm = a ? D.pmNow(a[i + 1], nowIso) : null, v = pm && Number.isFinite(pm.value) ? pm.value : null, lv = D.pmLevel(v);
      html += '<div class="aqr"><div class="aqv' + (v === null ? ' na' : '') + '">' + (v === null ? '--' : Math.round(v)) + '</div><div class="aqn">' + esc(pl.name) + '</div><div class="aql">' + esc(lv.label) + '</div></div>';
    });
    $('#aqList').innerHTML = '<div id="aqList2" style="display:flex;flex-direction:column;flex:1;min-height:0">' + (html || '<div class="empty">No places. Add some in settings.</div>') + '</div>' +
      '<div class="aqf"><span>PM2.5 µg/m³ · hour ' + nowIso.slice(11) + '</span><span>Open-Meteo (CAMS model)</span></div>';
  }

  function renderCal() {
    var today = D.todayKey(Date.now()), ag = agenda(400), dots = D.dotDates(ag.items), cells = D.monthGrid(view.y, view.m), h = '';
    $('#barTitle').textContent = D.monthLabel(view.y, view.m);
    $('#dowRow').innerHTML = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(function (d, i) { return '<span aria-label="' + D.DOW[i] + '">' + d + '</span>'; }).join('');
    cells.forEach(function (c) {
      if (!c) { h += '<span></span>'; return; }
      h += '<button type="button" class="cell' + (c.dow === 0 ? ' sun' : '') + (c.iso === today ? ' today' : '') + (c.iso === sel ? ' sel' : '') + (dots[c.iso] ? ' has' : '') + '" data-d="' + c.iso + '" aria-label="' + D.dayLabel(c.iso) + (dots[c.iso] ? ', has items' : '') + '">' + c.d + '<i></i></button>';
    });
    $('#grid').innerHTML = h;
    var items = ag.items.filter(function (x) { return x.date >= sel && (x.kind !== 'class' || x.date === sel); }), html = '', last = '';
    items.forEach(function (x) {
      if (x.date !== last) { html += '<div class="dh" data-h="1">' + esc(dayWord(x.date, today)) + '</div>'; last = x.date; }
      var inner = (x.time ? '<span class="t">' + x.time + '</span>' : '') + '<span class="n">' + esc(x.title) + (x.kind === 'exam' ? ' (exam)' : x.late ? ' (late)' : '') + '</span>';
      html += x.own ? '<button type="button" class="agrow" data-ev="' + esc(x.id) + '">' + inner + '</button>' : '<div class="agrow ' + x.kind + '">' + inner + '</div>';
    });
    $('#agList').innerHTML = html || '<div class="empty">Nothing on or after ' + esc(D.dayLabel(sel)) + '.</div>';
    $('#agFoot').innerHTML = '<span id="more"></span><button type="button" class="add" id="addEv">+ Add</button>';
    fit();
  }
  /* Hide agenda rows that do not fit, and say how many were hidden. */
  function fit() {
    var list = $('#agList'); if (!list || cur().id !== 'cal') return;
    var kids = Array.prototype.slice.call(list.children), over = false, hidden = 0, lim = list.clientHeight;
    kids.forEach(function (k) { k.style.display = ''; });
    kids.forEach(function (k) {
      if (!over && k.offsetTop + k.offsetHeight > lim + 1) over = true;
      if (over) { k.style.display = 'none'; if (!k.dataset.h && k.className.indexOf('empty') < 0) hidden++; }
    });
    for (var i = kids.length - 1; i >= 0; i--) { if (kids[i].style.display !== 'none') { if (kids[i].dataset.h) kids[i].style.display = 'none'; break; } }
    var m = $('#more'); if (m) m.textContent = hidden ? '+ ' + hidden + ' more' : '';
  }

  function renderStudy() {
    var today = D.todayKey(Date.now()), p = D.parts(Date.now()), hm = pad(p.hh) + ':' + pad(p.mm), ag = agenda(60), cl = ag.items.filter(function (x) { return x.kind === 'class'; });
    var tc = cl.filter(function (x) { return x.date === today; }), h = '<div class="sech">Today\'s classes</div>';
    tc.forEach(function (x) {
      var cls = x.end && hm >= x.end ? ' past' : hm >= x.time && x.end && hm < x.end ? ' now' : '';
      h += '<div class="cls' + cls + '"><span class="t">' + x.time + '</span><span class="n">' + esc(x.title) + '</span></div>';
    });
    if (!tc.length) {
      var nx = cl.filter(function (x) { return x.date > today; })[0];
      h += '<div class="empty">' + (nx ? 'No classes today. Next: ' + esc(D.dayLabel(nx.date)) + ' ' + nx.time + ' ' + esc(nx.title) : 'No classes today. Add a timetable on the Calendar page of Study OS.') + '</div>';
    }
    $('#clsBox').innerHTML = h;
    var ex = ag.items.filter(function (x) { return x.kind === 'exam'; }).slice(0, 3), c = '<div class="sech">Countdown</div>';
    ex.forEach(function (x) {
      var n = D.diffDays(today, x.date);
      c += '<div class="cd"><div class="d">' + (n === 0 ? 'Today' : n) + '<small>' + (n === 0 ? '' : n === 1 ? 'day' : 'days') + '</small></div><div class="n">' + esc(x.title) + '<small>' + esc(D.dayLabel(x.date)) + '</small></div></div>';
    });
    if (!ex.length) c += '<div class="empty">No exams scheduled.</div>';
    var open = ag.tasks.filter(function (t) { return t && !t.done; }), late = open.filter(function (t) { return D.valid(t.date) && t.date < today; }).length;
    c += '<div class="stat"><b>' + open.length + '</b><span>open tasks' + (late ? ' · <b style="font-size:inherit;color:var(--red)">' + late + ' late</b>' : '') + '</span></div>';
    $('#cdBox').innerHTML = c;
  }

  function renderWeather() {
    var w = wxData();
    if (!w) { $('#wxMain').innerHTML = '<div class="empty">Weather has not loaded yet. Tap Update when online.</div>'; $('#catBox').innerHTML = cat('sun'); $('#fc').innerHTML = ''; return; }
    var c = w.current, d = w.daily, info = D.wmo(c.weather_code, c.is_day), rain = d.precipitation_probability_max[0], pm = homePm();
    $('#wxMain').innerHTML = '<div id="wxBig">' + ic(info.icon) + '<div id="wxTemp" class="num">' + Math.round(c.temperature_2m) + '°</div></div>' +
      '<div id="wxDesc">' + esc(info.label) + ' · Rain ' + Math.round(rain) + '%</div>' +
      '<div id="wxHL">High ' + Math.round(d.temperature_2m_max[0]) + '° · Low ' + Math.round(d.temperature_2m_min[0]) + '°</div>' +
      '<div id="wxIn">Feels ' + Math.round(c.apparent_temperature) + '° · Humidity ' + Math.round(c.relative_humidity_2m) + '%</div>';
    var cl = D.catLine({ pm: pm && pm.value, rain: rain, temp: c.temperature_2m, code: c.weather_code, isDay: c.is_day });
    $('#catBox').innerHTML = cat(cl.mood) + '<div id="bubble">' + esc(cl.text) + '</div>';
    var f = '';
    for (var i = 1; i <= 3 && i < d.time.length; i++) {
      var wi = D.wmo(d.weather_code[i], 1);
      f += '<div class="fcd"><div class="dn">' + D.DOW[D.dowOf(d.time[i])] + '</div>' + ic(wi.icon) + '<div>' + Math.round(d.temperature_2m_max[i]) + '°/' + Math.round(d.temperature_2m_min[i]) + '°</div><div>Rain ' + Math.round(d.precipitation_probability_max[i]) + '%</div></div>';
    }
    $('#fc').innerHTML = f;
  }

  /* ---------- new pages: tasks, this week, progress ---------- */
  function renderTasks() {
    var today = D.todayKey(Date.now()), tasks = (readHome().tasks || []).filter(function (t) { return t && typeof t.title === 'string' && D.valid(t.date); });
    var open = tasks.filter(function (t) { return !t.done; }), late = open.filter(function (t) { return t.date < today; }).length;
    var rows = tasks.filter(function (t) { return !t.done || recent[t.id]; }).sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0) || a.date.localeCompare(b.date); });
    var h = '<div class="hd">Open tasks · ' + open.length + '</div><div id="tkList">';
    rows.forEach(function (t) {
      var tag = t.done ? '' : t.date < today ? '<span class="tag late">Late</span>' : '<span class="tag">' + esc(t.date === today ? 'Today' : D.DOW[D.dowOf(t.date)] + ' ' + (+t.date.slice(8))) + '</span>';
      h += '<button type="button" class="tk' + (t.done ? ' done' : '') + '" data-id="' + esc(t.id) + '" aria-pressed="' + (t.done ? 'true' : 'false') + '"><i class="bx"></i><span class="n">' + esc(t.title) + '</span>' + tag + '</button>';
    });
    if (!rows.length) h += '<div class="empty">No open tasks. Add them on Today in Study OS.</div>';
    $('#tkBox').innerHTML = h + '</div><div id="tkFoot"><span class="big" style="font-size:calc(var(--u)*8)">' + open.length + '</span><span>to go' + (late ? ' · <b style="color:var(--red)">' + late + ' late</b>' : '') + '</span></div>';
    fitBox($('#tkList'), true);
  }
  function renderWeek() {
    var today = D.todayKey(Date.now()), p = D.parts(Date.now()), hm = pad(p.hh) + ':' + pad(p.mm), cols = D.weekGrid(T.loadSettings(rd(T.SETTINGS_KEY)).timetable, today), h = '';
    var any = cols.some(function (c) { return c.items.length; });
    cols.forEach(function (c) {
      h += '<div><div class="d' + (c.today ? ' today' : '') + '">' + c.label + ' ' + (+c.iso.slice(8)) + '</div>';
      c.items.forEach(function (x) {
        var cls = x.skip ? ' off' : c.today && hm >= x.start && hm < x.end ? ' now' : '';
        h += '<div class="blk' + cls + '"><b>' + x.start + '</b> ' + esc(x.name) + '<small>' + (cls === ' now' ? 'now · ' : '') + x.len + (x.skip ? ' · skipped' : '') + '</small></div>';
      });
      if (!c.items.length) h += '<div class="blk off">Free<small>no class</small></div>';
      h += '</div>';
    });
    $('#wkBox').innerHTML = any ? h : '<div class="empty" style="padding:calc(var(--u)*3)">No timetable yet. Add it on the Calendar page of Study OS.</div>';
  }
  function bars(frac, n) {
    var h = '';
    for (var i = 0; i < n; i++) h += '<b class="' + (frac >= (i + 1) / n ? 'on' : frac > i / n ? 'half' : '') + '"></b>';
    return '<div class="seg" role="img" aria-label="' + Math.round(frac * 100) + ' percent">' + h + '</div>';
  }
  function renderProg() {
    var M = window.StudyMotivation, St = window.StudyStats, W = window.StudyWordNest;
    if (!M || !St) { $('#prBox').innerHTML = '<div class="empty">Progress helpers did not load.</div>'; return; }
    var home = readHome(), now = Date.now(), per = St.answersPerDay(T.COURSES.map(function (c) { return rd('study-' + c.key); }));
    var today = M.dayKey(now), g = M.goal(home.qgoal), done = per[today] || 0, streak = M.goalStreak(per, g, now);
    var week = St.lastDays(now, 7).map(function (d) { return '<b class="' + ((per[d] || 0) >= g ? 'on' : per[d] > 0 ? 'half' : '') + '"></b>'; }).join('');
    var wg = W ? W.read(now) : null, pomo = St.pomoPerDay(rd('studyos.pomolog.v1'))[today] || 0;
    $('#prBox').innerHTML = '<div><div class="hd">Goal streak</div><div class="big" style="font-size:calc(var(--u)*20)">' + streak + '<small> day' + (streak === 1 ? '' : 's') + '</small></div><div class="seg" role="img" aria-label="Last 7 days">' + week + '</div><div class="muted" style="font:700 calc(var(--u)*2.6)/1.3 var(--ui)">Last 7 days · filled = daily goal met</div></div>' +
      '<div><div class="hd">Questions today</div><div class="row2"><span class="big" style="font-size:calc(var(--u)*9)">' + done + '</span><span>/ ' + g + ' goal</span></div>' + bars(Math.min(1, done / g), 4) +
      (wg && wg.started ? '<div class="hd">Words today</div><div class="row2"><span class="big" style="font-size:calc(var(--u)*9)">' + wg.done + '</span><span>/ ' + wg.goal + ' WordNest</span></div>' + bars(Math.min(1, wg.done / wg.goal), 4) : '') +
      '<div class="row2" style="margin-top:auto"><span class="tag">Focus</span><span>' + pomo + ' min today</span></div></div>';
  }

  var ALL = [
    { id: 'home', sec: '#p0', label: 'Home', r: renderHome },
    { id: 'air', sec: '#p1', label: 'Air quality', title: 'Air quality', r: renderAir },
    { id: 'cal', sec: '#p2', label: 'Calendar', r: renderCal },
    { id: 'study', sec: '#p3', label: 'Study', title: 'Study', r: renderStudy },
    { id: 'wx', sec: '#p4', label: 'Weather', title: 'Weather', r: renderWeather },
    { id: 'tasks', sec: '#p5', label: 'Tasks', title: 'Tasks', r: renderTasks },
    { id: 'week', sec: '#p6', label: 'This week', title: 'This week', r: renderWeek },
    { id: 'prog', sec: '#p7', label: 'Progress', title: 'Progress', r: renderProg }
  ];
  function pages() { var l = ALL.filter(function (p) { return S.pages.indexOf(p.id) >= 0; }); return l.length ? l : [ALL[0]]; }
  function cur() { var l = pages(); return l[Math.min(Math.max(page, 0), l.length - 1)]; }

  function paint() {
    var today = D.todayKey(Date.now()), c = cur();
    $('#barTitle').textContent = c.id === 'home' ? D.dayLabel(today) : c.id === 'cal' ? D.monthLabel(view.y, view.m) : c.title;
    var left = c.id === 'cal' ? 'Move' : 'Update';
    if ($('#bLeft').dataset.t !== left) { $('#bLeft').dataset.t = left; $('#bLeft').innerHTML = '<svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4.5"/></svg>' + left; }
    $('#bLeft').setAttribute('aria-label', c.id === 'cal' ? 'Move to the next day' : 'Update weather and air quality');
    c.r();
    $('#stale').textContent = status;
  }
  function show(i) {
    var n = pages().length; page = ((i % n) + n) % n; try { sessionStorage.setItem('studyos.desk.page', String(page)); } catch (e) {}
    var c = cur();
    ALL.forEach(function (p) { $(p.sec).classList.toggle('on', p === c); });
    $('#dots').innerHTML = pages().map(function (p, k) { return '<i' + (k === page ? ' class="on"' : '') + '></i>'; }).join('');
    paint(); armAuto();
  }
  function armAuto() { clearInterval(autoTimer); if (S.auto) autoTimer = setInterval(function () { if (!document.querySelector('dialog[open]')) show(page + 1); }, S.auto * 1000); }

  /* ---------- events ---------- */
  function openEv(ev) {
    editing = ev || null;
    $('#evTitle').textContent = ev ? 'Edit event' : 'New event';
    $('#evName').value = ev ? ev.title : ''; $('#evDate').value = ev ? ev.date : sel; $('#evTime').value = ev ? ev.time : '';
    $('#evDel').hidden = !ev; $('#evDlg').showModal();
  }
  $('#evForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var o = { id: editing ? editing.id : D.newId(Date.now(), Math.random()), title: $('#evName').value, date: $('#evDate').value, time: $('#evTime').value };
    if (!D.eventOk(o)) return;
    o.title = o.title.trim().slice(0, 80);
    S.events = S.events.filter(function (x) { return x.id !== o.id; });
    if (S.events.length >= 300) return;
    S.events.push(o); saveState(); sel = o.date; var m = /^(\d{4})-(\d{2})/.exec(o.date); view = { y: +m[1], m: +m[2] };
    $('#evDlg').close(); paint();
  });
  $('#evCancel').onclick = function () { $('#evDlg').close(); };
  $('#evDel').onclick = function () {
    if (!editing || !confirm('Delete "' + editing.title + '"?')) return;
    S.events = S.events.filter(function (x) { return x.id !== editing.id; }); saveState(); $('#evDlg').close(); paint();
  };

  /* ---------- settings ---------- */
  var searchT = null;
  function geocode(q, into, pick) {
    clearTimeout(searchT);
    if (q.trim().length < 2) { into.innerHTML = ''; return; }
    searchT = setTimeout(function () {
      getJSON('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q.trim()) + '&count=6&language=en&format=json').then(function (r) {
        var res = (r.results || []).filter(function (x) { return Number.isFinite(x.latitude) && Number.isFinite(x.longitude); });
        into.innerHTML = res.length ? res.map(function (x, i) { return '<li><button type="button" data-i="' + i + '">' + esc(x.name + (x.admin1 ? ', ' + x.admin1 : '') + (x.country_code ? ' (' + x.country_code + ')' : '')) + '</button></li>'; }).join('') : '<li class="hint" style="font:500 13px var(--ui);color:var(--muted)">No match</li>';
        into.onclick = function (e) { var b = e.target.closest('button[data-i]'); if (!b) return; var x = res[+b.dataset.i]; pick({ name: String(x.name).slice(0, 40), lat: x.latitude, lon: x.longitude }); into.innerHTML = ''; };
      }, function () { into.innerHTML = '<li class="hint" style="font:500 13px var(--ui);color:var(--muted)">Search needs an internet connection.</li>'; });
    }, 350);
  }
  function paintSettings() {
    $('#cityNow').textContent = S.city.name;
    $('#aqEdit').innerHTML = S.aq.map(function (c, i) { return '<li><span>' + esc(c.name) + '</span><button type="button" data-rm="' + i + '" aria-label="Remove ' + esc(c.name) + '">✕</button></li>'; }).join('');
    $('#autoSel').value = String(S.auto); $('#awake').checked = S.awake;
    $('#pgSel').innerHTML = ALL.map(function (p) { return '<label class="chk"><input type="checkbox" data-pg="' + p.id + '"' + (S.pages.indexOf(p.id) >= 0 ? ' checked' : '') + '> ' + esc(p.label) + '</label>'; }).join('');
  }
  $('#gear').onclick = function () { paintSettings(); $('#citySearch').value = ''; $('#aqSearch').value = ''; $('#cityRes').innerHTML = ''; $('#aqRes').innerHTML = ''; $('#setDlg').showModal(); };
  $('#citySearch').addEventListener('input', function () { geocode(this.value, $('#cityRes'), function (c) { S.city = c; saveState(); paintSettings(); $('#citySearch').value = ''; refresh(true); }); });
  $('#aqSearch').addEventListener('input', function () { geocode(this.value, $('#aqRes'), function (c) { if (S.aq.length < 12) { S.aq.push(c); saveState(); paintSettings(); $('#aqSearch').value = ''; refresh(true); } }); });
  $('#aqEdit').addEventListener('click', function (e) { var b = e.target.closest('button[data-rm]'); if (!b) return; S.aq.splice(+b.dataset.rm, 1); saveState(); paintSettings(); refresh(true); });
  $('#pgSel').addEventListener('change', function (e) {
    var id = e.target.dataset && e.target.dataset.pg; if (!id) return;
    var next = ALL.filter(function (p) { return p.id === id ? e.target.checked : S.pages.indexOf(p.id) >= 0; }).map(function (p) { return p.id; });
    if (!next.length) { e.target.checked = true; return; }
    var keep = cur().id; S.pages = next; saveState(); var k = pages().map(function (p) { return p.id; }).indexOf(keep);
    page = k >= 0 ? k : 0; show(page);
  });
  $('#autoSel').onchange = function () { S.auto = +this.value; saveState(); armAuto(); };
  $('#awake').onchange = function () { S.awake = this.checked; saveState(); if (S.awake) wake(); else if (wl) { wl.release().catch(function () {}); wl = null; } };
  $('#setForm').addEventListener('submit', function (e) { e.preventDefault(); $('#setDlg').close(); paint(); });
  $('#syncBtn').hidden = !(window.StudyCloud && typeof window.StudyCloud.open === 'function');
  $('#syncBtn').onclick = function () { $('#setDlg').close(); window.StudyCloud.open(); };
  (function () { var b = $('#studyThemeBtn'), L = function () { b.textContent = 'Theme: ' + (window.StudyTheme ? window.StudyTheme.LABEL[window.StudyTheme.mode()] : 'auto'); }; if (window.StudyTheme) { L(); b.onclick = function () { window.StudyTheme.cycle(); L(); }; } else b.hidden = true; })();
  $('#fsBtn').hidden = !document.documentElement.requestFullscreen;
  $('#fsBtn').onclick = function () { $('#setDlg').close(); document.documentElement.requestFullscreen().catch(function () {}); };

  /* ---------- screen on, controls ---------- */
  function wake() {
    try { if (S.awake && 'wakeLock' in navigator && document.visibilityState === 'visible' && !wl) navigator.wakeLock.request('screen').then(function (l) { wl = l; l.addEventListener('release', function () { wl = null; }); }, function () { wl = null; }); } catch (e) { wl = null; }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { wake(); refresh(false); paint(); } });
  document.addEventListener('pointerdown', function () { wake(); }, { once: true });
  window.addEventListener('touchstart', function () { document.body.classList.add('touch'); }, { once: true, passive: true });

  function moveDay() {
    sel = D.addDays(sel, 1); var m = /^(\d{4})-(\d{2})/.exec(sel); view = { y: +m[1], m: +m[2] }; paint();
  }
  $('#bLeft').onclick = function () { if (cur().id === 'cal') moveDay(); else refresh(true); armAuto(); };
  $('#bNext').onclick = function () { show(page + 1); };
  $('#grid').addEventListener('click', function (e) { var b = e.target.closest('.cell'); if (!b) return; sel = b.dataset.d; paint(); armAuto(); });
  $('#agBox').addEventListener('click', function (e) {
    if (e.target.closest('#addEv')) { openEv(null); return; }
    var b = e.target.closest('[data-ev]'); if (!b) return;
    var ev = S.events.filter(function (x) { return x.id === b.dataset.ev; })[0]; if (ev) openEv(ev);
  });
  $('#tkBox').addEventListener('click', function (e) {
    var b = e.target.closest('.tk'); if (!b) return;
    var done = b.getAttribute('aria-pressed') !== 'true'; recent[b.dataset.id] = true; tickTask(b.dataset.id, done); paint();
  });
  var tx = null, ty = null;
  $('#frame').addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  $('#frame').addEventListener('touchend', function (e) {
    if (tx === null) return; var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) show(page + (dx < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener('keydown', function (e) {
    if (document.querySelector('dialog[open]') || /INPUT|SELECT|TEXTAREA/.test((e.target.tagName || ''))) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); show(page + 1); }
    else if (e.key === 'ArrowLeft') show(page - 1);
    else if (e.key === 'u' || e.key === 'U') refresh(true);
    else if (/^[1-8]$/.test(e.key) && +e.key <= pages().length) show(+e.key - 1);
  });
  window.addEventListener('resize', function () { var id = cur().id; if (id === 'cal') fit(); if (id === 'home') fitBox($('#upBox')); if (id === 'tasks') fitBox($('#tkList'), true); });
  window.addEventListener('storage', function () { S = D.normalizeState(rd(D.KEY)); paint(); });
  window.addEventListener('studycloud:applied', paint);
  window.addEventListener('online', function () { refresh(true); });

  /* ---------- clock ---------- */
  function tick() {
    var p = D.parts(Date.now()), m = pad(p.hh) + ':' + pad(p.mm), day = D.todayKey(Date.now());
    if (m !== lastMin) { lastMin = m; var t = $('#time'); if (t) t.textContent = m; if (day !== lastDay) { lastDay = day; if (sel < day) { sel = day; } } if (!document.querySelector('dialog[open]')) paint(); }
  }
  setInterval(tick, 1000);
  setInterval(function () { refresh(false); }, 15 * 60000);

  show(page); lastDay = D.todayKey(Date.now()); lastMin = D.clock(Date.now());
  setStatus(cache.at ? 'Data from ' + D.clock(cache.at) : '');
  refresh(true);
})();
