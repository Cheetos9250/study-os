# Study OS MCP server for Gemini (read-only)

`study-os-gemini-mcp` lets Gemini (or any MCP client) read the owner's live Study OS progress.

- Reads the synced progress from `vocabloom-progress-cas-prod` through a service binding, **GET only**. It cannot write.
- Reads the public course data (`data/courses/*.js`) from GitHub Pages to name chapters and show question text.
- Data is as fresh as the last cloud sync from any device (the site syncs automatically).
- Tools: `get_overview` (exams, per-chapter answered / % right, weak chapters, last practice), `get_wrong_questions` (course, optional chapter, limit), `get_schedule` (exams and the classes on a date).
- The sync key stays inside the Worker. Clients only hold `MCP_READ_TOKEN`. Change the GitHub secret `GEMINI_MCP_TOKEN` and redeploy to revoke every client.

## Deploy (owner)

1. Make a random token of 40+ letters and digits (a password manager can generate one). Keep it private.
2. GitHub → repo **Settings → Secrets and variables → Actions → New repository secret**: name `GEMINI_MCP_TOKEN`, value = the token.
3. **Actions → Deploy Gemini MCP Worker (manual) → Run workflow**, type `DEPLOY`. The smoke test checks that it reads data and refuses requests without the token.

## Add to Gemini

Server URL: `https://study-os-gemini-mcp.kasidit09022550.workers.dev/mcp/<your token>`

- **Gemini app**: on gemini.google.com (web), Settings → Connected apps → Custom apps → Add a custom app, paste the URL. After that it also appears in the iPad app. (Based on third-party guides from Sept 2026; the menu names may differ.)
- **Gemini CLI / other MCP clients**: use the URL above as a Streamable HTTP server, or `https://…/mcp` with header `Authorization: Bearer <token>`.

Treat the URL like a password: anyone with it can read the progress (not change it).
