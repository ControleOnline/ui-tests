import { loginToApi } from './auth';
import { getAllStores } from '@store';

jest.mock('@store', () => ({
  getAllStores: jest.fn(),
}));

describe('loginToApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to the auth store signIn action', async () => {
    const session = {
      id: 15,
      active: true,
      api_key: 'token-123',
    };
    const signIn = jest.fn().mockResolvedValue(session);

    getAllStores.mockReturnValue({
      auth: {
        actions: {
          signIn,
        },
      },
    });

    await expect(
      loginToApi({
        username: '  user@example.test  ',
        password: '123456',
      }),
    ).resolves.toEqual(session);

    expect(signIn).toHaveBeenCalledWith({
      username: 'user@example.test',
      password: '123456',
    });
  });
});
