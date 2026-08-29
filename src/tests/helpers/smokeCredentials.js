'use strict';

const ENV_EMAIL_KEYS = [
  'SMOKE_ADMIN_EMAIL',
  'ADMIN_EMAIL',
  'SMOKE_LOGIN_EMAIL',
];
const ENV_PASSWORD_KEYS = [
  'SMOKE_ADMIN_PASSWORD',
  'ADMIN_PASSWORD',
  'SMOKE_LOGIN_PASSWORD',
];
const ENV_TOKEN_KEYS = [
  'SMOKE_API_TOKEN',
  'SMOKE_ADMIN_API_TOKEN',
  'API_TOKEN',
];
const ENV_PEOPLE_KEYS = ['SMOKE_ADMIN_PEOPLE_ID', 'ADMIN_PEOPLE_ID'];
const ENV_USER_KEYS = ['SMOKE_ADMIN_USER_ID', 'ADMIN_USER_ID'];

const readFirstEnv = (keys, env = process.env) => {
  for (const key of keys) {
    const value = String(env?.[key] || '').trim();
    if (value) {
      return {key, value};
    }
  }
  return {key: '', value: ''};
};

const MOCK_FALLBACK_EMAIL = 'admin@tenant.test';
const MOCK_FALLBACK_PASSWORD = 'admin';

const getAdminCredentials = (env = process.env) => {
  const email = readFirstEnv(ENV_EMAIL_KEYS, env);
  const password = readFirstEnv(ENV_PASSWORD_KEYS, env);
  const token = readFirstEnv(ENV_TOKEN_KEYS, env);
  const people = readFirstEnv(ENV_PEOPLE_KEYS, env);
  const user = readFirstEnv(ENV_USER_KEYS, env);
  const live = String(env?.SMOKE_LIVE || '').trim() === '1';
  const peopleId = people.value || '7';
  const userId = user.value || peopleId;

  return {
    email: email.value,
    password: password.value,
    emailSource: email.key,
    passwordSource: password.key,
    apiToken: token.value,
    apiTokenSource: token.key,
    peopleId,
    userId,
    live,
    hasSecrets: Boolean(email.value && password.value),
    hasApiSession: Boolean(token.value),
  };
};

const buildSessionPayload = (credentials = getAdminCredentials()) => {
  if (!credentials.hasApiSession) return null;
  return {
    id: Number(credentials.userId) || credentials.userId,
    people: `/people/${credentials.peopleId}`,
    api_key: credentials.apiToken,
    active: 1,
  };
};

const resolveLoginFields = (credentials = getAdminCredentials()) => {
  if (credentials.hasSecrets) {
    return {
      email: credentials.email,
      password: credentials.password,
      source: 'env',
    };
  }
  return {
    email: MOCK_FALLBACK_EMAIL,
    password: MOCK_FALLBACK_PASSWORD,
    source: 'mock-fallback',
  };
};

module.exports = {
  ENV_EMAIL_KEYS,
  ENV_PASSWORD_KEYS,
  ENV_TOKEN_KEYS,
  ENV_PEOPLE_KEYS,
  ENV_USER_KEYS,
  MOCK_FALLBACK_EMAIL,
  MOCK_FALLBACK_PASSWORD,
  getAdminCredentials,
  resolveLoginFields,
  buildSessionPayload,
};
