'use strict';

const REQUIRED_DEVICE_TYPES = ['PDV', 'DISPLAY', 'PRINT'];
const PRINT_TYPE_ALIASES = ['PRINT', 'PRINTER'];

const typeMatchers = {
  PDV: ['PDV'],
  // The admin screen labels the DISPLAY runtime as PPC in the web shell.
  DISPLAY: ['DISPLAY', 'PPC'],
  PRINT: PRINT_TYPE_ALIASES,
};

const normalizeDeviceType = (value) => String(value || '').trim().toUpperCase();

const aliasesForType = (type) =>
  typeMatchers[normalizeDeviceType(type)] || [normalizeDeviceType(type)];

module.exports = {
  REQUIRED_DEVICE_TYPES,
  PRINT_TYPE_ALIASES,
  typeMatchers,
  normalizeDeviceType,
  aliasesForType,
};
