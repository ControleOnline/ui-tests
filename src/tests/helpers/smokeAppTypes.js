'use strict';

const APP_ALIASES = {
  POS: ['POS'],
  PPC: ['PPC', 'PCP'],
  CHECKOUT: ['CHECKOUT', 'POS'],
};

const normalizeAppType = (value) => String(value || '').trim().toUpperCase();

const resolveAppCandidates = (appType) => {
  const normalized = normalizeAppType(appType);
  return APP_ALIASES[normalized] || [normalized];
};

module.exports = {
  APP_ALIASES,
  normalizeAppType,
  resolveAppCandidates,
};
