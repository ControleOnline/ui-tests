import { api as uiCommonApi } from '@controleonline/ui-common/src/api';
import { getStoredSessionApiKey } from './session';

function normalizeBaseUrl(apiBaseUrl) {
  const trimmed = String(apiBaseUrl || '').trim();

  if (trimmed === '') {
    throw new Error('API base URL não foi configurada.');
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function buildApiUrl(apiBaseUrl, path) {
  const normalizedBase = normalizeBaseUrl(apiBaseUrl);
  const normalizedPath = String(path || '').startsWith('/')
    ? String(path || '').slice(1)
    : String(path || '');

  return new URL(normalizedPath, `${normalizedBase}/`).toString();
}

function buildHeaders(accept = 'application/json') {
  const headers = new Headers();

  if (accept !== '') {
    headers.set('Accept', accept);
  }

  const sessionApiKey = getStoredSessionApiKey();
  if (sessionApiKey !== '') {
    headers.set('X-API-KEY', sessionApiKey);
  }

  return headers;
}

async function readErrorMessage(response) {
  const raw = await response.text().catch(() => '');
  const trimmed = raw.trim();

  if (trimmed !== '') {
    return trimmed;
  }

  return `${response.status} ${response.statusText}`.trim();
}

export async function loadSmokeIndex() {
  return await uiCommonApi.fetch('/tests/index.json', {});
}

export async function loadArtifactBlob(config, artifact) {
  const response = await fetch(buildApiUrl(config.apiBaseUrl, artifact.url), {
    headers: buildHeaders('*/*'),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return await response.blob();
}

export async function triggerSmokeRun() {
  return await uiCommonApi.fetch('/tests/run', {
    method: 'POST',
  });
}
