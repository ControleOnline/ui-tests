import { APP_ENV } from '../../config/env';
import { getStoredSessionApiKey } from './session';

const JSON_MIME_TYPE = 'application/ld+json';

function normalizeBaseUrl(apiBaseUrl) {
  const trimmed = String(apiBaseUrl || '').trim();

  if (trimmed === '') {
    throw new Error('API base URL não foi configurada.');
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function resolveRuntimeConfig(config = {}) {
  return {
    apiBaseUrl: String(config.apiBaseUrl || APP_ENV.API_ENTRYPOINT || '').trim(),
    htaccessUser: String(config.htaccessUser || APP_ENV.HTACCESS_USER || '').trim(),
    htaccessPassword: String(config.htaccessPassword || APP_ENV.HTACCESS_PASSWORD || '').trim(),
    domain: String(config.domain || APP_ENV.DOMAIN || '').trim(),
  };
}

export function buildApiUrl(apiBaseUrl, path) {
  const normalizedBase = normalizeBaseUrl(apiBaseUrl);
  const normalizedPath = String(path || '').startsWith('/')
    ? String(path || '').slice(1)
    : String(path || '');

  return new URL(normalizedPath, `${normalizedBase}/`).toString();
}

function encodeBasicAuth(user, password) {
  const credentials = `${String(user || '').trim()}:${String(password || '').trim()}`;

  if (credentials === ':') {
    return '';
  }

  if (typeof btoa === 'function') {
    return btoa(credentials);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(credentials, 'utf8').toString('base64');
  }

  return '';
}

function serializeParams(params, prefix = '') {
  if (!params || typeof params !== 'object') {
    return [];
  }

  const pairs = [];

  Object.keys(params).forEach((key) => {
    const value = params[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      pairs.push(`${fullKey}=`);
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        pairs.push(`${fullKey}[]=`);
        return;
      }

      value.forEach((item) => {
        if (item && typeof item === 'object') {
          pairs.push(...serializeParams(item, `${fullKey}[]`));
          return;
        }

        pairs.push(`${fullKey}[]=${encodeURIComponent(String(item))}`);
      });
      return;
    }

    if (typeof value === 'object') {
      pairs.push(...serializeParams(value, fullKey));
      return;
    }

    pairs.push(`${fullKey}=${encodeURIComponent(String(value))}`);
  });

  return pairs;
}

function buildRequestHeaders(
  { accept = JSON_MIME_TYPE, includeBody = false } = {},
  config = {},
) {
  const runtimeConfig = resolveRuntimeConfig(config);
  const headers = new Headers();

  if (accept !== '') {
    headers.set('Accept', accept);
  }

  if (includeBody) {
    headers.set('Content-Type', JSON_MIME_TYPE);
  }

  const sessionApiKey = getStoredSessionApiKey();
  if (sessionApiKey !== '') {
    headers.set('API-TOKEN', sessionApiKey);
    headers.set('X-API-KEY', sessionApiKey);
  }

  const basicAuth = encodeBasicAuth(runtimeConfig.htaccessUser, runtimeConfig.htaccessPassword);
  if (basicAuth !== '') {
    headers.set('Authorization', `Basic ${basicAuth}`);
  }

  if (runtimeConfig.domain !== '') {
    headers.set('App-Domain', runtimeConfig.domain);
  }

  return headers;
}

async function readResponseBody(response) {
  const raw = await response.text().catch(() => '');
  const trimmed = raw.trim();

  if (trimmed === '') {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function buildHttpError(response, body) {
  const message =
    String(body?.message || body?.error || body || response.statusText || 'Request failed')
      .trim() || 'Request failed';

  const error = new Error(message);
  error.code = response.status;
  error.status = response.status;
  error.body = body;
  return error;
}

async function request(path, options = {}, config = {}) {
  const runtimeConfig = resolveRuntimeConfig(config);
  const baseUrl = normalizeBaseUrl(runtimeConfig.apiBaseUrl);
  const normalizedPath = String(path || '').startsWith('/')
    ? String(path || '').slice(1)
    : String(path || '');
  const url = new URL(normalizedPath, `${baseUrl}/`);

  if (options.params && typeof options.params === 'object') {
    const serializedParams = serializeParams(options.params);
    if (serializedParams.length > 0) {
      url.search = serializedParams.join('&');
    }
  }

  const hasBody =
    options.body !== undefined &&
    options.body !== null &&
    options.method !== 'GET' &&
    options.method !== 'HEAD';

  const headers =
    options.headers instanceof Headers
      ? new Headers(options.headers)
      : buildRequestHeaders({
          accept: options.responseType === 'text' ? '*/*' : JSON_MIME_TYPE,
          includeBody: hasBody,
        }, runtimeConfig);

  if (!(options.headers instanceof Headers) && hasBody) {
    if (
      options.body &&
      typeof options.body !== 'string' &&
      !(options.body instanceof FormData) &&
      !(options.body instanceof Blob)
    ) {
      options.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw buildHttpError(response, responseBody);
  }

  if (
    responseBody &&
    typeof responseBody === 'object' &&
    (responseBody['@type'] === 'Error' ||
      responseBody['@type'] === 'ConstraintViolationList')
  ) {
    throw buildHttpError(response, responseBody);
  }

  if (options.responseType === 'text') {
    return typeof responseBody === 'string' ? responseBody : '';
  }

  return responseBody;
}

async function readErrorMessage(response) {
  const body = await response.text().catch(() => '');
  const trimmed = body.trim();

  if (trimmed !== '') {
    return trimmed;
  }

  return `${response.status} ${response.statusText}`.trim();
}

export async function loadSmokeIndex(config = {}) {
  return await request('/tests/index.json', {}, config);
}

export async function loadArtifactBlob(config, artifact) {
  const runtimeConfig = resolveRuntimeConfig(config);
  const response = await fetch(buildApiUrl(runtimeConfig.apiBaseUrl, artifact.url), {
    headers: buildRequestHeaders({ accept: '*/*' }, runtimeConfig),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return await response.blob();
}

export async function triggerSmokeRun(config = {}) {
  return await request('/tests/run', {
    method: 'POST',
  }, config);
}
