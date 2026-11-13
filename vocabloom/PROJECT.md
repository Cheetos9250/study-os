# VocaBloom

VocaBloom is a dedicated language-learning application. The first release focuses on English B1–B2. Chinese/HSK and additional languages are future work; academic subjects belong to Study OS.

## Source of truth and continuation

- Repository: `Cheetos9250/study-os` (shared legacy repository, not a separate VocaBloom repo).
- Working proposal: `feat/vocabloom-p1-english-ui-20261113`, Draft PR #41.
- Read `AGENTS.md` first, then `ARCHITECTURE.md`, `PROGRESS.md`, `NEXT_STEPS.md`, `DECISIONS.md`, `CHANGELOG.md` and `CONTINUOUS-AUDIT-2026-11-13.md` before continuing.
- Earlier Handoff v1.2 describes boundaries and historical infrastructure. Current branch files and live GitHub reads take precedence for implementation status.

## Priorities

Vocabulary, flashcards, language exercises, spaced repetition, learning progress, personalization, content quality, and safe cross-device synchronization. The current proposal includes English-only navigation and session-only vocabulary practice. Generated practice is explicitly distinct from Verified Notion quizzes.

## Preservation and release

Preserve all five legacy subject decks, card IDs, SRS/progress keys and content exports. Do not merge, deploy, change production endpoints/secrets, write production progress, enable Auto Sync, or migrate/delete real data without specific owner authorization. Successful offline tests do not establish live Cloudflare persistence or physical Safari behavior.
