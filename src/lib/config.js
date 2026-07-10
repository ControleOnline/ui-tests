import { env } from '../../config/env.local.js';

function readValue(...values) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        return trimmed;
      }
    }
  }

  return '';
}

export function getSmokeApiConfig() {
  return {
    apiBaseUrl: readValue(
      env.API_ENTRYPOINT,
      process.env.EXPO_PUBLIC_API_ENTRYPOINT,
    ),
    htaccessUser: readValue(
      env.HTACCESS_USER,
      process.env.EXPO_PUBLIC_HTACCESS_USER,
    ),
    htaccessPassword: readValue(
      env.HTACCESS_PASSWORD,
      process.env.EXPO_PUBLIC_HTACCESS_PASSWORD,
    ),
  };
}
