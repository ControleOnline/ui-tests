import React from 'react';
import {Pressable, Text, View} from 'react-native';

export function SmokeTabs({activeTab, smokeCount, otherCount, onChange, styles}) {
  return (
    <View style={styles.tabsRow}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('smoke')}
        style={[styles.tabChip, activeTab === 'smoke' && styles.tabChipActive]}
      >
        <Text style={[styles.tabChipText, activeTab === 'smoke' && styles.tabChipTextActive]}>
          Smoke ({smokeCount})
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('others')}
        style={[styles.tabChip, activeTab === 'others' && styles.tabChipActive]}
      >
        <Text style={[styles.tabChipText, activeTab === 'others' && styles.tabChipTextActive]}>
          Demais testes ({otherCount})
        </Text>
      </Pressable>
    </View>
  );
}

export function StatusFilterChips({statusFilter, onChange, styles}) {
  return (
    <View style={styles.filterChipsRow}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('failed')}
        style={[styles.filterChip, statusFilter === 'failed' && styles.filterChipDanger]}
      >
        <Text
          style={[styles.filterChipText, statusFilter === 'failed' && styles.filterChipTextActive]}
        >
          Só falhas
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('all')}
        style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
      >
        <Text
          style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}
        >
          Lista completa
        </Text>
      </Pressable>
    </View>
  );
}

export function isSmokeType(type) {
  const key = String(type || '').toLowerCase();
  return key.includes('smoke') || key.includes('browser-smoke');
}

export function sortSuitesFailedFirst(suites) {
  return [...(suites || [])].sort((a, b) => {
    const af = a?.status === 'failed' || (a?.failedCount || 0) > 0 ? 0 : 1;
    const bf = b?.status === 'failed' || (b?.failedCount || 0) > 0 ? 0 : 1;
    if (af !== bf) return af - bf;
    return String(a?.displayName || '').localeCompare(String(b?.displayName || ''));
  });
}

/** Thin premium suite row — entire surface is pressable */
export function SuiteCard({item, openRow, selected, styles, statusLabel, statusTone}) {
  const failed = item?.status === 'failed' || (item?.failedCount || 0) > 0;
  const tone = statusTone?.(item?.status) || (failed ? 'danger' : 'success');
  const label = statusLabel?.(item?.status) || (failed ? 'Falhou' : 'Passou');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (typeof openRow === 'function') openRow();
      }}
      style={({pressed}) => [
        styles.suiteCard,
        selected && styles.suiteCardSelected,
        failed && styles.suiteCardFailed,
        pressed && styles.suiteCardPressed,
      ]}
    >
      <View
        style={[
          styles.suiteCardAccent,
          failed ? styles.suiteCardAccentDanger : styles.suiteCardAccentOk,
        ]}
      />
      <View style={styles.suiteCardMain}>
        <Text style={styles.suiteCardTitle} numberOfLines={1}>
          {item?.displayName || item?.suitePath || 'Suite'}
        </Text>
        <Text style={styles.suiteCardPath} numberOfLines={1}>
          {item?.suitePath || '—'}
        </Text>
      </View>
      <View style={styles.suiteCardMeta}>
        <View
          style={[
            styles.suiteCardBadge,
            tone === 'danger' && styles.suiteCardBadgeDanger,
            tone === 'success' && styles.suiteCardBadgeSuccess,
          ]}
        >
          <Text
            style={[
              styles.suiteCardBadgeText,
              tone === 'danger' && styles.suiteCardBadgeTextDanger,
              tone === 'success' && styles.suiteCardBadgeTextSuccess,
            ]}
          >
            {label}
          </Text>
        </View>
        <Text style={styles.suiteCardCounts}>
          {(item?.failedCount || 0) > 0
            ? `${item.failedCount} falha · ${item?.passedCount || 0}/${item?.testsCount || 0}`
            : `${item?.passedCount || 0}/${item?.testsCount || 0} ok`}
        </Text>
      </View>
    </Pressable>
  );
}
