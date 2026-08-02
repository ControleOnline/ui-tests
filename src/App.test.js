import React from 'react';
import { act, create } from 'react-test-renderer';

const smokeConfig = {
  apiBaseUrl: 'https://example.test',
  domain: '',
  htaccessUser: '',
  htaccessPassword: '',
};

jest.mock('react-native', () => {
  return {
    ActivityIndicator: 'ActivityIndicator',
    Image: 'Image',
    Pressable: 'Pressable',
    Platform: {
      OS: 'web',
      select: (options) => options.web || options.default || options.ios || options.android,
    },
    ScrollView: 'ScrollView',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    View: 'View',
    StyleSheet: {
      create: (styles) => styles,
      flatten: (styles) => styles,
    },
    useWindowDimensions: () => ({
      width: 1280,
      height: 800,
      scale: 1,
      fontScale: 1,
    }),
  };
});
jest.mock('@controleonline/ui-common/src/react/components/MessageService', () => ({
  useMessage: () => ({
    showError: jest.fn(),
  }),
}));
jest.mock('react-native-vector-icons/Feather', () => {
  const React = require('react');
  return (props) => React.createElement('icon', props, props.children);
});
jest.mock('@controleonline/ui-default/src/react/components/table/DefaultTableImportModal', () => {
  const React = require('react');
  return (props) => React.createElement('DefaultTableImportModal', props);
});
jest.mock('@react-navigation/native', () => ({
  NavigationRouteContext: require('react').createContext(undefined),
  useIsFocused: jest.fn(() => false),
  useNavigation: () => ({
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));
jest.mock('@store', () => {
  const React = require('react');
  const {api} = jest.requireMock('@controleonline/ui-common/src/api');

  const listeners = new Set();

  const initialState = () => ({
    item: null,
    error: null,
    isLoading: true,
    refreshing: false,
    isSaving: false,
    runMessage: '',
    runError: '',
  });

  let state = initialState();
  let snapshot = null;

  const syncSnapshot = () => {
    snapshot = {
      getters: state,
      actions,
    };
  };

  const emit = () => {
    syncSnapshot();
    listeners.forEach((listener) => listener());
  };

  const setState = (patch) => {
    state = {
      ...state,
      ...patch,
    };
    emit();
  };

  const actions = {
    async loadIndex(options = {}) {
      const keepCurrent = options.keepCurrent === true;

      setState({
        isLoading: !keepCurrent,
        refreshing: keepCurrent,
        error: keepCurrent ? state.error : null,
        runMessage: keepCurrent ? state.runMessage : '',
        runError: keepCurrent ? state.runError : '',
      });

      try {
        const index = await api.loadSmokeIndex(smokeConfig);

        setState({
          item: index,
          error: null,
          isLoading: false,
          refreshing: false,
        });

        return index;
      } catch (error) {
        setState({
          item: keepCurrent ? state.item : null,
          error:
            error instanceof Error && error.message.trim() !== ''
              ? error.message
              : 'Falha ao consultar o índice publicado.',
          isLoading: false,
          refreshing: false,
        });

        throw error;
      }
    },
    async loadArtifact({artifact}) {
      return api.loadArtifactBlob(smokeConfig, artifact);
    },
    async runAllTests() {
      setState({
        isSaving: true,
        runMessage: '',
        runError: '',
      });

      try {
        const response = await api.triggerSmokeRun(smokeConfig);

        setState({
          isSaving: false,
          runMessage:
            response && typeof response === 'object' && String(response.message || '').trim() !== ''
              ? String(response.message).trim()
              : 'Smoke tests disparados com sucesso.',
        });

        await actions.loadIndex({keepCurrent: true});

        return response;
      } catch (error) {
        setState({
          isSaving: false,
          runError:
            error instanceof Error && error.message.trim() !== ''
              ? error.message
              : 'Falha ao disparar a execução dos smoke tests.',
        });

        throw error;
      }
    },
  };

  syncSnapshot();

  return {
    useStore: (storeName) => {
      if (storeName !== 'tests') {
        return {
          getters: {},
          actions: {},
        };
      }

      return React.useSyncExternalStore(
        (listener) => {
          listeners.add(listener);

          return () => {
            listeners.delete(listener);
          };
        },
        () => snapshot,
        () => snapshot,
      );
    },
  };
});
jest.mock('@controleonline/ui-common/src/api', () => ({
  api: {
    loadArtifactBlob: jest.fn(),
    loadSmokeIndex: jest.fn(),
    triggerSmokeRun: jest.fn(),
  },
}));
jest.mock('./smokeConfig', () => ({
  getSmokeApiConfig: () => smokeConfig,
}));

jest.setTimeout(60000);

let SmokeDashboard;
let commonApi;
let renderedTree;
let mockDefaultTableProps = null;

jest.mock('@controleonline/ui-default/src/react/components/table/DefaultTable', () => {
  const React = require('react');

  return function MockDefaultTable(props) {
    mockDefaultTableProps = props;
    const rows = Array.isArray(props.data) ? props.data : [];

    return React.createElement(
      'DefaultTable',
      props,
      rows.map((row) =>
        React.createElement(
          'TouchableOpacity',
          {
            key: row?.suiteId || row?.id || row?.displayName,
            accessibilityRole: 'button',
            onPress: () => props.onRowPress?.(row),
          },
          React.createElement('Text', null, row?.displayName || row?.suite || row?.suitePath || ''),
        ),
      ),
    );
  };
});

function loadSubject() {
  const appModule = require('./react/pages/home');
  SmokeDashboard = appModule.SmokeDashboard;
  commonApi = require('@controleonline/ui-common/src/api').api;
}

function createIndexFixture() {
  const browserSuiteId = 'browser-smoke-login-flow';
  const phpunitSuiteId = 'phpunit-unit';

  return {
    generatedAt: '2026-07-06T18:51:19.924Z',
    status: 'failed',
    progress: 67,
    message: '1 suite com falha em 2 publicadas.',
    lastRunAt: '2026-07-06T18:51:19.924Z',
    summary: {
      types: { total: 2, passed: 1, failed: 1 },
      suites: { total: 2, passed: 1, failed: 1 },
      tests: { total: 3, passed: 2, failed: 1 },
    },
    types: [
      {
        type: 'browser-smoke',
        displayName: 'Browser Smoke',
        status: 'passed',
        progress: 100,
        message: '1 suite publicada e 1 teste passaram.',
        summary: {
          suites: { total: 1, passed: 1, failed: 0 },
          tests: { total: 1, passed: 1, failed: 0 },
        },
        suites: [
          {
            type: 'browser-smoke',
            typeDisplayName: 'Browser Smoke',
            suite: 'login-flow',
            suitePath: 'browser-smoke/login-flow',
            suiteId: browserSuiteId,
            displayName: 'Login Flow',
            generatedAt: '2026-07-06T17:42:40.016Z',
            updatedAt: '2026-07-06T17:42:40.016Z',
            status: 'passed',
            summary: { total: 1, passed: 1, failed: 0 },
            tests: [
              {
                title: 'abre o fluxo de login e registra prints',
                status: 'passed',
                error: null,
                screenshots: [
                  {
                    label: 'Tela inicial',
                    name: '01-login-screen.png',
                    url: '/tests/artifacts/browser-smoke-login-flow/01-login-screen.png',
                    mimeType: 'image/png',
                    kind: 'image',
                    available: true,
                  },
                ],
                steps: [
                  {
                    title: 'Abre o login',
                    status: 'passed',
                    error: null,
                    screenshots: [],
                  },
                ],
              },
            ],
            error: null,
            links: { report: '/tests/artifacts/browser-smoke-login-flow/report.json' },
          },
        ],
      },
      {
        type: 'phpunit',
        displayName: 'PHPUnit',
        status: 'failed',
        progress: 50,
        message: '1 suite com falha em 1 publicadas.',
        summary: {
          suites: { total: 1, passed: 0, failed: 1 },
          tests: { total: 2, passed: 1, failed: 1 },
        },
        suites: [
          {
            type: 'phpunit',
            typeDisplayName: 'PHPUnit',
            suite: 'Core',
            suitePath: 'phpunit/unit',
            suiteId: phpunitSuiteId,
            displayName: 'Core',
            generatedAt: '2026-07-06T18:51:19+00:00',
            updatedAt: '2026-07-06T18:51:19+00:00',
            status: 'failed',
            summary: { total: 2, passed: 1, failed: 1 },
            tests: [
              {
                title: 'ExampleServiceTest::testItRegistersRecord',
                status: 'passed',
                error: null,
                screenshots: [],
                steps: [],
              },
              {
                title: 'ExampleServiceTest::testItRejectsInvalidData',
                status: 'failed',
                error: 'Failed asserting that false is true.',
                screenshots: [],
                steps: [],
              },
            ],
            error: null,
            links: { report: '/tests/artifacts/phpunit-unit/report.xml' },
          },
        ],
      },
    ],
    suites: [
      {
        type: 'browser-smoke',
        typeDisplayName: 'Browser Smoke',
        suite: 'login-flow',
        suitePath: 'browser-smoke/login-flow',
        suiteId: browserSuiteId,
        displayName: 'Login Flow',
        generatedAt: '2026-07-06T17:42:40.016Z',
        updatedAt: '2026-07-06T17:42:40.016Z',
        status: 'passed',
        summary: { total: 1, passed: 1, failed: 0 },
        tests: [
          {
            title: 'abre o fluxo de login e registra prints',
            status: 'passed',
            error: null,
            screenshots: [
              {
                label: 'Tela inicial',
                name: '01-login-screen.png',
                url: '/tests/artifacts/browser-smoke-login-flow/01-login-screen.png',
                mimeType: 'image/png',
                kind: 'image',
                available: true,
              },
            ],
            steps: [
              {
                title: 'Abre o login',
                status: 'passed',
                error: null,
                screenshots: [],
              },
            ],
          },
        ],
        error: null,
        links: { report: '/tests/artifacts/browser-smoke-login-flow/report.json' },
      },
      {
        type: 'phpunit',
        typeDisplayName: 'PHPUnit',
        suite: 'Core',
        suitePath: 'phpunit/unit',
        suiteId: phpunitSuiteId,
        displayName: 'Core',
        generatedAt: '2026-07-06T18:51:19+00:00',
        updatedAt: '2026-07-06T18:51:19+00:00',
        status: 'failed',
        summary: { total: 2, passed: 1, failed: 1 },
        tests: [
          {
            title: 'ExampleServiceTest::testItRegistersRecord',
            status: 'passed',
            error: null,
            screenshots: [],
            steps: [],
          },
          {
            title: 'ExampleServiceTest::testItRejectsInvalidData',
            status: 'failed',
            error: 'Failed asserting that false is true.',
            screenshots: [],
            steps: [],
          },
        ],
        error: null,
        links: { report: '/tests/artifacts/phpunit-unit/report.xml' },
      },
    ],
    links: { self: '/tests', artifacts: '/tests/artifacts' },
  };
}

function isPlainTextNode(node) {
  return (
    Array.isArray(node?.children) &&
    node.children.length > 0 &&
    node.children.every((child) => typeof child === 'string' || typeof child === 'number')
  );
}

function getPlainText(node) {
  return node.children.map((child) => String(child)).join('');
}

function findTextNodes(root, text) {
  return root.findAll(
    (node) => isPlainTextNode(node) && getPlainText(node) === text,
  );
}

function getNodeText(node) {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (!node || !Array.isArray(node.children)) {
    return '';
  }

  return node.children
    .map((child) => getNodeText(child))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findButton(root, label) {
  const buttons = root.findAll(
    (node) => node.props?.accessibilityRole === 'button',
  );

  const button = buttons.find((node) => {
    if (String(node.props?.accessibilityLabel || '').trim() === label) {
      return true;
    }

    return getNodeText(node) === label;
  });

  if (!button) {
    throw new Error(`Botão não encontrado: ${label}`);
  }

  return button;
}

function findPressableContainingText(root, label) {
  const pressables = root.findAll(
    (node) => node.props?.accessibilityRole === 'button',
  );

  const node = pressables.find((candidate) => getNodeText(candidate).includes(label));

  if (!node) {
    throw new Error(`Linha não encontrada: ${label}`);
  }

  return node;
}

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

async function flushUpdates(times = 2) {
  for (let index = 0; index < times; index += 1) {
    await act(async () => {
      await flushMicrotasks();
    });
  }
}

async function waitForCondition(predicate, timeoutMs = 5000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      if (predicate()) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await act(async () => {
      await flushMicrotasks();
    });
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('Timed out waiting for condition.');
}

async function renderDashboard() {
  let tree;

  await act(async () => {
    tree = create(<SmokeDashboard />);
  });

  renderedTree = tree;
  await waitForCondition(() => commonApi.loadSmokeIndex.mock.calls.length > 0);
  return tree;
}

async function pressButton(label) {
  const button = findButton(renderedTree.root, label);

  await act(async () => {
    button.props.onPress?.();
  });

  await flushUpdates(2);
}

describe('SmokeDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDefaultTableProps = null;
    loadSubject();
    renderedTree = null;
  });

  afterEach(() => {
    renderedTree?.unmount?.();
    renderedTree = null;
  });

  it('renders grouped types, suites, and tests after loading the index', async () => {
    commonApi.loadSmokeIndex.mockResolvedValue(createIndexFixture());

    const tree = await renderDashboard();

    await waitForCondition(() => findTextNodes(tree.root, 'Smoke Atlas').length > 0);
    await waitForCondition(() => findTextNodes(tree.root, 'Browser Smoke').length > 0);

    expect(commonApi.loadSmokeIndex).toHaveBeenCalledWith(
      expect.objectContaining({
        apiBaseUrl: smokeConfig.apiBaseUrl,
      }),
    );
    expect(findTextNodes(tree.root, 'Smoke Atlas').length).toBeGreaterThan(0);
    expect(findTextNodes(tree.root, 'Tipos').length).toBeGreaterThan(0);
    expect(findTextNodes(tree.root, 'Testes').length).toBeGreaterThan(0);
    expect(mockDefaultTableProps?.storeName).toBe('tests');
    expect(findButton(tree.root, 'Browser Smoke')).toBeTruthy();
    expect(
      findTextNodes(tree.root, 'abre o fluxo de login e registra prints').length,
    ).toBeGreaterThan(0);

    await pressButton('Atualizar índice');

    expect(commonApi.loadSmokeIndex).toHaveBeenCalledTimes(2);
  });

  it('shows the error state when the API fails', async () => {
    commonApi.loadSmokeIndex.mockRejectedValue(new Error('401 Unauthorized'));

    const tree = await renderDashboard();

    await waitForCondition(
      () =>
        findTextNodes(tree.root, 'Falha ao consultar o índice publicado.').length > 0,
    );

    expect(findTextNodes(tree.root, 'Falha ao consultar o índice publicado.').length).toBeGreaterThan(0);
    expect(findTextNodes(tree.root, '401 Unauthorized').length).toBeGreaterThan(0);
  });

  it('allows switching types and suites', async () => {
    commonApi.loadSmokeIndex.mockResolvedValue(createIndexFixture());

    const tree = await renderDashboard();

    await waitForCondition(() => findButton(tree.root, 'Browser Smoke'));

    await pressButton('PHPUnit');
    const suiteRow = findPressableContainingText(tree.root, 'Core');

    await act(async () => {
      suiteRow.props.onPress?.();
    });
    await flushUpdates(2);

    expect(
      findTextNodes(tree.root, 'ExampleServiceTest::testItRegistersRecord').length,
    ).toBeGreaterThan(0);
    expect(findTextNodes(tree.root, 'PHPUnit').length).toBeGreaterThan(0);
  });

  it('triggers the shared run action and reloads the index', async () => {
    commonApi.loadSmokeIndex.mockResolvedValue(createIndexFixture());
    commonApi.triggerSmokeRun.mockResolvedValue({
      message: 'Smoke tests disparados com sucesso.',
    });

    const tree = await renderDashboard();

    await waitForCondition(() => findButton(tree.root, 'Refazer todos os testes'));
    await pressButton('Refazer todos os testes');

    expect(commonApi.triggerSmokeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        apiBaseUrl: smokeConfig.apiBaseUrl,
      }),
    );
    await waitForCondition(() => commonApi.loadSmokeIndex.mock.calls.length === 2);
  });
});
