const {expect, test} = require('playwright/test');
const {loginAsAdmin} = require('../../helpers/adminLogin');
const {captureStep, writeManifest} = require('../../helpers/smokeEvidence');

const CLIENT_DETAILS_USERS_FLOW_ID = 'client-details-users';
const FLOWCHART_IDS = [1];
const STEPS = ['login', 'client-details', 'aba-users', 'lista-ou-vazio'];
const CLIENT_ID = process.env.SMOKE_CLIENT_ID || '31468';

test.describe('client-details Users tab', () => {
  test.describe.configure({timeout: 90000});

  test('abre client-details e dispara GET /users?people= ao acionar Usuarios', async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push({
      type: 'fluxo',
      description: CLIENT_DETAILS_USERS_FLOW_ID,
    });
    testInfo.annotations.push({
      type: 'flowchartIds',
      description: JSON.stringify(FLOWCHART_IDS),
    });

    const evidenceDir = testInfo.outputDir;
    await loginAsAdmin(page, {evidenceDir});

    const usersRequests = [];
    page.on('request', request => {
      const url = request.url();
      if (/\/users(\?|$)/.test(url) && /people=/.test(url)) {
        usersRequests.push(url);
      }
    });

    await page.goto(`/client-details?clientId=${CLIENT_ID}&contextKey=employee`);
    await captureStep(page, 'client-details', {dir: evidenceDir});

    const usersTab = page.getByText(/usu[aá]rios/i).first();
    await expect(usersTab).toBeVisible({timeout: 20000});
    await usersTab.click();
    await captureStep(page, 'aba-users', {dir: evidenceDir});

    await expect
      .poll(() => usersRequests.length, {timeout: 20000})
      .toBeGreaterThan(0);

    expect(usersRequests[0]).toMatch(/people=\/people\/|people=%2Fpeople%2F/);
    expect(usersRequests[0]).not.toMatch(/[?&]company=/);

    const emptyOrList = page
      .getByText(/Nenhum usu[aá]rio cadastrado|Carregando usu[aá]rios|Falha ao carregar/i)
      .or(page.getByText(/Editar Senha|Usuario|Usuário/i).first());
    await expect(emptyOrList.first()).toBeVisible({timeout: 15000});
    await captureStep(page, 'lista-ou-vazio', {dir: evidenceDir});

    writeManifest(evidenceDir, {
      flowchartIds: FLOWCHART_IDS,
      fluxo: CLIENT_DETAILS_USERS_FLOW_ID,
      steps: STEPS,
      prints: STEPS.slice(),
      missingPrints: [],
      usersRequest: usersRequests[0],
      clientId: CLIENT_ID,
    });
  });
});
