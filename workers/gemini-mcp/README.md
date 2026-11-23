# Study OS MCP server for Gemini (read-only)

`study-os-gemini-mcp` lets Gemini (or any MCP client) read the owner's live Study OS progress.

- Reads the synced progress from `vocabloom-progress-cas-prod` through a service binding, **GET only**. It cannot write.
- Reads the public course data (`data/courses/*.js`) from GitHub Pages to name chapters and show question text.
- Data is as fresh as the last cloud sync from any device (the site syncs automatically).
- `GET /summary` (Bearer token): overview + today's classes as one Markdown page, for the Google Doc script.
- Tools: `get_overview` (exams, per-chapter answered / % right, weak chapters, last practice), `get_wrong_questions` (course, optional chapter, limit), `get_schedule` (exams and the classes on a date).
- The sync key stays inside the Worker. Clients only hold `MCP_READ_TOKEN`. Change the GitHub secret `GEMINI_MCP_TOKEN` and redeploy to revoke every client.

## Deploy (owner)

1. Make a random token of 40+ letters and digits (a password manager can generate one). Keep it private.
2. GitHub → repo **Settings → Secrets and variables → Actions → New repository secret**: name `GEMINI_MCP_TOKEN`, value = the token.
3. **Actions → Deploy Gemini MCP Worker (manual) → Run workflow**, type `DEPLOY`. The smoke test checks that it reads data and refuses requests without the token.

## Google Doc for the Gemini app (works in Thailand)

Custom MCP apps in the Gemini app are US + English only (Google Help, Nov 2026), so the Gemini app reads a Google Doc instead:
`study-os-doc.gs` is a Google Apps Script that runs in the owner's Google account, fetches `GET /summary` (Bearer token) every 15 minutes and rewrites a Doc named **Study OS live**. In Gemini: "@Google Drive read my Study OS live doc …". Setup steps are at the top of the script. The token lives only in the script's properties.

## Add to Gemini as an MCP server (US + English accounts, Gemini CLI, other MCP clients)

Server URL: `https://study-os-gemini-mcp.kasidit09022550.workers.dev/mcp/<your token>`

- **Gemini app** (only accounts in the US, English, 18+): gemini.google.com → Settings → Connected Apps → Custom apps → Add a custom app.
- **Gemini CLI / other MCP clients**: use the URL above as a Streamable HTTP server, or `https://…/mcp` with header `Authorization: Bearer <token>`.

Treat the URL like a password: anyone with it can read the progress (not change it).
