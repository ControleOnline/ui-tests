'use strict';

const {expect} = require('playwright/test');
const {captureStep} = require('./smokeEvidence');
const {
  APP_ALIASES,
  normalizeAppType,
  resolveAppCandidates,
} = require('./smokeAppTypes');

const openAppTypeMenu = async (page) => {
  const trigger = page.getByRole('button', {name: 'Selecionar tipo de app'});
  await expect(trigger).toBeVisible({timeout: 15000});
  await trigger.click();
  return trigger;
};

const switchApp = async (page, appType, options = {}) => {
  const candidates = resolveAppCandidates(appType);
  await openAppTypeMenu(page);

  let selected = '';
  for (const candidate of candidates) {
    const button = page.getByRole('button', {name: candidate, exact: true});
    if ((await button.count()) > 0) {
      await button.click();
      selected = candidate;
      break;
    }
  }

  if (!selected) {
    throw new Error(`App type not available in selector: ${candidates.join(', ')}`);
  }

  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('button', {name: 'Selecionar tipo de app'})).toContainText(
    selected,
    {timeout: 15000},
  );

  if (options.screenshot !== false) {
    const stepName = options.stepName || `app-${String(selected).toLowerCase()}-aberto`;
    await captureStep(page, stepName, {dir: options.evidenceDir});
  }

  return selected;
};

module.exports = {
  APP_ALIASES,
  normalizeAppType,
  resolveAppCandidates,
  openAppTypeMenu,
  switchApp,
};
