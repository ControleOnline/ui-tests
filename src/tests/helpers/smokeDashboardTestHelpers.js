const { act } = require("react-test-renderer");

// Extracted helpers for SmokeDashboard tests — keep under code-quality limits
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


module.exports = {
  createIndexFixture,
  isPlainTextNode,
  getPlainText,
  findTextNodes,
  getNodeText,
  findButton,
  findPressableContainingText,
  flushMicrotasks,
  flushUpdates,
  waitForCondition,
};
