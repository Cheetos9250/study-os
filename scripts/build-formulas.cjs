/* Builds data/formulas.json: every formula that is already written in the course data
   (data/courses/acc|eco|math.js: summary tables and flashcards). Nothing is invented; each entry keeps its source.
   Run: node scripts/build-formulas.cjs   (tests/formulas.test.cjs checks the file is up to date and every text is in the data) */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const COURSES = [['acc', 'Accounting'], ['eco', 'Economics'], ['math', 'Math for Life']];
const OPS = /[=÷×]|\/|\^|Σ|√/;
const ASK = /สูตร|formula|equation|สมการ|คำนวณ|calculate/i;
const BAD_HEAD = /ตัวอย่าง|สหรัฐฯ|Exhibit|เปรียบเทียบ|Keynesian|Service vs|Special Journals|Petty Cash|Bank Reconciliation|Inventory Systems|Valuing|Disposing/i;
const BAD_LABEL = /ตัวอย่าง|^\d{4}$|^ปีฐาน|Exhibit|^คำนวณ$|^อ่านผล|^Note$|Golden|Replenish|Making Payments|Types of Transactions|COGS Recording|Subsidiary|Full employment|^สาเหตุ|^รูปทรง|^ราคา|^แก้ถดถอย|^AD เพิ่ม|Growth vs|^Exhibit|CPI vs/i;
const BAD_FORMULA = /^(ค่ารักษา|Demand-pull|Spending multiplier = 4|รายจ่ายของครัวเรือน|รายได้ของครัวเรือน)/; /* worked examples / descriptions that only contain '=' */
const clean = s => String(s).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
const SLIDES = JSON.parse(fs.readFileSync(path.join(root, 'data/formulas-slides.json'), 'utf8'));
const out = { generated: 'node scripts/build-formulas.cjs', courses: {} };
for (const [c, name] of COURSES) {
  const D = new Function(fs.readFileSync(path.join(root, 'data/courses', c + '.js'), 'utf8') + ';return D;')();
  const cat = Object.fromEntries(D.cats);
  const list = [], seen = new Set();
  const add = e => { if (BAD_FORMULA.test(e.formula)) return; const k = e.formula.toLowerCase().replace(/[\s()*]/g, ''); if (seen.has(k)) return; seen.add(k); list.push(e); };
  D.cards.forEach(x => {
    const [ch, q, a, src, id] = x;
    if (!ASK.test(q) || !/[=÷×]/.test(a)) return;
    const lines = clean(a.replace(/\n/g, ' ⏎ ')).split(' ⏎ ');
    add({ ch, title: clean(q).replace(/\s*(คำนวณอย่างไร|คืออะไร)?\s*\??$/, '').replace(/^สูตร\s*/, '') || clean(q), formula: lines.join('\n'), src: /slide/i.test(src || '') ? 'slide' : 'card', ref: src || '', id });
  });
  D.sum.forEach(s => {
    if (BAD_HEAD.test(s.h)) return;
    s.rows.forEach(r => {
      const label = clean(r[0]), f = clean(r[1] || '');
      if (BAD_LABEL.test(label) || f.startsWith('•') || f.length > 170 || !OPS.test(f) || !/[=÷×]/.test(f)) return;
      add({ ch: s.cat, title: label, formula: f, src: 'sum', ref: s.h });
    });
    if (s.tip && /^[^,;]{0,40}=[^;]*$/.test(s.tip) && !/\d/.test(s.tip.split('=')[0])) add({ ch: s.cat, title: 'Tip', formula: clean(s.tip), src: 'sum', ref: s.h });
  });
  const order = D.cats.map(x => x[0]);
  /* formulas typed from the teacher's slide PDFs (data/formulas-slides.json) go first in their chapter */
  const extra = (SLIDES[c] || []).map(e => ({ ch: e.ch, title: e.title, formula: e.formula, src: 'slide', ref: e.ref }));
  extra.forEach(e => { if (!order.includes(e.ch)) throw new Error('bad chapter ' + e.ch); });
  list.unshift(...extra);
  list.sort((a, b) => order.indexOf(a.ch) - order.indexOf(b.ch));
  out.courses[c] = { name, cats: D.cats, items: list };
}
fs.writeFileSync(path.join(root, 'data/formulas.json'), JSON.stringify(out, null, 1) + '\n');
for (const c in out.courses) console.log(c, out.courses[c].items.length);
