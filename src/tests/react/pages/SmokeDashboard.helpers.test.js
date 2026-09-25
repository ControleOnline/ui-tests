/* global describe, expect, it */

const {
  EMPTY_SMOKE_INDEX,
  buildSmokeTypeSections,
  listTestArtifacts,
  normalizeSuiteRecord,
} = require('../../../react/pages/home/SmokeDashboard.helpers');

describe('SmokeDashboard helpers', () => {
  it('treats a null published index as an empty dashboard', () => {
    expect(buildSmokeTypeSections(null)).toEqual([]);
    expect(EMPTY_SMOKE_INDEX.status).toBe('idle');
    expect(EMPTY_SMOKE_INDEX.summary.tests.total).toBe(0);
  });

  it('normalizes suites with null tests, steps and artifacts', () => {
    const suite = normalizeSuiteRecord({
      displayName: 'Runtime smoke',
      suitePath: 'admin/tests-playground',
      tests: [
        null,
        {
          title: '',
          status: '',
          screenshots: [null],
          steps: [null],
        },
      ],
    });

    expect(suite.status).toBe('pending');
    expect(suite.tests).toHaveLength(2);
    expect(suite.tests[0]).toMatchObject({ title: 'Teste 1', status: 'pending' });
    expect(suite.tests[1].steps[0]).toMatchObject({ title: 'Etapa 1', status: 'pending' });
    expect(listTestArtifacts(suite.tests[1])[0]).toMatchObject({
      label: 'Artefato',
      kind: 'artifact',
    });
  });

  it('merges top-level suites into typed sections without duplicates', () => {
    const sections = buildSmokeTypeSections({
      types: [
        {
          type: 'browser-smoke',
          suites: [{suitePath: 'admin/home', tests: [{title: 'home', status: 'passed'}]}],
        },
      ],
      suites: [
        {type: 'browser-smoke', suitePath: 'admin/home', tests: [{title: 'home', status: 'passed'}]},
        {type: 'browser-smoke', suitePath: 'admin/orders', tests: [{title: 'orders', status: 'pending'}]},
        {type: 'phpunit', suitePath: 'unit/core', tests: [{title: 'core', status: 'passed'}]},
      ],
    });

    expect(sections).toHaveLength(2);
    expect(sections.find((section) => section.type === 'browser-smoke').suites).toHaveLength(2);
    expect(sections.find((section) => section.type === 'phpunit').suites).toHaveLength(1);
  });
});
