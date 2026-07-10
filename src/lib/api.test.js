import { api as uiCommonApi } from '@controleonline/ui-common/src/api';
import { buildApiUrl, loadArtifactBlob, loadSmokeIndex, triggerSmokeRun } from './api';

jest.mock('@controleonline/ui-common/src/api', () => ({
  api: {
    fetch: jest.fn(),
  },
}));

jest.mock('./session', () => ({
  getStoredSessionApiKey: jest.fn(() => 'secret'),
}));

describe('api helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('builds API URLs without duplicating slashes', () => {
    expect(buildApiUrl('https://api.example.test/', '/tests/index.json')).toBe(
      'https://api.example.test/tests/index.json',
    );
  });

  it('loads the smoke index through ui-common', async () => {
    const json = { suites: [], summary: {}, status: 'idle' };
    uiCommonApi.fetch.mockResolvedValue(json);

    await expect(loadSmokeIndex()).resolves.toEqual(json);

    expect(uiCommonApi.fetch).toHaveBeenCalledWith('/tests/index.json', {});
  });

  it('loads artifacts as blobs', async () => {
    const blob = new Blob(['image'], { type: 'image/png' });

    global.fetch.mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(blob),
      text: jest.fn(),
    });

    await expect(
      loadArtifactBlob(
        {
          apiBaseUrl: 'https://api.example.test',
        },
        {
          url: '/tests/artifacts/company-advertiser-route/shot.png',
        },
      ),
    ).resolves.toEqual(blob);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/tests/artifacts/company-advertiser-route/shot.png',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get('Accept')).toBe('*/*');
    expect(headers.get('X-API-KEY')).toBe('secret');
  });

  it('triggers a smoke run through ui-common', async () => {
    const payload = {
      status: 'running',
      progress: 15,
      message: 'Executando smoke tests.',
    };
    uiCommonApi.fetch.mockResolvedValue(payload);

    await expect(triggerSmokeRun()).resolves.toEqual(payload);

    expect(uiCommonApi.fetch).toHaveBeenCalledWith('/tests/run', {
      method: 'POST',
    });
  });
});
