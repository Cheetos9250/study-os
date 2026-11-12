# Study OS sync CAS prototype — SY-08

**Status: code prototype only. NOT deployed. NOT wired into VocaBloom or the legacy subject pages.**

This is an isolated example addressing the lost-update race found by independent Claude QA when two browsers perform concurrent GET → PUT with no revision check. It is deliberately in `experiments/`, with **no GitHub Actions deploy step**, no real user data and no production credentials.

## Files
- `worker.mjs`: Worker router + one SQLite-backed Durable Object per Study OS subject, validates `X-Sync-Key`, limits the schema/body, exposes `ETag`, requires conditional `If-Match`, returns HTTP 409 on stale PUT.
- `client.mjs`: separate prototype GET → merge → conditional PUT + bounded 409 retry client. Not connected to the current site.
- `worker.test.mjs`: Node.js simulation using in-memory Durable Object storage, including 100 concurrent A/B rounds.
- `wrangler.jsonc`: dedicated staging name with `new_sqlite_classes`. **Do not point this at the existing production Worker or existing KV namespace.**

## Tests
Run `node --test experiments/study-sync-cas/worker.test.mjs`; CI workflow `study-sync-cas-tests.yml` runs the same test with no Cloudflare credentials.

The test proves conditional revision behavior in a simulated runtime. It **does not prove actual Durable Object runtime behavior, network CORS, KV migration, data recovery, latency or production integrity**.

## Why Durable Objects?
Cloudflare documents that SQLite-backed Durable Object storage is transactional and strongly consistent, and synchronous storage operations avoid interleaving within the read-modify-write critical section. Ordinary Cloudflare KV is eventually consistent and cannot safely implement GET → PUT compare-and-swap without a coordination layer.

Official references:
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- https://developers.cloudflare.com/changelog/post/2026-07-09-restrict-new-kv-backed-namespaces/

## Protocol (prototype)
1. `GET /progress/eng` with `X-Sync-Key` returns the existing JSON shape `{study,srs}` and header `ETag: "revision"`.
2. Client merges with *local* data; it does not delete local records during conflicts.
3. `PUT /progress/eng` includes `X-Sync-Key`, `If-Match: "revision"`, and the merged JSON.
4. Server accepts and increments revision atomically, or rejects stale writes with **409 Conflict** (current ETag).
5. Client rereads, merges again and retries up to a bounded limit, then leaves local data unchanged and reports failure.

Legacy unconditional PUT fails with HTTP **428 Precondition Required** in this prototype. This is intentional to prevent silent lost updates, but is incompatible with old clients.

## Prerequisites before any live rollout
1. **First find and inspect the deployed `study-api` Worker source** and preserve existing auth, CORS, query paths, and KV data contract. It is not in the `study-os` repo.
2. Export and verify the existing `/progress/{subject}` data for all 5 subjects and establish a rollback plan.
3. Create a **separate test Worker**, separate SQLite Durable Object namespace and separate `SYNC_KEY` (never commit the key).
4. Update **VocaBloom and all 5 legacy subject pages together** to send If-Match and retry 409. The live site currently sends unconditional PUT and will fail if this prototype is deployed as-is.
5. Plan a safe server-side migration of existing KV data into the new Durable Objects, and test old & new client compatibility. No silent reinitialization of current scores.
6. Test 2 browser profiles with same subject under simultaneous writes, offline, errors, corrupted data, conflicting quiz answers and incorrect auth. Test many real requests against staging.
7. Re-run independent Claude QA and obtain explicit user authorization before deploying to production or modifying real learning records.

## Known risks and limitations
- Revision checks fix whole-document lost updates **only when all writers use the protocol**. Old clients, cron scripts and parallel tabs need review.
- Within the same card/question, timestamps choose the latest submission; clock skew can change the winning review. Strict conflict semantics for the same card need product decisions.
- Word/day shadows in `srs.s` are merged by ID; device-day counts must never be blindly added on every retry.
- The prototype assumes a single personal SYNC_KEY. A multi-user app needs isolated authenticated user identities and authorization.
- A page ID in public Notion exports is still usable to reconstruct a direct Notion link; this prototype does not change that exposure.
- SQLite Durable Objects are priced/limited differently from existing KV. Check official plan quotas before rollout.

**Release status: BLOCKED** until real staging Worker tests and safe migration are verified.
