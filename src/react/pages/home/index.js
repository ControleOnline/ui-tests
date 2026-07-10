import React, { useEffect } from 'react';
import { SmokeDashboard } from '../../../App';
import { getSmokeApiConfig } from '../../../lib/config';
import { createAuthenticatedFetch } from '../../../lib/fetchAuth';

export default function SmokeTestsPage() {
  const config = getSmokeApiConfig();

  useEffect(() => {
    const hasHtaccess =
      config.apiBaseUrl !== '' &&
      config.htaccessUser !== '' &&
      config.htaccessPassword !== '';

    if (!hasHtaccess || typeof globalThis.fetch !== 'function') {
      return undefined;
    }

    const previousFetch = globalThis.fetch;
    globalThis.fetch = createAuthenticatedFetch(previousFetch.bind(globalThis), {
      apiBaseUrl: config.apiBaseUrl,
      htaccessUser: config.htaccessUser,
      htaccessPassword: config.htaccessPassword,
    });

    return () => {
      globalThis.fetch = previousFetch;
    };
  }, [config.apiBaseUrl, config.htaccessPassword, config.htaccessUser]);

  return <SmokeDashboard apiBaseUrl={config.apiBaseUrl} />;
}
