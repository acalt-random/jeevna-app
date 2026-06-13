import { ActivityScheduleCard } from '@/components/ActivityScheduleCard';
import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveGrid, ResponsiveGridItem } from '@/components/ResponsiveGrid';
import { ScheduleActivityModal } from '@/components/ScheduleActivityModal';
import { SectionCard } from '@/components/SectionCard';
import { KPI, Subtask, SubtaskFrequency, useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActivitySchedule } from '@/types/schedule';

const FREQUENCY_OPTIONS: { label: string; value: SubtaskFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom', value: 'custom' },
];

interface SuggestionHelperCardProps {
  hasSuggestionParams: boolean;
  hasConfidentSuggestedCategory: boolean;
  suggestedActivity?: string;
  originalCommand?: string;
}

function SuggestionHelperCard({
  hasSuggestionParams,
  hasConfidentSuggestedCategory,
  suggestedActivity,
  originalCommand,
}: SuggestionHelperCardProps) {
  const { theme } = useTheme();

  if (!hasSuggestionParams) return null;

  return (
    <View
      style={[
        styles.suggestionCard,
        {
          backgroundColor: theme.secondaryBackground,
          borderColor: theme.cardBorder,
          borderRadius: theme.borderRadius.md,
        },
      ]}>
      <Text style={[styles.suggestionTitle, { color: theme.textPrimary }]}>
        Editing Life Buddy suggestion
      </Text>
      {originalCommand ? (
        <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>
          Original command: {originalCommand}
        </Text>
      ) : null}
      {!hasConfidentSuggestedCategory ? (
        <Text style={[styles.suggestionWarning, { color: theme.warning }]}>
          Life Buddy could not confidently choose a category. Please select one.
        </Text>
      ) : null}
      {suggestedActivity ? (
        <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>
          Suggested activity: {suggestedActivity}
        </Text>
      ) : null}
    </View>
  );
}

interface SubtaskRowProps {
  subtask: Subtask;
  onEdit: (subtask: Subtask) => void;
  onDelete: (id: string) => void;
  schedule?: ActivitySchedule;
  onSchedule: (subtask: Subtask) => void;
}

function SubtaskRow({ subtask, onEdit, onDelete, schedule, onSchedule }: SubtaskRowProps) {
  const { theme } = useTheme();

  return (
    <View style={[stStyles.row, { borderBottomColor: theme.cardBorder }]}>
      <View style={stStyles.info}>
        <Text style={[stStyles.name, { color: theme.textPrimary }]}>{subtask.name}</Text>
        <Text style={[stStyles.meta, { color: theme.textMuted }]}>
          {subtask.frequency} · {subtask.targetCount}x
        </Text>
        <ActivityScheduleCard schedule={schedule} onPress={() => onSchedule(subtask)} />
      </View>
      <View style={stStyles.actions}>
        <TouchableOpacity
          style={[
            stStyles.editBtn,
            { borderColor: theme.primary, backgroundColor: theme.buttonSecondary },
          ]}
          onPress={() => onEdit(subtask)}
          activeOpacity={0.7}>
          <Text style={[stStyles.editBtnText, { color: theme.primary }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            stStyles.deleteBtn,
            { borderColor: theme.danger, backgroundColor: theme.buttonSecondary },
          ]}
          onPress={() => onDelete(subtask.id)}
          activeOpacity={0.7}>
          <Text style={[stStyles.deleteBtnText, { color: theme.danger }]}>Del</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface SubtaskFormProps {
  kpiId: string;
  editingSubtask: Subtask | null;
  onDone: () => void;
}

function SubtaskForm({ kpiId, editingSubtask, onDone }: SubtaskFormProps) {
  const { addSubtask, updateSubtask } = useAppData();
  const { theme } = useTheme();
  const [name, setName] = useState(editingSubtask?.name ?? '');
  const [frequency, setFrequency] = useState<SubtaskFrequency>(
    editingSubtask?.frequency ?? 'daily'
  );
  const [targetCount, setTargetCount] = useState(
    editingSubtask ? String(editingSubtask.targetCount) : '1'
  );
  const [freqPickerOpen, setFreqPickerOpen] = useState(false);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const count = parseInt(targetCount, 10);
    const safeCount = Number.isNaN(count) || count < 1 ? 1 : count;

    if (editingSubtask) {
      updateSubtask({
        ...editingSubtask,
        name: trimmedName,
        frequency,
        targetCount: safeCount,
      });
    } else {
      addSubtask({ kpiId, name: trimmedName, frequency, targetCount: safeCount });
    }
    onDone();
  };

  const selectedFreqLabel =
    FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.label ?? 'Daily';

  return (
    <View
      style={[
        stStyles.form,
        {
          backgroundColor: theme.inputBackground,
          borderColor: theme.cardBorder,
          borderRadius: theme.borderRadius.md,
        },
      ]}>
      <TextInput
        style={[
          stStyles.input,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
            color: theme.textPrimary,
          },
        ]}
        value={name}
        onChangeText={setName}
        placeholder="Subtask name"
        placeholderTextColor={theme.textMuted}
        autoFocus
      />
      <TouchableOpacity
        style={[
          stStyles.freqButton,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
            borderRadius: theme.borderRadius.sm,
          },
        ]}
        onPress={() => setFreqPickerOpen(true)}
        activeOpacity={0.7}>
        <Text style={[stStyles.freqButtonText, { color: theme.textSecondary }]}>
          Frequency: {selectedFreqLabel}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={freqPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFreqPickerOpen(false)}>
        <View style={stStyles.modalOverlay}>
          <TouchableOpacity
            style={stStyles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setFreqPickerOpen(false)}
          />
          <View
            style={[
              stStyles.modalCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
              },
            ]}>
            <Text style={[stStyles.modalTitle, { color: theme.textPrimary }]}>Select frequency</Text>
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  stStyles.modalRow,
                  { borderBottomColor: theme.cardBorder },
                  frequency === option.value && [
                    stStyles.modalRowSelected,
                    { backgroundColor: theme.buttonSecondary },
                  ],
                ]}
                onPress={() => {
                  setFrequency(option.value);
                  setFreqPickerOpen(false);
                }}>
                <Text style={[stStyles.modalRowText, { color: theme.textPrimary }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <View style={stStyles.countRow}>
        <Text style={[stStyles.countLabel, { color: theme.textSecondary }]}>Target count</Text>
        <TextInput
          style={[
            stStyles.countInput,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
              color: theme.textPrimary,
            },
          ]}
          value={targetCount}
          onChangeText={setTargetCount}
          keyboardType="numeric"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={stStyles.formActions}>
        <TouchableOpacity
          style={[stStyles.saveBtn, { backgroundColor: theme.buttonPrimary }]}
          onPress={handleSave}
          activeOpacity={0.8}>
          <Text style={stStyles.saveBtnText}>{editingSubtask ? 'Save' : 'Add'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            stStyles.cancelBtn,
            {
              backgroundColor: theme.buttonSecondary,
              borderColor: theme.cardBorder,
            },
          ]}
          onPress={onDone}
          activeOpacity={0.7}>
          <Text style={[stStyles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SubtasksSection({ kpiId }: { kpiId: string }) {
  const {
    categories,
    kpis,
    subtasks,
    deleteSubtask,
    getActivitySchedule,
    addActivitySchedule,
    updateActivitySchedule,
    deleteActivitySchedule,
  } = useAppData();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<Subtask | null>(null);
  const kpiSubtasks = subtasks.filter((subtask) => subtask.kpiId === kpiId);
  const parentKpi = kpis.find((item) => item.id === kpiId);
  const parentCategory = categories.find((item) => item.name === parentKpi?.category);

  const handleEdit = (subtask: Subtask) => {
    setEditingSubtask(subtask);
    setShowForm(true);
    setExpanded(true);
  };

  const handleFormDone = () => {
    setShowForm(false);
    setEditingSubtask(null);
  };

  return (
    <View style={[stStyles.section, { borderTopColor: theme.cardBorder }]}>
      <TouchableOpacity
        style={stStyles.sectionHeader}
        onPress={() => {
          setExpanded((value) => !value);
          if (showForm) setShowForm(false);
        }}
        activeOpacity={0.7}>
        <Text style={[stStyles.sectionTitle, { color: theme.primary }]}>
          Subtasks{kpiSubtasks.length > 0 ? ` (${kpiSubtasks.length})` : ''}
        </Text>
        <Text style={stStyles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View>
          {kpiSubtasks.length === 0 && !showForm ? (
            <Text style={[stStyles.emptyText, { color: theme.textMuted }]}>
              No subtasks yet. Add one below.
            </Text>
          ) : (
            kpiSubtasks.map((subtask) => (
              <SubtaskRow
                key={subtask.id}
                subtask={subtask}
                onEdit={handleEdit}
                onDelete={deleteSubtask}
                schedule={getActivitySchedule(subtask.id)}
                onSchedule={setScheduleTarget}
              />
            ))
          )}

          {showForm ? (
            <SubtaskForm
              kpiId={kpiId}
              editingSubtask={editingSubtask}
              onDone={handleFormDone}
            />
          ) : (
            <TouchableOpacity
              style={[
                stStyles.addSubtaskButton,
                {
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.buttonSecondary,
                  borderRadius: theme.borderRadius.sm,
                },
              ]}
              onPress={() => {
                setEditingSubtask(null);
                setShowForm(true);
                setExpanded(true);
              }}
              activeOpacity={0.8}>
              <Text style={[stStyles.addSubtaskButtonText, { color: theme.primary }]}>
                + Add Subtask
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      <ScheduleActivityModal
        visible={Boolean(scheduleTarget)}
        subtask={scheduleTarget}
        kpi={parentKpi}
        category={parentCategory}
        initialSchedule={scheduleTarget ? getActivitySchedule(scheduleTarget.id) : undefined}
        onSave={(schedule) => {
          const existing = scheduleTarget ? getActivitySchedule(scheduleTarget.id) : undefined;
          if (existing) {
            updateActivitySchedule({
              ...schedule,
              id: existing.id,
              createdAt: existing.createdAt,
            });
            return;
          }
          addActivitySchedule(schedule);
        }}
        onDelete={deleteActivitySchedule}
        onClose={() => setScheduleTarget(null)}
      />
    </View>
  );
}

function KpiForm({
  kpiName,
  setKpiName,
  category,
  setCategory,
  target,
  setTarget,
  unit,
  setUnit,
  weight,
  setWeight,
  categories,
  categoryPickerOpen,
  setCategoryPickerOpen,
  handleSaveOrAddKPI,
  clearForm,
  editingId,
  hasSuggestionParams,
  hasConfidentSuggestedCategory,
  suggestedActivity,
  originalCommand,
}: {
  kpiName: string;
  setKpiName: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  target: string;
  setTarget: (value: string) => void;
  unit: string;
  setUnit: (value: string) => void;
  weight: string;
  setWeight: (value: string) => void;
  categories: { id: string; name: string }[];
  categoryPickerOpen: boolean;
  setCategoryPickerOpen: (value: boolean) => void;
  handleSaveOrAddKPI: () => void;
  clearForm: () => void;
  editingId: string | null;
  hasSuggestionParams: boolean;
  hasConfidentSuggestedCategory: boolean;
  suggestedActivity?: string;
  originalCommand?: string;
}) {
  const { theme } = useTheme();

  return (
    <View>
      <SuggestionHelperCard
        hasSuggestionParams={hasSuggestionParams}
        hasConfidentSuggestedCategory={hasConfidentSuggestedCategory}
        suggestedActivity={suggestedActivity}
        originalCommand={originalCommand}
      />

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>KPI Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.cardBorder,
              borderRadius: theme.borderRadius.md,
              color: theme.textPrimary,
              backgroundColor: theme.inputBackground,
            },
          ]}
          value={kpiName}
          onChangeText={setKpiName}
          placeholder="Enter KPI name"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>Category</Text>
        {categories.length === 0 ? (
          <Text style={[styles.emptyCategoriesText, { color: theme.textMuted }]}>
            Please add categories first
          </Text>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.inputBackground,
                },
              ]}
              onPress={() => setCategoryPickerOpen(!categoryPickerOpen)}
              activeOpacity={0.7}>
              <Text
                style={
                  category
                    ? [styles.pickerValueText, { color: theme.textPrimary }]
                    : [styles.pickerPlaceholderText, { color: theme.textMuted }]
                }>
                {category || 'Select category'}
              </Text>
            </TouchableOpacity>
            {categoryPickerOpen ? (
              <View
                style={[
                  styles.pickerDropdown,
                  {
                    borderColor: theme.cardBorder,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: theme.cardBackground,
                  },
                ]}>
                <ScrollView style={{ maxHeight: 180 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.pickerOption}
                      onPress={() => {
                        setCategory(cat.name);
                        setCategoryPickerOpen(false);
                      }}>
                      <Text style={[styles.modalRowText, { color: theme.textPrimary }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>Target</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
                color: theme.textPrimary,
                backgroundColor: theme.inputBackground,
              },
            ]}
            value={target}
            onChangeText={setTarget}
            keyboardType="numeric"
            placeholder="Enter target"
            placeholderTextColor={theme.textMuted}
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>Unit</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
                color: theme.textPrimary,
                backgroundColor: theme.inputBackground,
              },
            ]}
            value={unit}
            onChangeText={setUnit}
            placeholder="Enter unit"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>Weight</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.cardBorder,
              borderRadius: theme.borderRadius.md,
              color: theme.textPrimary,
              backgroundColor: theme.inputBackground,
            },
          ]}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="Enter weight"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.formActionRow}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.buttonPrimary,
              borderRadius: theme.borderRadius.md,
            },
          ]}
          onPress={handleSaveOrAddKPI}>
          <Text style={styles.buttonText}>{editingId ? 'Save KPI' : 'Add KPI'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            {
              borderColor: theme.cardBorder,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.buttonSecondary,
            },
          ]}
          onPress={clearForm}
          activeOpacity={0.7}>
          <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function KPIManagerScreen() {
  const params = useLocalSearchParams<{
    suggestedCategory?: string | string[];
    suggestedKpiName?: string | string[];
    suggestedTarget?: string | string[];
    suggestedUnit?: string | string[];
    suggestedWeight?: string | string[];
    suggestedActivity?: string | string[];
    originalCommand?: string | string[];
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { categories, kpis, entries, latestActuals, addKPI, updateKPI, deleteKPI } = useAppData();

  const [kpiName, setKpiName] = useState('');
  const [category, setCategory] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [weight, setWeight] = useState('');
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const suggestedCategory = Array.isArray(params.suggestedCategory)
    ? params.suggestedCategory[0]
    : params.suggestedCategory;
  const suggestedKpiName = Array.isArray(params.suggestedKpiName)
    ? params.suggestedKpiName[0]
    : params.suggestedKpiName;
  const suggestedTarget = Array.isArray(params.suggestedTarget)
    ? params.suggestedTarget[0]
    : params.suggestedTarget;
  const suggestedUnit = Array.isArray(params.suggestedUnit)
    ? params.suggestedUnit[0]
    : params.suggestedUnit;
  const suggestedWeight = Array.isArray(params.suggestedWeight)
    ? params.suggestedWeight[0]
    : params.suggestedWeight;
  const suggestedActivity = Array.isArray(params.suggestedActivity)
    ? params.suggestedActivity[0]
    : params.suggestedActivity;
  const originalCommand = Array.isArray(params.originalCommand)
    ? params.originalCommand[0]
    : params.originalCommand;

  const hasSuggestionParams = Boolean(
    suggestedKpiName || suggestedCategory || suggestedTarget || suggestedUnit || suggestedWeight
  );
  const hasConfidentSuggestedCategory = Boolean(
    suggestedCategory &&
      suggestedCategory !== 'Choose category' &&
      categories.some((item) => item.name === suggestedCategory)
  );

  const latestEntryActuals = useMemo(() => {
    if (entries.length === 0) return latestActuals;
    const latestEntry = [...entries].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    return latestEntry?.actuals ?? latestActuals;
  }, [entries, latestActuals]);

  const kpiCards = useMemo(() => {
    return kpis.map((kpi) => {
      const latestActualRaw = latestEntryActuals[kpi.id];
      const latestActual = latestActualRaw === undefined || latestActualRaw === '' ? null : latestActualRaw;
      const parsedActual = latestActual ? parseFloat(latestActual) : NaN;
      const progress =
        latestActual && !Number.isNaN(parsedActual) && kpi.target > 0
          ? Math.min(100, Math.round((parsedActual / kpi.target) * 100))
          : null;

      return {
        ...kpi,
        latestActual,
        progress,
      };
    });
  }, [kpis, latestEntryActuals]);

  const clearForm = useCallback(() => {
    setKpiName('');
    setCategory('');
    setTarget('');
    setUnit('');
    setWeight('');
    setEditingId(null);
    setCategoryPickerOpen(false);
    setIsFormOpen(false);
  }, []);

  const openAddModal = useCallback(() => {
    setKpiName('');
    setCategory('');
    setTarget('');
    setUnit('');
    setWeight('');
    setEditingId(null);
    setCategoryPickerOpen(false);
    setIsFormOpen(true);
  }, []);

  const handleStartEdit = useCallback((item: KPI) => {
    setKpiName(item.name);
    setCategory(item.category);
    setTarget(String(item.target));
    setUnit(item.unit);
    setWeight(String(item.weight));
    setEditingId(item.id);
    setCategoryPickerOpen(false);
    setIsFormOpen(true);
  }, []);

  const handleSaveOrAddKPI = useCallback(() => {
    if (!kpiName.trim() || !category.trim() || !target.trim() || !unit.trim() || !weight.trim()) {
      return;
    }

    const targetNum = parseFloat(target);
    const weightNum = parseFloat(weight);
    if (Number.isNaN(targetNum) || Number.isNaN(weightNum)) return;

    if (editingId) {
      const existingKpi = kpis.find((item) => item.id === editingId);
      if (!existingKpi) return;

      updateKPI({
        ...existingKpi,
        name: kpiName.trim(),
        category: category.trim(),
        target: targetNum,
        unit: unit.trim(),
        weight: weightNum,
      });
    } else {
      addKPI({
        name: kpiName.trim(),
        category: category.trim(),
        target: targetNum,
        unit: unit.trim(),
        weight: weightNum,
      });
    }

    clearForm();
  }, [addKPI, category, clearForm, editingId, kpiName, kpis, target, unit, updateKPI, weight]);

  const handleDeleteKPI = useCallback(
    (id: string) => {
      if (editingId === id) {
        clearForm();
      }
      deleteKPI(id);
    },
    [clearForm, deleteKPI, editingId]
  );

  useEffect(() => {
    if (!hasSuggestionParams || editingId) return;

    if (suggestedKpiName) setKpiName(suggestedKpiName);
    if (hasConfidentSuggestedCategory) {
      setCategory(suggestedCategory ?? '');
    } else {
      setCategory('');
    }
    if (suggestedTarget) setTarget(suggestedTarget);
    if (suggestedUnit) setUnit(suggestedUnit);
    if (suggestedWeight) setWeight(suggestedWeight);
    setCategoryPickerOpen(false);
    setIsFormOpen(true);
  }, [
    editingId,
    hasConfidentSuggestedCategory,
    hasSuggestionParams,
    suggestedCategory,
    suggestedKpiName,
    suggestedTarget,
    suggestedUnit,
    suggestedWeight,
  ]);

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="KPIs"
          subtitle="Manage your performance metrics."
          rightAccessory={
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: theme.buttonPrimary,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={openAddModal}
              activeOpacity={0.8}>
              <Text style={styles.addButtonText}>+ Add KPI</Text>
            </TouchableOpacity>
          }
        />

        {kpis.length === 0 ? (
          <EmptyState
            title="No KPIs Yet"
            message="Add your first KPI to start tracking."
          />
        ) : (
          <ResponsiveGrid gap={14}>
            {kpiCards.map((kpi) => (
              <ResponsiveGridItem
                key={kpi.id}
                mobileSpan={1}
                tabletSpan={3}
                desktopSpan={3}>
                <SectionCard>
                  <View style={styles.kpiHeader}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={[styles.kpiName, { color: theme.textPrimary }]}>{kpi.name}</Text>
                      <Text style={[styles.kpiCategory, { color: theme.primary }]}>{kpi.category}</Text>
                    </View>
                    <View style={styles.actionCluster}>
                      <TouchableOpacity
                        style={[
                          styles.inlineActionButton,
                          {
                            borderColor: theme.cardBorder,
                            backgroundColor: theme.buttonSecondary,
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: '/(tabs)/entry',
                            params: { kpiId: kpi.id },
                          })
                        }
                        activeOpacity={0.8}>
                        <Text style={[styles.inlineActionText, { color: theme.textPrimary }]}>Entry</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.inlineActionButton,
                          {
                            borderColor: theme.cardBorder,
                            backgroundColor: theme.buttonSecondary,
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}
                        onPress={() => handleStartEdit(kpi)}
                        activeOpacity={0.8}>
                        <Text style={[styles.inlineActionText, { color: theme.textPrimary }]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.inlineActionButton,
                          {
                            borderColor: theme.danger,
                            backgroundColor: theme.buttonSecondary,
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}
                        onPress={() => handleDeleteKPI(kpi.id)}
                        activeOpacity={0.8}>
                        <Text style={[styles.inlineActionText, { color: theme.danger }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.kpiMeta, { color: theme.textSecondary }]}>
                    Target: {kpi.target} {kpi.unit}
                  </Text>
                  <Text style={[styles.kpiMeta, { color: theme.textSecondary }]}>Weight: {kpi.weight}</Text>
                  <Text style={[styles.kpiMeta, { color: theme.textSecondary }]}>
                    Latest actual: {kpi.latestActual ? `${kpi.latestActual} ${kpi.unit}` : 'No entries yet'}
                  </Text>
                  <Text style={[styles.kpiMeta, { color: theme.textSecondary }]}>
                    Progress: {kpi.progress !== null ? `${kpi.progress}%` : 'Not enough data'}
                  </Text>

                  <SubtasksSection kpiId={kpi.id} />
                </SectionCard>
              </ResponsiveGridItem>
            ))}
          </ResponsiveGrid>
        )}

        <Modal
          visible={isFormOpen}
          transparent
          animationType="fade"
          onRequestClose={clearForm}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={clearForm}
            />
            <View
              style={[
                styles.formModalCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {editingId ? 'Edit KPI' : 'Add KPI'}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <KpiForm
                  kpiName={kpiName}
                  setKpiName={setKpiName}
                  category={category}
                  setCategory={setCategory}
                  target={target}
                  setTarget={setTarget}
                  unit={unit}
                  setUnit={setUnit}
                  weight={weight}
                  setWeight={setWeight}
                  categories={categories}
                  categoryPickerOpen={categoryPickerOpen}
                  setCategoryPickerOpen={setCategoryPickerOpen}
                  handleSaveOrAddKPI={handleSaveOrAddKPI}
                  clearForm={clearForm}
                  editingId={editingId}
                  hasSuggestionParams={hasSuggestionParams}
                  hasConfidentSuggestedCategory={hasConfidentSuggestedCategory}
                  suggestedActivity={suggestedActivity}
                  originalCommand={originalCommand}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </PageContainer>
    </ScrollView>
  );

  return <DesktopShell title="KPIs">{pageContent}</DesktopShell>;
}

const stStyles = StyleSheet.create({
  section: {
    marginTop: 14,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addSubtaskButton: {
    marginTop: 10,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  addSubtaskButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  freqButton: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  freqButtonText: {
    fontSize: 14,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  countLabel: {
    fontSize: 14,
    flex: 1,
  },
  countInput: {
    borderWidth: 1,
    padding: 8,
    fontSize: 14,
    width: 70,
    textAlign: 'center',
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: '75%',
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalRow: {
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  modalRowSelected: {
    borderRadius: 6,
  },
  modalRowText: {
    fontSize: 15,
  },
});

const styles = StyleSheet.create({
  addButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
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
  formModalCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '88%',
    borderWidth: 1,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  modalRowText: {
    fontSize: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  suggestionCard: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  suggestionWarning: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
  },
  emptyCategoriesText: {
    fontSize: 15,
    paddingVertical: 10,
  },
  pickerValueText: {
    fontSize: 15,
  },
  pickerPlaceholderText: {
    fontSize: 15,
  },
  pickerDropdown: {
    marginTop: 10,
    borderWidth: 1,
  },
  pickerOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  formActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  kpiName: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  kpiCategory: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  inlineActionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  kpiMeta: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});
