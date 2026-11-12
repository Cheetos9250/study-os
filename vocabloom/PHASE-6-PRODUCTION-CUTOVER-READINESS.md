# VocaBLoom Phase 6 — Safe Production Cloud Sync architecture

Status: **PLANNING ONLY · NO PRODUCTION CUTOVER · 12 Nov 2026**

This is a rollout gate, not permission to deploy. Never change the live `study-api`, `PROGRESS` KV namespace, or the publicly served `data/config.json` until the readiness checks are complete and the owner authorizes a specific cutover.

## Existing reality confirmed from source

- Live `study-api` Worker serves `GET /quiz`, `GET /cards`, and authenticated `POST /review` for Verified Notion content; these are distinct from progress syncing.
- The same Worker currently serves `GET/PUT /progress/{acc|eco|math|eng|zh}` using KV binding `PROGRESS`, with unconditional writes and a synthetic `{"updated":0}` fallback on missing keys.
- Public GitHub Pages `data/config.json` currently contains a **single** `api` property pointing to the original Production Worker. All five legacy course pages also use that property to fetch quiz/card content. **Pointing `api` at the CAS-only staging Worker would break Notion content and review endpoints.**
- Private original KV, read-only Cloud snapshot, verified five-key administrative capture, and a transformed private Staging Preview have been archived separately in Google Drive. The owner-operated staging import UI reported PASS for one Accounting record and four unchanged subjects; a fresh independent read-only persistence check is separately provided.
- The CAS prototype is an isolated SQLite-backed Durable Object Worker with `X-Sync-Revision` and `If-Match` semantics; it is **not** a drop-in replacement for the Notion Worker.

## Recommended production topology: split progress and content endpoints

| Responsibility | Future endpoint | Source of truth |
| --- | --- | --- |
| Quiz/cards and Notion review | **Existing** `study-api` | Notion; existing Production Worker routes |
| CAS-protected progress | **New** and separately named production Worker, not `study-api-cas-staging-only` | New, independent SQLite-backed Durable Objects |
| Static site and local progress | Existing VocaBLoom + five legacy pages | Local browser, with safeguarded merge into production CAS |

Keep `data/config.json`'s `api` unchanged for Notion. The frontend now understands an **optional** `progress_api`, which is used for progress requests only; when absent, it falls back to `api`. The repository's published config intentionally remains unchanged. There is **no** production CAS hostname or key configured today.

This split makes rollback possible without replacing the Notion Worker or overwriting the original KV namespace. The new progress Worker must use a **different credential** from the original `SYNC_KEY` and staging key. Review how keys are stored in browsers, especially public university computers.

## Migration gates, in order

1. **Close Staging QA:** fresh read-only Staging exit check must show Accounting matches the verified Preview with a positive revision; `eco`, `math`, `eng`, `zh` match and remain revision 0. Save the redacted report and original Staging backup separately.
2. **Preserve source:** capture another authoritative, five-key **administrative** Production KV backup just before cutover. The earlier screenshot/manifests represent a historical point in time and are not a transactional freeze. Save original JSON, capture time and integrity hashes in private Drive.
3. **Identify all writers:** inventory the five legacy course pages, VocaBLoom tabs, old JS cached versions, any scheduled workflows and other write-capable clients. Plan a temporary write freeze and a notification that locally unsynced progress must be backed up.
4. **Build separate production CAS Worker:** create a new SQLite-backed Durable Object namespace and separate token. Retain strict CORS and host/identity guards. Never deploy the staging-only Worker code under the live Notion Worker's hostname. Confirm current Wrangler config syntax before provisioning; Cloudflare now recommends `exports` for new declarative configurations, while existing repositories using `migrations` must not mix them with `exports`.
5. **Dry-run importer:** re-read source KV and compare to admin backup. Missing keys may be normalized only with explicit absence evidence, as already implemented in the offline conversion. Reject partial or stale states.
6. **Freeze writes and import exactly once:** do not let old and new progress endpoints accept competing writes. Confirm every CAS object is empty at revision 0 or already identical, apply with `If-Match`, read back all five, compare value hashes and revisions, and require a verified independent recovery artifact.
7. **Canary and device testing:** test all VocaBLoom and legacy pages against the **new production** progress endpoint with a test account/synthetic namespace first. Verify 401, 409, 428, stale local data, two-device conflicts, offline mode, Refresh, session expiry and browser cache behavior. Do not reuse production scores for a canary.
8. **Explicitly authorize endpoint switch:** update **only** `progress_api` in `data/config.json` to the newly verified production CAS Worker after approval. Leave `api` intact. Recheck browser key routing, force-refresh older page versions and verify live data readback. Leave Auto Sync disabled until separately approved.
9. **Rollback:** if any unexpected response occurs, **disable new writes first**; restore `progress_api` to absent or the approved previous endpoint only after reconciling any new writes made during the cutover. Do not blindly overwrite original KV with an old snapshot or enable two independent writable copies. Restore from verified backups only with an explicit recovery decision.

## Explicit NO-GO signals

- New progress API resolves to the isolated Staging Worker or an unapproved hostname.
- `/quiz`, `/cards`, or `/review` contract breaks or a client cannot access old Notion data.
- Source KV changed after capture or any backup has incomplete metadata.
- Staging post-import report is absent and no independent later readback is available.
- Production CAS returns missing/weak-only ETag revision or accepts a write without `If-Match`.
- Any active client still performs unconditional legacy writes after the freeze.
- Rollback cannot reconcile writes created after snapshot.
- No explicit approval for production cutover.

## Evidence and platform references

- [Cloudflare 9 July 2026 Durable Object storage change](https://developers.cloudflare.com/changelog/post/2026-07-09-restrict-new-kv-backed-namespaces/)
- [Cloudflare Wrangler configuration and migrations](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [SQLite-backed Durable Objects storage and recovery](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/)
- Repo-local `vocabloom/PHASE-5-DATA-INTEGRITY.md` and `vocabloom/SAFE-SYNC-ROLLOUT.md`

**At this commit:** only optional routing support and tests are changed. No change to Production Worker, Notion integration, KV keys, the active `api` value, Auto Sync, or learner scores.


## Continuous integration NO-GO guard (development only)

The regression suite includes `vocabloom/tests/production-cutover-no-go.test.cjs` as an explicit safety gate against accidental production cutover. It is intended to **fail the GitHub checks** if a subsequent commit:
- changes the current `data/config.json` production Notion API URL, adds `progress_api` without changing the reviewed test, or points a live configuration to Staging;
- renames the isolated `study-api-cas-staging-only` Wrangler configuration, drops its `STAGING_ONLY=true` guard, alters its Durable Object binding or adds secrets into public configuration;
- removes Staging Worker host/origin/secret guards;
- unexpectedly changes the five legacy course pages' Notion quiz/card data loading to use the new progress route;
- causes Staging-only helper pages to reference the original Production hostname or begin persisting keys into browser storage.

This CI test is not a production authorization system. Repository maintainers could alter or disable a test, and a passing build cannot prove which Worker deployment is running, what happens to independent writers, or whether current KV data is unchanged. Production activation still requires a separately reviewed release decision, fresh authoritative backup, verified new Worker, rollback plan and explicit owner approval. The safety gate's intentionally hardcoded current `data/config.json` configuration must be changed **only in the same separately authorized PR as an actual production cutover**, after all other no-go conditions are cleared.

The test makes no network calls, does not read private Drive data, and is safe for GitHub Actions.


## Separate Progress Worker credentials (client-side compatibility gate)

The optional `progress_api` resolver now also isolates its browser credential. When `progress_api` is **absent or resolves to the exact existing** `api` URL, VocaBLoom and the five Study OS pages continue to read the original `study-sync-key` and the live routing is unchanged.

When `progress_api` explicitly points at a **different URL**, clients instead read/write `study-sync-progress-key-v1`. They **never fall back to the old Production `study-sync-key`**; a missing new key requires the learner to enter a separate token before any progress request. The previous token is retained under the original key and must not be automatically sent to the new endpoint. VocaBLoom also disables inherited Auto Sync and clears the auto-sync opt-in on first resolution of the newly split URL, requiring a new conscious activation later.

This is a guard against accidental credential cross-use, **not** an authorization to enable any endpoint. The production CAS Worker and its new credential still do not exist in the public configuration. Do not place either secret in `data/config.json`, code, query strings, test fixtures containing real values, screenshots or Drive links with public sharing. On shared/university computers, remove credentials from the browser when finished.

Future production rollout must explicitly specify how owner credentials are rotated and how old devices holding the original secret are handled. An old, cached client can still point at the legacy Worker, so a configuration change alone does **not** freeze all writers. Independently verify every client version and credential scope before cutover.


## Review endpoint cross-routing audit (five legacy pages)

During Phase 6 preparation we found that all five legacy Study OS pages used `window.__xs.api()` and `window.__xs.hdr()` for authenticated `POST /review`, **not only** for progress GET/PUT. Before correction, a future explicit `progress_api` switch would inadvertently redirect Notion review writes to the separate CAS-only progress service, with the wrong credential. This was dormant with the unchanged current `data/config.json`, but would break Review Step updates at cutover.

The five pages now keep two independent targets in memory:
- **Content/Notion review:** `contentApi` sourced only from `config.api`, `reviewApi()` and `reviewHdr()` using the original `study-sync-key`.
- **Progress CAS:** `api` sourced from optional `config.progress_api` or old fallback, and `hdr()` using the endpoint-scoped progress credential when split.

`renderSync()` now checks `reviewReady()`, independent of whether a newly introduced CAS progress key has been set. `syncViaApi()` uses only `reviewApi()` and `reviewHdr()` to contact `/review`. The original quiz/cards loader continues to use `config.api`. The independent tests `vocabloom/tests/notion-review-split.test.cjs` exercise all five flows and intentionally supply **different fake secrets and hostnames** so accidental cross-use fails. They also check that missing original content credentials cause zero Notion requests rather than falling back to the CAS key.

This remains a **code-side preparation only**: the live split endpoint is not activated, the original Worker and Notion database remain unchanged, and Production migration is still blocked. A future endpoint switch must additionally verify Notion review from a fresh browser session using a real *original* credential, and cannot rely on simulated tests alone.


## Async Auto Sync switch-off race — guarded before Phase 6

A VocaBLoom background sync may begin while the page still has the previous stored Auto Sync preference. Its first `await cApiUrl()` can discover a **different** optional `progress_api` URL and deactivate inherited Auto Sync. Without a second permission check after this asynchronous config resolution, the already-running sync could continue and issue CAS writes to the newly configured worker using the separate progress credential, despite the deliberate new-endpoint opt-in gate.

The client now **rechecks Auto Sync after endpoint resolution**, at the beginning of each progress GET/retry and **immediately before each PUT**, stopping with an explanatory error if Auto Sync has been disabled. This also handles a user turning Auto Sync off during an in-flight GET, and stops the remaining subjects after an already-acknowledged PUT. An acknowledged write cannot be undone by disabling Auto Sync; consequently a partial sync must be identified and reconciled rather than represented as an all-five-subject success.

Deterministic offline regressions cover: endpoint discovery disabling Auto Sync before any GET; turning off Auto Sync while a GET is in flight (zero PUT); turning it off just after a successful first PUT (no further subject writes, incomplete status); and a separately explicit manual sync remaining unaffected by the background-only guard.

This is frontend safety hardening, not a Production cutover. It makes no changes to `data/config.json`, cloud Worker code, production KV, Notion, stored study progress or existing credentials.


## Separate Production CAS Worker — code candidate, not a deployment

A new review-only implementation is kept under `experiments/prod-progress-cas/worker.mjs`, with deterministic tests and no Wrangler config. It is not connected to Cloudflare and cannot be deployed by the existing staging build command. Its own CI workflow runs only offline Node tests with synthetic credentials and study values.

The candidate uses a distinct `ProductionProgressDO` class, requires a new `PROD_PROGRESS_DO` binding with SQLite storage, a new independent `PROGRESS_SYNC_KEY`, the explicit expected hostname `vocabloom-progress-cas-prod.kasidit09022550.workers.dev`, and an explicit `PROGRESS_CAS_ENABLED=true` flag before even serving authenticated GET. It defaults to **HTTP 423 for all writes**. Only `PROGRESS_WRITES_ENABLED=true` **and** `PROGRESS_MIGRATION_VERIFIED=true` can enable CAS PUT requests. These flags are a defense-in-depth administrative gate, not cryptographic proof of source migration; a separate approval and independently verified KV migration are still required.

There is intentionally **no migration importer, production Wrangler config, Cloudflare secret, deployment workflow, or activated `data/config.json` progress endpoint** in this branch. The original `study-api` still owns Notion `/quiz`, `/cards`, `/review`, and legacy KV until the future cutover is independently authorized. See `experiments/prod-progress-cas/README.md` for the blockers and simulator instructions.

Even if offline tests pass, do not provision or deploy until Staging exit is independently verified, source KV is freshly captured, old writers are accounted for, the migration process is tested, and the owner explicitly approves each production change.


## Notion review dispatch gate (five legacy course pages)

A second part of the old `/review` dispatch logic was found after the separate API/credential fix: `syncNotion()` was still checking `window.__xs.ready()`, which reports **Progress** readiness. Consequently, a learner with the original Notion credential but **without** a new CAS Progress credential could see the Review Step button yet fail to dispatch `/review`. Conversely, an available Progress credential should never authorize a Notion action when the original credential is missing.

All five pages now dispatch the original API `/review` only when `window.__xs.reviewReady()` is true. Their separate direct Notion connector branch retains priority when available. Tests exercise the **real `syncNotion()` function** in all five pages: original Notion credential present/new Progress credential absent, the inverse combination, and direct Notion connector preference.

This correction is **dormant safety preparation** while `data/config.json` remains unchanged. It does not authorize Production cutover, write to Notion, or modify scores. A real browser test of both types of Review Step update remains a release gate.


## Audited published write-surface inventory

`vocabloom/PHASE-6-WRITER-INVENTORY.md` now records the six production-progress-capable public clients (VocaBLoom and five legacy course pages), the five **separate** Notion `/review` routes, the two isolated Staging test/import writers, and the published read-only interfaces. An automated static gate in `vocabloom/tests/client-writer-inventory.test.cjs` fails if recognized network-mutation signatures appear outside those reviewed files or change unexpectedly.

This gate supplements, **not replaces**, runtime traffic inspection and a final freeze of all old/cached clients and external systems. The live Worker source and cloud schedules remain separate verification items; the CI inventory cannot prove that those external writers have stopped.


## Endpoint-specific Auto Sync consent survives reloads without inheritance

The original `progress_api` split guard disabled inherited Auto Sync on every page load whenever the Progress API used a distinct hostname. That was safe against accidental old consent but also prevented users from ever retaining a **new, consciously approved** opt-in across reloads.

A separate local `vocabloom-auto-sync-endpoint-v1` setting now records the **exact new Progress API URL**, only after the user explicitly enables Auto Sync for that URL, has a separate Progress key, and accepts a warning about backing up and writing all five subjects. Until that happens, the old `vocabloom-auto-sync-v1` preference is reset to `0` on first detection of a different endpoint. Reloading the **same explicitly approved URL** preserves its new opt-in. Changing to any other URL refuses to inherit authorization and disables Auto Sync again.

Turning Auto Sync off keeps only the nonsecret endpoint identity so the same host can be approved again without conflating it with a different host. Failed storage writes, cancelled confirmation and missing Progress key all fail closed with no new sync. Existing live `config.api` users retain their original toggle behavior, and `data/config.json` is unchanged.

This remains forward-looking code preparation: no new Progress Worker endpoint is active, no data migration has been authorized, and a manually requested sync still requires its own credential and CAS safeguards. This preference binds **background write consent**, not the credential itself; credential-to-endpoint hardening is a separate audit concern.
