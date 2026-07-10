import { useSyncExternalStore } from 'react';
import stores from '@stores';

const storeState = {};
const subscribers = new Set();
let initialized = false;

function notify() {
  subscribers.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignorar listener quebrado para não travar a interface.
    }
  });
}

function resolveSystemErrorMessage(value) {
  if (value === null || value === undefined || value === false) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (value instanceof Error) {
    return String(value.message || '').trim();
  }

  if (typeof value === 'object' && typeof value.message === 'string') {
    return String(value.message || '').trim();
  }

  return String(value || '').trim();
}

function publishStoreError({ error, options = {} } = {}) {
  if (options?.skipSystemError === true) {
    return false;
  }

  const message = resolveSystemErrorMessage(error);

  if (!message) {
    return false;
  }

  if (typeof globalThis.publishSystemError === 'function') {
    try {
      globalThis.publishSystemError(error, {
        source: 'store',
        ...options,
      });
    } catch {
      // O front de testes não precisa falhar se o canal global não existir.
    }
  }

  return true;
}

function initializeStores() {
  if (initialized) {
    return;
  }

  if (!stores || Object.keys(stores).length === 0) {
    console.warn('No stores defined.');
    initialized = true;
    return;
  }

  Object.keys(stores).forEach((storeName) => {
    const storeModule = stores[storeName];

    if (!storeModule || !storeModule.state || !storeModule.mutations || !storeModule.actions) {
      console.warn(
        `Store "${storeName}" is missing required properties (state, mutations, or actions). Skipping.`,
      );
      return;
    }

    storeState[storeName] = {
      ...storeModule.state,
    };

    const getters = new Proxy({}, {
      get: (_, prop) => storeState[storeName]?.[prop],
      set: (_, prop, value) => {
        if (!storeState[storeName]) {
          return true;
        }

        storeState[storeName][prop] = value;
        notify();
        return true;
      },
    });

    storeState[storeName].getters = getters;
    storeState[storeName].actions = {};

    const commit = (type, payload, options = {}) => {
      if (!storeModule.mutations[type]) {
        console.error(`Mutation "${type}" not found in store "${storeName}"`);
        return;
      }

      storeModule.mutations[type](getters, payload);
      if (String(type).includes('ERROR') && resolveSystemErrorMessage(payload)) {
        publishStoreError({
          error: payload,
          options,
        });
      }
      notify();
    };

    const dispatch = (actionName, ...args) => {
      if (typeof actionName !== 'string' || !actionName) {
        console.error(
          `Dispatch received an invalid action name in store "${storeName}"`,
        );
        return undefined;
      }

      let targetStoreName = storeName;
      let targetActionName = actionName;

      if (actionName.includes('/')) {
        const [parsedStoreName, parsedActionName] = actionName.split('/');
        targetStoreName = parsedStoreName || storeName;
        targetActionName = parsedActionName || actionName;
      }

      const targetStore = storeState[targetStoreName];
      const targetAction = targetStore?.actions?.[targetActionName];

      if (typeof targetAction !== 'function') {
        console.error(
          `Action "${targetActionName}" not found in store "${targetStoreName}"`,
        );
        return undefined;
      }

      return targetAction(...args);
    };

    Object.keys(storeModule.actions).forEach((actionName) => {
      storeState[storeName].actions[actionName] = (...args) =>
        storeModule.actions[actionName](
          { commit, getters, dispatch },
          ...args,
        );
    });
  });

  initialized = true;
}

export const useStores = {
  getState() {
    initializeStores();
    return storeState;
  },
  subscribe(listener) {
    initializeStores();
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  },
};

const EMPTY_STORE = { getters: {}, actions: {} };

export const useStore = (storeName) =>
  useSyncExternalStore(
    useStores.subscribe,
    () => {
      const state = useStores.getState();
      if (!state[storeName]) {
        console.warn(`useStore: store not found "${String(storeName)}"`);
        return EMPTY_STORE;
      }
      return state[storeName];
    },
  );

export const getAllStores = () => useStores.getState();
