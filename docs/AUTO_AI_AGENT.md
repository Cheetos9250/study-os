# Study OS — AI Coding Agent (experimental, opt-in)

## Current state

This adds an AI-generated **Draft Pull Request** pipeline for the existing read-only Auto Runner. It does **not** autonomously merge, deploy, write Production data, or modify Cloudflare/Notion/KV.

The AI workflow is **disabled until explicitly enabled** in repository settings and **must be reviewed and merged** before it can run on a schedule. PR CI is free of API secrets and makes no model calls.

## Provider and budget

- Provider: Google Gemini Developer API, model `gemini-2.5-flash-lite`.
- Credentials: `GEMINI_API_KEY` **GitHub Actions repository secret**, never in any Markdown file or code.
- Feature switch: repository variable `STUDY_OS_AUTO_AI_ENABLED` = `true`; absent or `false` means no AI generation.
- One model request per run, **no retries**, output budget 4096 tokens, max two edited files, 50-second request timeout.
- A preflight check skips generating if another PR from `auto/study-os-ai-` is already open.
- Scheduled on weekdays at 09:41 Asia/Bangkok (subject to GitHub scheduler reliability).
- Free-tier availability and limits depend on the Google account/region. **This workflow cannot enforce a monetary billing cap**; use a non-billed Free Tier project and provider billing protections. A paid project/key may incur charges.

## Minimal activation checklist — requires user action

1. Review and approve stacked Draft PR #46 (and its prerequisite PR #45) separately. Do not merge automatically.
2. Configure a Google AI Studio API key in GitHub: `Settings → Secrets and variables → Actions → Secrets → New repository secret` named `GEMINI_API_KEY`.
3. Keep `STUDY_OS_AUTO_AI_ENABLED` absent/false until ready. Set under `Settings → Secrets and variables → Actions → Variables` to `true` as explicit opt-in.
4. In `Settings → Actions → General`, allow GitHub Actions to create pull requests if you want the Draft PR stage. GitHub often disables this by default. Do not grant broad unnecessary permissions.
5. On `main`, run the workflow manually with `proposal_only=true` to test generation/validation with no GitHub writes, then review artifacts, logs and provider usage.
6. Only if satisfied, use `proposal_only=false` or keep scheduled operation enabled. Every code proposal remains a Draft PR requiring human review.

## Security design

- Fixed `AUTO-AI:runner-regression` task identifier: a Markdown description is *never* treated as a shell command, and only source-approved task text is sent to the model.
- Source/input context is restricted to `scripts/auto_dev_pilot.py`, `scripts/tests/test_auto_dev_pilot.py` and `docs/AUTO_RUNNER_PILOT.md`. No user data, secrets, progress files or Worker config are sent.
- The same three files are the only files the model may edit (existing regular files; no symlinks; maximum 24,000 characters per file).
- The JSON proposal is validated twice and archived; malformed suggestions fail closed.
- The **generate job** receives only the Gemini secret, with `contents: read` and no Git write token. It does not execute model-generated code.
- The **verify job** runs generated code and offline tests **without secrets**, with read-only checkout credentials.
- The **publish-draft job** receives a GitHub write token but does **not execute tests or generated code**; a trusted validator applies only allowlisted changes, pushes to a new branch and opens a Draft PR.
- Never use `pull_request_target` for this pipeline; pull request checks cannot access the Gemini secret.
- Existing Notion sync workflow, production config and deployment tools are untouched.
- The proposal is untrusted code; a human must inspect the diff before any merge. Tests do not prove the code secure.

## Known limits

- This is a narrow agent: it hardens its own Runner/tests rather than modifying the academic UI or backend. Expanding scope requires a separately reviewed allowlist + safety tests.
- The scheduled workflow only starts after merge into the default branch. It is not active merely because the PR exists.
- GitHub may suppress automatic PR-triggered workflows when a PR is created with `GITHUB_TOKEN`. The workflow's separate **verify** job already runs required offline checks before creating the PR, but review its test run evidence.
- Provider free-tier requests can be rate-limited; output may fail JSON validation and no draft will be created.
- One open Auto AI PR pauses further model calls, preventing unreviewed proposal accumulation.
- The model can propose incorrect code; human review is mandatory.
- To stop automatic AI calls, set `STUDY_OS_AUTO_AI_ENABLED=false` or remove the API key.

## Local tests (no API calls)

```bash
python3 -m unittest discover -s scripts/tests -p 'test_*.py' -v
```

The unit tests use an injected fake model response. No real Gemini API calls are made during PR validation.
