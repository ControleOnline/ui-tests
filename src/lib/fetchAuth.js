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

function normalizeBaseUrl(apiBaseUrl) {
  const trimmed = String(apiBaseUrl || '').trim();

  if (trimmed === '') {
    throw new Error('API base URL não foi configurada.');
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function resolveRequestUrl(input, apiBaseUrl) {
  try {
    if (input instanceof URL) {
      return input;
    }

    if (typeof input === 'string') {
      return new URL(input, `${normalizeBaseUrl(apiBaseUrl)}/`);
    }

    if (input && typeof input.url === 'string') {
      return new URL(input.url);
    }
  } catch {
    return null;
  }

  return null;
}

export function createAuthenticatedFetch(baseFetch, { apiBaseUrl, htaccessUser, htaccessPassword }) {
  const basicAuth = encodeBasicAuth(htaccessUser, htaccessPassword);

  if (!basicAuth) {
    return baseFetch;
  }

  const allowedOrigin = new URL(normalizeBaseUrl(apiBaseUrl)).origin;

  return (input, init = {}) => {
    const requestUrl = resolveRequestUrl(input, apiBaseUrl);

    if (!requestUrl || requestUrl.origin !== allowedOrigin) {
      return baseFetch(input, init);
    }

    const headers = new Headers(init.headers || (input && input.headers) || undefined);
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Basic ${basicAuth}`);
    }

    return baseFetch(input, {
      ...init,
      headers,
    });
  };
}
