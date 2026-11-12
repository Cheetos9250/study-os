# Study OS sync CAS prototype — SY-08

**Status: staging Worker prototype only. NOT deployed. The VocaBloom and legacy pages already have CAS-aware client code, but no live CAS Worker has been deployed.**

This is an isolated example addressing the lost-update race found by independent Claude QA when two browsers perform concurrent GET → PUT with no revision check. It is deliberately in `experiments/`, with **no GitHub Actions deploy step**, no real user data and no production credentials.

## Files
- `smoke-staging.mjs`: default no-network CLI; optional authenticated staging checks with a fresh synthetic probe object, leaving all 5 subjects read-only.
- `smoke-staging.test.mjs`: fake-Worker regression for staging-only host, health marker, CAS conflicts, and no subject writes.
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


## Safe staging verification (no production deployment)

**All default commands below are local-only and make no requests to Cloudflare:**

```sh
node --test experiments/study-sync-cas/*.test.mjs
node experiments/study-sync-cas/smoke-staging.mjs
```

After a separately authorized staging Worker deployment, set only a **staging-only** `SYNC_KEY` secret (never the production key) and the dedicated Wrangler configuration `experiments/study-sync-cas/wrangler.jsonc`. This configuration has the fixed script name `study-api-cas-staging-only`, SQLite-backed Durable Objects and `STAGING_ONLY=true`. It has no deployment CI workflow.

To execute the **optional** live smoke test, set `STAGING_BASE_URL` to `https://study-api-cas-staging-only.<account>.workers.dev`, set `STAGING_SYNC_KEY` to the separate test secret through a secure environment, then run:

```sh
node experiments/study-sync-cas/smoke-staging.mjs --execute --acknowledge-staging-only
```

The checker requires a valid authenticated `GET /__staging/health` marker, tests 401/403/OPTIONS CORS, performs **GET-only** on `acc`, `eco`, `math`, `eng`, `zh`, and writes only to a brand-new `/__staging/probe/<24-hex-id>` Durable Object. It tests 200/409 concurrency, successful merge, and 428 rejection of old unconditional PUT. It refuses all non-staging domains or an existing probe. No real progress records are modified.

The separate `import-staging.mjs` tool is **not** part of smoke testing. It can write actual snapshot contents into a staging subject namespace only with explicit import flags; it now also requires the authenticated staging identity marker before attempting any subject requests.

**Deployment/production gate:** The current production Worker source, server-side backups, migration freeze and rollback, and real browser/device validation are still outstanding. Never deploy this prototype over `study-api` or attach it to production bindings.

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


## Safe dry-run snapshot validation and staging import

A separate \`import-staging.mjs\` utility now supports moving a **read-only VocaBloom Cloud snapshot** into a newly created *test-only* Durable Object Worker. It does **not** read production Cloudflare by itself, deploy Workers, or use a real secret. The user must first deliberately download \`Cloud snapshot (read-only)\` from VocaBloom Settings and safeguard the downloaded file.

\`\`\`bash
# 1. Offline dry run; scans file only, prints counts and SHA-256 checksums.
node experiments/study-sync-cas/import-staging.mjs --file ./vocabloom-cloud-snapshot-YYYY-MM-DD.json

# 2. OPTIONAL staging import only after creating a separate test Worker
# and configuring a test-only SYNC_KEY outside GitHub.
STAGING_SYNC_KEY="$YOUR_STAGING_ONLY_KEY" \
 node experiments/study-sync-cas/import-staging.mjs \
 --file ./vocabloom-cloud-snapshot-YYYY-MM-DD.json \
 --staging-url https://study-api-cas-staging-only.YOUR_SUBDOMAIN.workers.dev \
 --apply --acknowledge-staging-only
\`\`\`

**Safety and validation:**
- No \`--apply\` → **zero network requests and zero writes**, even if a staging URL is supplied.
- Staging URL must match \`study-api-cas-staging-only.*.workers.dev\` or localhost; production \`study-api.kasidit09022550.workers.dev\`, other hosts, credentials in URLs and non-HTTPS external addresses are refused.
- Exactly 5 subjects are required; a partial, malformed or oversized snapshot aborts before contacting staging.
- Before any write, all five remote staging subjects must either be truly empty at revision \`"0"\`, or **byte-equivalent after canonical JSON ordering** to the source snapshot. Unexpected data aborts without writing anything.
- Every new write uses \`If-Match\` and verifies the full subject SHA-256 via an immediate GET. A failed third subject may leave the first two imported; retrying with the *same unchanged* source snapshot resumes without overwriting the existing data.
- Only a dedicated staging key may be supplied via the \`STAGING_SYNC_KEY\` environment variable. The CLI does not print secrets, answers or flashcard text.
- The five-subject transfer is **not globally atomic**; no claim of cross-subject transactional consistency is made. Do not use this utility as a production migration or rollback.
- Do **not** commit cloud snapshot JSON files to a public repository; they contain private learning history.
- Never delete the source snapshot until destination checks and rollback procedures have been completed and verified.

New tests: \`node --test experiments/study-sync-cas/*.test.mjs\`, 15 isolated tests total, including resume, conflict, malformed file and production-host refusal.

