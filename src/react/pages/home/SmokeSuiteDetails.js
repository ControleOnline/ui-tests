import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Image, Pressable, Text, View} from 'react-native';
import {
  getFriendlyError,
  joinArtifactCounts,
  listTestArtifacts,
  statusLabel,
  statusTone,
} from './SmokeDashboard.helpers';
import styles from './SmokeSuiteDetails.styles';

function Badge({tone, label, subtle = false}) {
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

function Panel({title, subtitle, children, style}) {
  return (
    <View style={[styles.panel, style]}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHeading}>
          <Text style={styles.panelTitle}>{title}</Text>
          {subtitle ? <Text style={styles.panelSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function EmptyState({title, description, compact = false}) {
  return (
    <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

/** Loads artifact blob and shows image inline (no button). */
function TimelinePrint({artifact, loadArtifact}) {
  const [state, setState] = useState('loading');
  const [objectUrl, setObjectUrl] = useState('');
  const [error, setError] = useState(null);
  const urlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState('loading');
      setError(null);
      try {
        if (!loadArtifact) {
          setState('error');
          setError(new Error('Loader de print indisponível.'));
          return;
        }
        const blob = await loadArtifact(artifact);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setObjectUrl(url);
        setState('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err);
        setState('error');
      }
    }

    void run();

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [artifact?.url, loadArtifact]);

  const isImage = artifact?.kind === 'image' || String(artifact?.label || '').match(/screenshot|image|png|jpg/i);

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineRail}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>
      <View style={styles.timelineBody}>
        <Text style={styles.timelineLabel}>{artifact?.label || 'Print'}</Text>
        {state === 'loading' ? (
          <View style={styles.timelinePlaceholder}>
            <ActivityIndicator color="#7dd3fc" size="small" />
            <Text style={styles.timelineMeta}>Carregando…</Text>
          </View>
        ) : null}
        {state === 'error' ? (
          <Text style={styles.timelineError}>
            {getFriendlyError(error, 'Falha ao carregar print.')}
          </Text>
        ) : null}
        {state === 'ready' && isImage && objectUrl ? (
          <Image
            accessibilityLabel={artifact?.label || 'screenshot'}
            source={{uri: objectUrl}}
            style={styles.timelineImage}
            resizeMode="contain"
          />
        ) : null}
        {state === 'ready' && !isImage ? (
          <Text style={styles.timelineMeta}>{artifact?.kind || 'arquivo'} (sem prévia)</Text>
        ) : null}
      </View>
    </View>
  );
}

function PrintTimeline({artifacts, loadArtifact}) {
  if (!artifacts.length) {
    return <Text style={styles.sectionEmptyText}>Este teste não trouxe prints.</Text>;
  }

  return (
    <View style={styles.timeline}>
      {artifacts.map((artifact, index) => (
        <TimelinePrint
          key={`${artifact.url || artifact.label}-${index}`}
          artifact={artifact}
          loadArtifact={loadArtifact}
        />
      ))}
    </View>
  );
}

function StepCard({step, loadArtifact}) {
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
        <PrintTimeline artifacts={screenshots} loadArtifact={loadArtifact} />
      ) : null}
    </View>
  );
}

function TestAccordion({test, expanded, onToggle, loadArtifact}) {
  const artifacts = listTestArtifacts(test);
  const stepCount = Array.isArray(test.steps) ? test.steps.length : 0;

  return (
    <View style={[styles.testCard, expanded && styles.testCardSelected]}>
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={({pressed}) => [styles.testCardTop, pressed && styles.pressed]}
      >
        <View style={styles.testAccordionHeaderText}>
          <View style={styles.testAccordionTitleRow}>
            <Text style={styles.testTitle}>{test.title}</Text>
            <Badge tone={statusTone(test.status)} label={statusLabel(test.status)} subtle />
          </View>
          <Text style={styles.testMeta}>
            {joinArtifactCounts(test)} · {stepCount} passo{stepCount === 1 ? '' : 's'}
          </Text>
        </View>
        <Text style={styles.testAccordionToggle}>{expanded ? 'Fechar' : 'Abrir'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.testAccordionBody}>
          {test.error ? <Text style={styles.testError}>{test.error}</Text> : null}

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Linha do tempo</Text>
              <Text style={styles.sectionHint}>
                {artifacts.length
                  ? `${artifacts.length} print${artifacts.length === 1 ? '' : 's'}`
                  : 'Sem prints'}
              </Text>
            </View>
            <PrintTimeline artifacts={artifacts} loadArtifact={loadArtifact} />
          </View>

          {stepCount > 0 ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Etapas</Text>
                <Text style={styles.sectionHint}>
                  {stepCount} etapa{stepCount === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={styles.stepList}>
                {test.steps.map((step, index) => (
                  <StepCard
                    key={`${test.title}-${step.title}-${index}`}
                    step={step}
                    loadArtifact={loadArtifact}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function SmokeSuiteDetails({
  selectedSuite,
  selectedTestIndex,
  onTestToggle,
  loadArtifact,
}) {
  if (!selectedSuite) {
    return (
      <Panel title="Detalhes" subtitle="Selecione uma suite à esquerda" style={styles.detailPanel}>
        <EmptyState
          title="Nenhuma suite selecionada"
          description="Clique em um card à esquerda para ver prints e etapas."
          compact
        />
      </Panel>
    );
  }

  const tests = Array.isArray(selectedSuite.tests) ? selectedSuite.tests : [];

  return (
    <Panel
      title={selectedSuite.displayName}
      subtitle={`${selectedSuite.typeDisplayName || selectedSuite.type} · ${selectedSuite.testsCount || tests.length} teste(s) · ${selectedSuite.failedCount || 0} falha(s)`}
      style={styles.detailPanel}
    >
      <View style={styles.detailContent}>
        <View style={styles.testList}>
          {tests.map((test, index) => (
            <TestAccordion
              key={`${selectedSuite.suiteId}-${test.title}-${index}`}
              test={test}
              expanded={selectedTestIndex === index}
              onToggle={() => onTestToggle(index)}
              loadArtifact={loadArtifact}
            />
          ))}
        </View>
      </View>
    </Panel>
  );
}
