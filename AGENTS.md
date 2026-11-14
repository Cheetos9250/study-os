# AGENTS.md — Study OS (shared repository)

Repository-wide guidance for AI development tools. This repository `Cheetos9250/study-os` currently contains **two products**: Study OS and the language-learning app VocaBloom. Do not conflate their product scopes or assume they are already separate repositories.

## Product ownership
- **Study OS:** academic learning and planning for Accounting (`acc.html`), Economics (`eco.html`), Mathematics (`math.html`) and future non-language subjects; `index.html` is a shared entry point.
- **VocaBloom:** language learning (English first; Chinese later), primarily under `vocabloom/`. Follow `vocabloom/AGENTS.md` when working on that directory or its legacy integrations in `eng.html` and `zh.html`.
- Preserve existing language entry points and data during any proposed separation. Do not delete or rewrite legacy English/Chinese features merely to clarify the product boundary.
- Life OS is a different repository: `Cheetos9250/personal-life-os`. Prefer explicit, read-only inter-app links/integrations before introducing shared identity or write paths.

## Begin every session by checking reality
1. Inspect the repository, active branch/head SHA, existing draft/open PRs, and CI run results for the **current** commit.
2. Read the files present on the relevant branch: project handoffs and `README.md`, `PROJECT.md`, `ARCHITECTURE.md`, `PROGRESS.md`, `NEXT_STEPS.md` if available. Do not claim a file is on `main` when it exists only in a draft PR or external source.
3. Read the affected HTML/JS, `data/config.json`, `scripts/sync_notion.py`, `.github/workflows/`, and relevant `vocabloom/` safety documents before editing.
4. Distinguish local implementation, passing tests, green CI, merge and live deployment. Missing access or evidence means **unverified**, not successful.

## Technical orientation
- `acc.html`, `eco.html`, `math.html`: academic subject entry points.
- `data/cards.json`, `data/quiz.json`: exported learning content. `data/config.json`: API endpoint/configuration used by clients.
- `scripts/sync_notion.py` and `.github/workflows/sync.yml`: existing Notion Verified-content export/scheduled sync; inspect side effects before running.
- `vocabloom/`: language UI, progress sync, safety reviews, and tests. A nested `AGENTS.md` adds VocaBloom-specific rules.
- Relevant nonmutating checks, as supported by the checkout:
  - `node --test vocabloom/tests/*.test.cjs`
  - `python3 -m unittest discover -s vocabloom/tests -p 'test_*.py'`
- Validate HTML/data contracts and browser behavior where test tooling permits. Never describe mock or synthetic evidence as live cross-device/production verification.

## Hard safety boundary
- **No automatic PR merges, production deploy, GitHub Pages release/build trigger, Worker/KV/D1/Notion mutation, production migration, CAS cutover, sync activation, or live-data import without explicit user approval.**
- **No secrets/config/environment changes or destructive operations without explicit approval.**
- Run tests on fixtures, fake credentials, mock endpoints or isolated disposable staging assets; do not trigger scheduled/workflow sync actions as a side effect of verification.
- Preserve progress identity, explicit user consent, export Verified filtering, no-duplicate guarantees and backwards compatibility. Never overwrite live learning histories.
- Do not commit API keys, tokens, private Notion records or real user-study data.

## Work style and cross-model continuity
- Carry out multiple safe development steps per request: inspect → implement → test → fix → write evidence; do not stop only because a draft PR exists.
- Keep work on focused branches and create **draft PRs**. Inspect existing PRs to avoid duplicate or conflicting changes. Avoid unapproved merges or releases.
- At the end, update actual GitHub status/handoff documents **if present in the working scope**; otherwise supply a traceable PR summary without pretending absent Markdown files were updated.
- Include repository, branch, commit SHA, PR URL, files changed, test commands/results, CI state, unresolved blockers and next steps. A different AI or account must independently connect to GitHub; this file is not a credential or memory store.
