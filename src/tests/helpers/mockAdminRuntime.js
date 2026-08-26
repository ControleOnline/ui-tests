'use strict';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'API-TOKEN, APP-DOMAIN, DEVICE, ACCEPT, CONTENT-TYPE, X-Requested-With',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

const CURRENT_DEVICE_ID = 'web-7';
const COMPANY_ID = 3;
const PEOPLE_IRI = '/people/7';

const collection = (member = [], summary = {}) => ({
  member,
  'hydra:member': member,
  totalItems: member.length,
  'hydra:totalItems': member.length,
  summary,
});

const jsonHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'application/ld+json; charset=utf-8',
});

const textHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'text/css; charset=utf-8',
});

const createCompany = () => ({
  id: COMPANY_ID,
  name: 'Tenant Teste',
  alias: 'TESTE',
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  theme: {
    colors: {
      primary: '#0EA5E9',
      secondary: '#F97316',
    },
  },
  configs: {},
});

const createCurrentDevice = () => ({
  '@id': '/devices/396',
  '@type': 'Device',
  id: 396,
  device: CURRENT_DEVICE_ID,
  alias: 'Caixa atual',
  metadata: {
    runtime: 'web',
    network: {publicIp: '127.0.0.1'},
  },
});

const createDeviceConfig = ({id, type, device, appVersion}) => ({
  '@id': `/device_configs/${id}`,
  '@type': 'DeviceConfig',
  id,
  type,
  people: '/people/3',
  device,
  configs: JSON.stringify({
    'config-version': appVersion || '1.0.0',
  }),
});

const createAdminSession = () => ({
  id: 7,
  people: PEOPLE_IRI,
  api_key: 'test-api-key',
  active: 1,
  mycompany: COMPANY_ID,
  roles: ['ROLE_SUPER', 'ROLE_ADMIN'],
});

const createAdminMenus = () => ({
  modules: {
    configuracoes: {
      id: 'admin-configuracoes',
      label: 'Configuracoes',
      icon: 'settings',
      menus: [
        {
          id: 'devices',
          menuKey: 'devices',
          label: 'Dispositivos',
          route: 'DevicesPage',
          icon: 'smartphone',
          color: '#64748B',
          sortOrder: 10,
          menuType: 'home',
        },
      ],
    },
  },
});

const seedDeviceConfigs = ({device, appVersion, includeTypes}) => {
  const types = includeTypes || ['MANAGER', 'PDV', 'DISPLAY', 'PRINT'];
  return types.map((type, index) =>
    createDeviceConfig({
      id: 480 + index,
      type,
      device,
      appVersion,
    }),
  );
};

const installAdminRuntimeMock = async (page, options = {}) => {
  const apiOrigin = String(options.apiOrigin || '').replace(/\/$/, '');
  if (!apiOrigin) {
    throw new Error('apiOrigin is required to mock the admin runtime.');
  }

  const appVersion = options.appVersion || '1.0.0';
  const company = createCompany();
  const currentDevice = createCurrentDevice();
  const session = createAdminSession();
  const deviceConfigs = seedDeviceConfigs({
    device: currentDevice,
    appVersion,
    includeTypes: options.includeTypes,
  });
  const savedConfigs = [];

  await page.route(`${apiOrigin}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');
    const method = request.method().toUpperCase();

    if (method === 'OPTIONS') {
      return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
    }

    if (pathname === 'themes-colors.css') {
      return route.fulfill({
        status: 200,
        headers: textHeaders(),
        body: ':root { --primary: #0ea5e9; --secondary: #f97316; }',
      });
    }

    if (pathname === 'token' && method === 'POST') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(session),
      });
    }

    if (pathname === 'people/7' || pathname === 'people/3') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          '@id': `/${pathname}`,
          id: Number(pathname.split('/')[1]),
          name: 'Admin Teste',
          enabled: true,
        }),
      });
    }

    if (pathname === 'runtime/ip') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ip: '127.0.0.1'}),
      });
    }

    if (pathname === 'people/companies/my') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([company])),
      });
    }

    if (pathname === 'people/company/default') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(company),
      });
    }

    if (pathname === 'menus-people') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(createAdminMenus()),
      });
    }

    if (pathname === 'menu-config') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          member: [],
          summary: {
            appTypes: ['ADMIN', 'MANAGER', 'POS', 'PPC', 'CHECKOUT', 'DELIVERY', 'SHOP'],
            linkTypes: ['owner'],
            categories: [],
            routes: [],
          },
        }),
      });
    }

    if (pathname === 'configs/discovery-configs') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({configs: {}}),
      });
    }

    if (pathname === 'devices' && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([currentDevice])),
      });
    }

    if (pathname === 'devices' && method === 'POST') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(currentDevice),
      });
    }

    if (pathname === 'device_configs' && method === 'GET') {
      const requestedDevice = url.searchParams.get('device.device');
      const requestedType = url.searchParams.get('type');
      const filtered = deviceConfigs.filter(deviceConfig => {
        if (requestedDevice && deviceConfig.device.device !== requestedDevice) {
          return false;
        }
        if (requestedType && deviceConfig.type !== requestedType) {
          return false;
        }
        return true;
      });
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(filtered)),
      });
    }

    if (pathname === 'device_configs/add-configs' && method === 'POST') {
      const payload = request.postDataJSON() || {};
      const type = String(payload.type || 'PDV').toUpperCase();
      const saved = createDeviceConfig({
        id: 500 + savedConfigs.length,
        type,
        device: currentDevice,
        appVersion,
      });
      savedConfigs.push({type, payload});
      deviceConfigs.push(saved);
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(saved),
      });
    }

    return route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(collection([])),
    });
  });

  await page.addInitScript(
    ({appVersion: version, deviceId}) => {
      const setItem = (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // about:blank may not expose storage
        }
      };
      setItem('config', JSON.stringify({language: 'pt-br'}));
      setItem(
        'device',
        JSON.stringify({
          id: deviceId,
          device: deviceId,
          type: 'WEB',
          appName: 'Browser Admin',
          appVersion: version,
          buildNumber: version,
          systemName: 'web',
          systemVersion: 'web',
          deviceType: 'web',
          metadata: {},
        }),
      );
    },
    {appVersion, deviceId: CURRENT_DEVICE_ID},
  );

  return {
    company,
    currentDevice,
    session,
    deviceConfigs,
    savedConfigs,
    deviceId: CURRENT_DEVICE_ID,
  };
};

module.exports = {
  CORS_HEADERS,
  CURRENT_DEVICE_ID,
  COMPANY_ID,
  PEOPLE_IRI,
  collection,
  createCompany,
  createCurrentDevice,
  createDeviceConfig,
  createAdminSession,
  seedDeviceConfigs,
  installAdminRuntimeMock,
};
