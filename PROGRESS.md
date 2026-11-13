# Study OS Progress

Last repository audit: 2026-11-13 UTC

## Verified baseline

- `main` has four GitHub Actions workflows, including scheduled Notion export every 15 minutes.
- The read-only Auto Runner pilot exists on Draft PR #45. Its first GitHub CI run (43360809549) passed, including 5 Python tests and existing Node/Python offline suites.
- Existing VocaBloom and academic Study OS development PRs are separate; do not merge or overwrite them.

## Read-only pilot — PR #45 (pending review)

- Selects allowlisted NEXT_STEPS items and runs fixed offline regressions.
- Saves GitHub Actions Markdown/JSON artifacts with read-only repository permissions.
- Does not run an AI model, modify the repository, or touch Production.

## AI Coding Agent — stacked draft PR (under review)

- Adds `scripts/auto_ai_agent.py`, Gemini model `gemini-2.5-flash-lite`, hardcoded task and strict editable-file allowlist.
- Limits each AI generation to one HTTP request with no retries, 4096 requested output tokens, and at most two edited files.
- Adds a GitHub Actions workflow separating model calls, secret-free test execution and Draft PR publishing.
- Requires `STUDY_OS_AUTO_AI_ENABLED=true` and repository secret `GEMINI_API_KEY`; disabled by default.
- Human review required for PR merge. Nothing is deployed.
- Adds isolated unit tests and `docs/AUTO_AI_AGENT.md`.

## Verified CI evidence (2026-11-13 UTC)

- AI Coding Agent PR #46: [workflow run 43363867049](https://github.com/Cheetos9250/study-os/actions/runs/43363867049) passed; the unit-test job passed **13/13** tests using a fake model, with provider/API and publisher jobs skipped on the PR event.
- Read-only Runner on the same head: [workflow run 43363867064](https://github.com/Cheetos9250/study-os/actions/runs/43363867064) passed, including the runner safety unit tests and offline Node/Python regressions.
- These results verify **test and workflow behavior only**, not live Gemini generation or PR writing.

## Not yet verified or enabled
- Live Gemini API generation (requires user's provider key and explicit opt-in).
- Scheduled autonomous model calls (requires approved merge to default branch and opt-in).
- A real AI-generated Draft PR (requires setup and successful verification).
- Automatic Markdown commits after generated PRs (not implemented; workflow artifacts preserve evidence instead).
- Any extension of AI edit scope to Study OS academic UI (deliberately excluded from this first safety-limited pilot).

Production Deploy, KV, Notion mutations and Cloudflare changes remain prohibited.
