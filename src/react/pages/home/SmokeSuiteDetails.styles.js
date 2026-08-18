import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
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
  detailPanel: {
    flex: 1.28,
    gap: 18,
  },
  detailContent: {
    gap: 16,
  },
  testList: {
    gap: 12,
  },
  testCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(2, 6, 23, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    gap: 12,
  },
  testCardSelected: {
    borderColor: 'rgba(125, 211, 252, 0.30)',
    backgroundColor: 'rgba(8, 47, 73, 0.26)',
  },
  testCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  testAccordionHeaderText: {
    flex: 1,
    gap: 6,
  },
  testAccordionTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  testTitle: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  testMeta: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
  testAccordionToggle: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  testAccordionBody: {
    gap: 14,
  },
  testError: {
    color: '#fda4af',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHint: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionEmptyText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  artifactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  artifactButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    minWidth: 140,
    maxWidth: 220,
    gap: 2,
  },
  artifactButtonSelected: {
    borderColor: 'rgba(125, 211, 252, 0.38)',
    backgroundColor: 'rgba(8, 47, 73, 0.30)',
  },
  artifactButtonLabel: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  artifactButtonMeta: {
    color: '#94a3b8',
    fontSize: 11,
  },
  previewSection: {
    gap: 10,
  },
  previewBox: {
    minHeight: 180,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(2, 6, 23, 0.36)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  previewTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: 14,
  },
  stepList: {
    gap: 10,
  },
  stepCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    gap: 10,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  stepTitleWrap: {
    flex: 1,
    gap: 6,
  },
  stepTitle: {
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  stepError: {
    color: '#fda4af',
    fontSize: 12,
    lineHeight: 18,
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

  timeline: {
    gap: 0,
    marginTop: 6,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    minHeight: 48,
  },
  timelineRail: {
    width: 14,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#38bdf8',
    marginTop: 4,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.22)',
    marginTop: 4,
    marginBottom: 0,
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 16,
    gap: 8,
  },
  timelineLabel: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timelineMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  timelineError: {
    color: '#fda4af',
    fontSize: 12,
  },
  timelinePlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  timelineImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
});

export default styles;
