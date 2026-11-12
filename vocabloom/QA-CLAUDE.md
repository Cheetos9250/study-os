# VocaBloom — Independent QA Handoff for Claude
Date: 12 November 2026 (Thailand)
Repository: https://github.com/Cheetos9250/study-os
Site: https://cheetos9250.github.io/study-os/vocabloom/
Automated test: `node --test vocabloom/tests/regression.test.cjs`
GitHub Actions workflow: `.github/workflows/vocabloom-tests.yml`

## Scope
READ-ONLY audit by default. Do not edit GitHub, Cloudflare Worker, or Notion. Do not delete/change existing user learning history. Test only with a new browser profile or disposable data. Do not expose SYNC_KEY in chats, logs, screenshots or commits. If a real Worker write is needed, first obtain explicit approval and a backup; preferably use a separate test environment. Mark untestable cases BLOCKED, not PASS.

## Important implementation context
- Main site: `vocabloom/index.html`
- Existing 5-subject flashcards and study quizzes: `vocabloom/study-integration.js`, `vocabloom/study-decks.json`.
- Unified progress and Cloudflare sync: `vocabloom/unified-progress.js`. Uses existing `data/config.json` API endpoint and `/progress/{acc,eco,math,eng,zh}`.
- Legacy subject pages remain unchanged: `acc.html`, `eco.html`, `math.html`, `eng.html`, `zh.html`.
- Vocabulary game dataset: `data/cards.json`, filtered Verified English cards with a usable English example. Thus this vocabulary count can be smaller than the English flashcard count. Live export may update.
- UI changes: dynamic-neutral weekday text, local SVG favicon, continuous desktop sidebar background, more explanatory mobile labels, public Notion sharing note. Direct Notion page link removed from VocaBloom HTML, but public data export can still contain Notion page URLs.
- Cloud Auto Sync should be disabled by default until explicitly enabled. The shared-computer browser has a "Forget sync key" button. "Full backup" now has a validated "Full restore" with rollback attempt.
- **Unverified:** real production Worker GET/PUT behavior, KV propagation and concurrent writer safety. Only mocked sync is known to pass. Do not assert production sync is safe without end-to-end evidence.

## P0: Data safety and interoperability
1. On a clean browser profile, run the Node regression suite (record command/output and git commit). Check every test passes.
2. On a disposable browser profile, make progress in Accounting and English flashcards, reload, inspect original keys `acc-flashcards-v1-srs` and `eng-vocab-v1-srs`. Confirm original Study OS pages still display prior reviews on same origin/device.
3. For an English term present in both vocabulary exercises and Study OS (for example `accounts payable`), answer a learning/game item and inspect its associated `n-...` SRS key. Also rate a Study Flashcard and check VocaBloom word progress. Check no history is erased or double-counted.
4. Use Full backup on disposable data. Confirm JSON includes 5 subject `study-*` and `*-srs` slots, VocaBloom progress, day history, but not SYNC_KEY. Use Full restore and verify all data returns. Import a malformed JSON and a valid JSON with an incomplete `subjects` map: neither may overwrite existing state. Test restore on a second clean profile; check day counts are not duplicated. Never run restore on real user data.
5. Cloud Sync: verify Auto Sync is off by default, Sync now fails safely for missing/wrong keys, Forget sync key removes the key without clearing scores. Inspect Network/Console and confirm the sync key never appears in the URL, logs, screenshots, or GitHub.
6. **Real cross-device sync only with user approval and backups.** Test two separate browser profiles A/B using a test account/key: A quiz and flashcard -> sync -> B sync -> verify; B update -> sync -> A sync -> verify; test offline/retry and simultaneous writes. Record whether any update is lost, whether server readback matches local and whether the Worker requires additional changes. If test key or Worker access is unavailable, mark BLOCKED.

## P1: Full browser behavior
7. Test all six games to completion: Pick the word, Type the word, Finish the sentence, Listening practice, Match the pairs, Mistake words. Each needs at least one correct and one incorrect answer and a reload/persistence check. Use a fresh browser test profile.
8. Study Flashcards: all five subjects, chapter filters, Flip, Again/Hard/Good/Easy, Due + New, Browse all, Quizzes (Accounting/Economics/Math), wrong-only filter, Summaries. Watch for errors when switching tabs or subjects quickly.
9. Word library: search, filter Notion Verified, favorites, add custom word, backup/restore, Notion refresh. Verify vocabulary count is clearly distinguished from flashcards and duplicates are handled.
10. Daily review: ensure Notion-imported words without illustrations are included through a typing-based review path; avoid picture-only review failing when all due words are Notion entries.

## P1: UI, accessibility, privacy
11. Visit actual deployed GitHub Pages URL on 1366px desktop and 390px mobile (not just local source). Hard reload to bypass caching. Verify no 404s for `study-integration.js`, `unified-progress.js`, `study-decks.json`, `favicon.svg`, `data/cards.json` (relative paths). Record any Console errors and Network statuses.
12. On a long page scroll, sidebar white background should continue for full page; repeat in dark mode and mobile. Verify neutral weekday headline, favicon, sound button tooltip, and mobile navigation labels.
13. Inspect `data/cards.json` and `data/quiz.json` for published Notion URLs or sensitive data. Do NOT change Notion sharing permissions, keys, or dataset without user approval. Report what is visible and remediation options.
14. Audit HTML escaping on imported words and quiz explanations; try harmless text containing angle brackets or quotes in a disposable custom word. Do not test with destructive payloads or real Notion entries.

## Report format
For each finding, include: **Test ID | PASS / FAIL / BLOCKED | exact steps | expected vs actual | evidence (screenshot + console/network where relevant) | severity (P0/P1/P2) | suggested fix**.
Include git commit SHA, time, browsers/viewports, whether tested against real GitHub Pages or local mock, a final list of open risks and a release decision (PASS / CONDITIONAL / BLOCKED).
Do not label real Cloud Sync PASS based solely on a JavaScript mock or static code scan. Return the report in Thai.
