import { ContactPicker, SelectedContact } from '@/components/ContactPicker';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { KPI, useAppData } from '@/context/AppDataContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

function kpiContribution(kpi: KPI, actuals: Record<string, string>): number {
  const actualValue = parseFloat(actuals[kpi.id] || '0');
  const safeActual = isNaN(actualValue) ? 0 : actualValue;
  let kpiScore = 0;
  if (kpi.target > 0) {
    kpiScore = (safeActual / kpi.target) * kpi.weight;
  }
  if (kpiScore > kpi.weight) kpiScore = kpi.weight;
  return kpiScore;
}

function statusForScore(score: number) {
  if (score >= 80) return { label: 'Strong', color: '#34d399', barColor: '#10b981' };
  if (score >= 50) return { label: 'Stable', color: '#fbbf24', barColor: '#f59e0b' };
  return { label: 'Needs Attention', color: '#fb7185', barColor: '#f43f5e' };
}

export default function CategoryDetailScreen() {
  const { categories, kpis, subtasks, subtaskLogs, latestActuals, entries, toggleSubtaskLog, addPeopleTodo, deletePeopleTodo, getPeopleTodosForKpi } = useAppData();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showPeopleTodoForm, setShowPeopleTodoForm] = useState(false);
  const [selectedKpiForContact, setSelectedKpiForContact] = useState<string | null>(null);
  const [selectedContactForTodo, setSelectedContactForTodo] = useState<SelectedContact | null>(null);
  const [peopleTodoActivityType, setPeopleTodoActivityType] = useState<'Meet' | 'Call' | 'Message' | 'Date' | 'Other'>('Meet');
  const [peopleTodoFrequency, setPeopleTodoFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('weekly');
  const [peopleTodoTargetCount, setPeopleTodoTargetCount] = useState('1');

  const categoryName =
    typeof params.categoryName === 'string'
      ? decodeURIComponent(params.categoryName).trim()
      : '';

  const today = new Date().toISOString().split('T')[0];

  const isSocialCategory = useMemo(() => {
    const lowerName = categoryName.toLowerCase();
    return lowerName.includes('social') || lowerName.includes('people') || lowerName.includes('relationship');
  }, [categoryName]);

  const handleAddContact = (kpiId: string) => {
    setSelectedKpiForContact(kpiId);
    setShowContactPicker(true);
  };

  const handleContactSelected = (contact: SelectedContact) => {
    setShowContactPicker(false);
    setSelectedContactForTodo(contact);
    setShowPeopleTodoForm(true);
  };

  const handleDismissContactPicker = () => {
    setShowContactPicker(false);
    setSelectedKpiForContact(null);
  };

  const handleCancelPeopleTodo = () => {
    setShowPeopleTodoForm(false);
    setSelectedContactForTodo(null);
    setSelectedKpiForContact(null);
    setPeopleTodoActivityType('Meet');
    setPeopleTodoFrequency('weekly');
    setPeopleTodoTargetCount('1');
  };

  const handleSavePeopleTodo = () => {
    if (!selectedKpiForContact || !selectedContactForTodo) return;

    const targetCount = parseInt(peopleTodoTargetCount, 10);
    addPeopleTodo({
      kpiId: selectedKpiForContact,
      name: selectedContactForTodo.name,
      frequency: peopleTodoFrequency,
      targetCount: Number.isNaN(targetCount) || targetCount <= 0 ? 1 : targetCount,
      type: 'people',
      contactId: selectedContactForTodo.id,
      contactName: selectedContactForTodo.name,
      contactPhone: selectedContactForTodo.phoneNumber,
      contactEmail: selectedContactForTodo.email,
      activityType: peopleTodoActivityType,
    });

    setShowPeopleTodoForm(false);
    setSelectedContactForTodo(null);
    setSelectedKpiForContact(null);
    setPeopleTodoActivityType('Meet');
    setPeopleTodoFrequency('weekly');
    setPeopleTodoTargetCount('1');
  };

  const category = useMemo(
    () => categories.find((item) => item.name.toLowerCase() === categoryName.toLowerCase()),
    [categories, categoryName]
  );

  const categoryKpis = useMemo(
    () => kpis.filter((kpi) => category !== undefined && kpi.category === category.name),
    [kpis, category]
  );

  const categoryScore = useMemo(() => {
    if (categoryKpis.length === 0) return 0;
    const totalWeight = categoryKpis.reduce((sum, kpi) => sum + kpi.weight, 0);
    const achieved = categoryKpis.reduce((sum, kpi) => sum + kpiContribution(kpi, latestActuals), 0);
    return totalWeight > 0 ? Math.round((achieved / totalWeight) * 100) : 0;
  }, [categoryKpis, latestActuals]);

  const categoryTodoProgress = useMemo(() => {
    const allSubtasks = categoryKpis.flatMap(kpi => subtasks.filter(s => s.kpiId === kpi.id));
    const completed = allSubtasks.filter(subtask =>
      subtaskLogs.some(log => log.subtaskId === subtask.id && log.date === today && log.completed)
    ).length;
    const total = allSubtasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [categoryKpis, subtasks, subtaskLogs, today]);

  const status = statusForScore(categoryScore);

  if (!categoryName || !category) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <PageContainer>
            <EmptyState
              title="Category not found"
              message="Choose a category from the dashboard or add a new one."
            />
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.backButtonText}>Return to Home</Text>
            </TouchableOpacity>
          </PageContainer>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageContainer>
          <View style={styles.headerRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.title}>{category.name}</Text>
              <Text style={styles.subtitle}>Only KPIs and subtasks for this category</Text>
            </View>
            <TouchableOpacity style={styles.backButtonCompact} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.backButtonText}>Home</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Category score</Text>
            <Text style={[styles.summaryScore, { color: status.color }]}>{categoryScore} / 100</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, categoryScore))}%`, backgroundColor: status.barColor }]} />
            </View>
            <Text style={styles.statusLabel}>{status.label}</Text>
            <Text style={styles.detailLine}>Tracked days: {entries.length}</Text>
            <Text style={styles.detailLine}>KPIs in category: {categoryKpis.length}</Text>
            <Text style={styles.detailLine}>To-dos completed today: {categoryTodoProgress.completed} / {categoryTodoProgress.total} ({categoryTodoProgress.percent}%)</Text>
          </View>

          {categoryKpis.length === 0 ? (
            <EmptyState
              title="No KPIs yet"
              message="Add KPIs to this category in the KPIs tab and return to see them here."
            />
          ) : (
            categoryKpis.map((kpi) => {
              const latestActual = latestActuals[kpi.id];
              const kpiScore = Math.round(kpiContribution(kpi, latestActuals));
              const kpiSubtasks = subtasks.filter((subtask) => subtask.kpiId === kpi.id);
              const completedCount = kpiSubtasks.filter(subtask => subtaskLogs.some(log => log.subtaskId === subtask.id && log.date === today && log.completed)).length;
              const totalCount = kpiSubtasks.length;
              const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const kpiPeopleTodos = getPeopleTodosForKpi(kpi.id);

              return (
                <View key={kpi.id} style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={styles.kpiName}>{kpi.name}</Text>
                    <Text style={[styles.kpiScore, { color: status.color }]}>{kpiScore} / {kpi.weight}</Text>
                  </View>
                  <View style={styles.kpiMetaRow}>
                    <Text style={styles.kpiMeta}>Target: {kpi.target} {kpi.unit}</Text>
                    <Text style={styles.kpiMeta}>Weight: {kpi.weight}</Text>
                  </View>
                  <Text style={styles.kpiMeta}>Latest actual: {latestActual ? `${latestActual} ${kpi.unit}` : 'Not set'}</Text>
                  {kpiSubtasks.length > 0 && (
                    <View style={styles.todoProgress}>
                      <Text style={styles.todoProgressText}>
                        To-dos: {completedCount} / {totalCount} ({percent}%)
                      </Text>
                      <View style={styles.todoProgressTrack}>
                        <View style={[styles.todoProgressFill, { width: `${percent}%` }]} />
                      </View>
                    </View>
                  )}
                  {kpiSubtasks.length > 0 ? (
                    <View style={styles.subtaskSection}>
                      <Text style={styles.subtaskTitle}>To-dos</Text>
                      {kpiSubtasks.map((subtask) => {
                        const isCompleted = subtaskLogs.some(
                          (log) => log.subtaskId === subtask.id && log.date === today && log.completed
                        );
                        return (
                          <View key={subtask.id} style={styles.subtaskRow}>
                            <TouchableOpacity
                              onPress={() => toggleSubtaskLog(subtask.id, today)}
                              style={styles.checkbox}
                            >
                              <Text style={styles.checkboxText}>{isCompleted ? '☑' : '☐'}</Text>
                            </TouchableOpacity>
                            <View style={styles.subtaskTextBlock}>
                              <Text style={[styles.subtaskText, isCompleted && styles.completedText]}>
                                {subtask.name}
                              </Text>
                              <Text style={styles.subtaskHint}>{subtask.frequency}, target {subtask.targetCount}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.noSubtasks}>No To-dos yet</Text>
                  )}
                  {isSocialCategory && (
                    <View style={styles.peopleTodoSection}>
                      <Text style={styles.peopleTodoTitle}>People To-dos</Text>
                      {kpiPeopleTodos.length > 0 ? (
                        kpiPeopleTodos.map((todo) => (
                          <View key={todo.id} style={styles.peopleTodoRow}>
                            <View style={styles.peopleTodoMain}>
                              <Text style={styles.peopleTodoName}>{todo.contactName}</Text>
                              <Text style={styles.peopleTodoMeta}>
                                {todo.activityType} · {todo.frequency} · target {todo.targetCount}
                              </Text>
                              {(todo.contactPhone || todo.contactEmail) && (
                                <Text style={styles.peopleTodoContact}>{todo.contactPhone || ''}{todo.contactPhone && todo.contactEmail ? ' • ' : ''}{todo.contactEmail || ''}</Text>
                              )}
                            </View>
                            <TouchableOpacity
                              onPress={() => deletePeopleTodo(todo.id)}
                              style={styles.removeContactButton}
                            >
                              <Text style={styles.removeContactText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noPeopleTodos}>No People To-dos yet</Text>
                      )}
                      <TouchableOpacity
                        style={styles.addContactButton}
                        onPress={() => handleAddContact(kpi.id)}
                      >
                        <Text style={styles.addContactText}>+ Add People To-do</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </PageContainer>
      </ScrollView>
      {showPeopleTodoForm && selectedContactForTodo && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add People To-do</Text>
              <TouchableOpacity onPress={handleCancelPeopleTodo}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Contact</Text>
            <Text style={styles.modalText}>{selectedContactForTodo.name}</Text>
            {selectedContactForTodo.phoneNumber ? (
              <Text style={styles.modalText}>{selectedContactForTodo.phoneNumber}</Text>
            ) : null}
            {selectedContactForTodo.email ? (
              <Text style={styles.modalText}>{selectedContactForTodo.email}</Text>
            ) : null}

            <Text style={styles.modalLabel}>Activity type</Text>
            <View style={styles.optionRow}>
              {['Meet', 'Call', 'Message', 'Date', 'Other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    peopleTodoActivityType === type && styles.optionButtonActive,
                  ]}
                  onPress={() => setPeopleTodoActivityType(type as any)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      peopleTodoActivityType === type && styles.optionButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Frequency</Text>
            <View style={styles.optionRow}>
              {['weekly', 'monthly', 'quarterly', 'yearly'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.optionButton,
                    peopleTodoFrequency === freq && styles.optionButtonActive,
                  ]}
                  onPress={() => setPeopleTodoFrequency(freq as any)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      peopleTodoFrequency === freq && styles.optionButtonTextActive,
                    ]}
                  >
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Target count</Text>
            <TextInput
              style={styles.input}
              value={peopleTodoTargetCount}
              onChangeText={setPeopleTodoTargetCount}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#64748b"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSavePeopleTodo}>
              <Text style={styles.saveButtonText}>Save To-do</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={handleCancelPeopleTodo}>
              <Text style={styles.dismissButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {showContactPicker && (
        <ContactPicker
          onContactSelected={handleContactSelected}
          onDismiss={handleDismissContactPicker}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  content: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  backButton: {
    marginTop: 24,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1d2939',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonCompact: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 18,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  summaryScore: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 10,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
  },
  detailLine: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 2,
  },
  kpiCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  kpiName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    flex: 1,
    marginRight: 12,
  },
  kpiScore: {
    fontSize: 16,
    fontWeight: '900',
  },
  kpiMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  kpiMeta: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  subtaskSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  subtaskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  subtaskRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  subtaskBullet: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  subtaskTextBlock: {
    flex: 1,
  },
  subtaskText: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '600',
  },
  subtaskHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  checkbox: {
    padding: 4,
  },
  checkboxText: {
    fontSize: 16,
    color: '#f8fafc',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  todoProgress: {
    marginTop: 12,
  },
  todoProgressText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  todoProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  todoProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
  noSubtasks: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 13,
  },
  peopleTodoSection: {
    marginTop: 16,
  },
  peopleTodoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  peopleTodoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  peopleTodoMain: {
    flex: 1,
    paddingRight: 8,
  },
  peopleTodoName: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 4,
  },
  peopleTodoMeta: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  peopleTodoContact: {
    fontSize: 13,
    color: '#94a3b8',
  },
  noPeopleTodos: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  contactsSection: {
    marginTop: 16,
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '500',
  },
  contactDetail: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  removeContactButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeContactText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
  },
  modalClose: {
    fontSize: 22,
    color: '#94a3b8',
  },
  modalLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalText: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
  },
  optionButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  optionButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#111827',
    color: '#f8fafc',
    marginBottom: 16,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  dismissButton: {
    margin: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 14,
  },
  addContactButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addContactText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});