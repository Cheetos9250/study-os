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

Status: done (#148)

Today already has a backup reminder (`studyos.backup-meta.v1`). Make it stronger:
- once a week, offer a one-tap backup that downloads the JSON or opens the iPad share sheet (`navigator.share` with a file, falling back to a download);
- show which data is not covered by cloud sync and when it was last backed up.

`progress-backup.html` must stay read-only (CI checks this).

### 6. Sync Excel and PDF sets across devices (Thai: ซิงก์หน้า Excel และ My PDF sets)

Status: done (#157; Worker redeployed by the owner on 17 Nov 2026)

Add `studyos.excel.v1` and `studyos.pdfsets.v1` to cloud sync, using the `home` subject or a new subject with size guards. PDF files stay on the device; sync only the JSON. This needs a Worker change:
1. Prepare the code and tests.
2. Ask the owner before running the deploy workflow.
3. Until the Worker is deployed, the client must keep working while the server answers 404.

---

## C. Everyday use on iPad

### 7. Works offline (Thai: เปิดได้แม้ไม่มีเน็ต)

Status: done (#149)

Add a service worker that caches the core pages, `scripts/`, `assets/` and `data/*.json`, so the site opens offline and as a home-screen app.
- It must never touch localStorage or IndexedDB data.
- A new deploy must take over on the next visit (versioned cache, then skipWaiting/claim).
- Do not cache `data/config.json` API responses or any cross-origin calls.

### 8. Site-wide search (Thai: ค้นหารวมทั้งเว็บ)

Status: done (#156)

Add a search box to the nav (`scripts/study-nav.js`). It searches flashcards, summaries, quiz questions, lesson notes and textbook exercise titles. Tapping a result opens the page at that item (for example with `?q=` on course pages, which already exists in `acc.html`). Load the search data lazily.

### 9. "Continue where I left off" on Today (Thai: ปุ่มเรียนต่อจากล่าสุด)

Status: done (#151)

On Today, add a **Continue** card that opens the last page and question the owner worked on, plus a large countdown to the next exam. Store the last place in sessionStorage or an existing key. A new localStorage key must follow the backup rules.

---

## D. Progress and grades

### 10. Stats page (Thai: หน้าสถิติ)

Status: done (#155)

Add a **Stats** page linked from the nav footer. It shows:
- Pomodoro minutes per day;
- questions answered and % correct, per subject and chapter;
- the current streak;
- a 30-day chart.

Use only data that already exists (quiz `ans`/`ats`, review `rv`, plan ticks). If Pomodoro history is not stored yet, add it under an existing key or follow the backup rules for a new key.

### 11. Grades linked to practice (Thai: เกรดกับคะแนนฝึก)

Status: done (#152)

On `grades.html`, next to each course, show:
- the final score needed for each target letter (the maths exists in `scripts/study-grades.js`);
- a link to the weakest chapter for that course on the practice pages.

---

## E. Housekeeping

### 12. Audit speed, accessibility and tests (Thai: ตรวจความเร็วและโค้ด)

Status: done (#158; report in docs/audit-2026-11-17.md, accessibility fixed; course-engine refactor suggested)

Audit the repo:
- load time on iPad (`acc.html` embeds very large data);
- accessibility (labels, contrast, focus, 44 px touch targets);
- duplicate code;
- slow tests.

Fix one topic per PR. Never change storage formats.

### 13. Close stale PRs (Thai: เก็บกวาด PR)

Status: needs owner (#102 closed 17 Nov 2026 at the owner's request; #68 still waits for the owner)

- PR #102 (progress Worker deploy workflow) is already on `main`. Close it after confirming with the owner.
- PR #68 (79 worked textbook answers) is waiting for the owner to decide whether to release or close it.

---

## F. Owner wishlist, 18 Nov 2026 (Thai: รายการที่อยากได้)

The owner asked for these in three rounds. Round 1 helps the finals (Accounting 26 Nov, Economics 27 Nov); do it first.

### Round 1 · before the exams

### 14. Cram Mode (Thai: โหมดอัดก่อนสอบ)

Status: done (#171)

One page per subject for the last 24 hours before an exam: the questions answered wrong (and low review boxes), each with its right answer and explanation, plus the pinned formulas and the note cards (task 16). Read-only; never changes answers.

### 15. Pinned formulas (Thai: ปักหมุดสูตร)

Status: done (#171)

Pin formulas and journal-entry rules per subject, shown at the top of Practice and on Cram Mode. Store them in the backed-up, synced notes (`studyos.notes.v1`, key `<course>:pins`); no new storage key.

### 16. Note cards from `question :: answer` (Thai: โน้ตเป็นบัตรคำ)

Status: done (#171)

Lines written as `question :: answer` in the chapter notes become flip cards inside the Notes panel and on Cram Mode. Notes are not changed.

### 17. Calculator tape (Thai: เครื่องคิดเลขมีประวัติ)

Status: done (#171)

The floating calculator keeps a history of calculations (tap one to reuse the result). Device-only convenience; not backed up.

### 18. PDF resume page (Thai: PDF จำหน้าที่อ่านค้าง)

Status: done (#171)

My PDF sets opens each PDF at the page last viewed on this device.

### Round 2 · motivation

### 19. Daily goal bar on Today (Thai: หลอดเป้าหมายรายวัน)

Status: done (#171)

A small daily goal (e.g. 5 practice questions + 10 WordNest words) with a progress bar that fills as you study. #169 added a WordNest daily goal; extend it to practice questions.

### 20. Study heatmap (Thai: ปฏิทินความสม่ำเสมอ)

Status: done (#171)

GitHub-style coloured squares on Stats: questions answered per day for the last months.

### 21. Badges and milestones (Thai: เหรียญรางวัล)

Status: done (#171)

Unlock badges, e.g. first 100 accounting questions, a 7-day streak, a full chapter retired. Computed from existing data where possible.

### 22. Weekly summary (Thai: สรุปรายสัปดาห์)

Status: done (#171)

On Stats: this week's questions, accuracy change per subject, and chapters that did not improve.

### Round 3 · extras

### 23. Pomodoro sounds and per-subject time (Thai: เสียงฝนและเวลาแยกวิชา)

Status: todo

Rain / white-noise sound during Pomodoro (generated in the browser, no downloads), and minutes per subject in Stats.

### 24. Ctrl+K and tags (Thai: ค้นหาด่วนและแท็ก)

Status: todo

Ctrl+K / Cmd+K opens search; tags such as `#ออกสอบชัวร์`, `#สูตรลัด`, `#จุดหลอก` in notes are searchable.

### 25. Warm paper theme and read-aloud (Thai: ธีมถนอมสายตาและอ่านออกเสียง)

Status: todo

A warm paper colour theme for night reading, and a button that reads a lesson summary aloud (browser speech).

### 26. Share a quiz set (Thai: แชร์ชุดควิซ)

Status: needs owner

Share self-made question sets by link or QR. Needs a decision on what may leave the device (no personal data in links or in the repo).

---

## G. Stats page ideas, 18 Nov 2026 (Thai: ไอเดียหน้า Stats)

The Stats page counts quantity (questions, words, minutes). These add quality, readiness and actions. All from existing data; no new storage unless a task says so.

### 27. Accuracy and trend (Thai: ความแม่นยำและแนวโน้ม)

Status: todo

Accuracy % per subject and overall (`120 answered · 78% correct`), and a trend chart of this week's average against last week's, per chapter, so rising and falling chapters stand out.

### 28. Exam readiness and coverage (Thai: ความพร้อมสอบ)

Status: todo

Per subject: a bar of how much of the question bank is answered and how much is right; an estimate of the days to finish at the last 7 days' pace, compared with the exam date.

### 29. Study habit insights (Thai: วิเคราะห์พฤติกรรมการอ่าน)

Status: todo

Peak hours (when answers are most often right) and time balance (Pomodoro time per subject against accuracy, warning when strong subjects get most of the time). Needs a subject on Pomodoro sessions (see task 23).

### 30. Actionable chapter list (Thai: ปุ่มลุยต่อจาก Stats)

Status: todo

In "By subject and chapter": a **Practice weakest** button on chapters under 70% or not practised for 7 days, and sorting by weakest, least recent or least progress.

### 31. Timeframe switcher and weekly target (Thai: เลือกช่วงเวลาและเป้ารายสัปดาห์)

Status: todo

Switch the charts between 7 days, 30 days and all time; an editable weekly target (questions, Pomodoro minutes) on **This week** with a progress bar. The target is stored with `qgoal` in `studyos.home.v1` (validated on restore).
