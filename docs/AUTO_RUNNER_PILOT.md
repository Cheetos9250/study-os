# Study OS Auto Runner — pilot

## Purpose

A minimal *free of additional AI API cost*, read-only scheduled runner that reads `NEXT_STEPS.md`, selects one explicitly allowlisted task and executes **fixed offline tests**. It generates a Markdown status report, JSON report and GitHub Actions job summary. No external AI model is called.

## Activation

1. Review this draft PR, including the script, workflow and permissions.
2. When **separately** authorized, merge the PR to `main`; **do not merge automatically**.
3. Open **Actions → Study OS Auto Runner (read-only pilot) → Run workflow** to test manually.
4. On `main`, the workflow runs weekdays at 09:31 Thailand time (GitHub scheduling may be delayed or skipped).
5. Open the Job Summary and download the `study-os-auto-runner-report` artifact. It includes `AUTO_RUNNER_STATUS.md` and `auto-runner-report.json`.

## Guarantees and boundaries

- Permissions: `contents: read`; checkout has `persist-credentials: false`.
- No production credentials, token-based API access, repo writes, PR writes, database migrations, or deployments.
- One safe allowlisted action (`regression`) is hard-coded; task text cannot inject commands.
- `APPROVAL` tasks are never executed.
- All test commands use `subprocess.run([...])` without a shell.
- If NEXT_STEPS is missing, there are no authorized tasks, or a test fails, the job fails closed.
- Result Markdown is a GitHub Actions artifact, not a direct commit to `PROGRESS.md`.
- Existing 15-minute Notion Sync workflow is untouched.

## PR testing

The pull_request event runs the safety tests and existing regressions on proposed changes. The scheduled event only operates once the reviewed workflow is merged to the default branch.

## Phase 2: optional AI Coding Agent (NOT activated)

An AI agent that writes and commits code requires choosing a provider/credential (usage may be billed), isolated execution, strict permissions, maximum runtime/requests, untrusted-input safeguards, rate limits, and PR-only branch writes. Explicit approval and separate security review are mandatory before adding this capability.

## Local checks

```bash
python3 -m unittest discover -s scripts/tests -p 'test_*.py' -v
python3 scripts/auto_dev_pilot.py --root . --output-dir auto-runner-output --dry-run
```

## Maintenance

Add new automatic tasks only by explicitly extending `ALLOWLIST` in `scripts/auto_dev_pilot.py`, reviewing the code and adding tests. Merely adding a Markdown item cannot authorize arbitrary commands.
