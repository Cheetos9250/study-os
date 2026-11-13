import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { capture, summarizeDeployments } from '../scripts/capture-study-worker-source.mjs';

const account = '0123456789abcdef0123456789abcdef';
const v1 = '11111111-1111-4111-8111-111111111111';
const v2 = '22222222-2222-4222-8222-222222222222';
const deployment = '33333333-3333-4333-8333-333333333333';
const root = 'https://api.cloudflare.com/client/v4/accounts/' + account + '/workers/scripts/study-api';
const response = (data, opts = {}) => new Response(typeof data === 'string' ? data : JSON.stringify(data), opts);
function mockFetcher(options = {}) {
  const calls = [];
  const handler = async (url, init) => {
    calls.push({ url, method: init.method, authorization: init.headers.Authorization, redirect: init.redirect });
    if (options.override) return options.override(url, init);
    if (url === root + '/deployments') return response({
      success: true, result: { deployments: [{ id: deployment, created_on: '2026-11-13T10:00:00Z',
        versions: [{ version_id: v1, percentage: 60 }, { version_id: v2, percentage: 40 }] }] }
    }, { headers: { 'content-type': 'application/json' } });
    if (url === root + '/versions/' + v1 || url === root + '/versions/' + v2) {
      const id = url.endsWith(v1) ? v1 : v2;
      return response({ success: true, result: { id, resources: {
        script: { etag: 'etag-private', secret: 'DO_NOT_PUBLISH' },
        script_runtime: { compatibility_date: '2026-10-01' },
        bindings: { PRIVATE_BINDING: { text: 'DO_NOT_PUBLISH' } }
      } } }, { headers: { 'content-type': 'application/json' } });
    }
    if (url === root) return response("export default { fetch(){return new Response('OK') } }",
      { headers: { 'content-type': 'text/javascript' } });
    throw Error('Unexpected URL');
  };
  return { handler, calls };
}

async function fixture(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'study-worker-capture-test-'));
  try {
    return await fn({ CLOUDFLARE_ACCOUNT_ID: account,
      CLOUDFLARE_API_TOKEN: 'FAKE_READ_TOKEN_NO_REAL_ACCESS', OUTPUT_DIR: join(dir, 'out') }, dir);
  } finally { await rm(dir, { recursive: true, force: true }); }
}

test('retrieves only GET source/deployments/version metadata and writes no source to logs', async () => {
  await fixture(async (env) => {
    const mock = mockFetcher();
    const result = await capture(env, mock.handler);
    assert.deepEqual(result, { saved: true, byteLength: 50, deployedVersions: 2 });
    assert.equal(mock.calls.length, 4);
    assert.deepEqual(mock.calls.map(x => x.url), [root + '/deployments', root + '/versions/' + v1,
      root + '/versions/' + v2, root]);
    assert.ok(mock.calls.every(c => c.method === 'GET' && c.redirect === 'error'));
    const raw = await readFile(join(env.OUTPUT_DIR, 'study-api-source.raw'), 'utf8');
    assert.match(raw, /export default/);
    const manifest = JSON.parse(await readFile(join(env.OUTPUT_DIR, 'manifest.json'), 'utf8'));
    assert.equal(manifest.workerName, 'study-api');
    assert.equal(manifest.latestDeployment.versions.length, 2);
    assert.equal(manifest.scriptBytes, Buffer.byteLength(raw));
    assert.match(manifest.scriptSha256, /^[0-9a-f]{64}$/);
    assert.match(manifest.captureLimits.join(' '), /cannot prove.*actively served versions/i);
    assert.ok(!JSON.stringify(manifest).includes('DO_NOT_PUBLISH'));
    assert.equal(manifest.latestDeployment.versions[0].scriptEtag, 'etag-private');
  });
});

test('rejects missing credentials without any network request', async () => {
  await fixture(async (env) => {
    const mock = mockFetcher();
    await assert.rejects(capture({ ...env, CLOUDFLARE_API_TOKEN: '' }, mock.handler), /Missing read-only/);
    await assert.rejects(capture({ ...env, CLOUDFLARE_ACCOUNT_ID: 'bad' }, mock.handler), /account ID/);
    assert.equal(mock.calls.length, 0);
  });
});

test('fails closed if deployment listing is unavailable or malformed', async () => {
  await fixture(async (env) => {
    const deny = mockFetcher({ override: () => response('denied', { status: 403 }) });
    await assert.rejects(capture(env, deny.handler), /HTTP 403/);
    const empty = mockFetcher({ override: () => response({ success: true, result: { deployments: [] } }) });
    await assert.rejects(capture(env, empty.handler), /Cannot verify Worker deployment metadata/);
    await assert.rejects(readdir(env.OUTPUT_DIR), /ENOENT/);
  });
});

test('rejects unexpected success-as-JSON Worker source response', async () => {
  await fixture(async (env) => {
    const base = mockFetcher();
    const fetcher = (url, init) => url === root
      ? response({ success: false, errors: [{ message: 'Invalid token' }] }, { headers: { 'content-type': 'application/json' } })
      : base.handler(url, init);
    await assert.rejects(capture(env, fetcher), /Unexpected Cloudflare content type/);
    await assert.rejects(readdir(env.OUTPUT_DIR), /ENOENT/);
  });
});

test('ignores version binding values and rejects mismatched version identity', async () => {
  await fixture(async (env) => {
    const base = mockFetcher();
    const fetcher = (url, init) => url === root + '/versions/' + v1
      ? response({ success: true, result: { id: v2 } }) : base.handler(url, init);
    await assert.rejects(capture(env, fetcher), /does not match active deployment/);
    await assert.rejects(readdir(env.OUTPUT_DIR), /ENOENT/);
  });
});

test('sorts deployment metadata and rejects malformed version splits', () => {
  const parsed = summarizeDeployments({ success: true, result: { deployments: [
    { id: deployment, created_on: '2026-11-12T10:00:00Z', versions: [{ version_id: v2, percentage: 100 }] },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', created_on: '2026-11-13T10:00:00Z', versions: [{ version_id: v1, percentage: 100 }] }
  ] } });
  assert.equal(parsed.versions[0].id, v1);
  assert.throws(() => summarizeDeployments({ success: true, result: { deployments: [
    { id: deployment, versions: [{ version_id: 'bad', percentage: 100 }] }
  ] } }), /Invalid deployment version split/);
});
