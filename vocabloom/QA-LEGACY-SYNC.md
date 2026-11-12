# Independent QA — Legacy Study OS automatic-sync safety

**Branch:** `fix/legacy-stud-OS-manual-sync-only` — **do not merge before independent QA**.

## Why
Independent Claude QA round 3 showed that opening `eng.html` with an existing `study-sync-key` made six cloud requests without the user clicking. VocaBloom's opt-in setting does not govern the old five subject pages, and the live Worker is still vulnerable to concurrent lost updates (SY-08).

## What changed
- All five `acc.html`, `eco.html`, `math.html`, `eng.html`, `zh.html` now **never auto GET/PUT progress** on startup, tab visibility, local quiz answers, SRS rating, or refresh.
- LocalStorage save/restore continues to work as before. Both `save()` and `saveS()` still persist locally.
- A user can explicitly click `☁ ซิงก์ด้วยตนเอง`; the page must first show a `window.confirm` explaining GET+PUT for that subject, backup advice and concurrent sync risk.
- Entering SYNC_KEY shows a disclosure prompt before any progress write and then demands explicit confirmation.
- **Do not apply merged remote data locally until remote PUT succeeds**; if the Worker responds with an error, keep the local records untouched.
- The explicitly pressed `บันทึกลง Notion` / `/review` workflow is intentionally not disabled. Ensure it still requires deliberate user interaction and works on a mock.
- No Worker, Notion data, production keys or user scores changed.

## Claude test plan
1. Test all 5 legacy pages with a preexisting fake `study-sync-key`, nonempty local quiz and SRS entries. After loading and waiting >8s, assert **0 /progress requests** and unchanged scores.
2. Rate multiple flashcards, answer quizzes, trigger page `visibilitychange` and reload. Assert **0 /progress requests** and local progress persisted correctly; compare card IDs and timestamps.
3. On each page, click `☁ ซิงก์ด้วยตนเอง`. Deny confirmation: **0 progress requests**. Accept: exactly one GET + one PUT for the selected subject. Verify payload and stored local quiz/SRS values.
4. Mock 401, 409, 500 and network errors on GET and PUT: previously saved local progress **must not be overwritten**; show failure status.
5. No stored key: click `ตั้งรหัสซิงก์`; prompt must disclose the risk, cancel must make no requests; entering a fake key should still require a separate confirmation before any GET/PUT.
6. Check explicitly pressed `บันทึกลง Notion` still works via mocked `/review`, and does not accidentally start `/progress` autosync.
7. Check desktop/mobile UI (1366px,390px), no console errors; cloud status understandable in Thai.
8. Run `node --test vocabloom/tests/*.test.cjs`; 26 tests should pass, including 15 new legacy sync safety tests. Confirm GitHub Actions.
9. Recheck compatible behavior after future PR #5 changes `page_id` for exported Notion rows. Do not merge PR #5 and this PR without a combined regression check.

**Scope:** This is a temporary frontend safety mitigation. Real production Cloud Sync remains **BLOCKED** until the deployed Cloudflare Worker implements atomic revision checking and an isolated real integration test passes. Do not try real SYNC_KEY or modify live Worker. Report PASS/FAIL/BLOCKED, exact steps and evidence, in Thai.
