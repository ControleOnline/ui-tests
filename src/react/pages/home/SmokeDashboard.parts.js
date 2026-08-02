import React from 'react';
import {ScrollView, Text, View} from 'react-native';

export function Badge({tone, label, styles}) {
  return (
    <View
      style={[
        styles.badge,
        tone === 'success' && styles.badgeSuccess,
        tone === 'danger' && styles.badgeDanger,
        tone === 'idle' && styles.badgeIdle,
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

export function MetricCard({label, value, description, tone, styles}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[
          styles.metricValue,
          tone === 'danger' && styles.metricValueDanger,
          tone === 'success' && styles.metricValueSuccess,
        ]}
      >
        {value}
      </Text>
      {description ? <Text style={styles.metricDescription}>{description}</Text> : null}
    </View>
  );
}

export function Panel({title, subtitle, action, children, style, styles}) {
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

export function EmptyState({title, description, compact = false, styles}) {
  return (
    <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

export function SmokeShell({children, styles}) {
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
