import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SmokeDashboard } from './App';
import * as api from './lib/api';

jest.mock('./LoginScreen', () => 'LoginScreen');
jest.mock('./lib/api', () => ({
  loadArtifactBlob: jest.fn(),
  loadSmokeIndex: jest.fn(),
  triggerSmokeRun: jest.fn(),
}));

jest.setTimeout(60000);

const mockedLoadSmokeIndex = api.loadSmokeIndex;
const mockedTriggerSmokeRun = api.triggerSmokeRun;

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
    links: { self: '/tests/index.json', artifacts: '/tests/artifacts' },
  };
}

describe('SmokeDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const authConfig = {
    apiBaseUrl: 'https://example.test',
  };

  it('renders grouped types, suites, and tests after loading the index', async () => {
    mockedLoadSmokeIndex.mockResolvedValue(createIndexFixture());

    render(
      <SmokeDashboard
        apiBaseUrl={authConfig.apiBaseUrl}
      />,
    );

    await screen.findByRole('button', { name: 'Browser Smoke' });

    expect(mockedLoadSmokeIndex).toHaveBeenCalledWith({
      apiBaseUrl: authConfig.apiBaseUrl,
    });

    expect(screen.getAllByText('Smoke Atlas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tipos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Testes').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Login Flow' })).toBeTruthy();
    expect(screen.getAllByText('abre o fluxo de login e registra prints').length).toBeGreaterThan(0);
  });

  it('shows the error state when the API fails', async () => {
    mockedLoadSmokeIndex.mockRejectedValue(new Error('401 Unauthorized'));

    render(
      <SmokeDashboard
        apiBaseUrl={authConfig.apiBaseUrl}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Falha ao consultar o índice publicado.')).toBeTruthy();
    });

    expect(screen.getAllByText('401 Unauthorized').length).toBeGreaterThan(0);
  });

  it('allows switching types and suites', async () => {
    mockedLoadSmokeIndex.mockResolvedValue(createIndexFixture());

    render(
      <SmokeDashboard
        apiBaseUrl={authConfig.apiBaseUrl}
      />,
    );

    await screen.findByRole('button', { name: 'Browser Smoke' });

    fireEvent.press(screen.getByRole('button', { name: 'PHPUnit' }));

    await waitFor(() => {
      expect(screen.getAllByText('ExampleServiceTest::testItRejectsInvalidData').length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getByRole('button', { name: 'Core' }));

    await waitFor(() => {
      expect(screen.getAllByText('ExampleServiceTest::testItRegistersRecord').length).toBeGreaterThan(0);
    });
  });

  it('triggers a new smoke run and refreshes the index', async () => {
    mockedLoadSmokeIndex.mockResolvedValue(createIndexFixture());
    mockedTriggerSmokeRun.mockResolvedValue({
      status: 'running',
      progress: 15,
      message: 'Smoke tests disparados.',
    });

    render(
      <SmokeDashboard
        apiBaseUrl={authConfig.apiBaseUrl}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText('Browser Smoke').length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getByRole('button', { name: 'Refazer todos os testes' }));

    await waitFor(() => {
      expect(mockedTriggerSmokeRun).toHaveBeenCalledWith({
        apiBaseUrl: authConfig.apiBaseUrl,
      });
    });

    await waitFor(() => {
      expect(mockedLoadSmokeIndex).toHaveBeenCalledTimes(2);
    });
  });
});
