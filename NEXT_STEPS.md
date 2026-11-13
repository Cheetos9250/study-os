# Study OS — Next Steps

Tasks follow: `- [ ] [Priority] [Mode:action] Description`

## Safe to run automatically (no model charges)

- [ ] [P1] [AUTO-READONLY:regression] Run existing offline Node and Python regression suites, store a dated report, and stop without committing or deploying.

## Opt-in AI proposal (not enabled by default)

- [ ] [P2] [AUTO-AI:runner-regression] Propose a small robustness or regression-test improvement to the read-only runner, using only the reviewed file allowlist. Create a Draft PR only after isolated tests pass.

This AUTO-AI item is ignored until a reviewed merge, an explicit repository variable opt-in, and a manually configured Gemini secret. It may use provider quota/billing. See `docs/AUTO_AI_AGENT.md`.

## Human approval required

- [ ] [P1] [APPROVAL:merge] Review draft PR #44 (academic-first homepage) and authorize any eventual merge separately.
- [ ] [P1] [APPROVAL:merge] Review exporter PR #39 and verify Notion data-safety conditions before any eventual merge.
- [ ] [P1] [APPROVAL:merge] Review the read-only runner pilot PR #45 and the stacked AI coding PR independently.
- [ ] [P2] [APPROVAL:ai-api] Review the AI provider, model and budget protections; configure a non-billed key and explicitly enable the feature switch before paid/external API use.
- [ ] [P2] [APPROVAL:production] Keep Production deployment and Cloudflare/Notion/KV data changes manual and separately approved.

Markdown is a task list, never a shell script. Neither pilot evaluates tasks as arbitrary code.
