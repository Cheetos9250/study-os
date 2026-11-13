# VocaBloom decisions

## 2026-11-13 — Language scope and backward compatibility

English B1–B2 first, multilingual later. Hide academic subjects from VocaBloom navigation while retaining all five shared legacy decks and persistent IDs. Study OS owns academic learning.

## 2026-11-13 — Importer translation fields

Verified pipe rows occur as both `meaning | POS | example` and `POS | meaning | example`. Select the Thai-containing field from the first two fields; reject rows without a usable Thai meaning rather than displaying a POS tag. Strip an optional Example prefix. Preserve exact imported word IDs and the existing example eligibility rule.

## 2026-11-13 — Practice personalization without progress migration

Offer Retry mistakes using only answered incorrect items in the frozen practice session. Exclude correct and unanswered questions. Reuse the original options/answer indexes, including when source content refreshes. Retry starts a new in-memory round; it does not claim persistent mastery or update SRS. New set returns to the normal vocabulary pool.

## Deferred

Do not relax exact-headword example checks in this patch: inflected examples need a deliberate morphology/content policy. Do not alter production Notion deduplication for multi-sense `rebound` (issue #40), Chinese/Pinyin content, sync endpoints or CAS rollout.
