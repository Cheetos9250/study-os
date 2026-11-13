# VocaBloom changelog

All entries below describe an unmerged proposal, not a production release.

## 2026-11-13 — Continuous language development

- Fixed main vocabulary import selecting POS tags instead of Thai meanings for 236 committed Verified words; 573 imported words and their original IDs remain preserved.
- Removed the optional Example prefix from imported pipe-format example sentences.
- Fixed selected-chapter practice losing words deduplicated against another chapter; normalized practice identity comparisons with NFKC.
- Added session-only Retry mistakes for answered incorrect questions without changing SRS, quiz scores or cloud data.
- Added regression coverage for both importer field orders, invalid meaning fields, committed-data translations, cross-chapter duplicates and retry isolation.
- Added project/architecture/decision documentation and current evidence/next steps.
- Added an isolated Chromium/WebKit desktop/tablet browser harness and CI with read-only permissions; real service requests are blocked. Browser execution results are recorded in the audit.

## 2026-11-13 — Round 2 (proposal only)

- Accept reviewed regular inflections in examples while requiring complete tokens and phrasal particles; import 581 committed English words with no loss of the previous 573 IDs.
- Keep partial `securities filing` example excluded; do not rewrite source text.
- Show supplied source examples, translations and references after practice answers; freeze and HTML-escape context.
- Add eligibility/security regression tests and browser scenarios for active content refresh, Full Backup download and cancelled/accepted disposable Full Restore.
- Removed redundant nested distractor deduplication and added a 1,000-card correctness regression; local Node suite now 233 passing tests.
- Verified optimized generation with 233 Node tests, 3 Python tests and all four extended hosted browser cases; narrowed browser push path triggers to relevant app/test/data files.

## 2026-11-13 — Backup safety browser regression (unmerged)

- Extended isolated Chromium/WebKit desktop/tablet QA to reject three malformed Full Backup variants: invalid subjects array, invalid VocaBloom progress array, and missing English subject key.
- Verified each rejection leaves browser storage unchanged; tests use synthetic fixtures and block live services.
- Both CI workflows passed for implementation SHA `f269d5f9514580f75785e71a430042a8db282c68`: regression run `43367785010` and browser run `43367784703`.
- No production data, Worker, Notion, site configuration or existing learner progress changed.

## 2026-11-13 — Restore daily-counter validation (unmerged)

- Reject arrays, nulls and scalar `deviceDays` / `studyDays` maps when restoring a same-device Full Backup, before any local writes.
- Continue discarding cross-device daily counters without validating or importing them, preserving the existing device-isolation rule.
- Added executable regression tests. CI status is tracked in `PROGRESS.md` and the continuous audit; no production restore was attempted.

## 2026-11-13 — Browser-level daily-map regression (unmerged)

- Added disposable Chromium/WebKit QA for rejecting malformed same-device `deviceDays` and `studyDays` maps without modifying localStorage. No new production behavior beyond the prior daily-map validation fix.

## 2026-11-13 — Nested daily-row validation (unmerged)

- Validate per-date restore records before same-device Full Restore: nonnegative finite numeric counters and string-array IDs where present. Reject malformed rows before any local writes.
- Added disposable mock tests for invalid and valid daily-row payloads; CI verification remains pending in `PROGRESS.md`.

- Extended hosted browser QA with direct rejection cases for malformed nested daily counters (negative, nonnumeric and invalid IDs), without writing to live services.

## 2026-11-13 — Legacy backup compatibility regression coverage

- Added synthetic Full Restore tests for missing optional day maps, historical sparse daily rows and isolation from malformed cross-device daily counters. No production behavior changed.

## 2026-11-13 — Full Backup malformed-file regression coverage

- Added isolated execution tests confirming oversized files and malformed JSON cannot trigger restore confirmation, local writes or network calls. No application behavior changed.

## 2026-11-13 — Restore render-error state rollback

- Restore now rolls back the in-memory cloud merged-day cache and remote-status label if an error occurs after the local backup write, alongside existing storage/progress rollback.
- Added synthetic render-failure execution coverage. CI confirmation pending.

## 2026-11-13 — English practice meaning validation

- Multiline English practice answers now require actual Thai characters. English-only fallback text is skipped rather than presented as a Thai meaning; source records and learner progress are unchanged.

## 2026-11-13 — English practice source provenance test

- Added a regression checking rotated generated question answers and distractors against committed Verified Thai vocabulary meanings. No user-facing behavior or source data changed.

## 2026-11-13 — Practice distractor normalization

- Generated English practice now treats headwords and Thai meanings differing only in internal whitespace as duplicates for question/option selection. Source content is unchanged.

## 2026-11-13 — Invisible-separator deduplication

- English practice duplicate detection now ignores invisible Unicode separators in headwords and Thai meanings. Original displayed content, Notion source rows and SRS are unchanged.

## 2026-11-13 — Rotated option normalization audit

- Added a regression ensuring generated English practice options remain distinct after Unicode and whitespace normalization across rotated sets. No runtime or source data change.

## 2026-11-13 — Thai sense overlap guard (draft PR only)

- Changed English Practice distractor generation to avoid exact shared Thai senses in comma-, semicolon-, and slash-separated meanings, including the Verified `hinge on` / `contingent on` case.
- Added synthetic and actual Verified-export regression coverage across rotated question sets. No source translations, IDs, user progress, backup format, cloud settings, or production state changed.

## 2026-11-13 — Ambiguous small-pool empty-state UX (unmerged)

- If a chapter has too few mutually non-overlapping Thai meanings to generate four distinct answer choices, Practice now explains that requirement instead of implying that four different whole-string translations are sufficient.
- Added a regression with four source-shaped words and a shared explicit Thai sense; the resulting empty state contains no answer buttons. No SRS or cloud behavior changed.

## 2026-11-13 — Offline Thai distractor review tool (unmerged)

- Added a read-only CLI to screen committed Verified English translations for possible semantic overlap, plus deterministic tests.
- Captured a human-review queue of initial candidates in `THAI-DISTRACTOR-REVIEW-2026-11-13.md`. Fuzzy candidates are not automatically removed from practice or treated as translation errors.

## 2026-11-13 — Audit parser parity test and Safari QA checklist

- Added an executable full-Verified-export parity check between the semantic-review script and the actual Practice Thai-meaning parser.
- Updated the unexecuted iPad Safari QA checklist to review explicitly overlapping Thai senses without treating antonyms as translation errors. This does not change release or production state.

## 2026-11-13 — Practice completion and repeat-set variety (unmerged)

- Added a completion notice showing correct/total and missed questions after all current Practice questions are answered, with a reminder to use Retry mistakes or New set.
- Updated deterministic option rotation by round number so repeated five- and ten-card sets vary answer placement/distractors while preserving learning identities and frozen Retry mistakes.
- Added Node regressions for partial, imperfect and perfect rounds; five/ten-card replay; and hosted Chromium/WebKit full-session completion without persistent practice writes.

## 2026-11-13 — Practice focus recovery (draft only)

- Restore keyboard focus to the feedback notice after answering, and to the question heading after Practice Previous/Next, Retry mistakes or New set.
- Preserve normal Tab order using programmatic `tabindex="-1"`, avoid scroll jumps where supported, and safely skip DOM focus in unit-test contexts.
- Add Node focus-target checks and hosted Chromium/WebKit checks for answered, next, retry and new-set focus. This change is not a production VoiceOver certification.

## 2026-11-13 — Focus continuity through Verified content refresh (draft)

- Preserve answer-feedback/question-heading keyboard focus while `uBoot` reloads Verified content and rerenders Practice.
- Add a no-DOM/other-controls guard to avoid focus theft outside Practice and Node regressions for the new wrapper.
- Extend the isolated browser refresh scenario to verify focus remains on the feedback after a source update. No data, sync, SRS, source-identity or backup change.

## 2026-11-13 — English Practice pronunciation and review exposure tooling (unmerged)

- Added **Listen** to hear the current English word and **Listen to example** after answering when the Verified source supplies an example, both with `en-US` speech synthesis.
- Hide the example playback action before answering and reject forged pre-answer audio actions; disable audio controls if synthesis is unsupported. No practice persistence, SRS, quiz score, Cloudflare, Notion or backup changes.
- Added Node and isolated browser QA for audio action guards, access labels, disabled fallback, source-only audio, no score/storage writes and real DOM visibility.
- Added `scripts/audit-practice-exposure.cjs` and tests to scan generated Practice choices against review-only Thai similarity candidates.

## 2026-11-13 — Stop stale pronunciation on navigation (unmerged)

- Cancel in-progress Practice audio on answer, Previous/Next, Retry mistakes, New set, chapter switching and leaving Practice, while preserving session-only scores and existing SRS.
- Added synthetic Node tests of cancellation counts and ignored navigation outside Practice. No Cloudflare/Notion, backup, source or production configuration changes.

## 2026-11-13 — Audio failure resilience and 1–4 keyboard answers (draft only)

- Protect Practice answer recording and navigation from speech engine `cancel()` failures; speech playback construction/cancel/speak errors now fail safely with feedback, while unsupported engines disable Listen.
- Add optional hardware-keyboard 1–4 answer shortcuts, matching visible numeric answer labels and accessible `aria-keyshortcuts` attributes.
- Prevent shortcuts on other pages/tabs, in editable controls, dialogs, sidebar focus, with modifiers, key repeat or already answered questions.
- Add actual-action Node tests, browser desktop/tablet keyboard answer and choice-label checks. No source translation, SRS identity, user progress, cloud, backup or production endpoint changes.
