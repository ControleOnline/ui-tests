'use strict';

const fs = require('fs');
const path = require('path');

const DEVICE_CONFIG_FLOW_ID = 'device-configuracao';
const FLOWCHART_IDS = [1];

const DEVICE_CONFIG_STEPS = [
  'login',
  'lista-devices',
  'pdv-salvo',
  'display-salvo',
  'print-salvo',
  'app-pos-aberto',
];

const buildDeviceConfigManifest = (overrides = {}) => ({
  flowchartIds: FLOWCHART_IDS,
  fluxo: DEVICE_CONFIG_FLOW_ID,
  steps: DEVICE_CONFIG_STEPS,
  prints: DEVICE_CONFIG_STEPS.slice(),
  ...overrides,
});

const resolveEvidenceDir = (explicitDir) => {
  const fromEnv = String(process.env.PLAYWRIGHT_SMOKE_RESULTS_DIR || '').trim();
  return explicitDir || fromEnv || path.join(process.cwd(), '.playwright-smoke-results', 'device-configuracao');
};

const ensureDir = (dir) => {
  fs.mkdirSync(dir, {recursive: true});
};

const writeManifest = (dir, manifest) => {
  ensureDir(dir);
  const filePath = path.join(dir, 'manifest.json');
  fs.writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return filePath;
};

const captureStep = async (page, stepName, options = {}) => {
  const dir = resolveEvidenceDir(options.dir);
  ensureDir(dir);
  const filePath = path.join(dir, `${stepName}.png`);
  await page.screenshot({path: filePath, fullPage: options.fullPage !== false});
  return filePath;
};

module.exports = {
  DEVICE_CONFIG_FLOW_ID,
  FLOWCHART_IDS,
  DEVICE_CONFIG_STEPS,
  buildDeviceConfigManifest,
  resolveEvidenceDir,
  writeManifest,
  captureStep,
};
