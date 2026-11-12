# VocaBLoom isolated staging gate

Status: PREPARATION ONLY — no Cloudflare resources created or deployed.

## Isolation requirements
- Use a separate Cloudflare Worker named `study-api-cas-staging-only`, never the production Worker.
- Use a separate SQLite-backed Durable Object namespace/class migration using the existing `experiments/study-sync-cas/wrangler.jsonc` prototype; do not bind production Durable Objects, D1, KV, R2, or real Notion tokens.
- Use a staging-only secret `SYNC_KEY`; never reuse a real user key.
- Staging hostnames and route patterns must not overlap production.
- Never place secrets in repository files, build logs, screenshots, or PR comments.

## Deployment gate
1. Confirm actual production Worker source, route configuration, and KV/other storage bindings before planning any production migration.
2. Create staging resources only after explicit approval.
3. Apply Durable Object class migrations only to the separately named staging Worker and namespace.
4. Verify missing/invalid key => denied and dedicated staging key => accepted. Never send the production key to staging.
5. Use read-only GETs to verify all five subjects; perform 409/428/retry/concurrency writes only in a fresh synthetic `__staging/probe` object.
6. Verify no production or real Notion requests occurred.
7. Run staging smoke tests and collect redacted logs.
8. Keep production Cloud Sync blocked until SY-08 lost-update prevention and SY-LIVE pass.

## Current blockers
- SY-08: prototype implements server-side optimistic concurrency (revision + If-Match) and passes simulated tests, but the live production Worker still lacks verified CAS behavior.
- SY-LIVE: no isolated live staging Worker deployment or Cloudflare runtime verification has been performed.
- SEC-04: public Notion page URLs exported in JSON; review schema without changing stable card IDs.

## Rollback
- Stop staging deploy/traffic; retain staging data for diagnosis.
- Do not modify production bindings, credentials, or scores.

## Latest staging observation and fix

- Browser confirmed valid staging authentication and returned `ETag: W/"0"` for Accounting. This is a weak HTTP ETag that cannot safely be used for `If-Match`.
- Updated Worker source exposes a dedicated `X-Sync-Revision` (quoted numeric) header and browser CORS exposure; clients prefer it, fall back only to **strong** legacy ETag, and fail closed if neither is present.
- **Re-deploy the staging Worker separately after this commit** using the staging-only Wrangler config. A GitHub merge does not itself prove the Cloudflare Worker was updated.
- Run browser read-only staging verification before pressing the isolated synthetic-probe test button. Do not enable Production Sync or send any real production key.
- In a browser's Save Password popup, use Not now if the staging key is already stored in Bitwarden.

