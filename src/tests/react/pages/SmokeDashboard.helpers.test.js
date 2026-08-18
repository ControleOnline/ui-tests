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
});
