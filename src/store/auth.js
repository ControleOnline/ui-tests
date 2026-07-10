import { api } from '@controleonline/ui-common/src/api';
import {
  clearStoredSession,
  hasStoredSession,
  readStoredSession,
  writeStoredSession,
} from '../session';

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

function request(path, options = {}) {
  return api.fetch(path, options);
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
