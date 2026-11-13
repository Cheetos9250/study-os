import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { capture, SUBJECTS } from '../scripts/capture-study-progress-kv.mjs';

const account = '0123456789abcdef0123456789abcdef';
const namespace = 'fedcba9876543210fedcba9876543210';
const prefix = 'https://api.cloudflare.com/client/v4/accounts/' + account + '/storage/kv/namespaces/' + namespace;
const secretRaw = Buffer.from('{"study":{"known":["01-1"]},"private":"NEVER_OUTPUT_RAW_PROGRESS"}');
function reply(body, code = 200, headers = {}) {
  return new Response(body, { status: code, headers });
}
function synthetic(options = {}) {
  const calls = [];
  return {
    calls,
    fetch: async (url, init) => {
      calls.push({ url, method: init.method, redirect: init.redirect,
        auth: init.headers.Authorization });
      if (options.failPath && url.endsWith(options.failPath))
        return reply('unauthorized', options.failStatus || 403);
      if (url === prefix) return reply(JSON.stringify({ success: true,
        result: { id: options.wrongNamespace ? account : namespace } }),
        200, { 'content-type': 'application/json' });
      if (url === prefix + '/values/progress%3Aacc') return reply(options.emptyValue ? '' : secretRaw);
      if (url.startsWith(prefix + '/values/progress%3A')) return reply('missing', 404);
      throw Error('Unexpected endpoint');
    }
  };
}
async function fixture(fn) {
  const root = await mkdtemp(join(tmpdir(), 'study-kv-test-'));
  try {
    return await fn({ CLOUDFLARE_ACCOUNT_ID: account,
      STUDY_PROGRESS_KV_NAMESPACE_ID: namespace,
      CLOUDFLARE_API_TOKEN: 'SYNTHETIC_READ_ONLY_KV_TOKEN',
      OUTPUT_DIR: join(root, 'snapshot') });
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('snapshots exactly five known KV keys via GET and preserves raw bytes', async () => {
  await fixture(async env => {
    const mock = synthetic();
    const result = await capture(env, mock.fetch);
    assert.deepEqual(result, { captured: 1, unverified404: 4 });
    assert.equal(mock.calls.length, 6);
    assert.ok(mock.calls.every(x => x.method === 'GET' && x.redirect === 'error'));
    assert.deepEqual(mock.calls.slice(1).map(x => decodeURIComponent(x.url.split('/').at(-1))),
      SUBJECTS.map(x => 'progress:' + x));
    assert.deepEqual(await readFile(join(env.OUTPUT_DIR, 'progress-acc.raw')), secretRaw);
    const manifest = JSON.parse(await readFile(join(env.OUTPUT_DIR, 'manifest.json'), 'utf8'));
    assert.equal(manifest.entries.length, 5);
    assert.equal(manifest.entries[0].status, 'captured');
    assert.match(manifest.entries[0].sha256, /^[0-9a-f]{64}$/);
    assert.ok(manifest.entries.slice(1).every(x => x.status === 'api_404_unverified'));
    assert.ok(!JSON.stringify(manifest).includes('NEVER_OUTPUT_RAW_PROGRESS'));
    assert.deepEqual((await readdir(env.OUTPUT_DIR)).sort(), ['manifest.json', 'progress-acc.raw']);
  });
});

test('rejects missing credentials before contacting Cloudflare', async () => {
  await fixture(async env => {
    const mock = synthetic();
    await assert.rejects(capture({ ...env, CLOUDFLARE_API_TOKEN: '' }, mock.fetch), /Missing dedicated/);
    await assert.rejects(capture({ ...env, STUDY_PROGRESS_KV_NAMESPACE_ID: 'bad' }, mock.fetch), /STUDY_PROGRESS_KV_NAMESPACE_ID/);
    assert.equal(mock.calls.length, 0);
  });
});

test('never classifies an invalid namespace as an absent KV key', async () => {
  await fixture(async env => {
    const mock = synthetic({ wrongNamespace: true });
    await assert.rejects(capture(env, mock.fetch), /namespace identity/);
    await assert.rejects(readdir(env.OUTPUT_DIR), /ENOENT/);
  });
});

test('fails closed on a 403 for any key, without emitting a partial snapshot', async () => {
  await fixture(async env => {
    const mock = synthetic({ failPath: '/values/progress%3Aeco', failStatus: 403 });
    await assert.rejects(capture(env, mock.fetch), /HTTP 403/);
    await assert.rejects(readdir(env.OUTPUT_DIR), /ENOENT/);
  });
});

test('empty but existing value is distinct from a missing key', async () => {
  await fixture(async env => {
    const mock = synthetic({ emptyValue: true });
    const result = await capture(env, mock.fetch);
    assert.equal(result.captured, 1);
    const raw = await readFile(join(env.OUTPUT_DIR, 'progress-acc.raw'));
    assert.equal(raw.length, 0);
    const manifest = JSON.parse(await readFile(join(env.OUTPUT_DIR, 'manifest.json'), 'utf8'));
    assert.equal(manifest.entries[0].bytes, 0);
  });
});

test('never rewrites or parses the KV value during backup', async () => {
  await fixture(async env => {
    const mock = synthetic();
    await capture(env, mock.fetch);
    const raw = await readFile(join(env.OUTPUT_DIR, 'progress-acc.raw'), 'utf8');
    assert.equal(raw, secretRaw.toString('utf8'));
    assert.ok(!raw.includes('"updated":0'));
  });
});
