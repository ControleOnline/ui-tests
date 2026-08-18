import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useStore} from '@store';
import DefaultTable from '@controleonline/ui-default/src/react/components/table/DefaultTable';
import {
  buildSmokeTypeSections,
  EMPTY_SMOKE_INDEX,
  formatPercent,
  normalizeTypeKey,
  statusLabel,
  statusTone,
} from './SmokeDashboard.helpers';
import {Badge, EmptyState, MetricCard, Panel, SmokeShell} from './SmokeDashboard.parts';
import SmokeSuiteDetails from './SmokeSuiteDetails';
import {
  SmokeTabs,
  StatusFilterChips,
  sortSuitesFailedFirst,
  isSmokeType,
  SuiteCard,
} from './SmokeDashboard.chrome';
import styles from './SmokeDashboard.styles';

export function SmokeDashboard() {
  const navigation = useNavigation();
  const route = useRoute();
  const testsStore = useStore('tests');
  const testsState = testsStore.getters;
  const testsActions = testsStore.actions;
  const routeSmokeConfig = route.params?.smokeConfig || {};
  const routeTitle = String(route.params?.title || '').trim();
  const smokeConfig = useMemo(
    () => ({
      apiBaseUrl: String(routeSmokeConfig.apiBaseUrl || '').trim(),
      domain: String(routeSmokeConfig.domain || '').trim(),
      htaccessUser: String(routeSmokeConfig.htaccessUser || '').trim(),
      htaccessPassword: String(routeSmokeConfig.htaccessPassword || '').trim(),
    }),
    [
      routeSmokeConfig.apiBaseUrl,
      routeSmokeConfig.domain,
      routeSmokeConfig.htaccessPassword,
      routeSmokeConfig.htaccessUser,
    ],
  );
  const [selectedTypeKey, setSelectedTypeKey] = useState(null);
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [selectedTestIndex, setSelectedTestIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('smoke'); // smoke | others
  const [statusFilter, setStatusFilter] = useState('failed'); // failed | all
  const [preview, setPreview] = useState(null);
  const [previewState, setPreviewState] = useState('idle');
  const [previewError, setPreviewError] = useState(null);
  const previewUrlRef = useRef(null);
  const {width} = useWindowDimensions();
  const isWide = width >= 1080;
  const index = testsState.item || EMPTY_SMOKE_INDEX;
  const loadingError = String(testsState.error || '');
  const refreshing = testsState.refreshing === true;
  const runState = testsState.isSaving === true ? 'running' : 'idle';
  const runMessage = String(testsState.runMessage || '');
  const runError = String(testsState.runError || '');

  useEffect(() => {
    void testsActions.setConfigs?.({
      ...(typeof testsState.configs === 'object' && testsState.configs ? testsState.configs : {}),
      viewMode: 'cards',
    });
  }, [testsActions]);

  useEffect(() => {
    navigation.setOptions({
      title: routeTitle || 'Resultados de testes',
    });
  }, [navigation, routeTitle]);

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
    void testsActions.loadIndex(smokeConfig).catch(() => {});
  }, [clearPreview, smokeConfig, testsActions]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const typeSections = useMemo(() => buildSmokeTypeSections(index), [index]);

  const smokeSections = useMemo(
    () => typeSections.filter((section) => isSmokeType(section.type)),
    [typeSections],
  );
  const otherSections = useMemo(
    () => typeSections.filter((section) => !isSmokeType(section.type)),
    [typeSections],
  );
  const tabSections = activeTab === 'smoke' ? smokeSections : otherSections;

  const hasAnyFailures = useMemo(
    () => typeSections.some((section) => (section.summary?.tests?.failed || 0) > 0 || section.status === 'failed'),
    [typeSections],
  );

  useEffect(() => {
    // Prefer smoke tab when it has data; otherwise others.
    if (smokeSections.length === 0 && otherSections.length > 0 && activeTab === 'smoke') {
      setActiveTab('others');
    }
  }, [activeTab, otherSections.length, smokeSections.length]);

  useEffect(() => {
    // Default to failed-only when there are failures; otherwise show all.
    setStatusFilter(hasAnyFailures ? 'failed' : 'all');
  }, [hasAnyFailures, index?.generatedAt]);

  useEffect(() => {
    const sectionsForTab = tabSections.length > 0 ? tabSections : typeSections;
    if (sectionsForTab.length === 0) {
      setSelectedTypeKey(null);
      setSelectedSuiteId(null);
      setSelectedTestIndex(0);
      return;
    }

    const nextType = sectionsForTab.some((type) => type.type === selectedTypeKey)
      ? sectionsForTab.find((type) => type.type === selectedTypeKey)
      : sectionsForTab[0];

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
      setSelectedTestIndex(0);
    }
  }, [selectedSuiteId, selectedTestIndex, selectedTypeKey, tabSections, typeSections]);

  const selectedType =
    tabSections.find((type) => type.type === selectedTypeKey)
    ?? typeSections.find((type) => type.type === selectedTypeKey)
    ?? tabSections[0]
    ?? typeSections[0]
    ?? null;
  const rawSuites = selectedType?.suites ?? [];
  const selectedTypeSuites = useMemo(
    () => sortSuitesFailedFirst(rawSuites, statusFilter),
    [rawSuites, statusFilter],
  );
  const selectedSuite =
    selectedTypeSuites.find((suite) => suite.suiteId === selectedSuiteId) ?? selectedTypeSuites[0] ?? null;

  useEffect(() => {
    void testsActions.setTotalItems?.(selectedTypeSuites.length || 0);
  }, [selectedTypeSuites.length, testsActions]);

  async function openArtifact(artifact) {
    clearPreview();
    setPreviewState('loading');
    setPreview({artifact, objectUrl: ''});

    try {
      const blob = await testsActions.loadArtifact({
        artifact,
        ...smokeConfig,
      });
      const objectUrl = URL.createObjectURL(blob);

      previewUrlRef.current = objectUrl;
      setPreview({
        artifact,
        objectUrl,
      });
      setPreviewState('idle');
    } catch (error) {
      setPreviewState('error');
      setPreviewError(error);
    }
  }

  async function runAllTests() {
    clearPreview();

    try {
      await testsActions.runAllTests(smokeConfig);
    } catch (error) {
      // o store já registra o erro; evitamos rejeição não tratada.
    }
  }

  function selectSuite(suite) {
    setSelectedTypeKey(normalizeTypeKey(suite.type));
    setSelectedSuiteId(suite.suiteId);
    setSelectedTestIndex(0);
    clearPreview();
  }

  function selectType(type) {
    setSelectedTypeKey(type.type);
    setSelectedSuiteId(type.suites?.[0]?.suiteId ?? null);
    setSelectedTestIndex(0);
    clearPreview();
  }

  function toggleTest(index) {
    setSelectedTestIndex((current) => (current === index ? null : index));
    clearPreview();
  }

  useEffect(() => {
    const tests = selectedSuite?.tests;
    if (!Array.isArray(tests)) return;
    const failedIdx = tests.findIndex((test) => test?.status === 'failed');
    setSelectedTestIndex(failedIdx >= 0 ? failedIdx : 0);
  }, [selectedSuite?.suiteId]);

  const hasIndex = testsState.item !== null && typeof testsState.item === 'object';
  const loading = testsState.isLoading === true && !hasIndex;
  const error = Boolean(loadingError) && !hasIndex;
  const displayStatus = selectedType?.status || index?.status || 'idle';

  if (loading) {
    return (
      <SmokeShell styles={styles}>
        <View style={[styles.headerCard, !isWide && styles.headerCardStack]}>
          <View style={styles.headerMain}>
            <View style={styles.headerEyebrow}>
              <Badge tone="idle" label="Carregando" styles={styles} />
              <Text style={styles.headerEyebrowText}>Smoke Atlas</Text>
            </View>
            <Text style={styles.headerTitle}>Último smoke publicado</Text>
            <Text style={styles.headerSubtitle}>Carregando o índice e preparando o dashboard.</Text>
          </View>
        </View>
        <Panel title="Carregando" subtitle="O dashboard está sincronizando com a API." styles={styles}>
          <EmptyState title="Aguarde" description="O último relatório publicado está sendo carregado." compact styles={styles} />
        </Panel>
      </SmokeShell>
    );
  }

  if (error) {
    return (
      <SmokeShell styles={styles}>
        <View style={[styles.headerCard, !isWide && styles.headerCardStack]}>
          <View style={styles.headerMain}>
            <View style={styles.headerEyebrow}>
              <Badge tone="danger" label="Erro" styles={styles} />
              <Text style={styles.headerEyebrowText}>Smoke Atlas</Text>
            </View>
            <Text style={styles.headerTitle}>Último smoke publicado</Text>
            <Text style={styles.headerSubtitle}>Falha ao consultar o índice publicado.</Text>
            <Text style={styles.headerMessageError}>{loadingError}</Text>
          </View>
          <View style={styles.headerSide}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                clearPreview();
                void testsActions.loadIndex(smokeConfig).catch(() => {});
              }}
              style={({pressed}) => [
                styles.actionButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.actionButtonLabel}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Panel title="Erro" subtitle="Não foi possível montar o dashboard." styles={styles}>
          <EmptyState title="Erro ao carregar" description={loadingError} compact styles={styles} />
        </Panel>
      </SmokeShell>
    );
  }

  return (
    <SmokeShell styles={styles}>
      <View style={[styles.headerCard, !isWide && styles.headerCardStack]}>
        <View style={styles.headerMain}>
          <View style={styles.headerEyebrow}>
            <Badge tone={statusTone(displayStatus)} label={statusLabel(displayStatus)} styles={styles} />
            <Text style={styles.headerEyebrowText}>Tests Playground</Text>
          </View>
          <Text style={styles.headerTitle}>Resultados de testes</Text>
          <Text style={styles.headerSubtitle}>
            Clique numa suite à esquerda para ver prints e detalhes à direita.
          </Text>
          {runMessage ? <Text style={styles.headerMessage}>{runMessage}</Text> : null}
          {runError ? <Text style={styles.headerMessageError}>{runError}</Text> : null}
        </View>
        <View style={styles.headerSide}>
          <View style={styles.headerMetaRow}>
            <Badge tone={statusTone(index?.status)} label={statusLabel(index?.status)} styles={styles} />
            <Text style={styles.headerSubtitle}>Gerado {String(index.generatedAt || '-')}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={refreshing || runState === 'running'}
              onPress={() => testsActions.loadIndex({...smokeConfig, keepCurrent: true})}
              style={[styles.secondaryButton, (refreshing || runState === 'running') && styles.buttonDisabled]}
            >
              <Text style={styles.secondaryButtonText}>{refreshing ? 'Atualizando…' : 'Atualizar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={runState === 'running' || refreshing}
              onPress={() => testsActions.runSmoke(smokeConfig)}
              style={[styles.primaryButton, (runState === 'running' || refreshing) && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {runState === 'running' ? 'Rodando…' : 'Rodar testes no cluster'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard
          label="Tipos"
          value={index.summary?.types?.total}
          description={`${index.summary?.types?.passed || 0} ok · ${index.summary?.types?.failed || 0} falha`}
          tone={(index.summary?.types?.failed || 0) > 0 ? 'danger' : 'success'}
          styles={styles}
        />
        <MetricCard
          label="Suites"
          value={index.summary?.suites?.total}
          description={`${index.summary?.suites?.passed || 0} ok · ${index.summary?.suites?.failed || 0} falha`}
          tone={(index.summary?.suites?.failed || 0) > 0 ? 'danger' : 'success'}
          styles={styles}
        />
        <MetricCard
          label="Testes"
          value={index.summary?.tests?.total}
          description={`${index.summary?.tests?.passed || 0} ok · ${index.summary?.tests?.failed || 0} falha`}
          tone={(index.summary?.tests?.failed || 0) > 0 ? 'danger' : 'success'}
          styles={styles}
        />
        <MetricCard
          label="Progresso"
          value={formatPercent(index.progress)}
          description="Índice publicado"
          tone="idle"
          styles={styles}
        />
      </View>

      <SmokeTabs
        activeTab={activeTab}
        smokeCount={smokeSections.length}
        otherCount={otherSections.length}
        onChange={setActiveTab}
        styles={styles}
      />

      <View style={[styles.splitLayout, !isWide && styles.splitLayoutStack]}>
        <View style={styles.splitList}>
          <Panel
            title={selectedType ? selectedType.label : 'Suites'}
            subtitle="Cards · clique para ver prints"
            styles={styles}
          >
            <StatusFilterChips statusFilter={statusFilter} onChange={setStatusFilter} styles={styles} />
            {selectedTypeSuites.length === 0 ? (
              <EmptyState
                title="Nenhuma suite"
                description={
                  statusFilter === 'failed'
                    ? 'Sem falhas neste filtro — tente Lista completa.'
                    : 'Nenhum relatório neste tipo.'
                }
                compact
                styles={styles}
              />
            ) : (
              <View style={styles.tableShell}>
                <DefaultTable
                  data={selectedTypeSuites}
                  forceCardsOnCompact
                  initialViewMode="cards"
                  onRowPress={selectSuite}
                  renderCard={({item, openRow}) => (
                    <SuiteCard
                      item={item}
                      openRow={openRow}
                      selected={item?.suiteId === selectedSuite?.suiteId}
                      styles={styles}
                      statusLabel={statusLabel}
                      statusTone={statusTone}
                    />
                  )}
                  onRefresh={() => testsActions.loadIndex({...smokeConfig, keepCurrent: true})}
                  requestParams={{}}
                  rowStyle={(row) =>
                    row.suiteId === selectedSuite?.suiteId ? styles.selectedTableRow : null
                  }
                  searchKey="search"
                  searchPlaceholder="Buscar suite, caminho ou status"
                  showRowActions={false}
                  showTotalItemsInCompactToolbar={false}
                  storeName="tests"
                  summary={selectedType?.summary}
                  summaryLabels={{
                    'suites.total': 'Suites',
                    'suites.passed': 'Suites aprovadas',
                    'suites.failed': 'Suites com falha',
                    'tests.total': 'Testes',
                    'tests.passed': 'Testes aprovados',
                    'tests.failed': 'Testes com falha',
                  }}
                  visibleColumnsPreferenceKey="tests-playground-cards-v2"
                />

              </View>
            )}
          </Panel>
        </View>

        <View style={styles.splitDetails}>
          <SmokeSuiteDetails
            preview={preview}
            previewError={previewError}
            previewState={previewState}
            selectedSuite={selectedSuite}
            selectedTestIndex={selectedTestIndex}
            onArtifactPress={(artifact) => void openArtifact(artifact)}
            onTestToggle={toggleTest}
          />
        </View>
      </View>
    </SmokeShell>
  );
}

export { SmokeDashboard as default };
