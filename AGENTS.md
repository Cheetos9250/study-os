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

## Where things are (details: `docs/agents-reference.md`)

Read the matching section of **`docs/agents-reference.md`** before you change a page, a storage key or sync. It has the full page table, every localStorage key, the sync/Worker status and the open items.

- Pages: `index.html` Today · `flashcards.html` · `practice.html` · `hub.html` Lessons · `calendar.html` · `mock.html` · `je-drill.html` · `mistakes.html` · `stats.html` · `tutor.html` AI tutor · `gemini.html` · `classroom.html` · `grades.html` · `pdf-sets.html` · `excel.html` · `feedback.html` · `progress-backup.html` / `progress-restore.html` · `vocabloom/` WordNest.
- Course pages `acc/eco/math/eng/zh.html` = small shell + one shared engine `scripts/study-course-engine.js`; data in `data/courses/<course>.js` as `const D = {...};` on one line (never rewrite it with regex; never reorder rows in `acc-extra.js`). Layout of `data/`: `data/README.md`.
- Shared: `scripts/study-nav.js` (nav, loads search/usage/storage helpers), `scripts/study-theme.js` (theme + `sw.js`), `scripts/study-today.js` (`StudyToday`), `scripts/study-cloud.js` (cloud sync), `assets/study-world.css` + `study-eink-*.css` (look, see `DESIGN.md`).
- Every localStorage key that holds progress is in `scripts/study-progress-backup.js` `KEYS` (rule 2). Key list with meanings: `docs/agents-reference.md`.
- Workers (`workers/`, `experiments/prod-progress-cas/`) are live services: deploy only through their workflows and only after the owner says yes (rule 5).
- Notion is retired (15 Nov 2026): do not re-add Notion loading.

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
