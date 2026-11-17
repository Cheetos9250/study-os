# TASKS.md — work queue for AI agents

The owner starts a new Claude Code session and says, for example, **"ทำข้อ 3 ใน TASKS.md"** ("do task 3 in TASKS.md").
That means: do the task with that number below.

## How to work a task

1. Read `AGENTS.md` first and follow every rule in it (personal data, backup keys, new test files, changelog fragments, screenshots, asking before Worker deploys or `data/config.json` changes, no secrets in chat).
2. Before starting, check open PRs. If another open PR touches the same files, add to that PR instead of opening a second one.
3. Do the task in one branch and one PR. Merge it only when every CI check passes, then check the `main` CI and the Pages deploy.
4. In the same PR, change your task's status from `todo` to `done (#PR)`. Edit only your own task's status line, so that parallel PRs do not conflict.
5. Reply to the owner in short, plain Thai: what changed, where to find it on the site, and anything they must do.

Status values: `todo`, `needs owner` (blocked on an owner decision), `done (#PR)`.

---

## A. Study content (exams close by)

### 1. Economics: fiscal policy, monetary policy, growth (Thai: เพิ่มบทเศรษฐศาสตร์ที่ยังไม่มี)

Status: todo

`eco.html` has no chapters on fiscal policy, monetary policy or growth & development. All three are in the final on 27 Nov (see Open items in `AGENTS.md`). For each chapter, add:
- a summary;
- flashcards;
- 20 or more MCQs.

Write all of it yourself; never copy textbook or test-bank text. Use new ids and never renumber existing ones.

### 2. Excel: practice data file (Thai: ไฟล์ฝึกทำ dashboard)

Status: todo

On `excel.html`, add a **Download practice data** button that produces an .xlsx file built in the browser. The file has two sheets:
- `Categories`: Subcategory, Category, Category Type.
- `Transactions`: about three months of invented bank rows with the headers the steps use.

Add a second practice set built on accounting data, for example a trial balance after adjusting entries to report on Asset and Expense. The teacher said the final may use data like that. Do not call the network at runtime. A vendored library under `scripts/` is fine if it is small, or write the XML yourself.

### 3. Accounting: timed mock final (Thai: ข้อสอบเสมือนจริงจับเวลา)

Status: todo

Add a **Mock final** mode to `acc.html`:
- draws questions from Ch5–9 in proportion to the size of each chapter;
- has a 3-hour timer that survives a page reload;
- ends with a score per chapter and a list of wrong answers that link to the questions.

Prefer the existing `study-acc` store. A new key must follow the backup and restore rules.

### 4. Math: written calculation practice (Thai: โจทย์คณิตแบบเขียนตอบ)

Status: todo

`math.html` already has 62 MCQs for Ch5–7 (`scripts/math-practice-mcq.js`). Add 10 written calculation problems per chapter (financial maths). Each problem gets a worked solution and number-check boxes, the same way `acc.html` shows written exercises (`StudySosChecks` in `scripts/textbook-sos-render.js`).

---

## B. Data safety and sync

### 5. Weekly backup prompt (Thai: Back up อัตโนมัติ)

Status: todo

Today already has a backup reminder (`studyos.backup-meta.v1`). Make it stronger:
- once a week, offer a one-tap backup that downloads the JSON or opens the iPad share sheet (`navigator.share` with a file, falling back to a download);
- show which data is not covered by cloud sync and when it was last backed up.

`progress-backup.html` must stay read-only (CI checks this).

### 6. Sync Excel and PDF sets across devices (Thai: ซิงก์หน้า Excel และ My PDF sets)

Status: todo (needs owner approval to deploy)

Add `studyos.excel.v1` and `studyos.pdfsets.v1` to cloud sync, using the `home` subject or a new subject with size guards. PDF files stay on the device; sync only the JSON. This needs a Worker change:
1. Prepare the code and tests.
2. Ask the owner before running the deploy workflow.
3. Until the Worker is deployed, the client must keep working while the server answers 404.

---

## C. Everyday use on iPad

### 7. Works offline (Thai: เปิดได้แม้ไม่มีเน็ต)

Status: todo

Add a service worker that caches the core pages, `scripts/`, `assets/` and `data/*.json`, so the site opens offline and as a home-screen app.
- It must never touch localStorage or IndexedDB data.
- A new deploy must take over on the next visit (versioned cache, then skipWaiting/claim).
- Do not cache `data/config.json` API responses or any cross-origin calls.

### 8. Site-wide search (Thai: ค้นหารวมทั้งเว็บ)

Status: todo

Add a search box to the nav (`scripts/study-nav.js`). It searches flashcards, summaries, quiz questions, lesson notes and textbook exercise titles. Tapping a result opens the page at that item (for example with `?q=` on course pages, which already exists in `acc.html`). Load the search data lazily.

### 9. "Continue where I left off" on Today (Thai: ปุ่มเรียนต่อจากล่าสุด)

Status: todo

On Today, add a **Continue** card that opens the last page and question the owner worked on, plus a large countdown to the next exam. Store the last place in sessionStorage or an existing key. A new localStorage key must follow the backup rules.

---

## D. Progress and grades

### 10. Stats page (Thai: หน้าสถิติ)

Status: todo

Add a **Stats** page linked from the nav footer. It shows:
- Pomodoro minutes per day;
- questions answered and % correct, per subject and chapter;
- the current streak;
- a 30-day chart.

Use only data that already exists (quiz `ans`/`ats`, review `rv`, plan ticks). If Pomodoro history is not stored yet, add it under an existing key or follow the backup rules for a new key.

### 11. Grades linked to practice (Thai: เกรดกับคะแนนฝึก)

Status: todo

On `grades.html`, next to each course, show:
- the final score needed for each target letter (the maths exists in `scripts/study-grades.js`);
- a link to the weakest chapter for that course on the practice pages.

---

## E. Housekeeping

### 12. Audit speed, accessibility and tests (Thai: ตรวจความเร็วและโค้ด)

Status: todo

Audit the repo:
- load time on iPad (`acc.html` embeds very large data);
- accessibility (labels, contrast, focus, 44 px touch targets);
- duplicate code;
- slow tests.

Fix one topic per PR. Never change storage formats.

### 13. Close stale PRs (Thai: เก็บกวาด PR)

Status: needs owner

- PR #102 (progress Worker deploy workflow) is already on `main`. Close it after confirming with the owner.
- PR #68 (79 worked textbook answers) is waiting for the owner to decide whether to release or close it.
