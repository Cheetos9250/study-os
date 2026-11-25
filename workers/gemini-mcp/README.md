# Study OS MCP server for Gemini (read-only)

`study-os-gemini-mcp` lets Gemini (or any MCP client) read the owner's live Study OS progress.

- Reads the synced progress from `vocabloom-progress-cas-prod` through a service binding, **GET only**. It cannot write.
- Reads the public course data (`data/courses/*.js`) from GitHub Pages to name chapters and show question text.
- Data is as fresh as the last cloud sync from any device (the site syncs automatically).
- `GET /export` (Bearer token): every table for the Google Sheet **Study OS data** — Summary, Questions (the whole acc/eco/math bank from `bank.json`, with the student's answer and result), Notes, Tasks, Grades, Exams, Classes.
- `bank.json` is built at deploy by `node scripts/build-question-bank.cjs workers/gemini-mcp/bank.json` (same ids as the course engine; not committed). Redeploy after adding questions.
- `GET /plan` (Bearer token): small JSON with Study OS tasks, upcoming exams and the timetable. Life OS reads it (secret `STUDY_OS_TOKEN` in Life OS = the same token) to show study tasks on its Today and Plan pages.
- `GET /summary` (Bearer token): overview + today's classes as one Markdown page, for the Google Doc script.
- Tools: `get_questions` (whole bank, filter by chapter / wrong / right / unanswered, paged), `get_overview` (exams, per-chapter answered / % right, weak chapters, last practice), `get_wrong_questions` (course, optional chapter, limit), `get_schedule` (exams and the classes on a date).
- The sync key stays inside the Worker. Clients only hold `MCP_READ_TOKEN`. Change the GitHub secret `GEMINI_MCP_TOKEN` and redeploy to revoke every client.

## Deploy (owner)

1. Make a random token of 40+ letters and digits (a password manager can generate one). Keep it private.
2. GitHub → repo **Settings → Secrets and variables → Actions → New repository secret**: name `GEMINI_MCP_TOKEN`, value = the token.
3. **Actions → Deploy Gemini MCP Worker (manual) → Run workflow**, type `DEPLOY`. The smoke test checks that it reads data and refuses requests without the token.

## Google Doc for the Gemini app (works in Thailand)

Custom MCP apps in the Gemini app are US + English only (Google Help, Nov 2026), so the Gemini app reads a Google Doc instead:
`study-os-doc.gs` is a Google Apps Script that runs in the owner's Google account. Every 15 minutes it fetches `GET /summary` and `GET /export` (Bearer token) and rewrites a Doc **Study OS live** and a Sheet **Study OS data**. In Gemini: "@Google Drive read my Study OS live doc …". Setup steps are at the top of the script. The token lives only in the script's properties.

## Source code for Gemini (Google Docs)

The same Apps Script can also copy the site's **source code** into Google Docs, once a day at 04:00 Bangkok (only when the repo changed). It reads the public GitHub repo, so it needs no token.

1. Paste the latest `study-os-doc.gs` into the same Apps Script project (replace the old text) and save.
2. Choose the function **setupCode** and press **Run** (allow external requests if asked).
3. Drive now has **Study OS code – index** plus about 16 code Docs (pages, scripts, scripts (other), wordnest, styles/workers/CI, docs and service worker), each at most 100,000 characters and numbered (1/5), (2/5)… A very large file is split into pieces. Docs from an older layout go to the Drive trash.

**One folder:** the Doc, the Sheet and all code Docs are kept in a Drive folder **Study OS for Gemini**. After pasting this version, run **gatherFiles** once (allow Google Drive access) to move files made earlier; later refreshes keep new files there.

In Gemini: "@Google Drive read Study OS code – index, then open the Doc that has scripts/study-review.js and explain it". Course data, tests, images and the design-tool folder are not copied. Stop with **stopCode**.

## Add to Gemini as an MCP server (US + English accounts, Gemini CLI, other MCP clients)

Server URL: `https://study-os-gemini-mcp.kasidit09022550.workers.dev/mcp/<your token>`

- **Gemini app** (only accounts in the US, English, 18+): gemini.google.com → Settings → Connected Apps → Custom apps → Add a custom app.
- **Gemini CLI / other MCP clients**: use the URL above as a Streamable HTTP server, or `https://…/mcp` with header `Authorization: Bearer <token>`.

Treat the URL like a password: anyone with it can read the progress (not change it).
