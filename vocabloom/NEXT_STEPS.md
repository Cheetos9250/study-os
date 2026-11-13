# VocaBloom — Next Steps

Updated: 2026-11-13

## Allowed on feature branch without production access

1. Review the remaining `securities filing` partial-headword example and evaluate explicit irregular forms only when source examples require them. Bounded regular matching now imports 581 entries with all 573 previous IDs preserved. Do not edit Notion records or invent examples.
2. Continue semantic review of ambiguous senses/distractors before adding new question types; a structural audit of 650 rotated questions found no exact shared Thai-meaning atoms, which is not a full linguistic review. Source example/translation feedback, Retry mistakes and efficient unique distractor rotation are implemented; keep context frozen and SRS isolation intact.
3. Backup/rollback, Thai-script/source-grounding, whitespace and invisible Unicode separator deduplication passed hosted CI (latest guard regression 43379006639, browser 43379006644). New test-only normalized option uniqueness audit SHA `6775d45b667e12298409b3557f9ca6081d8916af` requires regression 43379340424 and browser 43379338387 verification. Continue human semantic review of ambiguous senses/distractors. Real historical backup compatibility requires an authorized private fixture; physical Safari and staging cross-device remain separate gates.
4. Keep project/architecture/decision/changelog documents and the current evidence in `CONTINUOUS-AUDIT-2026-11-13.md` aligned. Older P0/P1 audits are historical snapshots; do not replace their recorded results with assumptions.

## Requires a real test environment or user approval

1. Execute `SAFARI-RELEASE-QA.md` on a physical iPad using a disposable browser profile and an approved non-production preview.
2. Independently verify staging CAS persistence, strong revisions and two-client conflict handling with synthetic staging records.
3. Obtain a fresh authoritative private backup of all five production progress subjects before any contemplated migration.
4. Explicitly approve and separately authorize any deployment, `progress_api` cutover, data migration, or Auto Sync enablement. Do not assume a request to “continue” grants these permissions.

## Non-negotiable

Do not merge PR #41, deploy, change Cloudflare Worker/KV/Notion, delete/migrate old progress or expose secrets without explicit authorization. Keep existing `data/config.json` `api` pointing to the original Notion content Worker.

## Follow-up after explicit-sense guard

- Code/test SHA `1a2b4e96a8583fcf50b75e78d336ef0b0cd32fa7` rejects exact Thai sense collisions in distractors; regression [43380366218](https://github.com/Cheetos9250/study-os/actions/runs/43380366218) passed. Verify the final conclusion of browser run [43380366207](https://github.com/Cheetos9250/study-os/actions/runs/43380366207) before treating it as a completed browser gate.
- Evaluate remaining semantic overlap not indicated by comma/semicolon/slash delimiters; do not auto-rewrite Verified source meanings. Check small chapter pools with fewer than four mutually disjoint Thai senses, ensuring a clear empty-state explanation.
- Physical iPad Safari/VoiceOver, authorized historical backups and staging CAS remain separate unverified release gates. Do not merge/deploy or access production records.

### Small-chapter fallback follow-up

- The new empty-state wording and synthetic no-answer-button test at SHA `6c427d2b59c16f12a39dbadaf9ee76fbf8417678` passed regression [43380708719](https://github.com/Cheetos9250/study-os/actions/runs/43380708719). Verify final browser [43380708685](https://github.com/Cheetos9250/study-os/actions/runs/43380708685).
- Continue reviewing meanings with **semantic** overlaps that exact punctuation-delimited matching cannot detect, and ask for an approved private fixture before testing real historical backups. Physical Safari and staging CAS are still release-blocking.

### Human review queue and release gates

- Run `node vocabloom/scripts/audit-thai-distractors.cjs --all`, then review the candidates documented in `THAI-DISTRACTOR-REVIEW-2026-11-13.md`. The initial scan flagged 87 possible pairs but **not 87 confirmed mistakes**. Keep antonyms/grammatical contrasts unless separately proven ambiguous in a real question.
- Audit/test SHA `4f43f9ec599fbfec69fff9b71b7c0643e95e7e00` passed [regression 43381193510](https://github.com/Cheetos9250/study-os/actions/runs/43381193510); check final browser [43381193520](https://github.com/Cheetos9250/study-os/actions/runs/43381193520).
- Retain all earlier physical iPad Safari/VoiceOver, real historical backup, staging CAS and explicit deployment approval gates.

### Audit parser parity gate

- The audit parser parity regression SHA `c096dec49caaa99b8ead9a8750c5d01be957e9df` passed [regression 43381503376](https://github.com/Cheetos9250/study-os/actions/runs/43381503376). Verify browser [43381503455](https://github.com/Cheetos9250/study-os/actions/runs/43381503455), plus the exact latest documentation head before concluding CI.
- Manual iPad QA still requires a separate authorized preview and disposable profile; no physical test was performed in this chat.

### English Practice completion / replay follow-up

- Session completion summary and hosted full-round QA at SHA `dd1cd111e18710390c581ea3922a30a3ba5911fa` passed regression [43382182948](https://github.com/Cheetos9250/study-os/actions/runs/43382182948) and browser [43382182871](https://github.com/Cheetos9250/study-os/actions/runs/43382182871).
- Deterministic New set variation for small five/ten-card chapters at SHA `8e3affa83f699309cb06793844e9eb20ee355893` passed regression [43382305310](https://github.com/Cheetos9250/study-os/actions/runs/43382305310); verify final browser [43382305336](https://github.com/Cheetos9250/study-os/actions/runs/43382305336).
- Next low-risk improvement: verify nonvisual accessibility of the completion status (live updates, focus continuity after answering) in hosted browser and, separately, on a **physical iPad Safari + VoiceOver** with a disposable non-production preview.

### Current practice focus gate

- English Practice browser focus changes at SHA `b991ac24cb307ab29ed9b8f8e0d9b3a5fbc60533` passed regression [43382827489](https://github.com/Cheetos9250/study-os/actions/runs/43382827489); verify final [browser 43382827491](https://github.com/Cheetos9250/study-os/actions/runs/43382827491). If failing, inspect the exact failing assertion/job log and correct source or test before documenting a pass.
- On an authorized preview with a disposable physical iPad Safari profile, manually verify VoiceOver announcement of answer feedback, focus after navigating Practice, keyboard-only navigation, and 200% zoom. Do not assume hosted WebKit emulation is physical iPad evidence.
- Keep remaining semantic distractor reviews, private backup readback and staging CAS verification separate; no production sync/deploy approvals are implied.

### Verified hosted focus gate, remaining manual checks

- The focus test SHA `b991ac24cb307ab29ed9b8f8e0d9b3a5fbc60533` passed [regression 43382827489](https://github.com/Cheetos9250/study-os/actions/runs/43382827489) (**258/258 Node, 3/3 Python**) and [browser 43382827491](https://github.com/Cheetos9250/study-os/actions/runs/43382827491) (**4/4 hosted Chromium/WebKit desktop/tablet**, no live service requests). Earlier pending notes are superseded.
- Next: inspect actual keyboard/VoiceOver announcement and focus on a **physical iPad Safari** with disposable data in an approved non-production preview; document browser/iPadOS versions and any failed steps. Do not merge/deploy on the strength of hosted QA alone.
- Continue human review of Thai-meaning ambiguities, authoritative private backup/readback and synthetic staging CAS concurrency only in their separate authorized environments.

### Async refresh focus verification and remaining gates

- The latest application/test SHA `159ecb5d0e890fc18e0ea3a22b35e81d194cddcf` passed [regression 43383655509](https://github.com/Cheetos9250/study-os/actions/runs/43383655509) (259 Node + 3 Python) and [isolated browser 43383655513](https://github.com/Cheetos9250/study-os/actions/runs/43383655513) (four Chromium/WebKit desktop/tablet cases, zero live requests).
- On a separately approved non-production preview and disposable physical iPad Safari session, check VoiceOver announcement and focus persistence during Verified content refresh, Previous/Next, Retry mistakes, New set, portrait/landscape and 200% zoom.
- Continue manual review of semantic distractor candidates and separate staging CAS/backups only under the existing release gates. Do not merge/deploy or migrate real progress without explicit authorization.

### Post-pronunciation / real-choice exposure follow-up

- The code/test SHA `91ae3f7d8b8c6f455019d9df80afea254398d74f` passed [regression 43386329577](https://github.com/Cheetos9250/study-os/actions/runs/43386329577) (265 Node + 3 Python) and [isolated browser 43386329516](https://github.com/Cheetos9250/study-os/actions/runs/43386329516) (all 4 hosted Chromium/WebKit desktop/tablet cases; zero live service requests).
- Review potential Thai meaning collisions using `node vocabloom/scripts/audit-practice-exposure.cjs --rounds=60 --all` (read-only). Initial scan of 3,000 generated questions / 12,000 options found 0 fuzzy-pair answer/distractor exposures, but **this does not certify translation quality or all future rotations**; expand bounded sampling and manually review source POS/context if needed.
- Execute audio playback, speaker volume/unavailable-engine behavior, VoiceOver announcement, tab/feedback focus and full source-example answer gating on **physical iPad Safari with disposable data and an authorized preview**, not production.
- Staging CAS persistence/concurrency, authoritative historical five-subject backup and explicit owner approval still gate any sync migration or release. No automatic merge/deploy.

### Pronunciation interruption follow-up

- After the passing synthetic regression [43387274942](https://github.com/Cheetos9250/study-os/actions/runs/43387274942), verify final [hosted browser 43387275139](https://github.com/Cheetos9250/study-os/actions/runs/43387275139) for the code/test SHA `f02ae1c5107a918e5a660bf101e25b7d96f5cd32`.
- Test actual speaker output, speech cancellation when advancing/answering, browser-disabled audio, exact source examples, VoiceOver and focus on **physical iPad Safari in an approved non-production preview**. Headless Chromium/WebKit alone cannot certify audible sound.
- Keep real five-subject backup, staging CAS/cross-device conflict testing and explicit production approvals outstanding.

### Pronunciation interruption CI cleared (hosted only)

- [Regression 43387274942](https://github.com/Cheetos9250/study-os/actions/runs/43387274942) passed **266/266 Node plus 3/3 Python**; [Browser 43387275139](https://github.com/Cheetos9250/study-os/actions/runs/43387275139) passed **4/4 Chromium/WebKit desktop/tablet** with zero live service requests for code/test SHA `f02ae1c5107a918e5a660bf101e25b7d96f5cd32`. The previous pending note is superseded.
- Remaining release blockers: **physical iPad Safari speaker playback/VoiceOver and interruption behaviour**, real authorized backup coverage, staging CAS/concurrency, and explicit owner approval for production sync/deployment.
