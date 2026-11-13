# VocaBloom — Safari and cross-device release gate

Status: **NOT EXECUTED on physical iPad Safari**. This is a reproducible manual QA plan, not a passing test report.

## Before testing

- Use a non-production preview from the unmerged feature branch, not the public GitHub Pages production URL. Do not enable automatic deployment, merge PR #41 or repoint production.
- Use a dedicated disposable browser profile or test device with no existing Study OS/VocaBloom history. Do not clear cookies, website data, or localStorage on a device containing real progress.
- Never paste real SYNC_KEY, Cloudflare secrets or personal progress into test logs or screenshots.
- Keep legacy Cloudflare KV read-only and Auto Sync off. Do not run real multi-device writes against the unversioned legacy endpoint.

## Safari visual and interaction acceptance

1. On iPad Safari, open the approved preview and record Safari/iPadOS version, orientation, and test URL.
2. Confirm English-only subject navigation, no Accounting/Economics/Math/Chinese learning content visible in VocaBloom, and responsive navigation in portrait/landscape. Legacy data must remain untouched.
3. Open English Flashcards and Vocabulary Practice. Verify four unique choices per question, immediate answer feedback, score, Previous/Next, and New set. Also inspect meaning-list distractors for repeated Thai senses (for example, `hinge on` versus `contingent on`); do not treat mere substring similarity as proof of duplicate meanings because antonyms such as `unsaturated` and `saturated` may be useful contrasts.
4. Switch tabs and return: active practice answers should remain; switch chapter: answers and session snapshot should reset. Test a chapter with fewer than four meanings and verify a helpful empty state.
5. With Safari developer tools or a disposable browser profile, verify practice answers do **not** change `study-eng`, English SRS keys, or the unified progress key.
6. Refresh Verified content during a practice session: questions and correct options should remain frozen; New set should use refreshed content. With keyboard or VoiceOver focus on the current question heading or answer feedback, verify it remains on the equivalent element after refresh; focus on unrelated controls must not be hijacked.
7. Test VoiceOver focus order, 200% text zoom, touch target sizes, keyboard tab navigation (when available), and reduced-motion settings. Record issues without claiming automatic compliance.

## Disposable local backup/restore acceptance

1. In the isolated profile, create mock learning progress in all five preserved decks, export Full backup, inspect JSON shape and absence of credentials.
2. Cancel restore and confirm no data changes.
3. Restore a complete disposable backup and compare all ten subject/SRS keys plus VocaBloom progress.
4. Try an intentionally incomplete backup: must fail without changing local data.
5. Simulate quota failure only in an isolated harness, never by filling storage on the owner's iPad.
6. Reopen Safari and verify persistence. Test private browsing separately; do not assume it persists.

## Cloud Sync server-side release gate (not approved)

- Confirm exact staging URL and environment separation, independent staging credentials, backend revision generation, atomic `If-Match` enforcement, 409/412 conflict handling and no last-writer-wins.
- Run concurrency tests using disposable staging accounts and data only. Verify two clients reading the same revision cannot both commit successfully.
- Confirm that a changed local answer during an in-flight PUT triggers retry without losing the newer answer.
- Confirm endpoint-specific consent; no inherited Auto Sync when `progress_api` changes.
- Verify no secrets in backup exports, console logs, request URLs, or screenshots.
- **Do not cut over production**, modify Workers/KV, enable Auto Sync or run actual progress writes without separate explicit approval.

## Release decision

Current gate: **BLOCKED** until physical Safari tests and staging CAS atomicity are evidenced. Automated Node tests are necessary but not sufficient. Record failures, reproduction steps, before/after behavior and CI references in the audit document.
