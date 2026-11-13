# Study OS — S1/S2 Release Gates and iPad Safari QA

Date: 2026-11-13. Scope: draft PR #44 on `feat/study-os-s1-academic-home-20261113`. This is a **test plan**, not proof of a browser test or permission to deploy.

## Gate A — source and automated regression

- [x] Home entry links Accounting, Economics and Mathematics; language is separate.
- [x] Source baseline audit: 427 academic bundled cards, 136 quizzes, 33 summaries.
- [x] Shared legacy English (51) and Chinese (279) bundled cards retained.
- [x] Static tests check source category references, card IDs, quiz answer indexes and summary table columns.
- [x] Static tests guard course tab names and existing per-subject storage namespace strings.
- [ ] Latest PR-head CI green **after all changes**; inspect the exact commit SHA and run conclusion.
- [ ] Independent review of the PR diff for unrelated production configuration changes.

These are *structural* checks; they do not prove a correct accounting answer or an accurate economics explanation.

## Gate B — manual iPad Safari checks (not yet executed)

Use a clean/private Safari session for layout checks first. Avoid tapping the destructive **ล้างความคืบหน้า** action on any browser profile that contains real progress.

| Device/state | Action | Expected result |
|---|---|---|
| iPad portrait | Open the preview build's `index.html` | Three academic subjects visible; no horizontal overflow |
| iPad landscape | Rotate the screen | Cards and navigation remain readable; safe-area spacing preserved |
| iPad, light/dark appearance | Toggle appearance | Text contrast, links, and focus states remain readable |
| iPad touch | Open each subject | `acc.html`, `eco.html`, `math.html` load |
| iPad touch | Open the three tabs in each course | Cards, summary and practice remain usable |
| iPad touch | Flip card and answer practice | Correct controls react without accidental double activation |
| iPad touch | Navigate to VocaBloom | Language app opens; Study OS home does not claim to host language courses |
| iPad touch | Expand legacy links | English/Chinese old pages remain reachable |
| iPad, disconnected network | Open cached page only if already cached | Do not assume offline capability; document actual result |
| Keyboard (if available) | Tab through homepage links | Focus visible and logical reading order |

**Important:** A local GitHub branch is not a hosted preview automatically. Do not test production Pages and claim it validates the unmerged branch. A safe isolated preview is needed to test this exact draft build.

## Gate C — production data safety (blocked)

- [ ] Independent administrator-owned Cloudflare KV backup with timestamp and checksum.
- [ ] Verified restore/readback rehearsal to a non-production namespace.
- [ ] Confirm all writers and scheduling behavior, plus a writer-freeze plan.
- [ ] Document rollback steps and explicit operator authorization.
- [ ] Explicit owner approval for merge and production deployment.

Until Gate C is complete, **do not** cut over production progress, enable CAS, import/restore data, change API endpoints, or claim cross-device progress is safe.

## Data provenance / limitations

`vocabloom/study-decks.json` is a read-only legacy bundle. Its counts are not the same as Notion Verified counts. Bundled and Notion quiz counts may overlap. Static tests only establish that the current structure conforms to the observed baseline. No live iPad browser session, Notion writes, KV changes, Cloudflare deployment or production data test was performed in this QA plan.
