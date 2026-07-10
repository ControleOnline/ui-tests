import { createAuthenticatedFetch } from './fetchAuth';

describe('createAuthenticatedFetch', () => {
  it('adds basic auth to API requests when configured', async () => {
    const baseFetch = jest.fn().mockResolvedValue({});
    const wrappedFetch = createAuthenticatedFetch(baseFetch, {
      apiBaseUrl: 'https://api.example.test',
      htaccessUser: 'basic-user',
      htaccessPassword: 'basic-pass',
    });

    await wrappedFetch('https://api.example.test/tests/index.json', {
      headers: new Headers({
        Accept: 'application/json',
      }),
    });

    expect(baseFetch).toHaveBeenCalledWith(
      'https://api.example.test/tests/index.json',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );

    const headers = baseFetch.mock.calls[0][1].headers;
    expect(headers.get('Authorization')).toBe(
      `Basic ${Buffer.from('basic-user:basic-pass').toString('base64')}`,
    );
  });

  it('does not touch non API requests', async () => {
    const baseFetch = jest.fn().mockResolvedValue({});
    const wrappedFetch = createAuthenticatedFetch(baseFetch, {
      apiBaseUrl: 'https://api.example.test',
      htaccessUser: 'basic-user',
      htaccessPassword: 'basic-pass',
    });

    await wrappedFetch('https://cdn.example.test/image.png');

    expect(baseFetch).toHaveBeenCalledWith('https://cdn.example.test/image.png', {});
  });
});
