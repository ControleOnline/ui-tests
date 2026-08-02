import React from 'react';
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

function Panel({title, subtitle, action, children, style}) {
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

function EmptyState({title, description, compact = false}) {
  return (
    <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function ArtifactButton({artifact, selected, onPress}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
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

function PreviewPane({preview, previewState, previewError}) {
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
        <Text style={styles.previewText}>{getFriendlyError(previewError, 'Falha ao carregar o artifact.')}</Text>
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
        source={{uri: preview.objectUrl}}
        style={styles.previewImage}
        resizeMode="contain"
      />
    </View>
  );
}

function StepCard({step, onArtifactPress}) {
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
            <ArtifactButton
              key={`${artifact.url}-${artifact.label}`}
              artifact={artifact}
              onPress={() => onArtifactPress(artifact)}
            />
          ))}
        </View>
      ) : null}
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
            <PreviewPane
              preview={preview}
              previewState={previewState}
              previewError={previewError}
            />
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Etapas</Text>
              <Text style={styles.sectionHint}>
                {stepCount > 0 ? `${stepCount} etapa${stepCount === 1 ? '' : 's'}` : 'Sem etapas detalhadas'}
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

export default function SmokeSuiteDetails({
  preview,
  previewState,
  previewError,
  selectedSuite,
  selectedTestIndex,
  onArtifactPress,
  onTestToggle,
}) {
  if (!selectedSuite || Array.isArray(selectedSuite.tests) === false || selectedSuite.tests.length === 0) {
    return (
      <Panel
        title={selectedSuite ? selectedSuite.displayName : 'Detalhes'}
        subtitle={
          selectedSuite
            ? `${selectedSuite.typeDisplayName || selectedSuite.type} · sem testes publicados`
            : 'Escolha uma suite para ver os testes.'
        }
        style={styles.detailPanel}
      >
        <EmptyState
          title="Sem testes"
          description="A suite selecionada ainda não tem itens para mostrar."
          compact
        />
      </Panel>
    );
  }

  return (
    <Panel
      title={selectedSuite.displayName}
      subtitle={`${selectedSuite.typeDisplayName || selectedSuite.type} · ${selectedSuite.testsCount} teste${selectedSuite.testsCount === 1 ? '' : 's'} · ${selectedSuite.failedCount} falha${selectedSuite.failedCount === 1 ? '' : 's'}`}
      style={styles.detailPanel}
    >
      <View style={styles.detailContent}>
        <View style={styles.testList}>
          {selectedSuite.tests.map((test, index) => (
            <TestAccordion
              key={`${selectedSuite.suiteId}-${test.title}-${index}`}
              test={test}
              expanded={selectedTestIndex === index}
              onArtifactPress={onArtifactPress}
              onToggle={() => onTestToggle(index)}
              preview={preview}
              previewState={previewState}
              previewError={previewError}
            />
          ))}
        </View>
      </View>
    </Panel>
  );
}
