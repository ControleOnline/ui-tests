import { StyleSheet } from 'react-native';

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
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
  },
  headerCardStack: {
    flexDirection: 'column',
  },
  headerMain: {
    flex: 1.6,
    gap: 12,
  },
  headerSide: {
    flex: 0.9,
    minWidth: 260,
    gap: 14,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerEyebrowText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 760,
  },
  headerMessage: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 23,
  },
  headerMessageError: {
    color: '#fda4af',
    fontSize: 15,
    lineHeight: 23,
  },
  headerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  headerStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
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
  metricMiniRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#7dd3fc',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 168,
  },
  actionButtonAlt: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.20)',
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonLabel: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  actionButtonLabelAlt: {
    color: '#e2e8f0',
  },
  actionMessage: {
    color: '#7dd3fc',
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(125, 211, 252, 0.10)',
  },
  actionMessageError: {
    color: '#fda4af',
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 113, 133, 0.10)',
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
  sidebarColumn: {
    flex: 0.92,
    gap: 16,
    position: 'sticky',
    top: 16,
    alignSelf: 'flex-start',
    maxHeight: 'calc(100vh - 48px)',
    overflowY: 'auto',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
  },
  tabButtonActive: {
    borderColor: 'rgba(125, 211, 252, 0.45)',
    backgroundColor: 'rgba(8, 47, 73, 0.45)',
  },
  tabButtonLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  tabButtonLabelActive: {
    color: '#e0f2fe',
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    backgroundColor: 'rgba(2, 6, 23, 0.35)',
  },
  filterChipActive: {
    borderColor: 'rgba(251, 113, 133, 0.55)',
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
  },
  filterChipLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipLabelActive: {
    color: '#fecdd3',
  },
  contentColumn: {
    flex: 1.28,
    gap: 16,
  },
  panel: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    gap: 18,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  panelHeading: {
    flex: 1,
    gap: 6,
  },
  panelTitle: {
    color: '#f8fafc',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  panelSubtitle: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  typePanel: {
    gap: 16,
  },
  typeList: {
    gap: 12,
  },
  typeCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(2, 6, 23, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    gap: 10,
  },
  typeCardSelected: {
    borderColor: 'rgba(125, 211, 252, 0.38)',
    backgroundColor: 'rgba(8, 47, 73, 0.28)',
  },
  typeCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeCardHeading: {
    flex: 1,
    gap: 6,
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
    lineHeight: 18,
    fontWeight: '700',
  },
  typeProgressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
  typeProgressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#7dd3fc',
  },
  typeDescription: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  tablePanel: {
    gap: 14,
  },
  tableHint: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
  },
  tableShell: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  selectedTableRow: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  badgeIdle: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  badgeSubtle: {
    opacity: 0.92,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeTextSuccess: {
    color: '#4ade80',
  },
  badgeTextDanger: {
    color: '#fb7185',
  },
  badgeTextIdle: {
    color: '#cbd5e1',
  },
  pressed: {
    opacity: 0.82,
  },
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(148, 163, 184, 0.20)',
    alignItems: 'center',
    gap: 6,
  },
  emptyStateCompact: {
    paddingVertical: 18,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  splitLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    width: '100%',
  },
  splitLayoutStack: {
    flexDirection: 'column',
  },
  splitList: {
    flex: 1.15,
    minWidth: 0,
  },
  splitDetails: {
    flex: 1,
    minWidth: 0,
    position: 'sticky',
    top: 16,
    alignSelf: 'flex-start',
    maxHeight: 'calc(100vh - 120px)',
    overflow: 'auto',
  },
});

export default styles;
