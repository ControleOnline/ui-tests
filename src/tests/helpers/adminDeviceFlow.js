'use strict';

const {installAdminRuntimeMock} = require('./mockAdminRuntime');
const {loginAsAdmin, openLoginPage} = require('./adminLogin');
const {
  REQUIRED_DEVICE_TYPES,
  openDeviceList,
  ensureRequiredDeviceConfigs,
  ensureDeviceTypeVisible,
} = require('./deviceConfig');
const {switchApp} = require('./switchApp');
const {
  DEVICE_CONFIG_FLOW_ID,
  FLOWCHART_IDS,
  DEVICE_CONFIG_STEPS,
  buildDeviceConfigManifest,
  resolveEvidenceDir,
  writeManifest,
} = require('./smokeEvidence');
const {getAdminCredentials, resolveLoginFields} = require('./smokeCredentials');

const prepareAdminDeviceFlow = async (page, options = {}) => {
  const evidenceDir = resolveEvidenceDir(options.evidenceDir);
  const manifest = buildDeviceConfigManifest({
    generatedAt: new Date().toISOString(),
    evidenceDir,
  });
  writeManifest(evidenceDir, manifest);

  const runtime = await installAdminRuntimeMock(page, {
    apiOrigin: options.apiOrigin,
    appVersion: options.appVersion,
    includeTypes: options.includeTypes,
  });

  return {runtime, evidenceDir, manifest};
};

const runAdminDeviceSetup = async (page, options = {}) => {
  const prepared = await prepareAdminDeviceFlow(page, options);
  const evidenceDir = prepared.evidenceDir;

  const login = await loginAsAdmin(page, {evidenceDir});
  await openDeviceList(page, {evidenceDir});
  await ensureRequiredDeviceConfigs(page, {
    evidenceDir,
    types: options.types || REQUIRED_DEVICE_TYPES,
    stepNames: {
      PDV: 'pdv-salvo',
      DISPLAY: 'display-salvo',
      PRINT: 'print-salvo',
    },
  });

  let switchedApp = null;
  if (options.switchTo !== false) {
    await page.goto('/');
    switchedApp = await switchApp(page, options.switchTo || 'POS', {
      evidenceDir,
      stepName: 'app-pos-aberto',
    });
  }

  return {
    ...prepared,
    login,
    switchedApp,
  };
};

module.exports = {
  FLOWCHART_IDS,
  DEVICE_CONFIG_FLOW_ID,
  DEVICE_CONFIG_STEPS,
  REQUIRED_DEVICE_TYPES,
  getAdminCredentials,
  resolveLoginFields,
  installAdminRuntimeMock,
  prepareAdminDeviceFlow,
  runAdminDeviceSetup,
  loginAsAdmin,
  openLoginPage,
  openDeviceList,
  ensureRequiredDeviceConfigs,
  ensureDeviceTypeVisible,
  switchApp,
  buildDeviceConfigManifest,
};
