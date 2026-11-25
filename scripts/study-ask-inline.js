/* Ask AI under a practice question (owner, 24 Nov 2026), so the "screenshot → Gemini → write a note" loop stays on the page.
   Uses the AI tutor's own settings and key (studyos.tutor.v1 / sessionStorage studyos.tutor.key, scripts/study-tutor.js);
   nothing is sent until the student taps Ask. Answers are kept in memory for this visit only.
   "Save to note" appends the answer to the chapter note in studyos.notes.v1 ("<course>:<chapter>"), keeping the note's
   pictures (imgs); the open Notes panel is flushed first and reloaded after, so nothing it holds is lost.
   Pure helpers (prompt, appendNote) work without a DOM so they can be tested. */
(function (root) {
  'use strict';
  var NOTES = 'studyos.notes.v1', MAXNOTE = 20000, MAXFOLLOW = 6;
  function clip(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }
  /* the first message for one question; q = {q, opts, right, exp, prompt}, mine = chosen option index or undefined */
  function prompt(q, mine, chapter) {
    var L = 'ABCDEFGH', opts = Array.isArray(q.opts) ? q.opts : [], t = '';
    if (chapter) t += 'Chapter: ' + clip(chapter, 80) + '\n';
    if (q.prompt) t += 'Case:\n' + clip(q.prompt, 4000) + '\n';
    t += 'Question: ' + clip(q.q, 3000) + '\n';
    opts.forEach(function (o, i) { t += L[i] + ') ' + clip(o, 600) + '\n'; });
    if (mine !== undefined && mine !== null && opts.length) {
      t += '\nMy answer: ' + L[mine] + '. Correct answer: ' + L[q.right] + '.\n';
      if (q.exp) t += 'Book explanation: ' + clip(q.exp, 1500) + '\n';
      t += '\nExplain in Thai, step by step, why the correct answer is right. Do not explain why the other options (or my answer) are wrong. Show the numbers and any journal entry as a table. End with one short line I can memorise.';
    } else {
      t += '\nSolve it in Thai, step by step. Explain only why the correct option is right, not why the others are wrong. Show the numbers and any journal entry as a table, then give the answer letter. End with one short line I can memorise.';
    }
    return t;
  }
  /* returns the new notes object (or null when the note would be too long) */
  function appendNote(notes, key, title, answer, nowIso) {
    var all = notes && typeof notes === 'object' && !Array.isArray(notes) ? Object.assign({}, notes) : {};
    var old = all[key] && typeof all[key] === 'object' ? all[key] : {};
    var text = typeof old.text === 'string' ? old.text : '';
    var add = '### ' + clip(String(title).replace(/\s+/g, ' ').trim(), 140) + '\n' + String(answer).trim() + '\n';
    var next = text.trim() ? text.replace(/\s+$/, '') + '\n\n' + add : add;
    if (next.length > MAXNOTE) return null;
    var n = { text: next, updated: nowIso };
    if (Array.isArray(old.imgs) && old.imgs.length) n.imgs = old.imgs.slice();
    all[key] = n;
    return all;
  }
  var api = { prompt: prompt, appendNote: appendNote, NOTES: NOTES };
  if (typeof document === 'undefined') { if (typeof module !== 'undefined' && module.exports) module.exports = api; return; }

  /* ---------- UI ---------- */
  var mem = {}; /* question id → {chat:[], busy, err} */
  var CSS = '.aib{margin:12px 0;border:2px solid var(--line,currentColor);border-radius:12px;padding:10px 12px}'
    + '.aib .aib-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.aib .btn{min-height:44px}'
    + '.aib .aib-s{font-size:13px;opacity:.8}.aib .aib-s.err{color:var(--red,#c21f2f);opacity:1}'
    + '.aib .aib-a{margin:8px 0;line-height:1.6;overflow-wrap:anywhere}.aib .aib-a table{display:block;overflow-x:auto}'
    + '.aib .aib-u{margin:8px 0 0;font-weight:700}.aib textarea{width:100%;min-height:44px;font:inherit;padding:8px;border-radius:10px;border:2px solid var(--line,currentColor);background:transparent;color:inherit}';
  function css() { if (document.getElementById('aibCss')) return; var s = document.createElement('style'); s.id = 'aibCss'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cfg() {
    var T = root.StudyTutor; if (!T) return null;
    var raw = {}; try { raw = JSON.parse(localStorage.getItem(T.KEY) || '{}') || {}; } catch (e) {}
    var c = T.normalize(raw);
    if (!c[c.provider].key) { try { var k = sessionStorage.getItem(T.SKEY); if (k) c[c.provider].key = k; } catch (e) {} }
    return c;
  }
  function md(t) { return root.StudySosMd ? root.StudySosMd(t) : '<p>' + esc(t).replace(/\n/g, '<br>') + '</p>'; }

  /* ctx = {id, course, courseName, chapterId, chapter, q, mine} */
  function mount(host, ctx) {
    css(); host.className = 'aib';
    var st = mem[ctx.id] || (mem[ctx.id] = { chat: [], busy: false, err: '' , saved: false });
    function paint() {
      var c = cfg(), ready = !!(c && c[c.provider].key), h = '';
      st.chat.forEach(function (m, i) {
        if (m.role === 'user') { if (i > 0) h += '<p class="aib-u">' + esc(m.show || m.text) + '</p>'; }
        else h += '<div class="aib-a sos-body">' + md(m.text) + '</div>';
      });
      if (!ready) h += '<div class="aib-row"><span class="aib-s">Add your Gemini key in AI tutor → Settings first.</span><a class="btn" href="tutor.html">Open AI tutor</a></div>';
      else if (!st.chat.length) h += '<div class="aib-row"><button class="btn primary" type="button" data-a="ask"' + (st.busy ? ' disabled' : '') + '>' + (ctx.mine === undefined ? 'Solve it step by step' : 'Explain this question') + '</button><span class="aib-s' + (st.err ? ' err' : '') + '">' + esc(st.busy ? 'Thinking…' : st.err || 'Sends this question to your AI.') + '</span></div>';
      else {
        h += '<div class="aib-row"><button class="btn primary" type="button" data-a="save"' + (st.saved ? ' disabled' : '') + '>' + (st.saved ? 'Saved to note ✓' : 'Save to note') + '</button>'
          + '<span class="aib-s' + (st.err ? ' err' : '') + '">' + esc(st.busy ? 'Thinking…' : st.err || ('Note: ' + (ctx.chapter || ctx.chapterId))) + '</span></div>';
        if (st.chat.filter(function (m) { return m.role === 'user'; }).length < MAXFOLLOW)
          h += '<form class="aib-row" data-a="more" style="margin-top:8px"><textarea rows="1" maxlength="1000" placeholder="Ask more about this question…"' + (st.busy ? ' disabled' : '') + '></textarea><button class="btn" type="submit"' + (st.busy ? ' disabled' : '') + '>Ask</button></form>';
      }
      host.innerHTML = h;
      var a = host.querySelector('[data-a=ask]'); if (a) a.onclick = function () { send(prompt(ctx.q, ctx.mine, ctx.chapter)); };
      var s = host.querySelector('[data-a=save]'); if (s) s.onclick = save;
      var f = host.querySelector('[data-a=more]'); if (f) f.onsubmit = function (e) { e.preventDefault(); var t = f.querySelector('textarea').value.trim(); if (t) send(t, t); };
    }
    function send(text, show) {
      var T = root.StudyTutor, c = cfg(); if (!T || !c || st.busy) return;
      st.chat.push({ role: 'user', text: text, show: show }); st.busy = true; st.err = ''; st.saved = false; paint();
      var sys = T.system({ course: ctx.courseName, chapter: ctx.chapter });
      var r; try { r = T.request(c, sys, st.chat); } catch (e) { st.chat.pop(); st.busy = false; st.err = e.message; paint(); return; }
      var ctl = typeof AbortController === 'function' ? new AbortController() : null, tm = setTimeout(function () { if (ctl) ctl.abort(); }, 120000);
      if (ctl) r.init.signal = ctl.signal;
      fetch(r.url, r.init).then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return T.reply(c.provider, res.status, j); }); })
        .then(function (t) { st.chat.push({ role: 'assistant', text: t }); })
        .catch(function (e) { st.chat.pop(); st.err = e && e.name === 'AbortError' ? 'No answer after 2 minutes.' : (e && /fetch|network|load failed/i.test(e.message || '') ? 'Could not reach the AI service (offline?).' : String(e && e.message || e)); })
        .then(function () { clearTimeout(tm); st.busy = false; if (host.isConnected) paint(); });
    }
    function save() {
      var answers = st.chat.filter(function (m) { return m.role === 'assistant'; }).map(function (m) { return m.text; });
      if (!answers.length) return;
      try { document.dispatchEvent(new CustomEvent('studyos:notes-flush')); } catch (e) {}
      var notes = {}; try { notes = JSON.parse(localStorage.getItem(NOTES) || '{}') || {}; } catch (e) {}
      var next = appendNote(notes, ctx.course + ':' + ctx.chapterId, ctx.q.q, answers.join('\n\n'), new Date().toISOString());
      if (!next) { st.err = 'This chapter note is full (20,000 characters).'; paint(); return; }
      try { localStorage.setItem(NOTES, JSON.stringify(next)); } catch (e) { st.err = 'Not saved: storage is full.'; paint(); return; }
      if (root.StudyCloud && root.StudyCloud.dirty) root.StudyCloud.dirty();
      try { document.dispatchEvent(new CustomEvent('studyos:notes-changed')); } catch (e) {}
      st.saved = true; st.err = ''; paint();
    }
    paint();
  }
  var open = false;
  api.mount = mount; api.isOpen = function () { return open; }; api.setOpen = function (v) { open = !!v; };
  api.has = function (id) { return !!(mem[id] && mem[id].chat.length); };
  root.StudyAskInline = api;
})(typeof window !== 'undefined' ? window : globalThis);
