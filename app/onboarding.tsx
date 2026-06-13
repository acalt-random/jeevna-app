import { BrandLogo } from '@/components/BrandLogo';
import { EmptyState } from '@/components/EmptyState';
import { GeneratedSetupPreview } from '@/components/GeneratedSetupPreview';
import { LifeBuddyAvatar } from '@/components/LifeBuddyAvatar';
import { LifeBuddySetup } from '@/components/LifeBuddySetup';
import { PageContainer } from '@/components/PageContainer';
import { SectionCard } from '@/components/SectionCard';
import { PersonTodo, SubtaskFrequency, useAppData } from '@/context/AppDataContext';
import { ReminderPreferences, usePreferences } from '@/context/PreferencesContext';
import { useTheme } from '@/context/ThemeContext';
import { buildLocalePreferences } from '@/services/localeService';
import { generateSetupFromSelections } from '@/services/ruleEngine';
import { appendAuditEntry } from '@/services/auditLogService';
import { emitDomainEvent } from '@/services/eventBus';
import { categoryIconMap } from '@/src/design/icons';
import { onboardingSteps } from '@/src/data/lifeLibrary';
import {
  GeneratedOnboardingSetup,
  GeneratedRelationshipTracker,
  OnboardingSelections,
  OnboardingStepId,
} from '@/types/onboarding';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type OnboardingMode = 'welcome' | 'questions' | 'preview' | 'review' | 'success';

function createEmptySelections(language: string, region: string, locale: string): OnboardingSelections {
  return {
    locale: locale ? [locale] : [],
    language: language ? [language] : [],
    region: region ? [region] : [],
    roles: [],
    lifeStages: [],
    relationships: [],
    responsibilities: [],
    assets: [],
    interests: [],
    priorities: [],
    currentFocus: [],
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
  const { t } = useTranslation();
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
    selectedLanguage,
    selectedLocale,
    localePreferences,
    setOnboardingCompleted,
    setOnboardingProfile,
    setSelectedLocale,
    updateReminderPreference,
  } = usePreferences();

  const [mode, setMode] = useState<OnboardingMode>('welcome');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [generatedSetup, setGeneratedSetup] = useState<GeneratedOnboardingSetup | null>(null);
  const [editableReview, setEditableReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSetupSnapshot, setSavedSetupSnapshot] = useState<GeneratedOnboardingSetup | null>(null);
  const [selections, setSelections] = useState<OnboardingSelections>(() =>
    createEmptySelections(selectedLanguage, localePreferences.countryCode, selectedLocale)
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

  const setupCounts = useMemo(() => {
    const source = activeSetupForPreview ?? generatedSetup;
    if (!source) {
      return { categories: 0, kpis: 0, activities: 0, recommended: 0 };
    }

    const kpiCount = source.categories.reduce((sum, category) => sum + category.kpis.length, 0);
    const activities = source.categories.flatMap((category) =>
      category.kpis.flatMap((kpi) => kpi.activities)
    );

    return {
      categories: source.categories.length,
      kpis: kpiCount,
      activities: activities.length,
      recommended: activities.filter((activity) => activity.recommended).length,
    };
  }, [activeSetupForPreview, generatedSetup]);

  const selectedCount = onboardingSteps.reduce(
    (sum, step) => sum + selections[step.id].length,
    0
  );

  const updateGeneratedSetup = (
    updater: (current: GeneratedOnboardingSetup) => GeneratedOnboardingSetup
  ) => {
    setGeneratedSetup((current) => (current ? updater(current) : current));
  };

  const toggleOption = (stepId: OnboardingStepId, optionId: string) => {
    const step = onboardingSteps.find((item) => item.id === stepId);
    const maxSelections = step?.maxSelections;

    setSelections((current) => {
      const currentValues = current[stepId];
      const isSingleSelect = step?.singleSelect;
      const exists = currentValues.includes(optionId);

      let nextValues = currentValues;
      if (isSingleSelect) {
        nextValues = [optionId];
      } else if (exists) {
        nextValues = currentValues.filter((value) => value !== optionId);
      } else if (maxSelections && currentValues.length >= maxSelections) {
        nextValues = currentValues;
      } else {
        nextValues = [...currentValues, optionId];
      }

      let nextState: OnboardingSelections = {
        ...current,
        [stepId]: nextValues,
      };

      if (stepId === 'language' || stepId === 'region') {
        const nextLanguage =
          stepId === 'language'
            ? optionId
            : current.language[0] || selectedLanguage;
        const nextRegion =
          stepId === 'region'
            ? optionId
            : current.region[0] || localePreferences.countryCode;
        const locale = buildLocalePreferences({
          languageCode: nextLanguage,
          countryCode: nextRegion,
        });

        setSelectedLocale(locale.locale);
        nextState = {
          ...nextState,
          language: [locale.languageCode],
          region: [locale.countryCode],
          locale: [locale.locale],
        };
      }

      return nextState;
    });
  };

  const handleNextStep = () => {
    if (currentStepIndex === onboardingSteps.length - 1) {
      setGeneratedSetup(generateSetupFromSelections(selections));
      setMode('preview');
      setEditableReview(false);
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

      updateReminderPreference('kpiReminders', generatedSetup.reminderPreferences.kpiReminders);
      updateReminderPreference(
        'relationshipReminders',
        generatedSetup.reminderPreferences.relationshipReminders
      );
      updateReminderPreference('weeklyReview', generatedSetup.reminderPreferences.weeklyReview);

      const finalSelections: OnboardingSelections = {
        ...selections,
        language: selections.language.length ? selections.language : [selectedLanguage],
        region: selections.region.length ? selections.region : [localePreferences.countryCode],
        locale: [localePreferences.locale],
      };

      setOnboardingProfile(finalSelections);
      setOnboardingCompleted(true);
      setSavedSetupSnapshot(generatedSetup);

      void emitDomainEvent({
        eventName: 'ONBOARDING_COMPLETED',
        entityType: 'onboarding',
        entityId: 'onboarding',
        metadata: {
          selectedLocale: localePreferences.locale,
          selectedLanguage,
          selectedCountry: localePreferences.countryCode,
          totalSelections: onboardingSteps.reduce(
            (sum, step) => sum + finalSelections[step.id].length,
            0
          ),
        },
      });

      void appendAuditEntry({
        action: 'ONBOARDING_COMPLETED',
        entityType: 'onboarding',
        entityId: 'onboarding',
        after: {
          language: finalSelections.language,
          region: finalSelections.region,
          locale: finalSelections.locale,
          lifeStages: finalSelections.lifeStages.length,
          responsibilities: finalSelections.responsibilities.length,
          assets: finalSelections.assets.length,
          interests: finalSelections.interests.length,
          currentFocus: finalSelections.currentFocus.length,
        },
      });

      setMode('success');
    } catch (error) {
      console.error('Failed to save onboarding setup', error);
      Alert.alert(
        t('onboarding.alerts.saveFailedTitle'),
        t('onboarding.alerts.saveFailedMessage')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const previewCategories = (activeSetupForPreview ?? generatedSetup)?.categories ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <PageContainer>
          {mode === 'welcome' ? (
            <SectionCard
              style={[
                styles.heroCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                },
              ]}>
              <View style={styles.heroLogoWrap}>
                <BrandLogo size={84} />
              </View>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Welcome to Life KPI</Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Build a life system that helps you track, review, and improve what matters.
              </Text>

              <View style={styles.heroActionColumn}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={() => setMode('questions')}
                  activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>{t('common.continue')}</Text>
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
                  onPress={handleSkip}
                  activeOpacity={0.85}>
                  <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                    {t('common.skipForNow')}
                  </Text>
                </TouchableOpacity>
              </View>
            </SectionCard>
          ) : null}

          {mode === 'questions' ? (
            <>
              <View style={styles.questionHeader}>
                <Text style={[styles.eyebrow, { color: theme.primary }]}>Life Buddy Setup</Text>
                <Text style={[styles.questionTitle, { color: theme.textPrimary }]}>
                  One calm decision at a time.
                </Text>
                <Text style={[styles.questionSubtitle, { color: theme.textSecondary }]}>
                  Pick the pieces that match your life. Life Buddy will build the first system for you.
                </Text>
              </View>

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
                <Text style={[styles.sideTitle, { color: theme.textPrimary }]}>Starter system preview</Text>
                <Text style={[styles.sideText, { color: theme.textSecondary }]}>
                  {selectedCount > 0
                    ? `${selectedCount} choices made so far.`
                    : 'Make a few quick choices and Life Buddy will do the heavy lifting.'}
                </Text>
                <Text style={[styles.sideHint, { color: theme.textMuted }]}>
                  Categories, KPIs, activities, and relationship trackers are generated after the last step.
                </Text>
              </SectionCard>
            </>
          ) : null}

          {mode === 'preview' && generatedSetup ? (
            <>
              <SectionCard
                style={{
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                }}>
                <View style={styles.previewHeader}>
                  <LifeBuddyAvatar size={64} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>
                      Life Buddy built your starter system
                    </Text>
                    <Text style={[styles.previewSubtitle, { color: theme.textSecondary }]}>
                      A calmer start, with structure already in place.
                    </Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: theme.secondaryBackground, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statValue, { color: theme.textPrimary }]}>{setupCounts.categories}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Categories</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.secondaryBackground, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statValue, { color: theme.textPrimary }]}>{setupCounts.kpis}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>KPIs</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.secondaryBackground, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statValue, { color: theme.textPrimary }]}>{setupCounts.activities}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Activities</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.secondaryBackground, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statValue, { color: theme.textPrimary }]}>{setupCounts.recommended}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Recommended</Text>
                  </View>
                </View>

                <View style={styles.categorySummaryGrid}>
                  {previewCategories.map((category) => {
                    const activityCount = category.kpis.reduce(
                      (sum, kpi) => sum + kpi.activities.length,
                      0
                    );
                    return (
                      <View
                        key={category.id}
                        style={[
                          styles.categorySummaryCard,
                          {
                            backgroundColor: theme.secondaryBackground,
                            borderColor: theme.cardBorder,
                          },
                        ]}>
                        <View
                          style={[
                            styles.categoryIconWrap,
                            {
                              backgroundColor: theme.inputBackground,
                              borderColor: theme.cardBorder,
                            },
                          ]}>
                          <MaterialIcons
                            name={(categoryIconMap[category.name] || 'insights') as never}
                            size={20}
                            color={theme.primary}
                          />
                        </View>
                        <Text style={[styles.categorySummaryTitle, { color: theme.textPrimary }]}>
                          {category.name}
                        </Text>
                        <Text style={[styles.categorySummaryMeta, { color: theme.textSecondary }]}>
                          {`${category.kpis.length} KPIs`}
                        </Text>
                        <Text style={[styles.categorySummaryMeta, { color: theme.textSecondary }]}>
                          {`${activityCount} Activities`}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: theme.buttonPrimary,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => setMode('review')}
                    activeOpacity={0.85}>
                    <Text style={styles.primaryButtonText}>Review & Customize</Text>
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
                      setMode('questions');
                    }}
                    activeOpacity={0.85}>
                    <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                      Back
                    </Text>
                  </TouchableOpacity>
                </View>
              </SectionCard>
            </>
          ) : null}

          {mode === 'review' && generatedSetup ? (
            <>
              <SectionCard
                style={{
                  backgroundColor: theme.secondaryBackground,
                  borderColor: theme.cardBorder,
                }}>
                <Text style={[styles.reviewTitle, { color: theme.textPrimary }]}>
                  Review & Customize
                </Text>
                <Text style={[styles.reviewText, { color: theme.textSecondary }]}>
                  Adjust names, remove anything unnecessary, and keep the best starting version.
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
                      {isSaving ? t('onboarding.saving') : 'Save My Life System'}
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
                    onPress={() => setEditableReview((prev) => !prev)}
                    activeOpacity={0.85}>
                    <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                      {editableReview ? 'Done Editing' : 'Edit'}
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
                    onPress={() => setMode('preview')}
                    activeOpacity={0.85}>
                    <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                      Back
                    </Text>
                  </TouchableOpacity>
                </View>
              </SectionCard>

              <GeneratedSetupPreview
                setup={activeSetupForPreview ?? generatedSetup}
                editable={editableReview}
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
                              field === 'frequency' ? normalizeFrequency(value) : value,
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
          ) : null}

          {mode === 'success' ? (
            <SectionCard
              style={[
                styles.heroCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                },
              ]}>
              <View style={styles.heroLogoWrap}>
                <LifeBuddyAvatar size={84} />
              </View>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Your Life System is Ready</Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Life Buddy prepared your first categories, KPIs, and responsibilities.
              </Text>

              {savedSetupSnapshot ? (
                <Text style={[styles.successMeta, { color: theme.textMuted }]}>
                  {`${savedSetupSnapshot.categories.length} categories, ${setupCounts.kpis} KPIs, ${setupCounts.activities} activities`}
                </Text>
              ) : null}

              <View style={styles.heroActionColumn}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={() => router.replace('/(tabs)')}
                  activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>Open My Dashboard</Text>
                </TouchableOpacity>
              </View>
            </SectionCard>
          ) : null}

          {mode === 'preview' && !generatedSetup ? (
            <EmptyState
              title="Nothing generated yet"
              subtitle="Finish the setup steps first and Life Buddy will build your starter system."
            />
          ) : null}
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  heroLogoWrap: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 520,
  },
  heroActionColumn: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
    marginTop: 24,
  },
  questionHeader: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 620,
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
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    minWidth: 132,
    flexGrow: 1,
    borderWidth: 1,
    padding: 14,
    borderRadius: 18,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  categorySummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  categorySummaryCard: {
    width: 176,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categorySummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  categorySummaryMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  reviewTitle: {
    fontSize: 20,
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
    minHeight: 46,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    minHeight: 46,
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
  successMeta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
});
