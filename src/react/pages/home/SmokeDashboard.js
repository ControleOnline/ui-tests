import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useStore} from '@store';
import DefaultTable from '@controleonline/ui-default/src/react/components/table/DefaultTable';
import {
  buildSmokeTypeSections,
  formatPercent,
  normalizeTypeKey,
  statusLabel,
  statusTone,
} from './SmokeDashboard.helpers';
import {Badge, EmptyState, MetricCard, Panel, SmokeShell} from './SmokeDashboard.parts';
import SmokeSuiteDetails from './SmokeSuiteDetails';
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
  const [preview, setPreview] = useState(null);
  const [previewState, setPreviewState] = useState('idle');
  const [previewError, setPreviewError] = useState(null);
  const previewUrlRef = useRef(null);
  const {width} = useWindowDimensions();
  const isWide = width >= 1080;
  const index = testsState.item;
  const loadingError = String(testsState.error || '');
  const refreshing = testsState.refreshing === true;
  const runState = testsState.isSaving === true ? 'running' : 'idle';
  const runMessage = String(testsState.runMessage || '');
  const runError = String(testsState.runError || '');

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

  useEffect(() => {
    if (typeSections.length === 0) {
      setSelectedTypeKey(null);
      setSelectedSuiteId(null);
      setSelectedTestIndex(0);
      return;
    }

    const nextType = typeSections.some((type) => type.type === selectedTypeKey)
      ? typeSections.find((type) => type.type === selectedTypeKey)
      : typeSections[0];

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
  }, [selectedSuiteId, selectedTestIndex, selectedTypeKey, typeSections]);

  const selectedType = typeSections.find((type) => type.type === selectedTypeKey) ?? typeSections[0] ?? null;
  const selectedTypeSuites = selectedType?.suites ?? [];
  const selectedSuite =
    selectedTypeSuites.find((suite) => suite.suiteId === selectedSuiteId) ?? selectedTypeSuites[0] ?? null;
  const selectedSuiteTests = selectedSuite?.tests ?? [];

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

  const loading = testsState.isLoading === true && !index;
  const error = loadingError && !index;
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
            <Text style={styles.headerEyebrowText}>Smoke Atlas</Text>
          </View>
          <Text style={styles.headerTitle}>Último smoke publicado</Text>
          <Text style={styles.headerSubtitle}>
            Tipos, suites, testes e prints em uma interface compacta. Clique em um tipo para filtrar as suites.
          </Text>
          <View style={styles.headerMetaRow}>
            <Badge tone={statusTone(index.status)} label={statusLabel(index.status)} styles={styles} />
            <Text style={styles.headerSubtitle}>Gerado em {String(index.generatedAt || '-')}</Text>
            <Text style={styles.headerSubtitle}>Última execução {String(index.lastRunAt || '-')}</Text>
          </View>
          {runMessage ? <Text style={styles.actionMessage}>{runMessage}</Text> : null}
          {runError ? <Text style={styles.actionMessageError}>{runError}</Text> : null}
          {loadingError && index ? <Text style={styles.actionMessageError}>{loadingError}</Text> : null}
        </View>

        <View style={styles.headerSide}>
          <View style={styles.headerStatsRow}>
            <MetricCard
              label="Tipos"
              value={index.summary.types.total}
              description={`${index.summary.types.passed} passaram · ${index.summary.types.failed} falharam`}
              tone={index.summary.types.failed > 0 ? 'danger' : 'success'}
              styles={styles}
            />
            <MetricCard
              label="Suites"
              value={index.summary.suites.total}
              description={`${index.summary.suites.passed} passaram · ${index.summary.suites.failed} falharam`}
              tone={index.summary.suites.failed > 0 ? 'danger' : 'success'}
              styles={styles}
            />
            <MetricCard
              label="Testes"
              value={index.summary.tests.total}
              description={`${index.summary.tests.passed} passaram · ${index.summary.tests.failed} falharam`}
              tone={index.summary.tests.failed > 0 ? 'danger' : 'success'}
              styles={styles}
            />
            <MetricCard
              label="Progresso"
              value={formatPercent(index.progress)}
              description="Do índice publicado"
              styles={styles}
            />
          </View>
          <View style={styles.actionButtonRow}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                clearPreview();
                void testsActions.loadIndex({...smokeConfig, keepCurrent: true}).catch(() => {});
              }}
              disabled={refreshing}
              style={({pressed}) => [
                styles.actionButton,
                styles.actionButtonAlt,
                pressed && !refreshing && styles.pressed,
                refreshing && styles.actionButtonDisabled,
              ]}
            >
              <Text style={[styles.actionButtonLabel, styles.actionButtonLabelAlt]}>
                {refreshing ? 'Atualizando...' : 'Atualizar índice'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => void runAllTests()}
              disabled={runState === 'running'}
              style={({pressed}) => [
                styles.actionButton,
                pressed && runState !== 'running' && styles.pressed,
                runState === 'running' && styles.actionButtonDisabled,
              ]}
            >
              <Text style={styles.actionButtonLabel}>
                {runState === 'running' ? 'Executando...' : 'Refazer todos os testes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.mainGrid, isWide ? styles.mainGridWide : styles.mainGridStack]}>
        <View style={styles.sidebarColumn}>
          <Panel title="Tipos de teste" subtitle="Browser smoke, PHPUnit e outros resultados publicados." style={styles.typePanel} styles={styles}>
            {typeSections.length === 0 ? (
              <EmptyState title="Nenhum tipo" description="Ainda não existe relatório publicado." compact styles={styles} />
            ) : (
              <View style={styles.typeList}>
                {typeSections.map((type) => (
                  <TouchableOpacity
                    key={type.type}
                    accessibilityRole="button"
                    accessibilityLabel={type.displayName}
                    onPress={() => selectType(type)}
                    style={({pressed}) => [
                      styles.typeCard,
                      selectedType?.type === type.type && styles.typeCardSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.typeCardTop}>
                      <View style={styles.typeCardHeading}>
                        <Text style={styles.typeTitle}>{type.displayName}</Text>
                        <Text style={styles.typeMeta}>
                          {type.summary.suites.total} suites · {type.summary.tests.total} testes
                        </Text>
                      </View>
                      <Badge tone={statusTone(type.status)} label={statusLabel(type.status)} styles={styles} />
                    </View>
                    <View style={styles.typeProgressTrack}>
                      <View style={[styles.typeProgressBar, {width: `${Math.max(0, Math.min(100, type.progress))}%`}]} />
                    </View>
                    <Text style={styles.typeDescription}>{type.message}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Panel>
        </View>

        <View style={styles.contentColumn}>
          <Panel
            title={selectedType ? `${selectedType.displayName} · suites` : 'Suites'}
            subtitle={
              selectedType
                ? 'A listagem usa DefaultTable e conserva busca, filtros, ordenação e paginação pelo próprio componente.'
                : 'Escolha um tipo para filtrar as suites.'
            }
            style={styles.tablePanel}
            styles={styles}
          >
            {selectedTypeSuites.length === 0 ? (
              <EmptyState
                title="Nenhuma suite"
                description={selectedType ? 'Este tipo ainda não publicou suites.' : 'Ainda não existe relatório publicado.'}
                compact
                styles={styles}
              />
            ) : (
              <View style={styles.tableShell}>
                <DefaultTable
                  data={selectedTypeSuites}
                  initialViewMode="table"
                  onRowPress={selectSuite}
                  onRefresh={() => testsActions.loadIndex({...smokeConfig, keepCurrent: true})}
                  requestParams={{}}
                  rowStyle={(row) => (row.suiteId === selectedSuite?.suiteId ? styles.selectedTableRow : null)}
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
                  visibleColumnsPreferenceKey="tests-playground-suites"
                />
              </View>
            )}
          </Panel>

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
