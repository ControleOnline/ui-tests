import { APP_ENV } from '../../config/env';
import {
  clearStoredSession,
  hasStoredSession,
  readStoredSession,
  writeStoredSession,
  getStoredSessionApiKey,
} from '../lib/session';

const JSON_MIME_TYPE = 'application/ld+json';

const mutationTypes = {
  LOGIN_SET_USER: 'LOGIN_SET_USER',
  LOGIN_SET_ERROR: 'LOGIN_SET_ERROR',
  LOGIN_SET_ISLOADING: 'LOGIN_SET_ISLOADING',
  LOGIN_SET_IS_LOGGED: 'LOGIN_SET_IS_LOGGED',
  LOGIN_SET_SESSION_CHECKED: 'LOGIN_SET_SESSION_CHECKED',
  LOGIN_SET_VIOLATIONS: 'LOGIN_SET_VIOLATIONS',
  LOGIN_SET_INDEX_ROUTE: 'LOGIN_SET_INDEX_ROUTE',
  SET_PEOPLE_STATUS: 'SET_PEOPLE_STATUS',
};

function normalizeResponse(response) {
  return response?.response?.data ?? response?.data ?? response ?? null;
}

function parseStoredSession() {
  const session = readStoredSession();

  if (!session || typeof session !== 'object') {
    return null;
  }

  return session;
}

function normalizeBaseUrl(apiBaseUrl) {
  const trimmed = String(apiBaseUrl || '').trim();

  if (trimmed === '') {
    throw new Error('API base URL não foi configurada.');
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
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

function buildApiUrl(path, params) {
  const baseUrl = normalizeBaseUrl(APP_ENV.API_ENTRYPOINT);
  const normalizedPath = String(path || '').startsWith('/')
    ? String(path || '').slice(1)
    : String(path || '');
  const url = new URL(normalizedPath, `${baseUrl}/`);

  if (params && typeof params === 'object') {
    const serializedParams = serializeParams(params);

    if (serializedParams.length > 0) {
      url.search = serializedParams.join('&');
    }
  }

  return url.toString();
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

function buildHeaders({
  accept = JSON_MIME_TYPE,
  includeBody = false,
} = {}) {
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
  }

  const basicAuth = encodeBasicAuth(APP_ENV.HTACCESS_USER, APP_ENV.HTACCESS_PASSWORD);
  if (basicAuth !== '') {
    headers.set('Authorization', `Basic ${basicAuth}`);
  }

  if (String(APP_ENV.DOMAIN || '').trim() !== '') {
    headers.set('App-Domain', APP_ENV.DOMAIN);
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

async function request(path, options = {}) {
  const url = buildApiUrl(path, options.params);
  const hasBody =
    options.body !== undefined &&
    options.body !== null &&
    options.method !== 'GET' &&
    options.method !== 'HEAD';

  const headers = options.headers instanceof Headers
    ? new Headers(options.headers)
    : buildHeaders({
        accept: options.responseType === 'text' ? '*/*' : JSON_MIME_TYPE,
        includeBody: hasBody,
      });

  if (!(options.headers instanceof Headers)) {
    const hasBodyContentType =
      hasBody && typeof options.body !== 'string' && !(options.body instanceof FormData);

    if (hasBodyContentType && !headers.has('Content-Type')) {
      headers.set('Content-Type', JSON_MIME_TYPE);
    }
  }

  let body = options.body;
  if (hasBody && body && typeof body !== 'string' && !(body instanceof FormData) && !(body instanceof Blob)) {
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body,
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

async function fetchPeopleStatus(peopleId) {
  return await request(`people/${peopleId}`, {});
}

function persistSession(commit, user) {
  if (user && typeof user === 'object') {
    writeStoredSession(user);
  } else {
    clearStoredSession();
  }

  commit(mutationTypes.LOGIN_SET_USER, user);
  commit(mutationTypes.LOGIN_SET_IS_LOGGED, !!user?.active);
}

function clearSession(commit) {
  persistSession(commit, null);
}

export default {
  namespaced: true,
  state: {
    user: parseStoredSession() || {},
    isLoading: false,
    isLogged: hasStoredSession(),
    sessionChecked: false,
    error: '',
    violations: null,
    indexRoute: 'HomeIndex',
    peopleStatus: null,
    created: null,
  },
  mutations: {
    [mutationTypes.LOGIN_SET_USER](state, user) {
      if (!user) {
        clearStoredSession();
        state.user = {};
        state.isLogged = false;
      } else {
        writeStoredSession(user);
        state.user = user;
        state.isLogged = true;
      }

      return 'user';
    },
    [mutationTypes.LOGIN_SET_ERROR](state, error) {
      state.error = String(error || '').trim();
      return 'error';
    },
    [mutationTypes.LOGIN_SET_ISLOADING](state, isLoading = true) {
      state.isLoading = isLoading === true;
      return 'isLoading';
    },
    [mutationTypes.LOGIN_SET_IS_LOGGED](state, isLogged) {
      state.isLogged = isLogged === true;
      return 'isLogged';
    },
    [mutationTypes.LOGIN_SET_SESSION_CHECKED](state, sessionChecked) {
      state.sessionChecked = sessionChecked === true;
      return 'sessionChecked';
    },
    [mutationTypes.LOGIN_SET_VIOLATIONS](state, violations) {
      state.violations = violations || null;
      return 'violations';
    },
    [mutationTypes.LOGIN_SET_INDEX_ROUTE](state, indexRoute) {
      state.indexRoute = String(indexRoute || '').trim() || 'HomeIndex';
      return 'indexRoute';
    },
    [mutationTypes.SET_PEOPLE_STATUS](state, peopleStatus) {
      state.peopleStatus = peopleStatus || null;
      return 'peopleStatus';
    },
  },
  actions: {
    async signIn({ commit }, values) {
      commit(mutationTypes.LOGIN_SET_ERROR, '');
      commit(mutationTypes.LOGIN_SET_ISLOADING, true);

      try {
        const data = await request('token', {
          method: 'POST',
          body: values,
        });

        if (!data || data.error) {
          throw new Error(data?.error || 'Credenciais inválidas');
        }

        if ((data.active !== 1 && data.active !== true) || !data.api_key) {
          throw new Error('Credenciais inválidas');
        }

        persistSession(commit, data);
        commit(mutationTypes.LOGIN_SET_SESSION_CHECKED, true);
        return data;
      } catch (error) {
        commit(
          mutationTypes.LOGIN_SET_ERROR,
          error?.message || 'Credenciais inválidas',
        );
        throw error;
      } finally {
        commit(mutationTypes.LOGIN_SET_ISLOADING, false);
      }
    },
    async gSignIn({ commit }, values) {
      commit(mutationTypes.LOGIN_SET_ERROR, '');
      commit(mutationTypes.LOGIN_SET_ISLOADING, true);

      try {
        const response = await request('oauth/google/return', {
          method: 'POST',
          params: values,
        });
        const user = normalizeResponse(response);

        if (!user || user.error) {
          throw new Error(user?.error || 'Credenciais inválidas');
        }

        if ((user.active !== 1 && user.active !== true) || !user.api_key) {
          throw new Error('Credenciais inválidas');
        }

        persistSession(commit, user);
        commit(mutationTypes.LOGIN_SET_SESSION_CHECKED, true);
        return user;
      } catch (error) {
        commit(
          mutationTypes.LOGIN_SET_ERROR,
          error?.message || 'Credenciais inválidas',
        );
        throw error;
      } finally {
        commit(mutationTypes.LOGIN_SET_ISLOADING, false);
      }
    },
    async signUp({ commit }, values) {
      commit(mutationTypes.LOGIN_SET_ERROR, '');
      commit(mutationTypes.LOGIN_SET_ISLOADING, true);

      try {
        const response = await request('users/create-account', {
          method: 'POST',
          body: values,
        });

        const sessionData = response?.response?.data ?? response?.data ?? null;

        if (response?.response?.success === true && sessionData) {
          persistSession(commit, sessionData);
        }

        commit(mutationTypes.LOGIN_SET_SESSION_CHECKED, true);
        return response;
      } catch (error) {
        commit(
          mutationTypes.LOGIN_SET_ERROR,
          error?.message || 'Não foi possível criar a conta.',
        );
        throw error;
      } finally {
        commit(mutationTypes.LOGIN_SET_ISLOADING, false);
      }
    },
    async restoreSession({ commit }) {
      commit(mutationTypes.LOGIN_SET_SESSION_CHECKED, false);

      const session = parseStoredSession();
      const hasValidShape =
        !!session?.id &&
        !!session?.people &&
        !!session?.api_key &&
        (session.active === 1 || session.active === true);

      if (!hasValidShape) {
        clearSession(commit);
        commit(mutationTypes.LOGIN_SET_SESSION_CHECKED, true);
        return null;
      }

      try {
        await fetchPeopleStatus(session.people);
        persistSession(commit, session);
        commit(mutationTypes.LOGIN_SET_SESSION_CHECKED, true);
        return session;
      } catch {
        clearSession(commit);
        commit(mutationTypes.LOGIN_SET_SESSION_CHECKED, true);
        return null;
      }
    },
    logIn({ commit }, user = null) {
      persistSession(commit, user);
      commit(mutationTypes.LOGIN_SET_SESSION_CHECKED, true);
      return user;
    },
    logOut({ commit }) {
      clearStoredSession();
      commit(mutationTypes.LOGIN_SET_USER, null);
      commit(mutationTypes.LOGIN_SET_IS_LOGGED, false);
      commit(mutationTypes.LOGIN_SET_SESSION_CHECKED, true);
    },
    isLogged({ state }) {
      return !!state?.isLogged;
    },
    getLoggedUser({ state }) {
      return state?.user || {};
    },
    setIndexRoute({ commit }, indexRoute) {
      commit(mutationTypes.LOGIN_SET_INDEX_ROUTE, indexRoute);
    },
    async getUserStatus({ commit }) {
      const session = parseStoredSession();
      if (!session?.people) {
        return null;
      }

      try {
        const response = await fetchPeopleStatus(session.people);
        commit(mutationTypes.SET_PEOPLE_STATUS, normalizeResponse(response));
        return response;
      } catch {
        return null;
      }
    },
  },
};
