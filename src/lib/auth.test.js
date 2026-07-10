import { loginToApi } from './auth';
import { signIn as signInAction } from '@controleonline/ui-login/src/store/modules/auth/actions';

jest.mock('@controleonline/ui-login/src/store/modules/auth/actions', () => ({
  signIn: jest.fn(),
}));

describe('loginToApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to ui-login signIn action', async () => {
    const session = {
      id: 15,
      active: true,
      api_key: 'token-123',
    };
    signInAction.mockResolvedValue(session);

    await expect(
      loginToApi({
        username: '  user@example.test  ',
        password: '123456',
      }),
    ).resolves.toEqual(session);

    expect(signInAction).toHaveBeenCalledWith(
      { commit: expect.any(Function) },
      {
        username: 'user@example.test',
        password: '123456',
      },
    );
  });
});
