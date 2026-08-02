import Formatter from '@controleonline/ui-common/src/utils/formatter';

const {formatCount, formatDateTime} = Formatter;

export const formatPercent = (value) =>
  Formatter.formatPercent(Math.max(0, Math.min(100, Math.round(Number(value) || 0))));

export function statusTone(status) {
  switch (status) {
    case 'passed':
      return 'success';
    case 'failed':
      return 'danger';
    default:
      return 'idle';
  }
}

export function statusLabel(status) {
  switch (status) {
    case 'passed':
      return 'Passou';
    case 'failed':
      return 'Falhou';
    default:
      return 'Pendente';
  }
}

export function normalizeTypeKey(value) {
  const raw = String(value || '').trim().toLowerCase();

  if (raw === '') {
    return 'browser-smoke';
  }

  return raw
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatTypeLabel(value) {
  const normalized = normalizeTypeKey(value);

  switch (normalized) {
    case 'browser-smoke':
      return 'Browser Smoke';
    case 'phpunit':
      return 'PHPUnit';
    case 'junit':
      return 'JUnit';
    case 'unit':
      return 'Unit';
    case 'integration':
      return 'Integration';
    default:
      return (
        normalized
          .split('-')
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ') || 'Outros testes'
      );
  }
}

export function toCount(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function normalizeCountSummary(summary, fallback = {}) {
  const passed = toCount(summary?.passed) ?? fallback.passed ?? 0;
  const failed = toCount(summary?.failed) ?? fallback.failed ?? 0;
  const total = toCount(summary?.total) ?? fallback.total ?? passed + failed;

  return {
    total,
    passed,
    failed,
  };
}

export function getSuiteIdentity(suite) {
  return String(
    suite?.suiteId
      || suite?.suitePath
      || suite?.suite
      || suite?.displayName
      || '',
  ).trim();
}

export function countTestsInSuites(suites) {
  let total = 0;
  let passed = 0;
  let failed = 0;

  for (const suite of suites) {
    const tests = Array.isArray(suite.tests) ? suite.tests : [];

    for (const test of tests) {
      total += 1;

      if (test?.status === 'passed') {
        passed += 1;
      } else {
        failed += 1;
      }
    }
  }

  return { total, passed, failed };
}

export function countSuitesByStatus(suites) {
  let passed = 0;
  let failed = 0;

  for (const suite of suites) {
    if (suite?.status === 'passed') {
      passed += 1;
    } else {
      failed += 1;
    }
  }

  return {
    total: suites.length,
    passed,
    failed,
  };
}

export function normalizeSuiteRecord(suite, fallbackType = 'browser-smoke') {
  const type = normalizeTypeKey(suite?.type || fallbackType);
  const displayName = String(
    suite?.displayName || suite?.suite || suite?.suitePath || getSuiteIdentity(suite) || 'Suite',
  ).trim() || 'Suite';
  const suiteId = getSuiteIdentity(suite) || normalizeTypeKey(displayName);
  const tests = Array.isArray(suite?.tests) ? suite.tests : [];
  const failedCount = tests.reduce(
    (count, test) => count + (test?.status === 'failed' ? 1 : 0),
    0,
  );
  const passedCount = tests.reduce(
    (count, test) => count + (test?.status === 'passed' ? 1 : 0),
    0,
  );

  return {
    ...suite,
    type,
    typeDisplayName: String(suite?.typeDisplayName || formatTypeLabel(type)).trim() || formatTypeLabel(type),
    suite: String(suite?.suite || displayName).trim() || displayName,
    suitePath: String(suite?.suitePath || suiteId).trim() || suiteId,
    suiteId,
    displayName,
    summary: normalizeCountSummary(suite?.summary, {
      total: tests.length,
      passed: passedCount,
      failed: failedCount,
    }),
    tests,
    testsCount: tests.length,
    passedCount,
    failedCount,
    reportUrl: String(suite?.links?.report || suite?.reportUrl || '').trim(),
    updatedAt: String(suite?.updatedAt || suite?.generatedAt || '').trim(),
  };
}

export function buildTypeMessage(suiteSummary, testSummary) {
  if (suiteSummary.total === 0) {
    return 'Nenhuma suite publicada neste tipo.';
  }

  if (suiteSummary.failed === 0) {
    return `${formatCount(suiteSummary.total, 'suite')} publicada${suiteSummary.total === 1 ? '' : 's'} e ${formatCount(testSummary.passed, 'teste')} passaram.`;
  }

  return `${formatCount(suiteSummary.failed, 'suite')} com falha em ${formatCount(suiteSummary.total, 'publicação', 'publicações')}.`;
}

export function normalizeTypeSection(typeEntry, fallbackSuites = []) {
  const suites = Array.isArray(typeEntry?.suites) && typeEntry.suites.length > 0
    ? typeEntry.suites.map((suite) => normalizeSuiteRecord(suite, typeEntry?.type))
    : fallbackSuites.map((suite) => normalizeSuiteRecord(suite, typeEntry?.type));

  const suiteSummary = normalizeCountSummary(typeEntry?.summary?.suites, countSuitesByStatus(suites));
  const testSummary = normalizeCountSummary(typeEntry?.summary?.tests, countTestsInSuites(suites));
  const type = normalizeTypeKey(typeEntry?.type || suites[0]?.type || 'browser-smoke');

  return {
    type,
    displayName: String(typeEntry?.displayName || formatTypeLabel(type)).trim() || formatTypeLabel(type),
    status: String(typeEntry?.status || (suiteSummary.failed === 0 ? 'passed' : 'failed')),
    progress: Number.isFinite(Number(typeEntry?.progress))
      ? Math.max(0, Math.min(100, Math.round(Number(typeEntry.progress))))
      : (testSummary.total > 0 ? Math.round((testSummary.passed * 100) / testSummary.total) : 0),
    message: String(typeEntry?.message || buildTypeMessage(suiteSummary, testSummary)).trim() || buildTypeMessage(suiteSummary, testSummary),
    summary: {
      suites: suiteSummary,
      tests: testSummary,
    },
    suites,
  };
}

export function buildSmokeTypeSections(index) {
  const explicitTypes = Array.isArray(index?.types) ? index.types : [];

  if (explicitTypes.length > 0) {
    return explicitTypes.map((typeEntry) => normalizeTypeSection(typeEntry));
  }

  const suites = Array.isArray(index?.suites) ? index.suites : [];
  const grouped = new Map();

  suites.forEach((suite) => {
    const normalizedSuite = normalizeSuiteRecord(suite, suite?.type || 'browser-smoke');
    const type = normalizedSuite.type;

    if (!grouped.has(type)) {
      grouped.set(type, []);
    }

    grouped.get(type).push(normalizedSuite);
  });

  return Array.from(grouped.entries()).map(([type, typeSuites]) => normalizeTypeSection({ type }, typeSuites));
}

export function listTestArtifacts(test) {
  const screenshots = Array.isArray(test?.screenshots) ? test.screenshots : [];
  const stepScreenshots = Array.isArray(test?.steps)
    ? test.steps.flatMap((step) => (Array.isArray(step.screenshots) ? step.screenshots : []))
    : [];

  return [...screenshots, ...stepScreenshots];
}

export function joinArtifactCounts(test) {
  const screenshotCount = Array.isArray(test?.screenshots) ? test.screenshots.length : 0;
  const stepCount = Array.isArray(test?.steps) ? test.steps.length : 0;

  return `${formatCount(stepCount, 'etapa')} · ${formatCount(screenshotCount, 'print')}`;
}

export function getFriendlyError(error, fallback) {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }

  return fallback;
}

export function formatDateTimeLabel(value) {
  return formatDateTime(value);
}
