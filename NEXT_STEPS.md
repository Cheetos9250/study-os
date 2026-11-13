# Study OS next actions

## Immediate

1. Code checkpoint c1392bd passed static and browser QA (run 43361053043). Recheck exact-head CI after future changes; fix failures on the same working branch.
2. Use CI screenshot artifacts for future layout comparisons; physical iPad Safari remains unverified until actually tested.
3. Add study planning with an isolated, versioned storage schema; test malformed-state preservation and same-browser tab concurrency before persisting user plans. Never reuse existing quiz/SRS/secret keys. Mark done only on explicit user action.
4. Add editable academic course metadata after defining stable subject identities and restore behavior. Keep original acc/eco/math/eng/zh pages and shared content intact.
5. Validate bundled/external question and card identity mapping before deriving accuracy, coverage, due counts or streaks from real progress.

## Release and infrastructure blockers

- Explicit owner authorization required before merge or production deploy. PR #44 stays draft.
- iPad Safari on real hardware, local backup/restore, cached legacy tabs and cross-device progress require separate verification. Passing WebKit fixtures is not proof of these.
- Cloudflare read-only admin access/evidence is needed to verify deployed Worker, KV namespace, scheduler bindings and Cron runs. HTTP 403 is not a successful health check.
- Production CAS needs independent raw KV backup with checksums, staged restore/readback, writer inventory/freeze, rollback rehearsal and explicit cutover approval. Never change content `api` to a CAS-only endpoint.
- Review #39 independently; do not silently combine exporter behavior with the academic UI change. Do not bulk-verify Notion Draft rows.

## Verification commands

- `node --test tests/*.test.cjs vocabloom/tests/*.test.cjs experiments/study-sync-cas/*.test.mjs experiments/prod-progress-cas/*.test.mjs`
- `python3 -m unittest discover -s vocabloom/tests -p 'test_*.py'`
- `node scripts/study-os-content-audit.cjs`
- `node scripts/study-os-source-overlap.cjs`
- `node scripts/study-os-browser-check.cjs` (requires Playwright Chromium/WebKit; isolated localhost/synthetic data only)
