import { api as commonApi } from '@controleonline/ui-common/src/api';
import { getSmokeApiConfig } from '../smokeConfig';
import { formatDateTimeLabel, statusLabel } from '../react/pages/home/SmokeDashboard.helpers';

const EMPTY_SUMMARY = {
  types: { total: 0, passed: 0, failed: 0 },
  suites: { total: 0, passed: 0, failed: 0 },
  tests: { total: 0, passed: 0, failed: 0 },
};

let loadRequestId = 0;
let runRequestId = 0;

function toCount(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function normalizeCountSummary(summary = {}, fallback = EMPTY_SUMMARY.types) {
  return {
    total: toCount(summary.total ?? fallback.total),
    passed: toCount(summary.passed ?? fallback.passed),
    failed: toCount(summary.failed ?? fallback.failed),
  };
}

function normalizeSummary(summary = {}) {
  return {
    types: normalizeCountSummary(summary.types, EMPTY_SUMMARY.types),
    suites: normalizeCountSummary(summary.suites, EMPTY_SUMMARY.suites),
    tests: normalizeCountSummary(summary.tests, EMPTY_SUMMARY.tests),
  };
}

function normalizeItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  return {
    ...item,
    summary: normalizeSummary(item.summary),
  };
}

function buildColumns() {
  return [
    {
      sortable: true,
      name: 'displayName',
      align: 'left',
      label: 'suite',
      isIdentity: true,
      searchable: true,
      format(value) {
        return value || '';
      },
    },
    {
      sortable: true,
      name: 'suitePath',
      align: 'left',
      label: 'caminho',
      searchable: true,
      format(value) {
        return value || '';
      },
    },
    {
      sortable: true,
      name: 'status',
      align: 'left',
      label: 'status',
      searchable: true,
      list: [
        {value: 'passed', label: statusLabel('passed')},
        {value: 'failed', label: statusLabel('failed')},
        {value: 'pending', label: statusLabel('pending')},
      ],
      format(value) {
        return statusLabel(value);
      },
    },
    {
      sortable: true,
      name: 'testsCount',
      align: 'center',
      label: 'testes',
      format(value) {
        return String(Number(value) || 0);
      },
    },
    {
      sortable: true,
      name: 'passedCount',
      align: 'center',
      label: 'passaram',
      format(value) {
        return String(Number(value) || 0);
      },
    },
    {
      sortable: true,
      name: 'failedCount',
      align: 'center',
      label: 'falharam',
      format(value) {
        return String(Number(value) || 0);
      },
    },
    {
      sortable: true,
      name: 'updatedAt',
      align: 'left',
      label: 'atualizado em',
      format(value) {
        return formatDateTimeLabel(value);
      },
    },
  ];
}

function getApiConfig(options = {}) {
  const apiBaseUrl =
    typeof options === 'string'
      ? options
      : options?.apiBaseUrl;
  const config = getSmokeApiConfig();

  return {
    ...config,
    apiBaseUrl: String(apiBaseUrl || config.apiBaseUrl || '').trim(),
    domain: String(options?.domain || config.domain || '').trim(),
    htaccessUser: String(options?.htaccessUser || config.htaccessUser || '').trim(),
    htaccessPassword: String(options?.htaccessPassword || config.htaccessPassword || '').trim(),
  };
}

function readRunMessage(response) {
  if (response && typeof response === 'object' && typeof response.message === 'string') {
    const message = response.message.trim();
    if (message !== '') {
      return message;
    }
  }

  return 'Smoke tests disparados com sucesso.';
}

function readErrorMessage(error, fallback) {
  const message = String(error?.message || '').trim();
  return message || fallback;
}

export default {
  namespaced: true,
  state: {
    item: null,
    items: [],
    resourceEndpoint: 'tests',
    isLoading: false,
    refreshing: false,
    isSaving: false,
    error: '',
    runMessage: '',
    runError: '',
    totalItems: 0,
    summary: EMPTY_SUMMARY,
    filters: {},
    visibleColumns: {},
    configs: {
      searchKey: 'search',
      viewMode: 'table',
    },
    columns: buildColumns(),
    loadedAt: 0,
    loadedKey: '',
  },
  mutations: {
    SET_ITEM(state, item) {
      state.item = item;
      return 'item';
    },
    SET_ITEMS(state, items) {
      state.items = Array.isArray(items) ? items : [];
      return 'items';
    },
    SET_RESOURCE_ENDPOINT(state, resourceEndpoint) {
      state.resourceEndpoint = String(resourceEndpoint || '').trim() || 'tests';
      return 'resourceEndpoint';
    },
    SET_ISLOADING(state, isLoading = true) {
      state.isLoading = isLoading === true;
      return 'isLoading';
    },
    SET_REFRESHING(state, refreshing = true) {
      state.refreshing = refreshing === true;
      return 'refreshing';
    },
    SET_ISSAVING(state, isSaving = true) {
      state.isSaving = isSaving === true;
      return 'isSaving';
    },
    SET_ERROR(state, error) {
      state.error = String(error || '').trim();
      return 'error';
    },
    SET_RUN_MESSAGE(state, runMessage) {
      state.runMessage = String(runMessage || '').trim();
      return 'runMessage';
    },
    SET_RUN_ERROR(state, runError) {
      state.runError = String(runError || '').trim();
      return 'runError';
    },
    SET_TOTALITEMS(state, totalItems) {
      state.totalItems = toCount(totalItems);
      return 'totalItems';
    },
    SET_SUMMARY(state, summary) {
      state.summary = normalizeSummary(summary);
      return 'summary';
    },
    SET_FILTERS(state, filters) {
      state.filters = filters && typeof filters === 'object' ? filters : {};
      return 'filters';
    },
    SET_VISIBLE_COLUMNS(state, visibleColumns) {
      state.visibleColumns = visibleColumns && typeof visibleColumns === 'object' ? visibleColumns : {};
      return 'visibleColumns';
    },
    SET_CONFIGS(state, configs) {
      state.configs = configs && typeof configs === 'object' ? configs : {};
      return 'configs';
    },
    SET_COLUMNS(state, columns) {
      state.columns = Array.isArray(columns) ? columns : [];
      return 'columns';
    },
    SET_LOADED_AT(state, loadedAt) {
      state.loadedAt = Number(loadedAt) || 0;
      return 'loadedAt';
    },
    SET_LOADED_KEY(state, loadedKey) {
      state.loadedKey = String(loadedKey || '').trim();
      return 'loadedKey';
    },
  },
  actions: {
    async loadIndex({ commit }, options = {}) {
      const keepCurrent = options?.keepCurrent === true;
      const config = getApiConfig(options);
      const apiClient = options?.api || commonApi;
      const loadSmokeIndexFn =
        typeof apiClient.loadSmokeIndex === 'function'
          ? apiClient.loadSmokeIndex
          : commonApi.loadSmokeIndex;
      const requestId = ++loadRequestId;

      if (keepCurrent) {
        commit('SET_REFRESHING', true);
      } else {
        commit('SET_ISLOADING', true);
        commit('SET_ITEM', null);
        commit('SET_ITEMS', []);
        commit('SET_TOTALITEMS', 0);
        commit('SET_SUMMARY', EMPTY_SUMMARY);
        commit('SET_LOADED_AT', 0);
        commit('SET_LOADED_KEY', '');
      }

      commit('SET_ERROR', '');
      commit('SET_RUN_ERROR', '');
      commit('SET_RUN_MESSAGE', '');

      try {
        const index = normalizeItem(await loadSmokeIndexFn(config));

        if (requestId !== loadRequestId) {
          return index;
        }

        commit('SET_ITEM', index);
        commit('SET_ITEMS', Array.isArray(index?.suites) ? index.suites : []);
        commit('SET_TOTALITEMS', Array.isArray(index?.suites) ? index.suites.length : 0);
        commit('SET_SUMMARY', index?.summary || EMPTY_SUMMARY);
        commit('SET_LOADED_AT', Date.now());
        commit('SET_LOADED_KEY', index?.lastRunAt || index?.generatedAt || '');
        return index;
      } catch (error) {
        if (requestId !== loadRequestId) {
          throw error;
        }

        commit('SET_ERROR', readErrorMessage(error, 'Falha ao ler o índice publicado.'));

        if (!keepCurrent) {
          commit('SET_ITEM', null);
          commit('SET_ITEMS', []);
          commit('SET_TOTALITEMS', 0);
          commit('SET_SUMMARY', EMPTY_SUMMARY);
          commit('SET_LOADED_AT', 0);
          commit('SET_LOADED_KEY', '');
        }

        throw error;
      } finally {
        if (requestId === loadRequestId) {
          commit('SET_ISLOADING', false);
          commit('SET_REFRESHING', false);
        }
      }
    },
    setItems({ commit }, items) {
      commit('SET_ITEMS', items);
      return items;
    },
    setTotalItems({ commit }, totalItems) {
      commit('SET_TOTALITEMS', totalItems);
      return totalItems;
    },
    setFilters({ commit }, filters) {
      commit('SET_FILTERS', filters);
      return filters;
    },
    setVisibleColumns({ commit }, visibleColumns) {
      commit('SET_VISIBLE_COLUMNS', visibleColumns);
      return visibleColumns;
    },
    setColumns({ commit }, columns) {
      commit('SET_COLUMNS', columns);
      return columns;
    },
    setConfigs({ commit }, configs) {
      commit('SET_CONFIGS', configs);
      return configs;
    },
    async runAllTests({ commit, dispatch }, options = {}) {
      const config = getApiConfig(options);
      const apiClient = options?.api || commonApi;
      const triggerSmokeRunFn =
        typeof apiClient.triggerSmokeRun === 'function'
          ? apiClient.triggerSmokeRun
          : commonApi.triggerSmokeRun;
      const requestId = ++runRequestId;

      commit('SET_ISSAVING', true);
      commit('SET_RUN_ERROR', '');
      commit('SET_RUN_MESSAGE', '');

      try {
        const response = await triggerSmokeRunFn(config);

        if (requestId !== runRequestId) {
          return response;
        }

        commit('SET_RUN_MESSAGE', readRunMessage(response));
        await dispatch('loadIndex', {
          keepCurrent: true,
          apiBaseUrl: config.apiBaseUrl,
          domain: config.domain,
          htaccessUser: config.htaccessUser,
          htaccessPassword: config.htaccessPassword,
        });
        return response;
      } catch (error) {
        if (requestId !== runRequestId) {
          throw error;
        }

        commit('SET_RUN_ERROR', readErrorMessage(error, 'Falha ao disparar a execução dos smoke tests.'));
        throw error;
      } finally {
        if (requestId === runRequestId) {
          commit('SET_ISSAVING', false);
        }
      }
    },
    async loadArtifact({ commit }, payload = {}) {
      const artifact = payload?.artifact || payload;
      const config = getApiConfig(payload);
      const apiClient = payload?.api || commonApi;
      const loadArtifactBlobFn =
        typeof apiClient.loadArtifactBlob === 'function'
          ? apiClient.loadArtifactBlob
          : commonApi.loadArtifactBlob;

      if (!artifact || typeof artifact !== 'object') {
        throw new Error('Artefato inválido.');
      }

      return await loadArtifactBlobFn(config, artifact);
    },
    clearFeedback({ commit }) {
      commit('SET_ERROR', '');
      commit('SET_RUN_MESSAGE', '');
      commit('SET_RUN_ERROR', '');
    },
  },
};
