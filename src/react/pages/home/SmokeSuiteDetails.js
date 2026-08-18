import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Image, Text, View} from 'react-native';
import {
  getFriendlyError,
  listTestArtifacts,
  statusLabel,
  statusTone,
} from './SmokeDashboard.helpers';
import styles from './SmokeSuiteDetails.styles';

function Badge({tone, label}) {
  return (
    <View
      style={[
        styles.badge,
        tone === 'success' && styles.badgeSuccess,
        tone === 'danger' && styles.badgeDanger,
        tone === 'idle' && styles.badgeIdle,
        styles.badgeSubtle,
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

  const isImage =
    artifact?.kind === 'image' ||
    /screenshot|image|png|jpg|jpeg|webp/i.test(String(artifact?.label || ''));

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
    return null;
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

/** One test phase — always open: summary + prints + steps */
function TestPhase({test, loadArtifact}) {
  const artifacts = listTestArtifacts(test);
  const steps = Array.isArray(test?.steps) ? test.steps : [];
  const failed = test?.status === 'failed';

  return (
    <View style={[styles.phaseCard, failed && styles.phaseCardFailed]}>
      <View style={styles.phaseHeader}>
        <View style={styles.phaseTitleWrap}>
          <Text style={styles.phaseTitle}>{test?.title || 'Teste'}</Text>
          <Badge tone={statusTone(test?.status)} label={statusLabel(test?.status)} />
        </View>
        <Text style={styles.phaseMeta}>
          {artifacts.length} print{artifacts.length === 1 ? '' : 's'}
          {steps.length ? ` · ${steps.length} etapa${steps.length === 1 ? '' : 's'}` : ''}
        </Text>
      </View>

      {test?.error ? <Text style={styles.phaseError}>{test.error}</Text> : null}

      {artifacts.length > 0 ? (
        <PrintTimeline artifacts={artifacts} loadArtifact={loadArtifact} />
      ) : (
        <Text style={styles.sectionEmptyText}>Sem prints neste teste.</Text>
      )}

      {steps.length > 0 ? (
        <View style={styles.stepList}>
          {steps.map((step, index) => {
            const shots = Array.isArray(step?.screenshots) ? step.screenshots : [];
            return (
              <View key={`${test?.title}-step-${index}`} style={styles.stepCard}>
                <View style={styles.stepCardHeader}>
                  <Text style={styles.stepTitle}>{step?.title || `Etapa ${index + 1}`}</Text>
                  <Badge tone={statusTone(step?.status)} label={statusLabel(step?.status)} />
                </View>
                {step?.error ? <Text style={styles.stepError}>{step.error}</Text> : null}
                {shots.length > 0 ? (
                  <PrintTimeline artifacts={shots} loadArtifact={loadArtifact} />
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Body of an open suite accordion: all tests already expanded as phases.
 */
export default function SmokeSuiteDetails({selectedSuite, loadArtifact}) {
  if (!selectedSuite) {
    return null;
  }

  const tests = Array.isArray(selectedSuite.tests) ? selectedSuite.tests : [];

  if (tests.length === 0) {
    return (
      <View style={styles.suiteBody}>
        <Text style={styles.sectionEmptyText}>Esta suite não publicou testes.</Text>
      </View>
    );
  }

  // Failed tests first for scanability
  const ordered = [...tests].sort((a, b) => {
    const af = a?.status === 'failed' ? 0 : 1;
    const bf = b?.status === 'failed' ? 0 : 1;
    return af - bf;
  });

  return (
    <View style={styles.suiteBody}>
      {ordered.map((test, index) => (
        <TestPhase
          key={`${selectedSuite.suiteId}-${test?.title}-${index}`}
          test={test}
          loadArtifact={loadArtifact}
        />
      ))}
    </View>
  );
}
