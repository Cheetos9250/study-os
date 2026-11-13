# VocaBloom decisions

## 2026-11-13 — Language scope and backward compatibility

English B1–B2 first, multilingual later. Hide academic subjects from VocaBloom navigation while retaining all five shared legacy decks and persistent IDs. Study OS owns academic learning.

## 2026-11-13 — Importer translation fields

Verified pipe rows occur as both `meaning | POS | example` and `POS | meaning | example`. Select the Thai-containing field from the first two fields; reject rows without a usable Thai meaning rather than displaying a POS tag. Strip an optional Example prefix. Preserve exact imported word IDs. The example eligibility rule was subsequently refined in round 2 below.

## 2026-11-13 — Practice personalization without progress migration

Offer Retry mistakes using only answered incorrect items in the frozen practice session. Exclude correct and unanswered questions. Reuse the original options/answer indexes, including when source content refreshes. Retry starts a new in-memory round; it does not claim persistent mastery or update SRS. New set returns to the normal vocabulary pool.

## Deferred

Do not alter production Notion deduplication for multi-sense `rebound` (issue #40), Chinese/Pinyin content, sync endpoints or CAS rollout. Partial-headword examples and general irregular forms still require a separate policy.

## Original example matching acceptance criteria (implemented in round 2)

Evaluate whole English tokens rather than arbitrary substring inclusion. Permit explicitly supported inflections (`modify`/`modified`, `rally`/`rallied`, `authority`/`authorities`) and inflect only the verb token in phrasal verbs (`ramp up`/`ramped up`). Tests must reject substring false positives and sentences that omit a required token (`securities filing` versus only `filing`). Preserve source text and existing IDs; report uncertain cases for review rather than inventing examples. This acceptance criterion does not authorize production content edits. Round 2 changes only branch-side import eligibility using the rules below.

## Round 2 — bounded POS-guided matching and supplied feedback

Use whole token sequences and source POS to permit regular plural/conjugated forms. Inflect the first token of recognized phrasal verbs and the last token of other phrases; do not accept missing/reordered particles or arbitrary derivations. Doubled-consonant handling is explicit for audited `admit`/`flop`, rather than guessing word stress. This retains all 573 previous IDs and adds eight reviewed entries; it is not a full morphology engine.

Show only source-supplied examples/translations after a practice answer, frozen with its questions/options and HTML-escaped. Do not invent text, reveal the answer through context before answering, or turn session-only Practice into persisted SRS scoring.

## Round 2 — deterministic distractor performance

Rely on the existing normalized unique-meaning pool when choosing distractors; exclude the current card and rotate candidates instead of re-scanning for duplicates inside every option. Preserve active snapshots and question/card IDs. Option ordering for newly generated sessions may change; it is not persistent learning progress. The 650-question Thai-atom audit is a screening check, not authority to mark all language content semantically Verified.

## 2026-11-13 — Reject malformed restore payloads before local writes

Keep Full Restore fail-closed for invalid backup object types or missing subject keys. Exercise rejection against the actual browser restore handler using disposable fixtures, not real user backups. Do not interpret mock browser success as production CAS or iPad Safari verification. Preserve all five legacy subjects and rollback protections.

## 2026-11-13 — Daily counter restore validation

Require record-shaped daily counter maps for same-device Full Restore, rather than treating any JavaScript object (including arrays) as a valid map. Keep the existing cross-device rule: do not import source device counters. Reject malformed same-device input before confirmation and any local write; no production data migration is authorized.

## 2026-11-13 — Nested daily counter safety

Validate nested same-device daily rows before Full Restore writes. Preserve valid historical optional fields, require finite nonnegative counters and string-array IDs if supplied, and continue discarding cross-device counters. Do not silently normalize malformed backup statistics into learner progress.

## 2026-11-13 — Full Restore failure atomicity

On a failure after local backup writes, restore the cloud UI merged-day cache and remote-status label together with localStorage and in-memory progress. A successful restore still clears the merged-day cache and marks progress as restored locally; this does not trigger cloud sync.

## 2026-11-13 — Avoid explicit duplicate Thai senses in distractors

A read-only audit of 582 Verified English rows identified a source collision: `hinge on` translates to `ขึ้นอยู่กับ`, while `contingent on` includes `ขึ้นอยู่กับ; มีเงื่อนไขว่า`. Whole-string normalization alone can place these ambiguous choices in one question. Reject distractors that repeat an exact punctuation-delimited Thai sense; also keep distractors pairwise disjoint. Preserve complete original source meanings in feedback and skip questions lacking three safe alternatives. This is a conservative ambiguity guard, not a judgment that different-looking translations are semantically distinct.

## 2026-11-13 — Fuzzy similarity is review-only

Automated Thai substring and character-bigram matches cannot reliably distinguish synonym ambiguity from grammatical contrast, related meanings or antonyms. A separate offline report/CLI will list candidates; **do not automatically reject vocabulary or distractors** based solely on fuzzy scores. Exact punctuation-delimited sense overlap retains its narrowly scoped runtime guard.

## 2026-11-13 — Session feedback is local and repeat sets vary deterministically

Expose a clear complete-round message only when all current frozen Practice questions have answers, without recording a persistent score. Preserve existing Retry mistakes and New set actions and their in-memory state.

Retain ten-card offset rotation for coverage, but vary distractor starting positions and multiple-choice placement with the integer round count. This avoids an identical visible replay for five- and ten-word decks without random-state persistence or altering card IDs, source translations, previous answers, backups or SRS.

## 2026-11-13 — Restore question/feedback focus after Practice rerender

Practice replaces its DOM after answering or switching the current question, which can otherwise lose keyboard focus. Focus the newly inserted feedback status after answering and the new question heading after practice navigation/retry/restart. Do not alter the Verified Quiz navigation path or stored learning progress. Automated Chromium/WebKit focus checks are useful but a physical iPad VoiceOver pass remains required before release.

## 2026-11-13 — Async refresh should preserve focus but not hijack it

Preserve the active Practice question or feedback status through both renders in an asynchronous `uBoot` refresh. Restore focus only when it originated from those two recognized elements within the active Practice content; leave unrelated controls and pages alone. Keep the existing read-only source refresh and in-memory frozen snapshot semantics. Hosted browser checks do not certify physical Safari/VoiceOver.

## 2026-11-13 — Pronunciation respects answer gating and source provenance

Use the browser's Speech Synthesis API for optional English Practice word pronunciation, without recording a pronunciation score or changing SRS. A source-example pronunciation control appears **only after the answer is recorded**, and the action handler verifies the answer gate even if a synthetic click is forged. Speak the exact frozen source-supplied English example; do not generate or translate audio content, send external requests or modify source records. Disable the control where browser speech synthesis is unavailable.

Approximate Thai meaning matches are prioritized for human review only if they appear together in actual generated answer/distractor choices. They must never silently suppress words, alter Verified Notion data or be interpreted as proven wrong answers.
