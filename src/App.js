import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useStore } from '@store';
import LoginScreen from './LoginScreen';
import { getSmokeApiConfig } from './lib/config';
import { formatCount, formatDateTime, formatPercent } from './lib/format';
import { createAuthenticatedFetch } from './lib/fetchAuth';

function statusTone(status) {
  switch (status) {
    case 'passed':
      return 'success';
    case 'failed':
      return 'danger';
    default:
      return 'idle';
  }
}

function statusLabel(status) {
  switch (status) {
    case 'passed':
      return 'Passou';
    case 'failed':
      return 'Falhou';
    default:
      return 'Pendente';
  }
}

function joinArtifactCounts(test) {
  const screenshotCount = Array.isArray(test.screenshots) ? test.screenshots.length : 0;
  const stepCount = Array.isArray(test.steps) ? test.steps.length : 0;

  return `${formatCount(stepCount, 'etapa')} · ${formatCount(screenshotCount, 'print')}`;
}

function listTestArtifacts(test) {
  const screenshots = Array.isArray(test.screenshots) ? test.screenshots : [];
  const stepScreenshots = Array.isArray(test.steps)
    ? test.steps.flatMap((step) => (Array.isArray(step.screenshots) ? step.screenshots : []))
    : [];

  return [...screenshots, ...stepScreenshots];
}

function getFriendlyError(error, fallback) {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }

  return fallback;
}

function normalizeTypeKey(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === '') {
    return 'browser-smoke';
  }

  return raw
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatTypeLabel(value) {
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
      return normalized
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'Outros testes';
  }
}

function toCount(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeCountSummary(summary, fallback = {}) {
  const passed = toCount(summary?.passed) ?? fallback.passed ?? 0;
  const failed = toCount(summary?.failed) ?? fallback.failed ?? 0;
  const total = toCount(summary?.total) ?? fallback.total ?? passed + failed;

  return {
    total,
    passed,
    failed,
  };
}

function getSuiteIdentity(suite) {
  return String(
    suite?.suiteId
      || suite?.suitePath
      || suite?.suite
      || suite?.displayName
      || '',
  ).trim();
}

function normalizeSuiteRecord(suite, fallbackType = 'browser-smoke') {
  const type = normalizeTypeKey(suite?.type || fallbackType);
  const displayName = String(suite?.displayName || suite?.suite || suite?.suitePath || getSuiteIdentity(suite) || 'Suite').trim() || 'Suite';
  const suiteId = getSuiteIdentity(suite) || normalizeTypeKey(displayName);
  const tests = Array.isArray(suite?.tests) ? suite.tests : [];

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
    }),
    tests,
  };
}

function countTestsInSuites(suites) {
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

function countSuitesByStatus(suites) {
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

function buildTypeMessage(suiteSummary, testSummary) {
  if (suiteSummary.total === 0) {
    return 'Nenhuma suite publicada neste tipo.';
  }

  if (suiteSummary.failed === 0) {
    return `${formatCount(suiteSummary.total, 'suite')} publicada${suiteSummary.total === 1 ? '' : 's'} e ${formatCount(testSummary.passed, 'teste')} passaram.`;
  }

  return `${formatCount(suiteSummary.failed, 'suite')} com falha em ${formatCount(suiteSummary.total, 'publicação', 'publicações')}.`;
}

function normalizeTypeSection(typeEntry, fallbackSuites = []) {
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

function buildSmokeTypeSections(index) {
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

function Panel({ title, subtitle, action, children, style }) {
  return (
    <View style={[styles.panel, style]}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHeading}>
          <Text style={styles.panelTitle}>{title}</Text>
          {subtitle ? <Text style={styles.panelSubtitle}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

function Badge({ tone, label, subtle = false }) {
  return (
    <View
      style={[
        styles.badge,
        tone === 'success' && styles.badgeSuccess,
        tone === 'danger' && styles.badgeDanger,
        tone === 'idle' && styles.badgeIdle,
        subtle && styles.badgeSubtle,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          tone === 'success' && styles.badgeTextSuccess,
          tone === 'danger' && styles.badgeTextDanger,
          tone === 'idle' && styles.badgeTextIdle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function MetricCard({ label, value, description, tone }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, tone === 'danger' && styles.metricValueDanger, tone === 'success' && styles.metricValueSuccess]}>
        {value}
      </Text>
      {description ? <Text style={styles.metricDescription}>{description}</Text> : null}
    </View>
  );
}

function EmptyState({ title, description, compact = false }) {
  return (
    <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function ArtifactButton({ artifact, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.artifactButton,
        selected && styles.artifactButtonSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.artifactButtonLabel} numberOfLines={1}>
        {artifact.label}
      </Text>
      <Text style={styles.artifactButtonMeta} numberOfLines={1}>
        {artifact.kind}
      </Text>
    </Pressable>
  );
}

function StepCard({ step, onArtifactPress }) {
  const screenshots = Array.isArray(step.screenshots) ? step.screenshots : [];

  return (
    <View style={styles.stepCard}>
      <View style={styles.stepCardHeader}>
        <View style={styles.stepTitleWrap}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Badge tone={statusTone(step.status)} label={statusLabel(step.status)} subtle />
        </View>
      </View>
      {step.error ? <Text style={styles.stepError}>{step.error}</Text> : null}
      {screenshots.length > 0 ? (
        <View style={styles.artifactRow}>
          {screenshots.map((artifact) => (
            <ArtifactButton key={`${artifact.url}-${artifact.label}`} artifact={artifact} onPress={() => onArtifactPress(artifact)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PreviewPane({ preview, previewState, previewError }) {
  if (previewState === 'loading') {
    return (
      <View style={styles.previewBox}>
        <ActivityIndicator color="#7dd3fc" />
        <Text style={styles.previewText}>Carregando print selecionado.</Text>
      </View>
    );
  }

  if (previewState === 'error') {
    return (
      <View style={styles.previewBox}>
        <Text style={styles.previewTitle}>Falha ao abrir print</Text>
        <Text style={styles.previewText}>{previewError}</Text>
      </View>
    );
  }

  if (!preview) {
    return (
      <View style={styles.previewBox}>
        <Text style={styles.previewTitle}>Pré-visualização</Text>
        <Text style={styles.previewText}>Selecione um print para ver a imagem aqui.</Text>
      </View>
    );
  }

  if (preview.artifact.kind !== 'image') {
    return (
      <View style={styles.previewBox}>
        <Text style={styles.previewTitle}>{preview.artifact.label}</Text>
        <Text style={styles.previewText}>
          {preview.artifact.kind} sem prévia visual direta. Abra o artefato pelo link da API.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.previewBox}>
      <Text style={styles.previewTitle}>{preview.artifact.label}</Text>
      <Image
        accessibilityLabel={preview.artifact.label}
        source={{ uri: preview.objectUrl }}
        style={styles.previewImage}
        resizeMode="contain"
      />
    </View>
  );
}

function TestAccordion({
  test,
  expanded,
  onToggle,
  onArtifactPress,
  preview,
  previewState,
  previewError,
}) {
  const artifacts = listTestArtifacts(test);
  const isEmpty = artifacts.length === 0;
  const stepCount = Array.isArray(test.steps) ? test.steps.length : 0;
  const selectedPreviewUrl = preview?.artifact?.url ?? null;

  return (
    <View style={[styles.testCard, expanded && styles.testCardSelected]}>
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={({ pressed }) => [styles.testCardTop, pressed && styles.pressed]}
      >
        <View style={styles.testAccordionHeaderText}>
          <View style={styles.testAccordionTitleRow}>
            <Text style={styles.testTitle}>{test.title}</Text>
            <Badge tone={statusTone(test.status)} label={statusLabel(test.status)} subtle />
          </View>
          <Text style={styles.testMeta}>
            {joinArtifactCounts(test)} · {formatCount(stepCount, 'passo')}
          </Text>
        </View>
        <Text style={styles.testAccordionToggle}>{expanded ? 'Fechar' : 'Abrir'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.testAccordionBody}>
          {test.error ? <Text style={styles.testError}>{test.error}</Text> : null}

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Prints</Text>
              <Text style={styles.sectionHint}>
                {isEmpty ? 'Nenhum print anexado' : 'Clique em um print para abrir a imagem'}
              </Text>
            </View>
            {isEmpty ? (
              <Text style={styles.sectionEmptyText}>Este teste não trouxe prints para exibir.</Text>
            ) : (
              <View style={styles.artifactRow}>
                {artifacts.map((artifact) => (
                  <ArtifactButton
                    key={`${artifact.url}-${artifact.label}`}
                    artifact={artifact}
                    selected={selectedPreviewUrl === artifact.url}
                    onPress={() => onArtifactPress(artifact)}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.previewSection}>
            <PreviewPane preview={preview} previewState={previewState} previewError={previewError} />
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Etapas</Text>
              <Text style={styles.sectionHint}>
                {stepCount > 0 ? formatCount(stepCount, 'etapa') : 'Sem etapas detalhadas'}
              </Text>
            </View>
            <View style={styles.stepList}>
              {stepCount > 0 ? (
                test.steps.map((step, index) => (
                  <StepCard
                    key={`${test.title}-${step.title}-${index}`}
                    step={step}
                    onArtifactPress={onArtifactPress}
                  />
                ))
              ) : (
                <Text style={styles.sectionEmptyText}>
                  O relatório não trouxe etapas detalhadas para este teste.
                </Text>
              )}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function SmokeDashboard({ apiBaseUrl }) {
  const testsStore = useStore('tests');
  const testsState = testsStore.getters;
  const testsActions = testsStore.actions;
  const [selectedTypeKey, setSelectedTypeKey] = useState(null);
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [selectedTestIndex, setSelectedTestIndex] = useState(0);
  const [preview, setPreview] = useState(null);
  const [previewState, setPreviewState] = useState('idle');
  const [previewError, setPreviewError] = useState(null);
  const previewUrlRef = useRef(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 1080;
  const index = testsState.item;
  const loadingError = String(testsState.error || '');

  const state = useMemo(
    () => ({
      status:
        testsState.isLoading === true && !index
          ? 'loading'
          : loadingError && !index
            ? 'error'
            : index
              ? 'ready'
              : 'loading',
      index,
      error: loadingError || null,
    }),
    [index, loadingError, testsState.isLoading],
  );
  const refreshing = testsState.refreshing === true;
  const runState = testsState.isSaving === true ? 'running' : 'idle';
  const runMessage = String(testsState.runMessage || '');
  const runError = String(testsState.runError || '');

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreview(null);
    setPreviewState('idle');
    setPreviewError(null);
  }, []);

  useEffect(() => {
    clearPreview();
    void testsActions.loadIndex().catch(() => {});
  }, [clearPreview, testsActions]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (state.status !== 'ready') {
      return;
    }

    const nextTypes = buildSmokeTypeSections(state.index);

    if (nextTypes.length === 0) {
      if (selectedTypeKey !== null) {
        setSelectedTypeKey(null);
      }
      if (selectedSuiteId !== null) {
        setSelectedSuiteId(null);
      }
      if (selectedTestIndex !== 0) {
        setSelectedTestIndex(0);
      }

      return;
    }

    const nextType = nextTypes.some((type) => type.type === selectedTypeKey)
      ? nextTypes.find((type) => type.type === selectedTypeKey)
      : nextTypes[0];

    if ((nextType?.type ?? null) !== selectedTypeKey) {
      setSelectedTypeKey(nextType?.type ?? null);
      setSelectedSuiteId(nextType?.suites?.[0]?.suiteId ?? null);
      setSelectedTestIndex(0);

      return;
    }

    const currentSuite = nextType?.suites?.find((suite) => suite.suiteId === selectedSuiteId) ?? null;
    const nextSuiteId = currentSuite?.suiteId ?? nextType?.suites?.[0]?.suiteId ?? null;

    if (nextSuiteId !== selectedSuiteId) {
      setSelectedSuiteId(nextSuiteId);
      setSelectedTestIndex(0);

      return;
    }

    if (currentSuite && selectedTestIndex >= currentSuite.tests.length) {
      setSelectedTestIndex(currentSuite.tests.length > 0 ? 0 : 0);
    }
  }, [selectedSuiteId, selectedTestIndex, selectedTypeKey, state]);

  async function openArtifact(artifact) {
    clearPreview();

    setPreviewState('loading');
    setPreview({ artifact, objectUrl: '' });

    try {
      const blob = await testsActions.loadArtifact({ artifact, apiBaseUrl });
      const objectUrl = URL.createObjectURL(blob);

      previewUrlRef.current = objectUrl;
      setPreview({
        artifact,
        objectUrl,
      });
      setPreviewState('idle');
    } catch (error) {
      setPreviewState('error');
      setPreviewError(getFriendlyError(error, 'Falha ao carregar o artifact.'));
    }
  }

  async function runAllTests() {
    clearPreview();

    try {
      await testsActions.runAllTests();
    } catch (error) {
      // o store já registra o erro; evitamos rejeição não tratada.
    }
  }

  function selectSuite(suite) {
    setSelectedTypeKey(suite.type);
    setSelectedSuiteId(suite.suiteId);
    setSelectedTestIndex(0);
    setPreview(null);
    setPreviewState('idle');
    setPreviewError(null);
  }

  function selectType(type) {
    setSelectedTypeKey(type.type);
    setSelectedSuiteId(type.suites?.[0]?.suiteId ?? null);
    setSelectedTestIndex(0);
    setPreview(null);
    setPreviewState('idle');
    setPreviewError(null);
  }

  function toggleTest(index) {
    setSelectedTestIndex((current) => (current === index ? null : index));
    setPreview(null);
    setPreviewState('idle');
    setPreviewError(null);
  }

  const typeSections = useMemo(() => buildSmokeTypeSections(index), [index]);
  const selectedType = typeSections.find((type) => type.type === selectedTypeKey) ?? typeSections[0] ?? null;
  const selectedTypeSuites = selectedType?.suites ?? [];
  const selectedSuite = selectedTypeSuites.find((suite) => suite.suiteId === selectedSuiteId) ?? selectedTypeSuites[0] ?? null;
  const selectedSuiteTests = selectedSuite?.tests ?? [];
  const selectedTest = selectedSuiteTests[selectedTestIndex] ?? null;

  if (state.status === 'loading') {
    return (
      <SmokeShell>
        <View style={[styles.dashboardHeader, !isWide && styles.dashboardHeaderStack]}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerKicker}>Smoke Atlas</Text>
            <Text style={styles.headerTitle}>Último smoke publicado</Text>
            <Text style={styles.headerSubtitle}>Carregando o índice e preparando o dashboard.</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.headerMetaStack}>
              <Badge tone="idle" label="Carregando" />
              <Text style={styles.headerMetaText}>Buscando o último index.json disponível.</Text>
            </View>
          </View>
        </View>
        <Panel title="Carregando" subtitle="O dashboard está sincronizando com a API." style={styles.loadingPanel}>
          <EmptyState title="Aguarde" description="O último relatório publicado está sendo carregado." compact />
        </Panel>
      </SmokeShell>
    );
  }

  if (state.status === 'error') {
    return (
      <SmokeShell>
        <View style={[styles.dashboardHeader, !isWide && styles.dashboardHeaderStack]}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerKicker}>Smoke Atlas</Text>
            <Text style={styles.headerTitle}>Último smoke publicado</Text>
            <Text style={styles.headerSubtitle}>Falha ao consultar o índice publicado.</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.headerMetaStack}>
              <Badge tone="danger" label="Erro" />
              <Text style={styles.headerMetaText}>{state.error}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                clearPreview();
                void testsActions.loadIndex().catch(() => {});
              }}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={styles.actionButtonLabel}>Tentar novamente</Text>
            </Pressable>
          </View>
        </View>
        <Panel title="Erro" subtitle="Não foi possível montar o dashboard." style={styles.loadingPanel}>
          <EmptyState title="Erro ao carregar" description={state.error} compact />
        </Panel>
      </SmokeShell>
    );
  }

  return (
    <SmokeShell>
      <View style={[styles.dashboardHeader, !isWide && styles.dashboardHeaderStack]}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerKicker}>Smoke Atlas</Text>
          <Text style={styles.headerTitle}>Último smoke publicado</Text>
          <Text style={styles.headerSubtitle}>
            Tipos, suites, testes e prints em uma interface compacta. Clique em um tipo para filtrar as suites.
          </Text>
          <View style={styles.headerMetaRow}>
            <Badge tone={statusTone(index.status)} label={statusLabel(index.status)} />
            <Text style={styles.headerMetaText}>Gerado em {formatDateTime(index.generatedAt)}</Text>
            <Text style={styles.headerMetaText}>Última execução {formatDateTime(index.lastRunAt)}</Text>
          </View>
          {runMessage ? <Text style={styles.headerFeedback}>{runMessage}</Text> : null}
          {runError ? <Text style={styles.headerFeedbackError}>{runError}</Text> : null}
          {state.error && state.index ? <Text style={styles.headerFeedbackError}>{state.error}</Text> : null}
        </View>

        <View style={styles.headerActions}>
          <View style={styles.headerStatsRow}>
            <MetricCard
              label="Tipos"
              value={index.summary.types.total}
              description={`${formatCount(index.summary.types.passed, 'passou')} · ${formatCount(index.summary.types.failed, 'falhou')}`}
              tone={index.summary.types.failed > 0 ? 'danger' : 'success'}
            />
            <MetricCard
              label="Suites"
              value={index.summary.suites.total}
              description={`${formatCount(index.summary.suites.passed, 'passou')} · ${formatCount(index.summary.suites.failed, 'falhou')}`}
              tone={index.summary.suites.failed > 0 ? 'danger' : 'success'}
            />
            <MetricCard
              label="Testes"
              value={index.summary.tests.total}
              description={`${formatCount(index.summary.tests.passed, 'passou')} · ${formatCount(index.summary.tests.failed, 'falhou')}`}
              tone={index.summary.tests.failed > 0 ? 'danger' : 'success'}
            />
            <MetricCard
              label="Progresso"
              value={formatPercent(index.progress)}
              description={`Geração ${formatDateTime(index.generatedAt)}`}
            />
          </View>

          <View style={styles.headerButtonRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  clearPreview();
                  void testsActions.loadIndex({ keepCurrent: true }).catch(() => {});
                }}
                disabled={refreshing}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && !refreshing && styles.pressed,
                  refreshing && styles.heroActionDisabled,
                ]}
              >
                {refreshing ? (
                  <ActivityIndicator color="#7dd3fc" />
                ) : (
                  <Text style={styles.actionButtonLabel}>Atualizar índice</Text>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => void runAllTests()}
                disabled={runState === 'running'}
                style={({ pressed }) => [
                  styles.heroAction,
                  pressed && runState !== 'running' && styles.pressed,
                  runState === 'running' && styles.heroActionDisabled,
                ]}
              >
                {runState === 'running' ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text style={styles.heroActionLabel}>Refazer todos os testes</Text>
                )}
              </Pressable>
          </View>
        </View>
      </View>

      <View style={[styles.mainGrid, isWide ? styles.mainGridWide : styles.mainGridStack]}>
        <View style={styles.sidebarColumn}>
          <Panel
            title="Tipos de teste"
            subtitle="Browser smoke, PHPUnit e outros resultados publicados."
            style={styles.typePanel}
          >
            {typeSections.length === 0 ? (
              <EmptyState title="Nenhum tipo" description="Ainda não existe relatório publicado." compact />
            ) : (
              <View style={styles.typeList}>
                {typeSections.map((type) => (
                  <Pressable
                    key={type.type}
                    accessibilityRole="button"
                    accessibilityLabel={type.displayName}
                    onPress={() => selectType(type)}
                    style={({ pressed }) => [
                      styles.typeCard,
                      selectedType?.type === type.type && styles.typeCardSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.typeCardTop}>
                      <View style={styles.typeCardHeading}>
                        <Text style={styles.typeTitle}>{type.displayName}</Text>
                        <Text style={styles.typeMeta}>
                          {formatCount(type.summary.suites.total, 'suite')} · {formatCount(type.summary.tests.total, 'teste')}
                        </Text>
                      </View>
                      <Badge tone={statusTone(type.status)} label={statusLabel(type.status)} />
                    </View>
                    <View style={styles.typeProgressTrack}>
                      <View style={[styles.typeProgressBar, { width: `${Math.max(0, Math.min(100, type.progress))}%` }]} />
                    </View>
                    <Text style={styles.typeDescription}>{type.message}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Panel>

          <Panel
            title="Suites"
            subtitle={
              selectedType
                ? `Dentro de ${selectedType.displayName}.`
                : 'Escolha um tipo para filtrar as suites.'
            }
            style={styles.suitePanel}
          >
            {selectedTypeSuites.length === 0 ? (
              <EmptyState
                title="Nenhuma suite"
                description={selectedType ? 'Este tipo ainda não publicou suites.' : 'Ainda não existe relatório publicado.'}
                compact
              />
            ) : (
              <View style={styles.suiteList}>
                {selectedTypeSuites.map((suite) => (
                  <Pressable
                    key={suite.suiteId}
                    accessibilityRole="button"
                    accessibilityLabel={suite.displayName}
                    onPress={() => selectSuite(suite)}
                    style={({ pressed }) => [
                      styles.suiteCard,
                      selectedSuite?.suiteId === suite.suiteId && styles.suiteCardSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.suiteCardTop}>
                      <Badge tone={statusTone(suite.status)} label={statusLabel(suite.status)} />
                      <Text style={styles.suiteMeta}>
                        {formatCount(suite.summary.total, 'teste')} · {formatCount(suite.summary.failed, 'falha')}
                      </Text>
                    </View>
                    <Text style={styles.suiteTitle}>{suite.displayName}</Text>
                    <Text style={styles.suiteDescription}>
                      {suite.error || `Atualizado em ${formatDateTime(suite.updatedAt || suite.generatedAt)}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Panel>
        </View>

        <Panel
          title={selectedSuite ? selectedSuite.displayName : 'Detalhes'}
          subtitle={
            selectedSuite
              ? `${selectedType?.displayName || selectedSuite.typeDisplayName} · ${formatCount(selectedSuiteTests.length, 'teste')} · ${formatCount(selectedSuite.summary.failed, 'falha')}`
              : 'Escolha uma suite para ver os testes.'
          }
          style={styles.detailPanel}
        >
          {!selectedSuite || selectedSuiteTests.length === 0 ? (
            <EmptyState title="Sem testes" description="A suite selecionada ainda não tem itens para mostrar." compact />
          ) : (
            <View style={styles.detailContent}>
              <View style={styles.testList}>
                {selectedSuiteTests.map((test, index) => (
                  <TestAccordion
                    key={`${selectedSuite.suiteId}-${test.title}-${index}`}
                    test={test}
                    expanded={selectedTestIndex === index}
                    onToggle={() => toggleTest(index)}
                    onArtifactPress={(artifact) => void openArtifact(artifact)}
                    preview={preview}
                    previewState={previewState}
                    previewError={previewError}
                  />
                ))}
              </View>

              {!selectedTest ? (
                <EmptyState
                  title="Nenhum teste aberto"
                  description="Abra um teste para ver prints e etapas aqui."
                  compact
                />
              ) : null}
            </View>
          )}
        </Panel>
      </View>
    </SmokeShell>
  );
}

function SmokeShell({ children }) {
  return (
    <View style={styles.shell}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

function Hero({ title, subtitle, status, message, generatedAt, lastRunAt, progress, onReload, loading = false }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroMain}>
        <View style={styles.heroEyebrow}>
          <Badge tone={statusTone(status)} label={statusLabel(status)} />
          <Text style={styles.heroEyebrowText}>Último smoke publicado</Text>
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
        {message ? <Text style={styles.heroMessage}>{message}</Text> : null}
      </View>

      <View style={styles.heroSide}>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progresso</Text>
            <Text style={styles.progressValue}>{formatPercent(progress)}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${Math.max(0, Math.min(100, progress))}%` }]} />
          </View>
        </View>

        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaText}>
            <Text style={styles.heroMetaLabel}>Geração:</Text> {formatDateTime(generatedAt)}
          </Text>
          <Text style={styles.heroMetaText}>
            <Text style={styles.heroMetaLabel}>Última execução:</Text> {formatDateTime(lastRunAt)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onReload}
          disabled={loading}
          style={({ pressed }) => [
            styles.heroAction,
            pressed && !loading && styles.pressed,
            loading && styles.heroActionDisabled,
          ]}
        >
          {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.heroActionLabel}>Recarregar índice</Text>}
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  const config = getSmokeApiConfig();
  const authStore = useStore('auth');
  const authState = authStore.getters;
  const authActions = authStore.actions;

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
  }, [config.apiBaseUrl, config.htaccessUser, config.htaccessPassword]);

  useEffect(() => {
    void authActions.restoreSession().catch(() => {});
  }, [authActions]);

  if (authState.sessionChecked !== true) {
    return (
      <SmokeShell>
        <View style={styles.loadingAuth}>
          <ActivityIndicator color="#7dd3fc" />
          <Text style={styles.loadingAuthText}>Carregando sessão...</Text>
        </View>
      </SmokeShell>
    );
  }

  if (!authState.isLogged) {
    return <LoginScreen />;
  }

  return (
    <SmokeDashboard
      apiBaseUrl={config.apiBaseUrl}
    />
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#050816',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 18,
  },
  glowOne: {
    position: 'absolute',
    top: -120,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 211, 238, 0.22)',
    opacity: 0.6,
  },
  glowTwo: {
    position: 'absolute',
    right: -120,
    bottom: -120,
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 114, 182, 0.20)',
    opacity: 0.55,
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
  },
  heroMain: {
    flex: 1.6,
    gap: 12,
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroEyebrowText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 760,
  },
  heroMessage: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 23,
  },
  heroSide: {
    flex: 0.9,
    minWidth: 260,
    gap: 14,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  progressCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 6, 23, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.16)',
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },
  progressValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#7dd3fc',
  },
  heroMeta: {
    gap: 8,
  },
  heroMetaText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  heroMetaLabel: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  heroAction: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#7dd3fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionDisabled: {
    opacity: 0.7,
  },
  heroActionLabel: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 220,
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    marginTop: 6,
    color: '#f8fafc',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  metricValueDanger: {
    color: '#fb7185',
  },
  metricValueSuccess: {
    color: '#4ade80',
  },
  metricDescription: {
    marginTop: 8,
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  mainGrid: {
    gap: 16,
  },
  mainGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainGridStack: {
    flexDirection: 'column',
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  dashboardHeaderStack: {
    flexDirection: 'column',
  },
  headerCopy: {
    flex: 1.2,
    gap: 10,
  },
  headerKicker: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 720,
  },
  headerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  headerActions: {
    flex: 1,
    gap: 14,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  headerMetaStack: {
    gap: 8,
  },
  headerMetaText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  headerFeedback: {
    color: '#7dd3fc',
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(125, 211, 252, 0.10)',
  },
  headerFeedbackError: {
    color: '#fda4af',
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 113, 133, 0.10)',
  },
  headerStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  headerButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  panel: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    gap: 18,
  },
  loadingPanel: {
    minHeight: 220,
  },
  sidebarColumn: {
    flex: 0.92,
    gap: 16,
  },
  typePanel: {
    gap: 16,
  },
  suitePanel: {
    gap: 16,
  },
  detailPanel: {
    flex: 1.28,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  panelHeading: {
    flex: 1,
    gap: 6,
  },
  panelTitle: {
    color: '#f8fafc',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  panelSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(125, 211, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.30)',
  },
  actionButtonLabel: {
    color: '#7dd3fc',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(74, 222, 128, 0.16)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(251, 113, 133, 0.18)',
  },
  badgeIdle: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  badgeSubtle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#cbd5e1',
  },
  badgeTextSuccess: {
    color: '#86efac',
  },
  badgeTextDanger: {
    color: '#fda4af',
  },
  badgeTextIdle: {
    color: '#fcd34d',
  },
  suiteList: {
    gap: 12,
  },
  typeList: {
    gap: 12,
  },
  typeCard: {
    gap: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  typeCardSelected: {
    borderColor: 'rgba(125, 211, 252, 0.55)',
    backgroundColor: 'rgba(8, 47, 73, 0.42)',
  },
  typeCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  typeCardHeading: {
    flex: 1,
    gap: 4,
  },
  typeTitle: {
    color: '#f8fafc',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  typeMeta: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  typeDescription: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  typeProgressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
  },
  typeProgressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#7dd3fc',
  },
  suiteCard: {
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(2, 6, 23, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  suiteCardSelected: {
    borderColor: 'rgba(125, 211, 252, 0.55)',
    backgroundColor: 'rgba(8, 47, 73, 0.42)',
  },
  suiteCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  suiteMeta: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  suiteTitle: {
    color: '#f8fafc',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  suiteDescription: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  detailContent: {
    gap: 18,
  },
  testAccordionHeaderText: {
    flex: 1,
    gap: 6,
  },
  testAccordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  testAccordionToggle: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  testAccordionBody: {
    gap: 14,
    paddingTop: 16,
  },
  selectedTestHeader: {
    gap: 10,
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 6, 23, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  selectedTestHeaderText: {
    gap: 6,
  },
  selectedTestLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectedTestTitle: {
    color: '#f8fafc',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  testError: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 22,
  },
  testList: {
    gap: 12,
  },
  testCard: {
    gap: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(2, 6, 23, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  testCardSelected: {
    borderColor: 'rgba(125, 211, 252, 0.55)',
    backgroundColor: 'rgba(8, 47, 73, 0.42)',
  },
  testCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  testMeta: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  testTitle: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  testDescription: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  sectionHint: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionEmptyText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  artifactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  artifactButton: {
    minWidth: 170,
    maxWidth: 260,
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    gap: 4,
  },
  artifactButtonSelected: {
    borderColor: 'rgba(125, 211, 252, 0.55)',
    backgroundColor: 'rgba(8, 47, 73, 0.48)',
  },
  artifactButtonLabel: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  artifactButtonMeta: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  previewSection: {
    gap: 12,
  },
  previewBox: {
    minHeight: 260,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    gap: 12,
  },
  previewTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  previewText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: 18,
    backgroundColor: '#020617',
  },
  loadingAuth: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingAuthText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },
  stepList: {
    gap: 12,
  },
  stepCard: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  stepCardHeader: {
    gap: 8,
  },
  stepTitleWrap: {
    gap: 8,
  },
  stepTitle: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  stepError: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    gap: 8,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  emptyStateCompact: {
    padding: 16,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyDescription: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
});
