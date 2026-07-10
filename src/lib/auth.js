import { signIn as signInAction } from '@controleonline/ui-login/src/store/modules/auth/actions';

export async function loginToApi({ username, password }) {
  const session = await signInAction(
    { commit: () => {} },
    {
      username: String(username || '').trim(),
      password: String(password || ''),
    },
  );

  if (!session || typeof session !== 'object') {
    throw new Error('Credenciais inválidas');
  }

  return session;
}
