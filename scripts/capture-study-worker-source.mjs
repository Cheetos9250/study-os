/**
 * Read-only Cloudflare Worker source capture for the known Study API.
 * Uses GET requests only. Do not treat a script snapshot as a verified copy of
 * every actively deployed version; see manifest.captureLimits.
 *
 * This module never uploads, deploys, modifies bindings, logs source, or prints tokens.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const WORKER_NAME = 'study-api';
const MAX_SOURCE = 25 * 1024 * 1024;
const ID_RE = /^[0-9a-f]{32}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateInputs(env) {
  if (!ID_RE.test(env.CLOUDFLARE_ACCOUNT_ID || '')) throw Error('Missing or invalid account ID; no requests made.');
  if (typeof env.CLOUDFLARE_API_TOKEN !== 'string' || env.CLOUDFLARE_API_TOKEN.length < 10)
    throw Error('Missing read-only Cloudflare API token; no requests made.');
  if (!env.OUTPUT_DIR || !String(env.OUTPUT_DIR).startsWith('/')) throw Error('OUTPUT_DIR must be absolute.');
  return { account: env.CLOUDFLARE_ACCOUNT_ID, output: resolve(env.OUTPUT_DIR) };
}

export function summarizeDeployments(payload) {
  const list = payload?.result?.deployments;
  if (payload?.success !== true || !Array.isArray(list) || !list.length)
    throw Error('Cannot verify Worker deployment metadata; no capture published.');
  const sorted = [...list].sort((a, b) => Date.parse(b.created_on || '') - Date.parse(a.created_on || ''));
  const latest = sorted[0];
  if (!UUID_RE.test(latest.id || '') || !Array.isArray(latest.versions) || !latest.versions.length)
    throw Error('Deployment metadata missing stable version identifiers.');
  if (latest.versions.length > 8) throw Error('Unexpected number of active Worker versions.');
  const versions = latest.versions.map(v => {
    if (!UUID_RE.test(v.version_id || '') || !Number.isFinite(v.percentage) ||
      v.percentage <= 0 || v.percentage > 100) throw Error('Invalid deployment version split.');
    return { id: v.version_id, percentage: v.percentage };
  });
  return { id: latest.id, createdOn: latest.created_on || null, versions };
}

export async function capture(env, fetcher = fetch) {
  const { account, output } = validateInputs(env);
  const base = 'https://api.cloudflare.com/client/v4/accounts/' + account +
    '/workers/scripts/' + WORKER_NAME;
  const headers = { Authorization: 'Bearer ' + env.CLOUDFLARE_API_TOKEN };
  const request = async (path, label) => {
    let response;
    try {
      response = await fetcher(base + path, { method: 'GET', headers,
        signal: AbortSignal.timeout(25000), redirect: 'error' });
    } catch (_) { throw Error('Read-only Cloudflare ' + label + ' request failed; no capture published.'); }
    if (!response.ok) throw Error('Cloudflare ' + label + ' read returned HTTP ' + response.status + '.');
    return response;
  };
  // Read only the metadata of the currently deployed versions, not their bindings.
  const depResponse = await request('/deployments', 'deployment list');
  const deployments = summarizeDeployments(await depResponse.json());
  const activeVersions = [];
  for (const version of deployments.versions) {
    const resp = await request('/versions/' + version.id, 'version metadata');
    const payload = await resp.json();
    if (payload?.success !== true || payload?.result?.id !== version.id)
      throw Error('Version metadata does not match active deployment; refusing capture.');
    const result = payload.result;
    activeVersions.push({
      id: version.id,
      percentage: version.percentage,
      scriptEtag: typeof result?.resources?.script?.etag === 'string' ?
        result.resources.script.etag : null,
      compatibilityDate: typeof result?.resources?.script_runtime?.compatibility_date === 'string' ?
        result.resources.script_runtime.compatibility_date : null
    });
  }
  const srcResponse = await request('', 'script download');
  const contentType = srcResponse.headers.get('content-type') || '';
  if (/application\/json|text\/html/i.test(contentType))
    throw Error('Unexpected Cloudflare content type; refusing to save possible API error response.');
  const length = Number(srcResponse.headers.get('content-length') || 0);
  if (length > MAX_SOURCE) throw Error('Script is larger than the 25 MB capture limit.');
  const bytes = Buffer.from(await srcResponse.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_SOURCE) throw Error('Script is empty or exceeds the 25 MB limit.');
  const digest = createHash('sha256').update(bytes).digest('hex');
  const manifest = {
    format: 'study-os-cloudflare-worker-source-capture',
    version: 1,
    workerName: WORKER_NAME,
    capturedAt: new Date().toISOString(),
    scriptBytes: bytes.length,
    scriptSha256: digest,
    scriptContentType: contentType,
    latestDeployment: { ...deployments, versions: activeVersions },
    captureLimits: [
      'The script download endpoint returns current script content; it does not accept an active deployment version ID.',
      'This cannot prove that all actively served versions have been captured.',
      'Bindings and secrets have not been backed up or verified.',
      'No recovery/deployment test was executed.'
    ]
  };
  await mkdir(output, { recursive: true, mode: 0o700 });
  await writeFile(resolve(output, 'study-api-source.raw'), bytes, { mode: 0o600, flag: 'wx' });
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n',
    { mode: 0o600, flag: 'wx' });
  return { saved: true, byteLength: bytes.length, deployedVersions: activeVersions.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  capture(process.env).then(result => {
    process.stdout.write('Read-only script capture prepared; ' +
      result.deployedVersions + ' deployment version(s) documented. No release was made.\n');
  }).catch(error => {
    process.stderr.write('Worker capture stopped: ' + error.message + '\n');
    process.exitCode = 1;
  });
}
