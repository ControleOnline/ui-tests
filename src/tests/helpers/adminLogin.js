'use strict';

const {expect} = require('playwright/test');
const {
  getAdminCredentials,
  resolveLoginFields,
  buildSessionPayload,
  MOCK_FALLBACK_EMAIL,
  MOCK_FALLBACK_PASSWORD,
} = require('./smokeCredentials');
const {captureStep} = require('./smokeEvidence');

const openLoginPage = async (page) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await expect(page.getByPlaceholder('Senha')).toBeVisible();
  await expect(page.getByText('Entrar', {exact: true})).toBeVisible();
};

const seedAdminSession = async (page, credentials = getAdminCredentials()) => {
  const session = buildSessionPayload(credentials);
  if (!session) {
    throw new Error('smoke session requires SMOKE_API_TOKEN + SMOKE_ADMIN_PEOPLE_ID');
  }
  await page.addInitScript((payload) => {
    window.localStorage.setItem('session', JSON.stringify(payload));
  }, session);
  await page.evaluate((payload) => {
    window.localStorage.setItem('session', JSON.stringify(payload));
  }, session);
  return session;
};

const loginAsAdmin = async (page, options = {}) => {
  const credentials = options.credentials || getAdminCredentials();
  const fields = resolveLoginFields(credentials);

  await openLoginPage(page);
  if (options.screenshot !== false) {
    await captureStep(page, 'login', {dir: options.evidenceDir});
  }

  if (credentials.hasApiSession && !credentials.hasSecrets) {
    await seedAdminSession(page, credentials);
    await page.reload();
    await expect(page.getByPlaceholder('Email')).toHaveCount(0, {timeout: 20000});
    return {
      source: 'api-session',
      live: true,
    };
  }

  await page.getByPlaceholder('Email').fill(fields.email);
  await page.getByPlaceholder('Senha').fill(fields.password);
  await page.getByText('Entrar', {exact: true}).click();

  await expect(page.getByPlaceholder('Email')).toHaveCount(0, {timeout: 15000});

  return {
    source: fields.source,
    live: credentials.live && credentials.hasSecrets,
  };
};

module.exports = {
  MOCK_FALLBACK_EMAIL,
  MOCK_FALLBACK_PASSWORD,
  resolveLoginFields,
  openLoginPage,
  seedAdminSession,
  loginAsAdmin,
};
