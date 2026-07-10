const appJson = require('./app.json');
const { APP_ENV } = require('./config/env');

const clone = (value) => JSON.parse(JSON.stringify(value));

module.exports = () => {
  const expo = clone(appJson.expo || {});

  expo.extra = {
    ...(expo.extra || {}),
    apiBaseUrl: APP_ENV.API_ENTRYPOINT || '',
    domain: APP_ENV.DOMAIN || '',
    htaccessUser: APP_ENV.HTACCESS_USER || '',
    htaccessPassword: APP_ENV.HTACCESS_PASSWORD || '',
  };

  return expo;
};
