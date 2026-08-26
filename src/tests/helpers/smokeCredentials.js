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
  const live = String(env?.SMOKE_LIVE || '').trim() === '1';

  return {
    email: email.value,
    password: password.value,
    emailSource: email.key,
    passwordSource: password.key,
    live,
    hasSecrets: Boolean(email.value && password.value),
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
  MOCK_FALLBACK_EMAIL,
  MOCK_FALLBACK_PASSWORD,
  getAdminCredentials,
  resolveLoginFields,
};
