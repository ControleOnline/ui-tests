import { getAllStores } from '@store';

export async function loginToApi({ username, password }) {
  const authActions = getAllStores()?.auth?.actions;

  if (typeof authActions?.signIn !== 'function') {
    throw new Error('Store de autenticação indisponível.');
  }

  const session = await authActions.signIn({
    username: String(username || '').trim(),
    password: String(password || ''),
  });

  if (!session || typeof session !== 'object') {
    throw new Error('Credenciais inválidas');
  }

  return session;
}
