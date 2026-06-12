import { GeneratedSetupPreview } from '@/components/GeneratedSetupPreview';
import { LifeBuddySetup } from '@/components/LifeBuddySetup';
import { LifeBuddyRecommendations } from '@/components/LifeBuddyRecommendations';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { PersonTodo, SubtaskFrequency, useAppData } from '@/context/AppDataContext';
import { ReminderPreferences, usePreferences } from '@/context/PreferencesContext';
import { useTheme } from '@/context/ThemeContext';
import { generateSetupFromSelections } from '@/services/ruleEngine';
import { onboardingSteps } from '@/src/data/lifeLibrary';
import {
  GeneratedOnboardingSetup,
  GeneratedRelationshipTracker,
  OnboardingSelections,
  OnboardingStepId,
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

function createEmptySelections(): OnboardingSelections {
  return {
    roles: [],
    relationships: [],
    assets: [],
    interests: [],
    priorities: [],
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
  const { setOnboardingCompleted, setOnboardingProfile, updateReminderPreference } = usePreferences();

  const [selections, setSelections] = useState<OnboardingSelections>(createEmptySelections);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [generatedSetup, setGeneratedSetup] = useState<GeneratedOnboardingSetup | null>(null);
  const [previewMode, setPreviewMode] = useState<'summary' | 'edit'>('summary');
  const [postGenerationStage, setPostGenerationStage] = useState<'recommendations' | 'preview'>(
    'recommendations'
  );
  const [isCustomizingRecommendations, setIsCustomizingRecommendations] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCount = useMemo(
    () => Object.values(selections).reduce((total, values) => total + values.length, 0),
    [selections]
  );
  const activeSetupForPreview = useMemo<GeneratedOnboardingSetup | null>(() => {
    if (!generatedSetup) return null;

    return {
      ...generatedSetup,
      categories: generatedSetup.categories.map((category) => ({
        ...category,
        kpis: category.kpis.map((kpi) => ({
          ...kpi,
          activities: kpi.activities.filter((activity) => activity.selected !== false),
        })),
      })),
    };
  }, [generatedSetup]);

  const toggleOption = (stepId: OnboardingStepId, optionId: string) => {
    setSelections((current) => {
      const values = current[stepId];
      const nextValues = values.includes(optionId)
        ? values.filter((value) => value !== optionId)
        : [...values, optionId];

      return {
        ...current,
        [stepId]: nextValues,
      };
    });
  };

  const handleNextStep = () => {
    if (currentStepIndex === onboardingSteps.length - 1) {
      setGeneratedSetup(generateSetupFromSelections(selections));
      setPreviewMode('summary');
      setPostGenerationStage('recommendations');
      setIsCustomizingRecommendations(false);
      return;
    }

    setCurrentStepIndex((prev) => Math.min(prev + 1, onboardingSteps.length - 1));
  };

  const handleBackStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    setOnboardingCompleted(true);
    router.replace('/(tabs)');
  };

  const updateGeneratedSetup = (
    updater: (current: GeneratedOnboardingSetup) => GeneratedOnboardingSetup
  ) => {
    setGeneratedSetup((current) => (current ? updater(current) : current));
  };

  const updateActivitySelections = (selector: (activitySelected: boolean, recommended: boolean) => boolean) => {
    updateGeneratedSetup((current) => ({
      ...current,
      categories: current.categories.map((category) => ({
        ...category,
        kpis: category.kpis.map((kpi) => ({
          ...kpi,
          activities: kpi.activities.map((activity) => ({
            ...activity,
            selected: selector(Boolean(activity.selected), Boolean(activity.recommended)),
          })),
        })),
      })),
    }));
  };

  const handleSaveSetup = async () => {
    if (!generatedSetup || isSaving) return;

    setIsSaving(true);

    try {
      const categoryLookup = new Map(
        categories.map((category) => [category.name.trim().toLowerCase(), category.name])
      );
      const kpiLookup = new Map(
        kpis.map((kpi) => [
          `${kpi.category.trim().toLowerCase()}::${kpi.name.trim().toLowerCase()}`,
          kpi,
        ])
      );
      const subtaskKeys = new Set(
        subtasks.map((subtask) => `${subtask.kpiId}::${subtask.name.trim().toLowerCase()}`)
      );
      const personLookup = new Map(
        people.map((person) => [person.name.trim().toLowerCase(), person])
      );
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
            if (activity.selected === false) continue;

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

      updateReminderPreference(
        'kpiReminders',
        generatedSetup.reminderPreferences.kpiReminders
      );
      updateReminderPreference(
        'relationshipReminders',
        generatedSetup.reminderPreferences.relationshipReminders
      );
      updateReminderPreference(
        'weeklyReview',
        generatedSetup.reminderPreferences.weeklyReview
      );
      setOnboardingProfile(selections);
      setOnboardingCompleted(true);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save onboarding setup', error);
      Alert.alert('Could not save setup', 'Please try again. Your generated setup is still here.');
    } finally {
      setIsSaving(false);
    }
  };

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Life Buddy Onboarding"
          subtitle="Choose who you are and what matters. Life Buddy will build the first version for you."
          showSearch={false}
        />

        {!generatedSetup ? (
          <>
            <LifeBuddySetup
              steps={onboardingSteps}
              currentStepIndex={currentStepIndex}
              selections={selections}
              onToggleOption={toggleOption}
              onBack={handleBackStep}
              onNext={handleNextStep}
              onSkip={handleSkip}
            />

            <SectionCard
              style={{
                backgroundColor: theme.secondaryBackground,
                borderColor: theme.cardBorder,
              }}>
              <Text style={[styles.sideTitle, { color: theme.textPrimary }]}>
                What Life Buddy will generate
              </Text>
              <Text style={[styles.sideText, { color: theme.textSecondary }]}>
                Categories, KPIs, activities, and relationship trackers built from your selections.
              </Text>
              <Text style={[styles.sideText, { color: theme.textSecondary }]}>
                {selectedCount > 0
                  ? `${selectedCount} selections made so far.`
                  : 'Make a few quick selections and Life Buddy will do the rest.'}
              </Text>
              <Text style={[styles.sideHint, { color: theme.textMuted }]}>
                The goal is to finish in under three minutes and avoid manual KPI setup.
              </Text>
            </SectionCard>
          </>
        ) : (
          <>
            {postGenerationStage === 'recommendations' ? (
              <LifeBuddyRecommendations
                categories={generatedSetup.categories}
                isCustomizing={isCustomizingRecommendations}
                onActivateAllRecommended={() => {
                  updateActivitySelections((_selected, recommended) => recommended);
                  setPreviewMode('summary');
                  setPostGenerationStage('preview');
                  setIsCustomizingRecommendations(false);
                }}
                onStartCustomizing={() => setIsCustomizingRecommendations(true)}
                onContinue={() => {
                  setPreviewMode('summary');
                  setPostGenerationStage('preview');
                }}
                onToggleActivity={(activityId) =>
                  updateGeneratedSetup((current) => ({
                    ...current,
                    categories: current.categories.map((category) => ({
                      ...category,
                      kpis: category.kpis.map((kpi) => ({
                        ...kpi,
                        activities: kpi.activities.map((activity) =>
                          activity.id === activityId
                            ? {
                                ...activity,
                                selected: !activity.selected,
                              }
                            : activity
                        ),
                      })),
                    })),
                  }))
                }
              />
            ) : (
              <>
                <SectionCard
                  style={{
                    backgroundColor: theme.secondaryBackground,
                    borderColor: theme.cardBorder,
                  }}>
                  <Text style={[styles.reviewTitle, { color: theme.textPrimary }]}>
                    {previewMode === 'edit' ? 'Editing your generated setup' : 'Review your generated setup'}
                  </Text>
                  <Text style={[styles.reviewText, { color: theme.textSecondary }]}>
                    {previewMode === 'edit'
                      ? 'Adjust categories, KPIs, activities, and relationship trackers before saving.'
                      : 'Life Buddy generated this from your roles, relationships, assets, interests, and priorities.'}
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
                        {previewMode === 'edit' ? 'Done Editing' : 'Edit Setup'}
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
                        setPostGenerationStage('recommendations');
                        setIsCustomizingRecommendations(true);
                      }}
                      activeOpacity={0.85}>
                      <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                        Recommendation Choices
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
                        setPostGenerationStage('recommendations');
                        setIsCustomizingRecommendations(false);
                      }}
                      activeOpacity={0.85}>
                      <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                        Back to Selections
                      </Text>
                    </TouchableOpacity>
                  </View>
                </SectionCard>

                <GeneratedSetupPreview
                  setup={activeSetupForPreview ?? generatedSetup}
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
                                          recommended: false,
                                          importanceScore: 5,
                                          defaultFrequency: 'weekly',
                                          reason: 'Manual selection',
                                          selected: true,
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
                          todoTitle: 'Check In',
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
          </>
        )}
      </PageContainer>
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {pageContent}
    </SafeAreaView>
  );
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
  sideHint: {
    fontSize: 12,
    lineHeight: 18,
  },
});
