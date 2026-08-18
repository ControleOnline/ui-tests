import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

export function SmokeTabs({activeTab, smokeCount, otherCount, onChange, styles}) {
  return (
    <View style={styles.tabRow}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => onChange('smoke')}
        style={[styles.tabButton, activeTab === 'smoke' && styles.tabButtonActive]}
      >
        <Text style={[styles.tabButtonLabel, activeTab === 'smoke' && styles.tabButtonLabelActive]}>
          Smoke{smokeCount ? ` (${smokeCount})` : ''}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => onChange('others')}
        style={[styles.tabButton, activeTab === 'others' && styles.tabButtonActive]}
      >
        <Text style={[styles.tabButtonLabel, activeTab === 'others' && styles.tabButtonLabelActive]}>
          Demais testes{otherCount ? ` (${otherCount})` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function StatusFilterChips({statusFilter, onChange, styles}) {
  return (
    <View style={styles.filterChipRow}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => onChange('failed')}
        style={[styles.filterChip, statusFilter === 'failed' && styles.filterChipActive]}
      >
        <Text style={[styles.filterChipLabel, statusFilter === 'failed' && styles.filterChipLabelActive]}>
          Só falhas
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => onChange('all')}
        style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
      >
        <Text style={[styles.filterChipLabel, statusFilter === 'all' && styles.filterChipLabelActive]}>
          Lista completa
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function sortSuitesFailedFirst(suites, statusFilter) {
  const sorted = [...(suites || [])].sort((a, b) => {
    const aFailed = a.status === 'failed' || (a.failedCount || 0) > 0 ? 0 : 1;
    const bFailed = b.status === 'failed' || (b.failedCount || 0) > 0 ? 0 : 1;
    if (aFailed !== bFailed) return aFailed - bFailed;
    return String(a.displayName || '').localeCompare(String(b.displayName || ''));
  });
  if (statusFilter === 'failed') {
    const onlyFailed = sorted.filter(
      (suite) => suite.status === 'failed' || (suite.failedCount || 0) > 0,
    );
    return onlyFailed.length > 0 ? onlyFailed : sorted;
  }
  return sorted;
}

export function isSmokeType(typeKey) {
  const key = String(typeKey || '');
  return key === 'browser-smoke' || key.includes('smoke');
}


export function TypeSectionList({sections, selectedType, onSelect, emptyTitle, emptyDescription, Badge, EmptyState, statusTone, statusLabel, styles}) {
  if (!sections || sections.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} compact styles={styles} />;
  }
  return (
    <View style={styles.typeList}>
      {sections.map((type) => (
        <TouchableOpacity
          key={type.type}
          accessibilityRole="button"
          accessibilityLabel={type.displayName}
          onPress={() => onSelect(type)}
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
  );
}
