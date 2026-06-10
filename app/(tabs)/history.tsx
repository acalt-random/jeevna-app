import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { DayEntry, useAppData } from '@/context/AppDataContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/** Max height of the bar area (score 100 = full height). */
const CHART_INNER_HEIGHT = 120;

export default function HistoryScreen() {
  const { entries, kpis } = useAppData();
  const deviceType = useDeviceType();
  const [selectedEntry, setSelectedEntry] = useState<DayEntry | null>(null);

  const sortedNewestFirst = useMemo(() => {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  const sortedKpis = useMemo(() => {
    return [...kpis].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [kpis]);

  /** Up to 7 most recent days, oldest → newest (left → right on the chart). */
  const lastSevenChronological = useMemo(() => {
    const ascending = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    return ascending.slice(-7);
  }, [entries]);

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="History"
          subtitle="Review past daily entries and see your score trends."
        />
          {sortedNewestFirst.length === 0 ? (
            <EmptyState
              title="No History Yet"
              message="Start tracking your daily progress to see your history here."
            />
          ) : (
            sortedNewestFirst.map((entry) => (
              <SectionCard key={entry.id}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => setSelectedEntry(entry)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.date}>{entry.date}</Text>
                  <Text style={styles.score}>{entry.totalScore} / 100</Text>
                  <Text style={styles.rowHint}>Tap for details</Text>
                </TouchableOpacity>
              </SectionCard>
            ))
          )}

          <Text style={styles.chartTitle}>7-day score trend</Text>
          {lastSevenChronological.length === 0 ? (
            <EmptyState
              title="No Trend Data"
              message="Save daily entries to see your 7-day score trend."
            />
          ) : (
            <SectionCard style={styles.chartCard}>
              <View style={styles.chartRow}>
                {lastSevenChronological.map((entry) => {
                  const clamped = Math.max(0, Math.min(100, entry.totalScore));
                  const barHeight = (clamped / 100) * CHART_INNER_HEIGHT;
                  return (
                    <View key={entry.id} style={styles.chartColumn}>
                      <View style={[styles.chartTrack, { height: CHART_INNER_HEIGHT }]}>
                        <View style={[styles.chartBar, { height: barHeight }]} />
                      </View>
                      <Text style={styles.chartDateLabel} numberOfLines={1}>
                        {entry.date.slice(5)}
                      </Text>
                      <Text style={styles.chartScoreLabel}>{entry.totalScore}</Text>
                    </View>
                  );
                })}
              </View>
            </SectionCard>
          )}

          <Modal
            visible={selectedEntry !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedEntry(null)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setSelectedEntry(null)}
              />
              <View style={styles.modalCard}>
                {selectedEntry ? (
                  <>
                    <Text style={styles.modalTitle}>{selectedEntry.date}</Text>
                    <Text style={styles.modalScore}>
                      Total score: {selectedEntry.totalScore} / 100
                    </Text>
                    <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                      {sortedKpis.length === 0 ? (
                        <Text style={styles.modalMeta}>No KPIs defined.</Text>
                      ) : (
                        sortedKpis.map((kpi) => {
                          const raw = selectedEntry.actuals[kpi.id];
                          const hasActual = raw !== undefined && raw !== '';
                          return (
                            <View key={kpi.id} style={styles.detailBlock}>
                              <Text style={styles.detailName}>{kpi.name}</Text>
                              <Text style={styles.detailLine}>
                                Actual:{' '}
                                {hasActual ? `${raw} ${kpi.unit}` : '—'}
                              </Text>
                              <Text style={styles.detailLine}>
                                Target: {kpi.target} {kpi.unit}
                              </Text>
                              <Text style={styles.detailLine}>Category: {kpi.category}</Text>
                              <Text style={styles.detailLine}>Weight: {kpi.weight}</Text>
                            </View>
                          );
                        })
                      )}
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setSelectedEntry(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
          </Modal>
        </PageContainer>
      </ScrollView>
    );

  if (deviceType === 'desktop') {
    return (
      <DesktopShell title="History">
        {pageContent}
      </DesktopShell>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {pageContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  date: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  score: {
    fontSize: 15,
    fontWeight: '800',
    color: '#93c5fd',
  },
  rowHint: {
    fontSize: 12,
    color: '#64748b',
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: 8,
    marginBottom: 10,
  },
  chartCard: {
    paddingVertical: 18,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartTrack: {
    width: '100%',
    maxWidth: 32,
    justifyContent: 'flex-end',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  chartBar: {
    width: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 10,
  },
  chartDateLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  chartScoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  modalScore: {
    fontSize: 15,
    fontWeight: '600',
    color: '#93c5fd',
    marginBottom: 14,
  },
  modalScroll: {
    maxHeight: 360,
  },
  modalMeta: {
    fontSize: 15,
    color: '#94a3b8',
  },
  detailBlock: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 6,
  },
  detailLine: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 3,
  },
  closeButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
});
