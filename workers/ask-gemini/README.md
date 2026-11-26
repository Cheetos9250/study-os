# Ask-Gemini MCP server for Claude

`study-os-ask-gemini` gives Claude one tool, `ask_gemini`, that sends a task to Google Gemini and returns the answer.
Claude can delegate writing, translation, brainstorming or code to Gemini, or ask it for a second opinion.

- Tool `ask_gemini`: `prompt` (required), `system`, `model` (`flash` default = `gemini-flash-latest`, `pro` = `gemini-pro-latest`), `temperature`, `max_output_tokens`.
- No storage, no bindings, no Study OS data. It only forwards the prompt to `generativelanguage.googleapis.com`.
- The Gemini key (`GEMINI_API_KEY`) stays inside the Worker and is sent only in the `x-goog-api-key` header. Error messages strip it.
- Clients authenticate with `CLAUDE_MCP_TOKEN` in the path (`/mcp/<token>`) or as a Bearer header. Change the GitHub secret and redeploy to revoke.
- Cost: uses the owner's Google AI Studio key, so the free tier limits (requests per minute/day) apply.

## Deploy (owner)

1. Create a Gemini API key at https://aistudio.google.com/apikey.
2. Make a random token of 40+ letters and digits.
3. GitHub → **Settings → Secrets and variables → Actions → New repository secret**: `GEMINI_API_KEY` and `CLAUDE_MCP_TOKEN`.
4. **Actions → Deploy Ask-Gemini Worker (manual) → Run workflow**, type `DEPLOY`. The smoke test makes one tiny Gemini call and checks that requests without the token are refused.

## Connect to Claude

claude.ai → **Settings → Connectors → Add custom connector**: name `Ask Gemini`, URL
`https://study-os-ask-gemini.kasidit09022550.workers.dev/mcp/<CLAUDE_MCP_TOKEN>`. Leave the OAuth fields empty.
Then enable it in a chat or project ("Search and tools") and ask Claude to "ask Gemini …".
