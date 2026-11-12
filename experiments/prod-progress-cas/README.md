# Production CAS Progress Worker — offline candidate only

**DO NOT DEPLOY. DO NOT CHANGE `data/config.json`. DO NOT TOUCH PRODUCTION KV.**

This directory contains a **code candidate**, not a functioning production service.
There is intentionally **no Wrangler configuration, deployment command, secret, or automated deployment** in this directory.

## Why this exists

The existing `study-api` Worker handles Notion-backed `/quiz`, `/cards` and authenticated `/review` **plus legacy KV-backed `/progress/*`**. We must never replace it in place with a CAS-only Worker. This candidate would be a separately named and independently credentialed service for progress, while keeping the existing Worker for Notion content and review.

- Candidate hostname hardcoded in the security guard: `vocabloom-progress-cas-prod.kasidit09022550.workers.dev` (**not registered or verified**).
- Separate Durable Object class: `ProductionProgressDO`, intended for a **new SQLite-backed namespace** under a distinct `PROD_PROGRESS_DO` binding.
- Namespace IDs use `vocabloom:production-progress:v1:<subject>`; there is **no fallback** to Staging's `PROGRESS_DO` binding.
- A **new**, independent `PROGRESS_SYNC_KEY` secret is mandatory and must have at least 24 characters. Never reuse the existing Production `SYNC_KEY` or the Staging key.
- Requires `PROGRESS_CAS_ENABLED=true` merely to start serving authenticated GET.
- **PUT is denied (HTTP 423) by default.** Both `PROGRESS_WRITES_ENABLED=true` and `PROGRESS_MIGRATION_VERIFIED=true` must be set to allow conditional writes. These flags are administrative controls, **not evidence that migration succeeded**.
- Browser Origin is restricted to `https://cheetos9250.github.io`; requests must present the independent secret.
- PUT uses a strong `If-Match: "revision"` and returns `X-Sync-Revision`, in addition to ETag (which Cloudflare may transform to a weak ETag).
- GET and PUT only for the five explicit subjects. It does not implement `/quiz`, `/cards`, `/review`, `/import`, `/restore` or admin migration endpoints.

## Offline checks (no Cloudflare credentials or network access)

Run `node --test experiments/prod-progress-cas/*.test.mjs` from the repository root.
The GitHub Actions workflow `.github/workflows/prod-progress-cas-tests.yml` **only runs these offline tests**. It does not call Wrangler, Cloudflare, GitHub deployment APIs, or the real Worker. All test keys and scores are synthetic.

## Remaining blockers before even considering a deployment

1. Independently verify Staging **post-import persistence** through `vocabloom/staging-exit-check.html`; save the owner-generated read-only report.
2. Prepare a new trusted **administrative KV snapshot** of all five Production subjects, and an up-to-date local-device unsynced backup. Historical screenshots do not establish current KV state.
3. Inventory/disable old clients and establish a credible write freeze, with safe rollback that reconciles any new writes; a config switch alone does not stop cached clients.
4. Review the exact new Cloudflare worker name, domain, namespace, secret strategy, permissions, and separate SQLite class; protect the existing Notion Worker.
5. Build and test a **staging-only migration importer** with explicit owner approval and readback checks; this candidate currently has no migration importer.
6. Test a new production instance in read-only mode against synthetic data and real deployment protections before enabling real-data migration.
7. Require an **explicit, separate owner authorization** for any real Cloudflare deployment, migration, write enablement, or `data/config.json` cutover. The current user's request to continue *code work* does not authorize migration.

Cloudflare's current [SQLite Durable Object storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) supports synchronous `ctx.storage.kv.get/put` for the critical CAS section. New class configuration should follow the current [Wrangler docs](https://developers.cloudflare.com/workers/wrangler/configuration/); the newer declarative `exports` and legacy `migrations` approaches must not be mixed. If/when an authorized release is planned, verify documentation again before generating any production Wrangler config.

**Status: DESIGN/TEST CANDIDATE ONLY — PRODUCTION RELEASE BLOCKED.**
