const {expect, test} = require('playwright/test');
const {API_ORIGIN} = require('../../../../../../../src/tests/browser/apiOrigin');
const {version: appVersion} = require('../../../../../../../package.json');
const {
  FLOWCHART_IDS,
  DEVICE_CONFIG_FLOW_ID,
  DEVICE_CONFIG_STEPS,
  runAdminDeviceSetup,
  switchApp,
} = require('../../helpers/adminDeviceFlow');

test.describe('device-configuracao helpers', () => {
  test.describe.configure({timeout: 60000});

  test('login ADMIN, garante PDV/DISPLAY/PRINT e abre POS', async ({page}, testInfo) => {
    testInfo.annotations.push({
      type: 'fluxo',
      description: DEVICE_CONFIG_FLOW_ID,
    });
    testInfo.annotations.push({
      type: 'flowchartIds',
      description: JSON.stringify(FLOWCHART_IDS),
    });

    const result = await runAdminDeviceSetup(page, {
      apiOrigin: API_ORIGIN,
      appVersion,
      evidenceDir: testInfo.outputDir,
      switchTo: 'POS',
    });

    expect(result.manifest.fluxo).toBe(DEVICE_CONFIG_FLOW_ID);
    expect(result.manifest.flowchartIds).toEqual(FLOWCHART_IDS);
    expect(result.manifest.steps).toEqual(DEVICE_CONFIG_STEPS);
    expect(result.switchedApp).toBe('POS');
    await expect(page.getByRole('button', {name: 'Selecionar tipo de app'})).toContainText(
      'POS',
    );
  });

  test('helpers de troca de app cobrem PPC e CHECKOUT', async ({page}, testInfo) => {
    await runAdminDeviceSetup(page, {
      apiOrigin: API_ORIGIN,
      appVersion,
      evidenceDir: testInfo.outputDir,
      switchTo: false,
    });

    await page.goto('/');

    const ppc = await switchApp(page, 'PPC', {
      evidenceDir: testInfo.outputDir,
      stepName: 'app-ppc-aberto',
    });
    expect(['PPC', 'PCP']).toContain(ppc);

    const checkout = await switchApp(page, 'CHECKOUT', {
      evidenceDir: testInfo.outputDir,
      stepName: 'app-checkout-aberto',
    });
    expect(['CHECKOUT', 'POS']).toContain(checkout);
  });
});
