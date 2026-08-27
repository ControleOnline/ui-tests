'use strict';

const {expect} = require('playwright/test');
const {captureStep} = require('./smokeEvidence');
const {
  REQUIRED_DEVICE_TYPES,
  PRINT_TYPE_ALIASES,
  normalizeDeviceType,
  aliasesForType,
} = require('./smokeDeviceTypes');

const configLocatorForType = (page, type) => {
  const aliases = aliasesForType(type);
  const pattern = new RegExp(aliases.join('|'), 'i');
  return page.locator('[data-testid^="device-config-"]').filter({hasText: pattern});
};

const openDeviceList = async (page, options = {}) => {
  await page.goto(options.path || '/devices-index?store=device_config');
  await expect(
    page.locator('[data-testid^="device-group-"]').or(page.getByTestId('current-device-badge')).first(),
  ).toBeVisible({timeout: 15000});
  if (options.screenshot !== false) {
    await captureStep(page, 'lista-devices', {dir: options.evidenceDir});
  }
};

const ensureDeviceTypeVisible = async (page, type, options = {}) => {
  const locator = configLocatorForType(page, type);
  const setupPdv = page.getByTestId('configure-current-device-pdv');

  if ((await locator.count()) === 0 && normalizeDeviceType(type) === 'PDV') {
    if ((await setupPdv.count()) > 0) {
      await setupPdv.click();
    }
  }

  await expect(locator.first()).toBeVisible({timeout: 15000});
  if (options.screenshot !== false) {
    const fileName = options.stepName || `${String(type).toLowerCase()}-salvo`;
    await captureStep(page, fileName, {dir: options.evidenceDir});
  }
  return locator.first();
};

const ensureRequiredDeviceConfigs = async (page, options = {}) => {
  const types = options.types || REQUIRED_DEVICE_TYPES;
  const found = {};
  for (const type of types) {
    found[type] = await ensureDeviceTypeVisible(page, type, {
      evidenceDir: options.evidenceDir,
      screenshot: options.screenshot,
      stepName: options.stepNames?.[type],
    });
  }
  return found;
};

module.exports = {
  REQUIRED_DEVICE_TYPES,
  PRINT_TYPE_ALIASES,
  normalizeDeviceType,
  configLocatorForType,
  openDeviceList,
  ensureDeviceTypeVisible,
  ensureRequiredDeviceConfigs,
};
