import { buildApiUrl, loadArtifactBlob, loadSmokeIndex, triggerSmokeRun } from './api';

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

  it('loads the smoke index from the configured API base', async () => {
    const json = { suites: [], summary: {}, status: 'idle' };

    global.fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(json)),
    });

    await expect(
      loadSmokeIndex({
        apiBaseUrl: 'https://api.example.test',
      }),
    ).resolves.toEqual(json);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/tests/index.json',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
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

  it('triggers a smoke run through the configured API base', async () => {
    const payload = {
      status: 'running',
      progress: 15,
      message: 'Executando smoke tests.',
    };

    global.fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    });

    await expect(
      triggerSmokeRun({
        apiBaseUrl: 'https://api.example.test',
      }),
    ).resolves.toEqual(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/tests/run',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });
});
