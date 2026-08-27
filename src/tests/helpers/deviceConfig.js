'use strict';

const {expect} = require('playwright/test');
const {captureStep} = require('./smokeEvidence');
const {
  REQUIRED_DEVICE_TYPES,
  PRINT_TYPE_ALIASES,
  normalizeDeviceType,
  aliasesForType,
} = require('./smokeDeviceTypes');

const DETAIL_HINTS = {
  PDV: /Configura[cç][aã]o do PDV/i,
  DISPLAY: /DISPLAY|KDS|Cozinha|Configura/i,
  PRINT: /PRINT|PRINTER|Impressora|Roteamento/i,
};

const configLocatorForType = (page, type) => {
  const aliases = aliasesForType(type);
  const pattern = new RegExp(aliases.join('|'), 'i');
  return page.locator('[data-testid^="device-config-"]').filter({hasText: pattern});
};

const waitListReady = async (page) => {
  await expect(
    page.locator('[data-testid^="device-group-"]').or(page.getByTestId('current-device-badge')),
  ).toBeVisible({timeout: 20000});
};

const openDeviceList = async (page, options = {}) => {
  await page.goto(options.path || '/devices-index?store=device_config');
  await waitListReady(page);
  if (options.screenshot !== false) {
    await captureStep(page, 'lista-devices', {dir: options.evidenceDir});
  }
};

const waitDetailReady = async (page, type) => {
  await expect(page).toHaveURL(/device-detail/, {timeout: 20000});
  await page.getByText(/Carregando/i).first().waitFor({state: 'hidden', timeout: 15000}).catch(() => {});
  const hint = DETAIL_HINTS[normalizeDeviceType(type)];
  if (hint) {
    await expect(page.getByText(hint).first()).toBeVisible({timeout: 15000}).catch(async () => {
      await expect(page.getByRole('button', {name: /salvar|save/i}).first()).toBeVisible({
        timeout: 8000,
      });
    });
  }
};

const returnToDeviceList = async (page) => {
  if (/device-detail/i.test(page.url())) {
    await page.goBack();
  }
  try {
    await waitListReady(page);
  } catch (_err) {
    await page.goto('/devices-index?store=device_config');
    await waitListReady(page);
  }
};

const ensureDeviceTypeVisible = async (page, type, options = {}) => {
  const locator = configLocatorForType(page, type);
  const setupPdv = page.getByTestId('configure-current-device-pdv');

  if ((await locator.count()) === 0 && normalizeDeviceType(type) === 'PDV') {
    if ((await setupPdv.count()) > 0) {
      await setupPdv.click();
      await locator.first().waitFor({state: 'visible', timeout: 20000}).catch(() => {});
    }
  }

  await expect(locator.first()).toBeVisible({timeout: 15000});

  if (options.openDetail !== false) {
    await locator.first().click();
    await waitDetailReady(page, type);
  }

  if (options.screenshot !== false) {
    const fileName = options.stepName || `${String(type).toLowerCase()}-salvo`;
    await captureStep(page, fileName, {dir: options.evidenceDir});
  }

  if (options.openDetail !== false && options.returnToList !== false) {
    await returnToDeviceList(page);
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
      openDetail: options.openDetail,
      returnToList: options.returnToList,
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
