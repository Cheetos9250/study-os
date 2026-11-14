# VocaBloom — Thai Distractor Semantic Review Queue (2026-11-13)

**Status: screening only, no source edits.** This file is on Draft PR #41; it is not a production linguistic approval.

## Reproduce

Run from the repository root:

```sh
node vocabloom/scripts/audit-thai-distractors.cjs
node vocabloom/scripts/audit-thai-distractors.cjs --all
node --test vocabloom/tests/english-distractor-review.test.cjs
```

The audit reads committed `data/cards.json` and returns JSON with a concise top-20 list by default or all flagged pairs using `--all`. It never connects to Notion/Cloudflare, writes data, changes answers or excludes cards.

## Initial read-only screening

- Source: 582 English Vocab rows marked Verified in the committed export.
- Exact punctuation-separated shared sense: 1 identified pair (`hinge on` / `contingent on`). The English Practice branch now filters this explicit collision from the answer and distractors.
- Approximate review candidates: 87 distinct word pairs, using normalized Thai text, substring containment of at least 5 characters, or Thai character-bigram Jaccard similarity of at least 0.72 with at least 3 overlapping bigrams. These are *not 87 errors*.

## Examples requiring human linguistic judgment

| Source words | Committed Thai meanings | Review concern |
| --- | --- | --- |
| hinge on / contingent on | ขึ้นอยู่กับ / ขึ้นอยู่กับ; มีเงื่อนไขว่า | Exact shared sense; already screened by runtime guard |
| plunge / tumble | การร่วงลงอย่างรวดเร็ว / ร่วงลงอย่างรวดเร็ว | Near-equivalent meaning |
| alleged / allegedly | ที่ถูกกล่าวหา / ตามที่ถูกกล่าวหา | Grammatical role and overlapping meaning |
| habitat / dwelling | ถิ่นที่อยู่อาศัย / ที่อยู่อาศัย | Related but not identical concepts |
| yield / return | ให้ผลตอบแทน / ผลตอบแทน | Shared finance concept but different role |
| unsaturated / saturated | ไม่อิ่มตัว / อิ่มตัว | **Opposite meanings**; substring similarity is a false-positive warning, not grounds for exclusion |
| predict​able / project | คาดการณ์ได้ / คาดการณ์ | Grammatical distinction; may be a useful distractor |
| valuable / value | มีมูลค่า / มูลค่า | Adjective versus noun |

## Reviewer process

1. Read both full Verified source records, their POS, examples and intended question context.
2. Distinguish genuine indistinguishable Thai answer options from near-synonyms, grammatical contrasts and opposites.
3. If a deterministic false-answer ambiguity is confirmed, add a minimal synthetic regression and a safe filtering rule. Do not silently rewrite Notion Verified text.
4. Retest rotated English Practice, Retry mistakes, frozen sessions, non-persistence and Chromium/WebKit. Physical iPad/VoiceOver remains a separate release gate.

## Boundaries

The fuzzy audit **does not automatically suppress any distractor**. Thai morphology and shared substrings can flag valid antonyms and related vocabulary. Runtime only screens exact punctuation-delimited Thai sense collisions. Draft PR only: no merge, deploy, private backup read, Worker/KV, Notion, migration or production data changes.

## Generated-question exposure check — 2026-11-13

A second read-only script narrows the existing 87 *possible* translation-pair warnings to those actually seen together as a correct answer and an incorrect option in generated Practice rounds:

```sh
node vocabloom/scripts/audit-practice-exposure.cjs --rounds=60
node vocabloom/scripts/audit-practice-exposure.cjs --rounds=60 --all
```

The script runs the existing English card adapter and Practice question generator (without browser storage or cloud calls) for the All category and every English chapter. A read-only scan of the branch files at implementation SHA `91ae3f7d8b8c6f455019d9df80afea254398d74f` reviewed 60 rounds per category, **3,000 questions** / **12,000 choices**, with **zero exact correct-vs-distractor exposures** among the 87 fuzzy review candidates in these bounded rounds.

**Interpretation:** This is encouraging structural screening, not complete linguistic certification, not an exhaustive audit of future offsets or all possible choices, and not authority to rewrite source meanings. Thai antonyms and related grammatical roles may still be useful distractors. Do not auto-filter using fuzzy similarity. See the original list above for manual review.
