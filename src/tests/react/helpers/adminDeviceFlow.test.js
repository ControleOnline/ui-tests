const {
  getAdminCredentials,
} = require('../../helpers/smokeCredentials');
const {
  buildDeviceConfigManifest,
  DEVICE_CONFIG_FLOW_ID,
  FLOWCHART_IDS,
  DEVICE_CONFIG_STEPS,
} = require('../../helpers/smokeEvidence');
const {
  resolveLoginFields,
  MOCK_FALLBACK_EMAIL,
} = require('../../helpers/smokeCredentials');
const {
  normalizeDeviceType,
  REQUIRED_DEVICE_TYPES,
  PRINT_TYPE_ALIASES,
} = require('../../helpers/smokeDeviceTypes');
const {resolveAppCandidates, normalizeAppType} = require('../../helpers/smokeAppTypes');
const {seedDeviceConfigs, createCurrentDevice} = require('../../helpers/mockAdminRuntime');

describe('admin device smoke helpers', () => {
  it('reads admin credentials only from env keys', () => {
    const creds = getAdminCredentials({
      SMOKE_ADMIN_EMAIL: 'ops@tenant.test',
      SMOKE_ADMIN_PASSWORD: 'secret-from-env',
    });
    expect(creds.hasSecrets).toBe(true);
    expect(creds.email).toBe('ops@tenant.test');
    expect(creds.emailSource).toBe('SMOKE_ADMIN_EMAIL');
    expect(creds.passwordSource).toBe('SMOKE_ADMIN_PASSWORD');
  });

  it('does not invent repo credentials when env is empty', () => {
    const creds = getAdminCredentials({});
    expect(creds.hasSecrets).toBe(false);
    expect(creds.email).toBe('');
    expect(resolveLoginFields(creds).email).toBe(MOCK_FALLBACK_EMAIL);
    expect(resolveLoginFields(creds).source).toBe('mock-fallback');
  });

  it('declares flowchart 1 and device-configuracao manifesto', () => {
    const manifest = buildDeviceConfigManifest();
    expect(manifest.fluxo).toBe(DEVICE_CONFIG_FLOW_ID);
    expect(manifest.flowchartIds).toEqual([1]);
    expect(manifest.flowchartIds).toEqual(FLOWCHART_IDS);
    expect(manifest.steps).toEqual(DEVICE_CONFIG_STEPS);
    expect(manifest.prints).toEqual([
      'login',
      'lista-devices',
      'pdv-salvo',
      'display-salvo',
      'print-salvo',
      'app-pos-aberto',
    ]);
    expect(manifest.missingPrints).toEqual([]);
  });

  it('normalizes PRINT aliases and required types', () => {
    expect(normalizeDeviceType(' print ')).toBe('PRINT');
    expect(PRINT_TYPE_ALIASES).toContain('PRINTER');
    expect(REQUIRED_DEVICE_TYPES).toEqual(['PDV', 'DISPLAY', 'PRINT']);
  });

  it('maps CHECKOUT to POS fallback and PPC to PCP alias', () => {
    expect(normalizeAppType('checkout')).toBe('CHECKOUT');
    expect(resolveAppCandidates('CHECKOUT')).toEqual(['CHECKOUT', 'POS']);
    expect(resolveAppCandidates('PPC')).toEqual(['PPC', 'PCP']);
    expect(resolveAppCandidates('POS')).toEqual(['POS']);
  });

  it('seeds DeviceConfig rows for PDV DISPLAY PRINT', () => {
    const device = createCurrentDevice();
    const configs = seedDeviceConfigs({
      device,
      appVersion: '1.0.0',
      includeTypes: ['PDV', 'DISPLAY', 'PRINT'],
    });
    expect(configs.map(item => item.type)).toEqual(['PDV', 'DISPLAY', 'PRINT']);
    expect(configs.every(item => item.device.device === device.device)).toBe(true);
  });
});
