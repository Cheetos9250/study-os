/**
 * Read-only administrative Cloudflare KV snapshot for the five known Study OS
 * progress keys. This NEVER writes, imports, normalizes or merges user history.
 * Missing-key 404s are recorded as unverified, not proof of permanent absence.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SUBJECTS = Object.freeze(['acc', 'eco', 'math', 'eng', 'zh']);
const ID_RE = /^[a-f0-9]{32}$/i;
const LIMIT = 5 * 1024 * 1024;

function validate(env) {
  for (const key of ['CLOUDFLARE_ACCOUNT_ID', 'STUDY_PROGRESS_KV_NAMESPACE_ID']) {
    if (!ID_RE.test(env[key] || '')) throw Error('Missing or invalid ' + key + '; no Cloudflare request made.');
  }
  if (typeof env.CLOUDFLARE_API_TOKEN !== 'string' || env.CLOUDFLARE_API_TOKEN.length < 10)
    throw Error('Missing dedicated read-only KV token; no requests made.');
  if (typeof env.OUTPUT_DIR !== 'string' || !env.OUTPUT_DIR.startsWith('/'))
    throw Error('OUTPUT_DIR must be an absolute temporary path.');
  return { output: resolve(env.OUTPUT_DIR) };
}

export async function capture(env, fetcher = fetch) {
  const { output } = validate(env);
  const base = 'https://api.cloudflare.com/client/v4/accounts/' +
    env.CLOUDFLARE_ACCOUNT_ID + '/storage/kv/namespaces/' + env.STUDY_PROGRESS_KV_NAMESPACE_ID;
  const request = async path => {
    let response;
    try {
      response = await fetcher(base + path, {
        method: 'GET', headers: { Authorization: 'Bearer ' + env.CLOUDFLARE_API_TOKEN },
        redirect: 'error', signal: AbortSignal.timeout(25000)
      });
    } catch (_) { throw Error('Cloudflare KV read failed; no snapshot published.'); }
    if (response.status === 404 && path.startsWith('/values/')) return response;
    if (!response.ok) throw Error('Cloudflare KV read failed with HTTP ' + response.status + '.');
    return response;
  };

  // Validate the exact namespace separately before interpreting a key-level 404.
  const namespace = await request('');
  let metadata;
  try { metadata = await namespace.json(); }
  catch (_) { throw Error('Cloudflare KV namespace response is not valid JSON.'); }
  if (metadata?.success !== true || metadata?.result?.id !== env.STUDY_PROGRESS_KV_NAMESPACE_ID)
    throw Error('KV namespace identity was not verified; refusing snapshot.');

  const data = [];
  for (const subject of SUBJECTS) {
    const key = 'progress:' + subject;
    const response = await request('/values/' + encodeURIComponent(key));
    if (response.status === 404) {
      data.push({ subject, key, status: 'api_404_unverified' });
      continue;
    }
    const len = Number(response.headers.get('content-length') || '0');
    if (Number.isFinite(len) && len > LIMIT)
      throw Error('KV response exceeds 5 MB limit; no snapshot published.');
    const raw = Buffer.from(await response.arrayBuffer());
    if (raw.length > LIMIT) throw Error('KV response exceeds 5 MB limit; no snapshot published.');
    data.push({
      subject, key, status: 'captured', raw,
      sha256: createHash('sha256').update(raw).digest('hex'),
      expiration: response.headers.get('expiration') || null
    });
  }
  const manifest = {
    format: 'study-os-cloudflare-kv-five-key-capture',
    version: 1,
    capturedAt: new Date().toISOString(),
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    namespaceId: env.STUDY_PROGRESS_KV_NAMESPACE_ID,
    entries: data.map(({ subject, key, status, raw, sha256, expiration }) => ({
      subject, key, status, bytes: raw ? raw.length : null,
      sha256: sha256 || null, expiration: expiration || null
    })),
    limitations: [
      'Only five known keys from one administratively selected namespace were read.',
      'A 404 is not proof of durable absence and can be affected by consistency or concurrent writes.',
      'This is a non-atomic snapshot: other clients may be writing during capture.',
      'No restore, production change, or verification against the Worker GET API has been performed.'
    ]
  };
  await mkdir(output, { recursive: true, mode: 0o700 });
  for (const item of data) {
    if (item.status !== 'captured') continue;
    await writeFile(resolve(output, 'progress-' + item.subject + '.raw'), item.raw,
      { mode: 0o600, flag: 'wx' });
  }
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n',
    { mode: 0o600, flag: 'wx' });
  return { captured: data.filter(x => x.status === 'captured').length,
    unverified404: data.filter(x => x.status !== 'captured').length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  capture(process.env).then(x => {
    process.stdout.write('Read-only KV capture prepared: ' + x.captured +
      ' raw values and ' + x.unverified404 + ' unverified 404s. No writes or imports.\n');
  }).catch(error => {
    process.stderr.write('KV capture stopped: ' + error.message + '\n');
    process.exitCode = 1;
  });
}
