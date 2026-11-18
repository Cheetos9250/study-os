# AGENTS.md — handoff guide for AI agents working on Study OS

Study OS is a personal, static study website for one first-year accounting student (the owner, GitHub `cheetos9250`).
Live site: https://cheetos9250.github.io/study-os/ (GitHub Pages, deployed from `main`).
The owner mostly uses it on an **iPad** (Safari, and as a home-screen app), sometimes on a desktop PC.
The owner reads **Thai**. Write replies to the owner in short, plain Thai. Keep the site UI in **English**.

## Rules (read first)

1. **No personal data in this public repo.** That covers the timetable, grades and scores, student ID, email, rooms, and private Notion/Drive content.
   - Personal data lives only in the browser (localStorage).
   - To load it, give the owner a one-time import link that carries the data in the URL fragment: `calendar.html#timetable=<base64url JSON>` or `grades.html#grades=<base64url JSON>`.
   - The home-screen app has separate storage from Safari, so both pages also have an **Import from link** button.
2. **Never lose study progress.** Any change to storage, backup, restore or sync must keep existing localStorage data. Every new key must:
   - be added to `scripts/study-progress-backup.js` (`KEYS`) and its label;
   - get validation in `scripts/study-progress-restore.js`;
   - get the same label in `progress-restore.html`.
3. **Avoid merge conflicts.**
   - Put new tests in a **new test file**. Appending to the same file from two PRs conflicts.
   - Do not edit `CHANGELOG.md` or `NEXT_STEPS.md`.
   - Add a fragment `changelog.d/YYYYMMDD-short-name.md` instead.
   - Do not stack PRs. If an open PR already touches the same files, add to that PR.
4. **Merging:** the owner allows the agent to merge its own PRs. Merge only when all CI checks pass and the PR is mergeable. After a merge, check the `main` CI and the Pages deploy, and fix any breakage right away.
5. **Ask the owner first** before anything irreversible or live:
   - deleting real data;
   - deploying or changing Cloudflare Workers;
   - changing `data/config.json` (`api` / `progress_api`);
   - handling secrets.

   Never put tokens or keys in the repo or in chat.
6. **Verify before claiming success.** Run the tests. For UI work, check screenshots at 1180×820 (iPad landscape), 820×1180 and 390×844, in both dark and light mode. Check that there is no horizontal overflow and no page errors.
7. Commit trailer used so far: `Co-Authored-By: <model> <noreply@anthropic.com>`. PR bodies end with a generated-by line.

## Work queue

`TASKS.md` lists numbered tasks the owner hands to agents ("ทำข้อ 3 ใน TASKS.md" = do task 3). Follow its "How to work a task" section and change only your own task's status line.

## Structure

| Page | Purpose |
|---|---|
| `index.html` | **Today**. Shows the cover and icon (local images; animated GIFs and https or Google Drive image links work), summary chips, today's classes, today's plan, a Pomodoro timer, exam countdowns, the owner's tasks and subject cards. |
| `flashcards.html` | Due/new cards per subject. English and Chinese open WordNest. |
| `practice.html` | Quizzes per subject, weak chapters, WordNest English games, the accounting textbook. |
| `hub.html` | **Lessons**: subject → chapters → Lesson / Cards / Practice / Notes. |
| `calendar.html` | Month view, weekly **timetable** (edit + import), **exam schedule** editor. |
| `stats.html` | **Stats** (nav footer): streak, 30-day answers and Pomodoro charts, accuracy per subject/chapter. Read-only; helpers in `scripts/study-stats.js`. |
| `tutor.html` | **AI tutor** (nav footer, 18 Nov 2026): chat with Gemini (Google AI Studio key) or any OpenAI-compatible API such as Hermes on OpenRouter/Nous, called straight from the browser with the owner's own key. Subject + chapter adds that chapter's summary from `data/courses/<course>.js` to the system prompt; replies render with `StudySosMd` (tables for journal entries); photos are sent inline. Deep link `?course=&cat=&q=` fills the box only. Helpers: `scripts/study-tutor.js`. |
| `classroom.html` | **Classroom import** (link on Today → Tasks): Google Identity Services token client with the owner's own OAuth client ID (public id, saved on the device), read-only Classroom scopes, adds chosen assignments to `studyos.home.v1` tasks as `gc-<courseWorkId>` with `src:'classroom'` and `link` (validated on restore: classroom.google.com only). The access token is memory only. Helpers: `scripts/study-classroom.js`. |
| `grades.html` | Weighted course items, letter per course scale, "needed on the rest", estimated GPA. |
| `acc/eco/math/eng/zh.html` | Course pages: a small HTML shell plus the shared engine `scripts/study-course-engine.js` (18 Nov 2026; one engine for all five, differences come from `window.StudyCourseOpts` in the page). Data lives in `data/courses/<course>.js` as `const D = {...};` on one line (never rewrite it with regex; Today, Lessons, Grades, Calendar, Stats and search fetch this file via `StudyToday` `c.data` and parse it). `<course>-snapshot.js` holds the saved Notion quiz rows (acc, eco); `acc-extra.js` holds the extra accounting sets and hidden near-duplicates (ids `<pre><n>`, never reorder rows). Each page shows one mode via `?tab=cards|sum|prac` (`scripts/study-course-mode.js`) and has its own sync engine (`window.__xs`, inside the shared engine). Source tests read a page through `tests/course-source.cjs`, which inlines these files. |
| `accounting-textbook.html` | **Redirect only** (17 Nov 2026): Textbook Exercises was merged into My PDF sets. Old links `?q=<id>` / `?ch=<n>` go to `pdf-sets.html?book=1&q=…` / `&ch=…`. |
| `pdf-sets.html` | **My PDF sets**: teacher PDFs with answer sheets, and the accounting textbook (403 written exercises with answer panel, journal/statement tables, reviewed final-answer checks from `scripts/accounting-answer-check.js`, MCQ links; chapter multiple-choice quizzes). Links: `?book=1[&q=<id>|&ch=<n>]`. |
| `excel.html` | **Excel** subject (not in `COURSES`; synced through the `extra` subject): basic dashboard step-by-step from the class, exam tips, quiz. Linked from Lessons and Practice. |
| `progress-backup.html` / `progress-restore.html` | Local JSON backup and validated restore. |
| `today.html` | Redirects to `calendar.html` (old links). |
| `vocabloom/` | **WordNest** (formerly VocaBloom). `?lang=en` gives English games + English cards, `?lang=zh` gives Chinese cards. The folder name and storage keys stay `vocabloom` so progress is kept. `vocabloom/wordnest.js` is the language layer. |

Shared scripts and styles:
- `scripts/study-nav.js`: sidebar on screens ≥ 900 px, bottom bar below that. Tabs: Today · Flashcards · Practice · Lessons · Calendar. The footer has theme, Grades, Back up, Restore and Cloud sync (course pages only).
- `scripts/study-search.js`: site search, loaded by the nav on first use (sidebar **Search** field, More → Search on phones, `/` key). Indexes course quiz/cards/summaries, `data/quiz.json`, textbook-style and written questions, the textbook index and lesson notes; read-only.
- `scripts/study-theme.js`: auto/dark/light theme. It also registers `sw.js` (https only): network-first offline cache of same-origin files; never caches `data/config.json` or other origins. Bump `VERSION` in `sw.js` only when the cache layout changes.
- `scripts/study-today.js`: `window.StudyToday`. Provides `COURSES`, `LANGS`, exams, the plan engine, `normalizeTimetable` and `classesOn`.
- `scripts/study-grades.js`: grade maths.
- `assets/study-unify.css`: gives course pages the site look.

Core pages use the "ink manga" system in `assets/study-world.css` (see `DESIGN.md`): Kaisei Decol (headings/numbers), Zen Maru Gothic (body), Mali (Thai); ink black on white panels, 3px frames, pen hatching. The accent colour follows the Today cover image via `scripts/study-accent.js` (sessionStorage cache only). Course pages keep `assets/study-unify.css`.

## localStorage keys (all backed up)

| Key | What |
|---|---|
| `<mark>-srs`, `<mark>-typ` | Flashcard SRS. Marks: `acc-flashcards-v1`, `econ-flashcards-v1`, `math-flashcards-v1`, `eng-vocab-v1`, `zh-vocab-v1`. |
| `study-<course>` | Quiz answers (`ans`, `ats`) and the quiz review schedule `rv` (`id → [box, dueMs]`, `scripts/study-review.js`; gaps 1/3/7/14/30/90 days, box ≥ 4 = retired). |
| `studyos.home.v1` | Owner tasks, cover, icon, card images. |
| `studyos.today.v1` | Exams, plan ticks, timetable. `markChapter` must keep the other fields. |
| `studyos.grades.v1` | Grades. |
| `studyos.notes.v1` | Lesson notes (`<course>:<chapter>` → text). |
| `studyos.accounting.textbook.progress.v1` | Textbook answers (`notes`, `status`, `updated`, `je`: journal-entry grid rows `[date, account, debit, credit]` from `scripts/je-grid.js`, and `fs`: statement-table rows `[line item, amount, total]` from `scripts/fs-grid.js`, both on acc.html written practice; `bje` / `bfs`: the same tables for the book's own exercise, from the My PDF sets Written panel, never checked against an answer). |
| `vocabloom_mvp_v1` | WordNest English data. |
| `studyos.pomolog.v1` | Pomodoro history for Stats: `days` (`YYYY-MM-DD` → minutes of finished 25-minute sessions) and `lastEnd` (end time of the last counted session, so one session counts once). Written only by `index.html`. |
| `studyos.excel.v1` | Excel page: ticked steps (`done`) and quiz answers (`ans`, `x<n>` → option index). |
| `studyos.pdfsets.v1` | **My PDF sets** (`pdf-sets.html`): per uploaded PDF its name, subject, detected question count, my answers, answer key and per-page working notes (`notes`). PDFs over 60 pages are books (no question detection, lazy page rendering). The 1,210-page textbook is set `ptextbook` and its file lives in the Textbook page's IDB `studyos-accounting-pdf-v1` (shared, added once). The PDFs themselves are in IndexedDB `studyos-pdf-sets-v1` on the device only (not backed up, never uploaded). Chapter multiple-choice quizzes found in the textbook (`scripts/pdf-mcq.js`) are sets `ptbmc<chapter>` with `book: 'ptextbook'`: they read the textbook file and removing one never deletes it. |

Not backed up: `studyos.tutor.v1` (AI tutor settings and the API key when "remember" is on; never backed up, synced or put in a link), sessionStorage `studyos.tutor.key` / `studyos.tutor.chat.v1` / `studyos.tutor.ctx` (this visit only), `studyos.classroom.v1` (Classroom OAuth client ID, last read time), `studyos.theme.v1`, `studyos.nav.v1` (collapsed sidebar), `studyos.focus.v1` (focus mode, default on: hides summaries and flashcards; all three written only by `scripts/study-theme.js`), `studyos.last.v1` (last study place for Today's **Continue** card: page link + label, written by `scripts/study-last.js` from acc/eco/math practice and the textbook in My PDF sets), `studyos.pomo.v1` (running Pomodoro end time, written only by `index.html`, read by `StudyTheme.pomo()` for the nav countdown), `studyos.backup-meta.v1` (time **Back up now** was last tapped on Today, written only by `index.html`; drives the Today backup reminder. `progress-backup.html` must stay read-only, CI checks it), sync keys (`study-sync-*`), caches.

## Tests

```
node --test tests/*.test.cjs vocabloom/tests/*.test.cjs   # main suite (~310 tests)
node tests/study-basic-browser.cjs                        # Playwright, Chromium + WebKit (CI)
node tests/study-course-storage-browser.cjs
node tests/auto-sync-browser.cjs
```

- CI workflows live in `.github/workflows/`.
- Some browser tests need WebKit, which may be missing locally. CI runs them.
- Browser tests reach English and Chinese course pages directly, because the home page links languages to WordNest.

## Sync status (cross-device)

- **Live since 16 Nov 2026.** The owner deployed `vocabloom-progress-cas-prod` (smoke test passed) and `data/config.json` has `progress_api`. Each device needs the sync key once (nav → Cloud sync → Set sync key). Back up / Restore still works as before.
- Client ready (16 Nov 2026): `scripts/study-cloud.js` (`window.StudyCloud`) on Today, Calendar, Practice, Flashcards and Lessons syncs all five courses plus the `today` subject (`studyos.today.v1` and `studyos.notes.v1` as `today.notes`, 340 KB guard), and a `home` subject (`studyos.home.v1` tasks/cover/icon/card images + `studyos.grades.v1`, 1.85 MB guard; needs the Worker redeployed, skipped while the server answers 404). Also loaded on Grades and the acc/eco/math quiz pages through `progress_api` only, with CAS and per-item merges; the nav's **Cloud sync** opens its dialog. Sync caches `study-sync-today-base-v1` / `study-sync-home-base-v1` / `study-sync-last-v1` are not backed up. The Worker accepts the extra subject `today` with its own schema.
- `extra` subject (**live since 17 Nov 2026**, owner redeployed the Worker at 12:54; the `home` subject went live with the 12:35 deploy): `studyos.excel.v1`, `studyos.pdfsets.v1` (JSON only) and `studyos.accounting.textbook.progress.v1` in one document `{excel, pdfsets, textbook}` (1.9 MB limit). Merges: Excel per step/answer, PDF sets per set then per answer/key/note, textbook per exercise (newer `updated` wins). Base cache `study-sync-extra-base-v1` (not backed up). Skipped while the server answers 404.
- Live `study-api` Worker:
  - serves Notion quiz/cards (no longer read by the site — Notion retired 15 Nov 2026; pages use only `data/quiz.json` / `data/cards.json`) plus legacy progress, with unconditional writes;
  - must not be replaced;
  - is used through `data/config.json` → `api`.
- `workers/progress/wrangler.jsonc` and `.github/workflows/deploy-progress-worker.yml` (from PR #102, now on `main`) deploy `vocabloom-progress-cas-prod`, a compare-and-set progress Worker built from `experiments/prod-progress-cas/worker.mjs`.
- Redeploying: GitHub secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `PROGRESS_SYNC_KEY` are set; run the workflow and type `DEPLOY` (ask the owner first).
- Owner request (15 Nov 2026, after losing quiz answers when the iPad cleared site data): when cloud sync goes live it must also sync `studyos.today.v1` (timetable, exams, plan ticks), not only course progress. Until then the owner chose device-side protection: `navigator.storage.persist()` on every page and the Today backup reminder.
- `study-api-cas-staging-only` is a staging prototype. Do not use it for real data.

## Open items

- Notion is retired (owner, 15 Nov 2026). Do not re-add Notion loading. New cards/questions would be edited in `data/*.json` or a future in-site editor.

- Syllabi received (all six courses, 16 Nov 2026). Grade data goes to the owner as an import link, never committed.
  - Accounting: 3 credits; final Thu 26 Nov 09:00–12:00 covers Ch5–9; weights 10/10/10/10/30/30.
  - EC1: no final exam; group presentation in week 16 (about Wed 18 Nov).
  - Economics (1202221): 3 credits; 15 + 35 mid + 15 + 35 final; A≥80 … D≥50. Final (27 Nov) covers weeks 10–16: GDP/GNP, business cycle & unemployment, money & inflation, AD–AS, fiscal and monetary policy, growth & development. The eco page has no fiscal/monetary chapters yet.
  - Math for Life (11061001): 3 credits; quizzes/HW/mid/final 25 each; final 1 Dec 09:00–12:00; grading by distribution (no fixed scale). Final scope not stated (default assumes Ch5–7).
  - Excel (1201118): 1 credit; assignments 10, case study 20, mid 35, final 35; A≥79.5 … D≥49.5; final review 19 Nov, final date not given.
  - Global Citizenship (16011001): online; goal quizzes 50%, SDG videos 10%, group video 40%; group video link due 20 Nov 2026 (default calendar entry `gc-video-20261120`).
- UI is English everywhere a user normally goes. Thai remains only in study content (cards, summaries) and in admin/staging tools under `vocabloom/`.
- AI tutor and Classroom import shipped 18 Nov 2026. Both need the owner to create something outside the repo (an AI API key; a Google Cloud OAuth client ID with origin `https://cheetos9250.github.io`); never commit either, and never ask for keys in chat.
- PR #68 (79 worked textbook answers, 50 PDF-reviewed) is waiting for the owner to decide whether to release the reviewed answers.
