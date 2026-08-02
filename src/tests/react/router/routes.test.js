/* global describe, expect, it, jest */

jest.mock('../../../react/pages/home', () => 'SmokeTestsPage');

const testsRoutes = require('../../../react/router/routes').default;

describe('ui-tests router', () => {
  it('uses a non-reserved path for the tests playground screen', () => {
    const routePaths = Object.fromEntries(
      testsRoutes.map(route => [route.name, route.path]),
    );

    expect(routePaths.SmokeTestsPage).toBe('smoke-tests-playground');
    expect(routePaths.TestsPlaygroundPage).toBe('tests-playground');
    expect(Object.values(routePaths)).not.toContain('tests');
  });
});
