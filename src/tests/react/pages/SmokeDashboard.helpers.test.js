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

  it('keeps top-level suites when type entries contain summaries only', () => {
    const sections = buildSmokeTypeSections({
      types: [
        {type: 'browser-smoke', summary: {suites: {total: 2}}},
        {type: 'phpunit', summary: {suites: {total: 1}}},
      ],
      suites: [
        {type: 'browser-smoke', suiteId: 'browser-1', tests: [{title: 'one'}]},
        {type: 'browser-smoke', suiteId: 'browser-2', tests: [{title: 'two'}]},
        {type: 'phpunit', suiteId: 'phpunit-1', tests: [{title: 'three'}]},
      ],
    });

    expect(sections).toHaveLength(2);
    expect(sections[0].suites).toHaveLength(2);
    expect(sections[1].suites).toHaveLength(1);
    expect(sections.flatMap((section) => section.suites).flatMap((suite) => suite.tests)).toHaveLength(3);
  });
});
