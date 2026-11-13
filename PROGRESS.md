# Study OS Progress

Last audited: 2026-11-13 UTC (GitHub repository read-only inspection)

## Verified baseline

- `main` includes 4 GitHub Actions workflows: Notion sync, CAS tests (two), and VocaBloom regression.
- Existing Notion sync workflow is scheduled every 15 minutes and writes exported `data/` files to `main`. This pilot does not modify that workflow.
- On `main`, `PROJECT.md`, `PROGRESS.md`, `NEXT_STEPS.md`, and `ARCHITECTURE.md` were not present at audit time.
- Draft PR #39 fixes Notion export safety; #41 handles VocaBloom English-only rendering; #44 covers the academic-first Study OS homepage. Their PR state and CI may change; check GitHub when resuming.

## Pilot implementation (this PR)

- Add independent scheduled/manual read-only GitHub Actions pilot.
- Add allowlisted NEXT_STEPS parser and fixed offline regression suite with unit tests.
- Generate `AUTO_RUNNER_STATUS.md` and JSON artifact **inside each workflow run**, not as a direct commit to `main`.
- No AI model or paid API key is configured.

## Not yet verified

- End-to-end scheduled execution (requires approved merge; scheduled workflows only execute from default branch).
- PR CI run at final head SHA (check in Actions).
- Optional autonomous AI code generation, PR creation and automated Markdown commits (not implemented).
