const local = require('./env.local.js');
const APP_ENV = local?.env || {};

module.exports = { APP_ENV };
