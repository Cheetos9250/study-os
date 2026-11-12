# VocaBLoom Phase 6 — Published client write-surface inventory

**As of 12 November 2026: repository-only evidence, NOT an inventory of deployed or cached clients. Production migration is BLOCKED.**

This manifest separates **score/progress writes**, **Notion Review Step writes**, and **synthetic Staging writes**. An accidental new production writer or route can otherwise create divergent state during a KV → CAS migration.

## Published pages able to write learner progress

| Published source | Progress scope | Trigger / current endpoint |
| --- | --- | --- |
| `vocabloom/unified-progress.js` | all five subjects | Manual sync, or existing opt-in Auto Sync. Reads `data/config.json` and uses `progress_api` only if separately configured; current config falls back to the original `study-api`. |
| `acc.html` | Accounting | Manual button only; progress PUT after a GET/merge. |
| `eco.html` | Economics | Manual button only; progress PUT after a GET/merge. |
| `math.html` | Mathematics | Manual button only; progress PUT after a GET/merge. |
| `eng.html` | English | Manual button only; progress PUT after a GET/merge. |
| `zh.html` | Chinese | Manual button only; progress PUT after a GET/merge. |

Each course page also has one **separate authenticated POST `/review` to the original Notion content Worker**, dispatched using `reviewReady()`, `reviewApi()` and `reviewHdr()`. This is **not a progress CAS write** and must not be redirected to the future Progress Worker.

The five legacy pages have background auto-sync deliberately disabled; VocaBLoom Auto Sync is possible only under its prior opt-in and Safe Sync guards. PR #33 added checks to stop background writes when the optional endpoint changes or Auto Sync is disabled during an in-flight operation. Existing cached older versions are outside the static scanner.

## Isolated Staging-only write-capable tools

| File | Allowed operation |
| --- | --- |
| `vocabloom/staging-check.html` | Writes only to a fresh random `/__staging/probe/<id>` object, never to a subject's score record. |
| `vocabloom/staging-accounting-import.html` | User-operated one conditional `PUT /progress/acc` at revision `"0"`, against the **Staging-only** hostname, after a private backup and repeated preflight. |

These are **not production clients**. Their CSP and static target must remain the isolated Staging Worker. The existing Staging Accounting import has already been reported successful by the owner; do not repeat it without fresh readback and a separate explicit reason.

## Read-only / local-only published pages

`index.html`, `vocabloom/index.html`, `vocabloom/migration-audit.html`, `vocabloom/private-kv-capture.html`, `vocabloom/staging-import-preflight.html`, `vocabloom/staging-exit-check.html`, and `vocabloom/study-integration.js` have **zero recognised mutating fetch signatures** in the current source. Some modify browser-local study data, which is not a remote score write.

## Machine-readable CI guard

`vocabloom/tests/client-writer-inventory.test.cjs` enumerates root HTML files and top-level VocaBLoom HTML/JS files and checks that every recognised POST/PUT/PATCH/DELETE signature is on the known allowlist. A newly introduced write statement or change in the number of known write statements fails CI until the inventory is reviewed. It also protects the Staging-only endpoints, manual-only legacy sync, independent Notion review routing, and unchanged current `data/config.json`.

**Limitations:** This is a conservative *text signature* check, not an AST-level dataflow analysis or a security audit. It cannot detect dynamically constructed method names, obfuscated requests, Service Workers, third-party scripts, browser extensions, user-installed older versions, connected apps, or remote clients outside this GitHub repository.

## Still unverified before any cutover

- Production `study-api` Worker source is known from an owner-supplied copy but is **not tracked as the live deployed Worker in this repository**. Confirm deployed code and all bindings directly.
- Cloudflare schedules, KV writers, Notion automations, connected apps and any non-GitHub clients must be inventoried separately.
- Offline user progress on iPad and other devices must be backed up. Site deployment cannot force-update a cached copy.
- Before migration: enforce a real write freeze/credential rotation, obtain fresh KV administrative exports for all five subjects, and verify a rollback that reconciles new writes instead of overwriting them with an old snapshot.
- The new production CAS code under `experiments/prod-progress-cas` is a **non-deployable candidate**. No production Workers, namespaced DOs, secrets, or `progress_api` have been activated.

**This inventory does not grant Production migration approval.**
