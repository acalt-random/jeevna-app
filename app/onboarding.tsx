import { GeneratedSetupPreview } from '@/components/GeneratedSetupPreview';
import { LifeBuddySetup } from '@/components/LifeBuddySetup';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import {
  PersonTodo,
  SubtaskFrequency,
  useAppData,
} from '@/context/AppDataContext';
import { ReminderPreferences, usePreferences } from '@/context/PreferencesContext';
import { useTheme } from '@/context/ThemeContext';
import {
  generateOnboardingSetup,
  onboardingQuestions,
} from '@/services/onboardingGenerator';
import {
  GeneratedOnboardingSetup,
  GeneratedRelationshipTracker,
  OnboardingAnswers,
  OnboardingQuestionId,
} from '@/types/onboarding';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function createEmptyAnswers(): OnboardingAnswers {
  return {
    focus: '',
    health: '',
    finance: '',
    relationships: '',
    career: '',
    learning: '',
    personalAdmin: '',
  };
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeFrequency(
  value: string
): 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time' {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('day')) return 'daily';
  if (normalized.includes('month')) return 'monthly';
  if (normalized.includes('quarter')) return 'quarterly';
  if (normalized.includes('year')) return 'yearly';
  if (normalized.includes('once')) return 'one-time';
  return 'weekly';
}

function normalizeSubtaskFrequency(value: string): SubtaskFrequency {
  const relationshipFrequency = normalizeFrequency(value);
  return relationshipFrequency === 'one-time' ? 'custom' : relationshipFrequency;
}

function buildDueDate(frequency: GeneratedRelationshipTracker['frequency']): string {
  const date = new Date();
  const offsetDays =
    frequency === 'daily'
      ? 1
      : frequency === 'weekly'
        ? 7
        : frequency === 'monthly'
          ? 30
          : frequency === 'quarterly'
            ? 90
            : frequency === 'yearly'
              ? 365
              : 7;
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function clampPositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const {
    categories,
    kpis,
    subtasks,
    people,
    personTodos,
    addCategory,
    addKPI,
    addSubtask,
    addPerson,
    addPersonTodo,
  } = useAppData();
  const {
    reminderPreferences,
    updateReminderPreference,
    setOnboardingCompleted,
  } = usePreferences();

  const [answers, setAnswers] = useState<OnboardingAnswers>(createEmptyAnswers);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [generatedSetup, setGeneratedSetup] = useState<GeneratedOnboardingSetup | null>(null);
  const [previewMode, setPreviewMode] = useState<'summary' | 'edit'>('summary');
  const [isSaving, setIsSaving] = useState(false);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value.trim().length > 0).length,
    [answers]
  );

  const handleChangeAnswer = (questionId: OnboardingQuestionId, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex === onboardingQuestions.length - 1) {
      const nextSetup = generateOnboardingSetup(answers);
      setGeneratedSetup(nextSetup);
      setPreviewMode('summary');
      return;
    }

    setCurrentQuestionIndex((prev) => Math.min(prev + 1, onboardingQuestions.length - 1));
  };

  const handleBackQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    setOnboardingCompleted(true);
    router.replace('/(tabs)');
  };

  const updateGeneratedSetup = (updater: (current: GeneratedOnboardingSetup) => GeneratedOnboardingSetup) => {
    setGeneratedSetup((current) => (current ? updater(current) : current));
  };

  const handleSaveSetup = async () => {
    if (!generatedSetup || isSaving) return;

    setIsSaving(true);

    try {
      const categoryLookup = new Map(categories.map((category) => [category.name.trim().toLowerCase(), category.name]));
      const kpiLookup = new Map(
        kpis.map((kpi) => [
          `${kpi.category.trim().toLowerCase()}::${kpi.name.trim().toLowerCase()}`,
          kpi,
        ])
      );
      const subtaskKeys = new Set(
        subtasks.map((subtask) => `${subtask.kpiId}::${subtask.name.trim().toLowerCase()}`)
      );
      const personLookup = new Map(people.map((person) => [person.name.trim().toLowerCase(), person]));
      const personTodoKeys = new Set(
        personTodos.map(
          (todo) => `${todo.personId}::${todo.title.trim().toLowerCase()}::${todo.frequency}`
        )
      );

      for (const category of generatedSetup.categories) {
        const categoryName = category.name.trim();
        if (!categoryName) continue;

        const categoryKey = categoryName.toLowerCase();
        if (!categoryLookup.has(categoryKey)) {
          addCategory(categoryName);
          categoryLookup.set(categoryKey, categoryName);
        }

        for (const draftKpi of category.kpis) {
          const kpiName = draftKpi.name.trim();
          if (!kpiName) continue;

          const normalizedCategory = categoryLookup.get(categoryKey) ?? categoryName;
          const kpiKey = `${normalizedCategory.toLowerCase()}::${kpiName.toLowerCase()}`;
          const existingKpi = kpiLookup.get(kpiKey);
          const savedKpi =
            existingKpi ??
            addKPI({
              name: kpiName,
              category: normalizedCategory,
              target: clampPositiveInt(String(draftKpi.target), 1),
              unit: draftKpi.unit.trim() || 'count',
              weight: clampPositiveInt(String(draftKpi.weight), 5),
            });

          if (!existingKpi) {
            kpiLookup.set(kpiKey, savedKpi);
          }

          for (const activity of draftKpi.activities) {
            const activityName = activity.name.trim();
            if (!activityName) continue;

            const subtaskKey = `${savedKpi.id}::${activityName.toLowerCase()}`;
            if (subtaskKeys.has(subtaskKey)) continue;

            addSubtask({
              kpiId: savedKpi.id,
              name: activityName,
              frequency: normalizeSubtaskFrequency(activity.frequency),
              targetCount: clampPositiveInt(String(activity.targetCount), 1),
            });
            subtaskKeys.add(subtaskKey);
          }
        }
      }

      for (const relationship of generatedSetup.relationships) {
        const personName = relationship.name.trim();
        if (!personName) continue;

        const personKey = personName.toLowerCase();
        const existingPerson = personLookup.get(personKey);
        const savedPerson =
          existingPerson ??
          addPerson({
            name: personName,
            relationshipType: relationship.relationshipType.trim() || 'Other',
            groupName: relationship.groupName.trim() || 'Other',
            notes: relationship.notes?.trim(),
          });

        if (!existingPerson) {
          personLookup.set(personKey, savedPerson);
        }

        const todoTitle = relationship.todoTitle.trim();
        if (!todoTitle) continue;

        const frequency = normalizeFrequency(relationship.frequency);
        const todoKey = `${savedPerson.id}::${todoTitle.toLowerCase()}::${frequency}`;
        if (personTodoKeys.has(todoKey)) continue;

        addPersonTodo({
          personId: savedPerson.id,
          title: todoTitle,
          frequency,
          dueDate: buildDueDate(frequency),
          completed: false,
          notes: relationship.notes?.trim(),
        } satisfies Omit<PersonTodo, 'id'>);
        personTodoKeys.add(todoKey);
      }

      updateReminderPreference('kpiReminders', generatedSetup.reminderPreferences.kpiReminders);
      updateReminderPreference(
        'relationshipReminders',
        generatedSetup.reminderPreferences.relationshipReminders
      );
      updateReminderPreference('weeklyReview', generatedSetup.reminderPreferences.weeklyReview);
      setOnboardingCompleted(true);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save onboarding setup', error);
      Alert.alert('Could not save setup', 'Please try again. Your draft is still here.');
    } finally {
      setIsSaving(false);
    }
  };

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Life Buddy Onboarding"
          subtitle="Create your first Life KPI system in a few minutes, then adjust anything before it is saved."
        />

        {!generatedSetup ? (
          <LifeBuddySetup
            questions={onboardingQuestions}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            onChangeAnswer={handleChangeAnswer}
            onBack={handleBackQuestion}
            onNext={handleNextQuestion}
            onSkip={handleSkip}
          />
        ) : (
          <>
            <SectionCard
              style={{
                backgroundColor: theme.secondaryBackground,
                borderColor: theme.cardBorder,
              }}>
              <Text style={[styles.reviewTitle, { color: theme.textPrimary }]}>
                {previewMode === 'edit' ? 'Editing your setup' : 'Review your setup'}
              </Text>
              <Text style={[styles.reviewText, { color: theme.textSecondary }]}>
                {previewMode === 'edit'
                  ? 'Everything below is editable. Clean up names, targets, habits, and reminder defaults before saving.'
                  : 'Life Buddy generated a first draft from your answers. Save it as-is or switch to manual editing.'}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={handleSaveSetup}
                  activeOpacity={0.85}
                  disabled={isSaving}>
                  <Text style={styles.primaryButtonText}>
                    {isSaving ? 'Saving...' : 'Save Setup'}
                  </Text>
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
                  onPress={() => setPreviewMode((prev) => (prev === 'edit' ? 'summary' : 'edit'))}
                  activeOpacity={0.85}>
                  <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                    {previewMode === 'edit' ? 'Done Editing' : 'Edit Manually'}
                  </Text>
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
                  onPress={() => {
                    setGeneratedSetup(null);
                    setPreviewMode('summary');
                  }}
                  activeOpacity={0.85}>
                  <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                    Back to Questions
                  </Text>
                </TouchableOpacity>
              </View>
            </SectionCard>

            <GeneratedSetupPreview
              setup={generatedSetup}
              editable={previewMode === 'edit'}
              onChangeSummary={(value) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  summary: value,
                }))
              }
              onUpdateCategoryName={(categoryId, value) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  categories: current.categories.map((category) =>
                    category.id === categoryId
                      ? {
                          ...category,
                          name: value,
                          kpis: category.kpis.map((kpi) => ({
                            ...kpi,
                            categoryName: value,
                          })),
                        }
                      : category
                  ),
                }))
              }
              onDeleteCategory={(categoryId) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  categories: current.categories.filter((category) => category.id !== categoryId),
                }))
              }
              onAddCategory={() =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  categories: [
                    ...current.categories,
                    {
                      id: makeId('category'),
                      name: 'New Category',
                      kpis: [],
                    },
                  ],
                }))
              }
              onAddKpi={(categoryId) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  categories: current.categories.map((category) =>
                    category.id === categoryId
                      ? {
                          ...category,
                          kpis: [
                            ...category.kpis,
                            {
                              id: makeId('kpi'),
                              name: 'New KPI',
                              categoryName: category.name,
                              target: 1,
                              unit: 'times/week',
                              weight: 5,
                              activities: [],
                            },
                          ],
                        }
                      : category
                  ),
                }))
              }
              onUpdateKpi={(categoryId, kpiId, field, value) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  categories: current.categories.map((category) =>
                    category.id === categoryId
                      ? {
                          ...category,
                          kpis: category.kpis.map((kpi) =>
                            kpi.id === kpiId
                              ? {
                                  ...kpi,
                                  [field]:
                                    field === 'target' || field === 'weight'
                                      ? clampPositiveInt(value, 1)
                                      : value,
                                }
                              : kpi
                          ),
                        }
                      : category
                  ),
                }))
              }
              onDeleteKpi={(categoryId, kpiId) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  categories: current.categories.map((category) =>
                    category.id === categoryId
                      ? {
                          ...category,
                          kpis: category.kpis.filter((kpi) => kpi.id !== kpiId),
                        }
                      : category
                  ),
                }))
              }
              onAddActivity={(categoryId, kpiId) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  categories: current.categories.map((category) =>
                    category.id === categoryId
                      ? {
                          ...category,
                          kpis: category.kpis.map((kpi) =>
                            kpi.id === kpiId
                              ? {
                                  ...kpi,
                                  activities: [
                                    ...kpi.activities,
                                    {
                                      id: makeId('activity'),
                                      name: 'New Activity',
                                      frequency: 'weekly',
                                      targetCount: 1,
                                    },
                                  ],
                                }
                              : kpi
                          ),
                        }
                      : category
                  ),
                }))
              }
              onUpdateActivity={(categoryId, kpiId, activityId, field, value) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  categories: current.categories.map((category) =>
                    category.id === categoryId
                      ? {
                          ...category,
                          kpis: category.kpis.map((kpi) =>
                            kpi.id === kpiId
                              ? {
                                  ...kpi,
                                  activities: kpi.activities.map((activity) =>
                                    activity.id === activityId
                                      ? {
                                          ...activity,
                                          [field]:
                                            field === 'targetCount'
                                              ? clampPositiveInt(value, 1)
                                              : field === 'frequency'
                                                ? normalizeSubtaskFrequency(value)
                                                : value,
                                        }
                                      : activity
                                  ),
                                }
                              : kpi
                          ),
                        }
                      : category
                  ),
                }))
              }
              onDeleteActivity={(categoryId, kpiId, activityId) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  categories: current.categories.map((category) =>
                    category.id === categoryId
                      ? {
                          ...category,
                          kpis: category.kpis.map((kpi) =>
                            kpi.id === kpiId
                              ? {
                                  ...kpi,
                                  activities: kpi.activities.filter(
                                    (activity) => activity.id !== activityId
                                  ),
                                }
                              : kpi
                          ),
                        }
                      : category
                  ),
                }))
              }
              onUpdateReminderPreference={(key, value) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  reminderPreferences: {
                    ...current.reminderPreferences,
                    [key]: value,
                  } satisfies ReminderPreferences,
                }))
              }
              onAddRelationship={() =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  relationships: [
                    ...current.relationships,
                    {
                      id: makeId('relationship'),
                      name: 'Important Person',
                      relationshipType: 'Other',
                      groupName: 'Other',
                      frequency: 'weekly',
                      todoTitle: 'Check in',
                    },
                  ],
                }))
              }
              onUpdateRelationship={(relationshipId, field, value) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  relationships: current.relationships.map((relationship) =>
                    relationship.id === relationshipId
                      ? {
                          ...relationship,
                          [field]:
                            field === 'frequency'
                              ? normalizeFrequency(value)
                              : value,
                        }
                      : relationship
                  ),
                }))
              }
              onDeleteRelationship={(relationshipId) =>
                updateGeneratedSetup((current) => ({
                  ...current,
                  relationships: current.relationships.filter(
                    (relationship) => relationship.id !== relationshipId
                  ),
                }))
              }
            />
          </>
        )}

        {!generatedSetup ? (
          <SectionCard
            style={{
              backgroundColor: theme.secondaryBackground,
              borderColor: theme.cardBorder,
            }}>
            <Text style={[styles.sideTitle, { color: theme.textPrimary }]}>What you&apos;ll get</Text>
            <Text style={[styles.sideText, { color: theme.textSecondary }]}>
              Categories, KPIs, activities, relationship trackers, and reminder preferences that
              you can edit before saving.
            </Text>
            <Text style={[styles.sideText, { color: theme.textSecondary }]}>
              {answeredCount > 0
                ? `${answeredCount} of ${onboardingQuestions.length} questions answered so far.`
                : `Start with any question. You can keep answers short and natural.`}
            </Text>
            <View style={styles.reminderRow}>
              <Text style={[styles.sideLabel, { color: theme.textMuted }]}>Current default reminders</Text>
              <Text style={[styles.sideValue, { color: theme.textPrimary }]}>
                KPI {reminderPreferences.kpiReminders ? 'On' : 'Off'} | Relationship{' '}
                {reminderPreferences.relationshipReminders ? 'On' : 'Off'} | Weekly review{' '}
                {reminderPreferences.weeklyReview ? 'On' : 'Off'}
              </Text>
            </View>
          </SectionCard>
        ) : null}
      </PageContainer>
    </ScrollView>
  );

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>{pageContent}</SafeAreaView>;
}

const styles = StyleSheet.create({
  reviewTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sideTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  sideText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reminderRow: {
    marginTop: 6,
  },
  sideLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sideValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
