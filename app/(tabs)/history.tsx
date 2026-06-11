import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CHART_INNER_HEIGHT = 120;

type HistoryEntryItem = {
  id: string;
  kpiId: string;
  kpiName: string;
  category: string;
  unit: string;
  date: string;
  actual: string;
  notes: string;
  totalScore: number;
};

type EditorMode = 'edit' | 'duplicate';

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function HistoryScreen() {
  const { entries, kpis, updateEntry, deleteEntry, duplicateEntry } = useAppData();
  const { theme } = useTheme();
  const deviceType = useDeviceType();

  const [actionEntry, setActionEntry] = useState<HistoryEntryItem | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [editorEntry, setEditorEntry] = useState<HistoryEntryItem | null>(null);
  const [editorDate, setEditorDate] = useState('');
  const [editorActual, setEditorActual] = useState('');
  const [editorNotes, setEditorNotes] = useState('');
  const [editorError, setEditorError] = useState('');
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<HistoryEntryItem | null>(null);

  const entryItems = useMemo<HistoryEntryItem[]>(() => {
    const kpiMap = new Map(kpis.map((kpi) => [kpi.id, kpi]));

    return entries
      .flatMap((dayEntry) =>
        Object.entries(dayEntry.actuals)
          .filter(([, actual]) => actual !== '')
          .map(([kpiId, actual]) => {
            const kpi = kpiMap.get(kpiId);
            return {
              id: `${dayEntry.date}::${kpiId}`,
              kpiId,
              kpiName: kpi?.name ?? 'Unknown KPI',
              category: kpi?.category ?? 'Unknown category',
              unit: kpi?.unit ?? '',
              date: dayEntry.date,
              actual,
              notes: dayEntry.notes?.[kpiId] ?? '',
              totalScore: dayEntry.totalScore,
            };
          })
      )
      .sort((a, b) => b.date.localeCompare(a.date) || a.kpiName.localeCompare(b.kpiName));
  }, [entries, kpis]);

  const lastSevenChronological = useMemo(() => {
    const ascending = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    return ascending.slice(-7);
  }, [entries]);

  const openEditor = (mode: EditorMode, entry: HistoryEntryItem) => {
    setActionEntry(null);
    setConfirmDeleteEntry(null);
    setEditorMode(mode);
    setEditorEntry(entry);
    setEditorDate(mode === 'duplicate' ? todayYMD() : entry.date);
    setEditorActual(entry.actual);
    setEditorNotes(entry.notes);
    setEditorError('');
  };

  const closeEditor = () => {
    setEditorEntry(null);
    setEditorError('');
    setEditorDate('');
    setEditorActual('');
    setEditorNotes('');
  };

  const handleSaveEditor = () => {
    if (!editorEntry) return;

    const trimmedDate = editorDate.trim();
    const trimmedActual = editorActual.trim();
    const trimmedNotes = editorNotes.trim();

    if (!trimmedDate) {
      setEditorError('Please enter a date.');
      return;
    }
    if (!trimmedActual) {
      setEditorError('Please enter an actual value.');
      return;
    }
    if (Number.isNaN(parseFloat(trimmedActual))) {
      setEditorError('Actual value must be numeric.');
      return;
    }

    const result =
      editorMode === 'edit'
        ? updateEntry(editorEntry.id, {
            date: trimmedDate,
            actual: trimmedActual,
            notes: trimmedNotes,
          })
        : duplicateEntry(editorEntry.id, {
            date: trimmedDate,
            actual: trimmedActual,
            notes: trimmedNotes,
          });

    if (!result.success) {
      setEditorError(result.error ?? 'Could not save this entry.');
      return;
    }

    closeEditor();
  };

  const handleDeleteConfirmed = () => {
    if (!confirmDeleteEntry) return;

    const result = deleteEntry(confirmDeleteEntry.id);
    if (!result.success) {
      setEditorError(result.error ?? 'Could not delete this entry.');
      return;
    }

    setConfirmDeleteEntry(null);
    setActionEntry(null);
    if (editorEntry?.id === confirmDeleteEntry.id) {
      closeEditor();
    }
  };

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="History"
          subtitle="Review, edit, duplicate, and delete KPI entries."
        />

        {entryItems.length === 0 ? (
          <EmptyState
            title="No History Yet"
            message="Start tracking your daily progress to see and manage entries here."
          />
        ) : (
          entryItems.map((entry) => (
            <SectionCard key={entry.id}>
              <TouchableOpacity
                style={styles.entryRow}
                activeOpacity={0.85}
                onLongPress={() => setActionEntry(entry)}
              >
                <View style={styles.entryMain}>
                  <Text style={[styles.entryTitle, { color: theme.textPrimary }]}>{entry.kpiName}</Text>
                  <Text style={[styles.entryMeta, { color: theme.textSecondary }]}>
                    {formatDisplayDate(entry.date)} • {entry.category}
                  </Text>
                  <Text style={[styles.entryValue, { color: theme.primary }]}>
                    {entry.actual} {entry.unit}
                  </Text>
                  {entry.notes ? (
                    <Text style={[styles.entryNotes, { color: theme.textMuted }]} numberOfLines={2}>
                      {entry.notes}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  accessibilityLabel="Entry actions"
                  style={[
                    styles.menuButton,
                    {
                      borderColor: theme.cardBorder,
                      backgroundColor: theme.buttonSecondary,
                      borderRadius: theme.borderRadius.sm,
                    },
                  ]}
                  onPress={() => setActionEntry(entry)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.menuButtonText, { color: theme.textPrimary }]}>⋮</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </SectionCard>
          ))
        )}

        <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>7-day score trend</Text>
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
                    <View
                      style={[
                        styles.chartTrack,
                        { height: CHART_INNER_HEIGHT, backgroundColor: theme.inputBackground },
                      ]}
                    >
                      <View
                        style={[
                          styles.chartBar,
                          { height: barHeight, backgroundColor: theme.buttonPrimary },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartDateLabel, { color: theme.textMuted }]} numberOfLines={1}>
                      {entry.date.slice(5)}
                    </Text>
                    <Text style={[styles.chartScoreLabel, { color: theme.textPrimary }]}>{entry.totalScore}</Text>
                  </View>
                );
              })}
            </View>
          </SectionCard>
        )}

        <Modal
          visible={actionEntry !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActionEntry(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setActionEntry(null)}
            />
            <View
              style={[
                styles.actionCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
            >
              <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>Entry Actions</Text>
              <TouchableOpacity style={styles.actionItem} onPress={() => actionEntry && openEditor('edit', actionEntry)}>
                <Text style={[styles.actionText, { color: theme.textPrimary }]}>Edit Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem} onPress={() => actionEntry && openEditor('duplicate', actionEntry)}>
                <Text style={[styles.actionText, { color: theme.textPrimary }]}>Duplicate Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  setConfirmDeleteEntry(actionEntry);
                  setActionEntry(null);
                }}>
                <Text style={[styles.actionText, { color: theme.danger }]}>Delete Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem} onPress={() => setActionEntry(null)}>
                <Text style={[styles.actionText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={editorEntry !== null}
          transparent
          animationType="fade"
          onRequestClose={closeEditor}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeEditor} />
            <View
              style={[
                styles.editorCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.xl,
                },
              ]}
            >
              {editorEntry ? (
                <>
                  <Text style={[styles.editorTitle, { color: theme.textPrimary }]}>
                    {editorMode === 'edit' ? 'Edit Entry' : 'Duplicate Entry'}
                  </Text>
                  <ScrollView style={styles.editorScroll} keyboardShouldPersistTaps="handled">
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>KPI Name</Text>
                    <View
                      style={[
                        styles.readOnlyField,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.cardBorder,
                          borderRadius: theme.borderRadius.md,
                        },
                      ]}
                    >
                      <Text style={[styles.readOnlyText, { color: theme.textPrimary }]}>
                        {editorEntry.kpiName}
                      </Text>
                    </View>

                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Date</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.cardBorder,
                          borderRadius: theme.borderRadius.md,
                          color: theme.textPrimary,
                        },
                      ]}
                      value={editorDate}
                      onChangeText={setEditorDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.textMuted}
                    />

                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Actual Value</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.cardBorder,
                          borderRadius: theme.borderRadius.md,
                          color: theme.textPrimary,
                        },
                      ]}
                      value={editorActual}
                      onChangeText={setEditorActual}
                      keyboardType="numeric"
                      placeholder={`Enter actual (${editorEntry.unit})`}
                      placeholderTextColor={theme.textMuted}
                    />

                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Notes</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.notesInput,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.cardBorder,
                          borderRadius: theme.borderRadius.md,
                          color: theme.textPrimary,
                        },
                      ]}
                      value={editorNotes}
                      onChangeText={setEditorNotes}
                      multiline
                      placeholder="Optional notes"
                      placeholderTextColor={theme.textMuted}
                    />

                    {editorError ? (
                      <Text style={[styles.errorText, { color: theme.danger }]}>{editorError}</Text>
                    ) : null}
                  </ScrollView>

                  <View style={styles.editorActions}>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        {
                          backgroundColor: theme.buttonPrimary,
                          borderRadius: theme.borderRadius.md,
                        },
                      ]}
                      onPress={handleSaveEditor}
                    >
                      <Text style={styles.primaryButtonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        {
                          backgroundColor: theme.buttonSecondary,
                          borderColor: theme.cardBorder,
                          borderRadius: theme.borderRadius.md,
                        },
                      ]}
                      onPress={closeEditor}
                    >
                      <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Cancel</Text>
                    </TouchableOpacity>
                    {editorMode === 'edit' ? (
                      <TouchableOpacity
                        style={[
                          styles.secondaryButton,
                          {
                            backgroundColor: theme.buttonSecondary,
                            borderColor: theme.danger,
                            borderRadius: theme.borderRadius.md,
                          },
                        ]}
                        onPress={() => setConfirmDeleteEntry(editorEntry)}
                      >
                        <Text style={[styles.secondaryButtonText, { color: theme.danger }]}>Delete</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </Modal>

        <Modal
          visible={confirmDeleteEntry !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmDeleteEntry(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setConfirmDeleteEntry(null)}
            />
            <View
              style={[
                styles.confirmCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
            >
              <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>Delete Entry?</Text>
              <Text style={[styles.confirmText, { color: theme.textSecondary }]}>
                This will remove the entry and refresh scores, history, and Life Buddy automatically.
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: theme.buttonSecondary,
                      borderColor: theme.cardBorder,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={() => setConfirmDeleteEntry(null)}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.danger,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={handleDeleteConfirmed}
                >
                  <Text style={styles.primaryButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </PageContainer>
    </ScrollView>
  );

  if (deviceType === 'desktop') {
    return <DesktopShell title="History">{pageContent}</DesktopShell>;
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>{pageContent}</SafeAreaView>;
}

const styles = StyleSheet.create({
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  entryMain: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  entryMeta: {
    fontSize: 13,
    marginBottom: 6,
  },
  entryValue: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  entryNotes: {
    fontSize: 13,
    lineHeight: 19,
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: '800',
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  chartBar: {
    width: '100%',
    borderRadius: 10,
  },
  chartDateLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  chartScoreLabel: {
    fontSize: 12,
    fontWeight: '700',
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
  actionCard: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    paddingVertical: 10,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },
  actionItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  editorCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '84%',
    borderWidth: 1,
    padding: 18,
  },
  editorTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  editorScroll: {
    maxHeight: 420,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  readOnlyField: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  readOnlyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  editorActions: {
    marginTop: 14,
    gap: 10,
  },
  primaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    padding: 18,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
