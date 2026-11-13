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
