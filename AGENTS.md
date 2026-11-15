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

## Structure

| Page | Purpose |
|---|---|
| `index.html` | **Today**. Shows the cover and icon (local images; animated GIFs and https or Google Drive image links work), summary chips, today's classes, today's plan, a Pomodoro timer, exam countdowns, the owner's tasks and subject cards. |
| `flashcards.html` | Due/new cards per subject. English and Chinese open WordNest. |
| `practice.html` | Quizzes per subject, weak chapters, WordNest English games, the accounting textbook. |
| `hub.html` | **Lessons**: subject → chapters → Lesson / Cards / Practice / Notes. |
| `calendar.html` | Month view, weekly **timetable** (edit + import), **exam schedule** editor. |
| `grades.html` | Weighted course items, letter per course scale, "needed on the rest", estimated GPA. |
| `acc/eco/math/eng/zh.html` | Course pages. Data is embedded as `const D={...}` (one huge line; never rewrite it with regex). Each page shows one mode via `?tab=cards|sum|prac` (`scripts/study-course-mode.js`) and has its own sync engine. |
| `accounting-textbook.html` | Index of 403 textbook exercises, Ch1–9. |
| `progress-backup.html` / `progress-restore.html` | Local JSON backup and validated restore. |
| `today.html` | Redirects to `calendar.html` (old links). |
| `vocabloom/` | **WordNest** (formerly VocaBloom). `?lang=en` gives English games + English cards, `?lang=zh` gives Chinese cards. The folder name and storage keys stay `vocabloom` so progress is kept. `vocabloom/wordnest.js` is the language layer. |

Shared scripts and styles:
- `scripts/study-nav.js`: sidebar on screens ≥ 900 px, bottom bar below that. Tabs: Today · Flashcards · Practice · Lessons · Calendar. The footer has theme, Grades, Back up, Restore and Cloud sync (course pages only).
- `scripts/study-theme.js`: auto/dark/light theme.
- `scripts/study-today.js`: `window.StudyToday`. Provides `COURSES`, `LANGS`, exams, the plan engine, `normalizeTimetable` and `classesOn`.
- `scripts/study-grades.js`: grade maths.
- `assets/study-unify.css`: gives course pages the site look.

Core pages use the "ink manga" system in `assets/study-world.css` (see `DESIGN.md`): Kaisei Decol (headings/numbers), Zen Maru Gothic (body), Mali (Thai); ink black on white panels, 3px frames, pen hatching. The accent colour follows the Today cover image via `scripts/study-accent.js` (sessionStorage cache only). Course pages keep `assets/study-unify.css`.

## localStorage keys (all backed up)

| Key | What |
|---|---|
| `<mark>-srs`, `<mark>-typ` | Flashcard SRS. Marks: `acc-flashcards-v1`, `econ-flashcards-v1`, `math-flashcards-v1`, `eng-vocab-v1`, `zh-vocab-v1`. |
| `study-<course>` | Quiz answers. |
| `studyos.home.v1` | Owner tasks, cover, icon, card images. |
| `studyos.today.v1` | Exams, plan ticks, timetable. `markChapter` must keep the other fields. |
| `studyos.grades.v1` | Grades. |
| `studyos.notes.v1` | Lesson notes (`<course>:<chapter>` → text). |
| `studyos.accounting.textbook.progress.v1` | Textbook answers. |
| `vocabloom_mvp_v1` | WordNest English data. |

Not backed up: `studyos.theme.v1`, sync keys (`study-sync-*`), caches.

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

- Not live yet. Today the owner moves data with Back up / Restore.
- Live `study-api` Worker:
  - serves Notion quiz/cards (no longer read by the site — Notion retired 15 Nov 2026; pages use only `data/quiz.json` / `data/cards.json`) plus legacy progress, with unconditional writes;
  - must not be replaced;
  - is used through `data/config.json` → `api`.
- `workers/progress/wrangler.jsonc` and `.github/workflows/deploy-progress-worker.yml` (PR #102, may still be open) deploy `vocabloom-progress-cas-prod`, a compare-and-set progress Worker built from `experiments/prod-progress-cas/worker.mjs`.
- That deploy needs the owner to add the GitHub secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and `PROGRESS_SYNC_KEY`, then run the workflow and type `DEPLOY`. The owner postponed this.
- After the smoke test passes, add `progress_api` to `data/config.json`. Course pages and WordNest already support it, including auto sync.
- `study-api-cas-staging-only` is a staging prototype. Do not use it for real data.

## Open items

- Notion is retired (owner, 15 Nov 2026). Do not re-add Notion loading. New cards/questions would be edited in `data/*.json` or a future in-site editor.

- Syllabi received so far: Accounting (3 credits; final Thu 26 Nov 09:00–12:00 covers Ch5–9; weights 10/10/10/10/30/30) and EC1 (no final exam; group presentation in week 16, about Wed 18 Nov).
- Still needed: syllabi for Math, Excel ("Using Spreadsheet Software for Accounting"), Global Citizenship and Economics. They give credits, Economics/Math final scope and grade weights. Grade data goes to the owner as an import link, never committed.
- UI is English everywhere a user normally goes. Thai remains only in study content (cards, summaries) and in admin/staging tools under `vocabloom/`.
- Planned features: Google Classroom import (needs an OAuth client the owner would create), AI tutor (costs money).
- PR #68 (79 worked textbook answers, 50 PDF-reviewed) is waiting for the owner to decide whether to release the reviewed answers.
