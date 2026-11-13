# VocaBloom — Development Progress

Updated: 2026-11-13 (feature branch only)

## Scope

VocaBloom is a **language-learning application**. English B1–B2 is the first learning experience; Chinese and other languages follow later. Accounting, Economics and Math belong to Study OS, not the VocaBloom presentation. The five legacy deck IDs, storage keys, SRS and quiz data remain preserved.

## Current state

- Branch: `feat/vocabloom-p1-english-ui-20261113`, Draft PR #41. **Not merged or deployed**.
- English-only navigation and integrated English Flashcards, chapter filtering, local-only Vocabulary Practice (10 questions/4 distinct Thai options), and Verified quiz provenance are implemented on the branch.
- Practice answers stay in session and do not modify Study OS quizzes, SRS or progress. Invalid/missing choices are rejected, chapter changes reset the session, and active questions are frozen during asynchronous content refresh.
- Verified English content audit against committed `data/cards.json`: 582 rows, 413 pipe-formatted (236 meaning-first, 177 part-of-speech-first) and 169 multiline. The meaning parser now supports both pipe orders. There are no Verified English quiz records in the committed quiz export; generated Practice is clearly labeled as distinct.
- Executable Node tests exercise disposable mock Full Backup/Restore, local rollback and async sync races; client-side CAS/legacy sync, endpoint-specific consent and credential scoping; committed English content quality. GitHub Actions passed for the final code/test commit `beefd11d628bd0bc87424dbaea7785c93e1b0800`.
- Practice accessibility improvements add polite live status announcements for scores and answer feedback, question descriptions on options, and explicit selected-answer state. Node regression passed at commit `6fd9a8b6e7895158c312559ea364179a14efae55` (run 43359349142). Physical iPad VoiceOver remains untested.
- The detailed evidence and links are in `P0-P1-ENGLISH-EXPERIENCE-AUDIT.md`.

## Safety boundary

No merge, production deploy, Notion change, Cloudflare Worker/KV change, production migration, Auto Sync activation or real progress writes were performed. Node mock results **do not** establish actual Safari or backend CAS behavior.

## Release gate

**BLOCKED** pending physical iPad Safari/VoiceOver testing and independent staging CAS atomicity/readback verification, plus explicit owner authorization for any production deployment or migration. See `SAFARI-RELEASE-QA.md` and `PHASE-6-PRODUCTION-CUTOVER-READINESS.md`.
