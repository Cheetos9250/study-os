# VocaBloom — Next Steps

Updated: 2026-11-13

## Allowed on feature branch without production access

1. Review the remaining `securities filing` partial-headword example and evaluate explicit irregular forms only when source examples require them. Bounded regular matching now imports 581 entries with all 573 previous IDs preserved. Do not edit Notion records or invent examples.
2. Continue semantic review of ambiguous senses/distractors before adding new question types; a structural audit of 650 rotated questions found no exact shared Thai-meaning atoms, which is not a full linguistic review. Source example/translation feedback, Retry mistakes and efficient unique distractor rotation are implemented; keep context frozen and SRS isolation intact.
3. Browser malformed-backup, quota-write/in-memory rollback, nested daily-row validation, synthetic legacy backup compatibility and oversized/invalid JSON checks passed hosted CI (latest browser 43371443800; regression 43371443779). New post-write render-failure cloud UI rollback code/test SHA `a535b1babdde470e13ea07dd40a0c89d83df28be` requires CI verification before claiming success. Real historical backup compatibility still needs a private authorized fixture; physical Safari and live cross-device behavior remain separate gates.
4. Keep project/architecture/decision/changelog documents and the current evidence in `CONTINUOUS-AUDIT-2026-11-13.md` aligned. Older P0/P1 audits are historical snapshots; do not replace their recorded results with assumptions.

## Requires a real test environment or user approval

1. Execute `SAFARI-RELEASE-QA.md` on a physical iPad using a disposable browser profile and an approved non-production preview.
2. Independently verify staging CAS persistence, strong revisions and two-client conflict handling with synthetic staging records.
3. Obtain a fresh authoritative private backup of all five production progress subjects before any contemplated migration.
4. Explicitly approve and separately authorize any deployment, `progress_api` cutover, data migration, or Auto Sync enablement. Do not assume a request to “continue” grants these permissions.

## Non-negotiable

Do not merge PR #41, deploy, change Cloudflare Worker/KV/Notion, delete/migrate old progress or expose secrets without explicit authorization. Keep existing `data/config.json` `api` pointing to the original Notion content Worker.
