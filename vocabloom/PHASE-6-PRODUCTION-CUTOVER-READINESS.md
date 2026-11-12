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
