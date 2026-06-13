import { defaultReminderPreferences } from '@/context/PreferencesContext';
import i18n from '@/src/localization/i18n';
import {
  assetOptions,
  currentFocusOptions,
  interestOptions,
  lifeStageOptions,
  lifeLibraryActivities,
  lifeLibraryCategories,
  lifeLibraryKpis,
  lifeLibraryRules,
  responsibilityOptions,
  relationshipOptions,
  relationshipTrackerTemplates,
  roleOptions,
} from '@/src/data/lifeLibrary';
import {
  GeneratedOnboardingCategory,
  GeneratedOnboardingSetup,
  GeneratedRelationshipTracker,
  LifeLibraryActivityTemplate,
  LifeLibraryKpiTemplate,
  OnboardingSelections,
} from '@/types/onboarding';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const categoryById = new Map(lifeLibraryCategories.map((category) => [category.id, category]));
const kpiById = new Map(lifeLibraryKpis.map((kpi) => [kpi.id, kpi]));
const activityById = new Map(lifeLibraryActivities.map((activity) => [activity.id, activity]));
const kpisByCategoryId = new Map<string, LifeLibraryKpiTemplate[]>();
const activitiesByKpiId = new Map<string, LifeLibraryActivityTemplate[]>();
const triggerLabelById = new Map(
  [
    ...roleOptions,
    ...lifeStageOptions,
    ...relationshipOptions,
    ...responsibilityOptions,
    ...assetOptions,
    ...interestOptions,
    ...currentFocusOptions,
  ].map((option) => [option.id, option.label ?? option.labelKey ?? option.id])
);

function getOptionLabel(optionId: string): string {
  const labelOrKey = triggerLabelById.get(optionId);
  if (!labelOrKey) return fallbackTitle(optionId);
  if (!labelOrKey.includes('.')) return labelOrKey;
  return t(labelOrKey, fallbackTitle(optionId));
}

function t(key: string | undefined, fallback: string): string {
  if (!key) return fallback;
  return i18n.t(key, { defaultValue: fallback });
}

function fallbackTitle(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function cleanGeneratedTitle(value: string, categoryName?: string): string {
  let nextValue = value.trim();

  nextValue = nextValue.replace(/^(activity|kpi|category)\s+/i, '');

  if (categoryName) {
    const escapedCategory = categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    nextValue = nextValue.replace(new RegExp(`^${escapedCategory}\\s+`, 'i'), '');
  }

  return nextValue.trim();
}

for (const kpi of lifeLibraryKpis) {
  const current = kpisByCategoryId.get(kpi.categoryId) ?? [];
  current.push(kpi);
  kpisByCategoryId.set(kpi.categoryId, current);
}

for (const activity of lifeLibraryActivities) {
  const current = activitiesByKpiId.get(activity.kpiId) ?? [];
  current.push(activity);
  activitiesByKpiId.set(activity.kpiId, current);
}

function createGeneratedCategory(
  categoryId: string,
  activeKpiIds: Set<string>,
  activeActivityIds: Set<string>,
  activityReasonsById: Map<string, string[]>,
  kpiReasonsById: Map<string, string[]>
): GeneratedOnboardingCategory | null {
  const template = categoryById.get(categoryId);
  if (!template) return null;

  const matchingKpis = (kpisByCategoryId.get(categoryId) ?? []).filter((kpi) =>
    activeKpiIds.has(kpi.id)
  );

  const kpisWithSpecificActivities = new Set(
    [...activeActivityIds]
      .map((activityId) => activityById.get(activityId)?.kpiId)
      .filter((value): value is string => Boolean(value))
  );

  return {
    id: makeId('category'),
    name: cleanGeneratedTitle(t(template.nameKey, fallbackTitle(template.id))),
    kpis: matchingKpis.map((kpi) => ({
      id: makeId('kpi'),
      name: cleanGeneratedTitle(
        t(kpi.nameKey, fallbackTitle(kpi.id)),
        t(template.nameKey, fallbackTitle(template.id))
      ),
      categoryName: cleanGeneratedTitle(t(template.nameKey, fallbackTitle(template.id))),
      target: kpi.target,
      unit: kpi.unit,
      weight: kpi.weight,
      activities: (activitiesByKpiId.get(kpi.id) ?? [])
        .filter((activity) =>
          activeActivityIds.size === 0
            ? true
            : activeActivityIds.has(activity.id) || !kpisWithSpecificActivities.has(kpi.id)
        )
        .map((activity) => {
          const reasons = activityReasonsById.get(activity.id) ?? kpiReasonsById.get(kpi.id) ?? [];
          return {
          id: makeId('activity'),
          name: cleanGeneratedTitle(
            t(activity.nameKey, fallbackTitle(activity.id)),
            t(template.nameKey, fallbackTitle(template.id))
          ),
          frequency: activity.frequency,
          targetCount: activity.targetCount,
          importanceScore: activity.importanceScore,
          recommended: activity.recommended,
          defaultFrequency: activity.defaultFrequency,
          reason: reasons.join(', '),
          sourceTriggers: reasons,
          selected: activity.recommended,
          };
        })
        .sort((a, b) => {
          if (a.recommended !== b.recommended) {
            return a.recommended ? -1 : 1;
          }
          return (b.importanceScore ?? 0) - (a.importanceScore ?? 0);
        }),
    })),
  };
}

function activeTriggersFromSelections(selections: OnboardingSelections): string[] {
  return Array.from(
    new Set([
      ...selections.roles,
      ...selections.lifeStages,
      ...selections.relationships,
      ...selections.responsibilities,
      ...selections.assets,
      ...selections.interests,
      ...selections.priorities,
      ...selections.currentFocus,
    ])
  );
}

function buildRelationshipTrackers(selections: OnboardingSelections): GeneratedRelationshipTracker[] {
  const selectedTriggerSet = new Set([
    ...selections.relationships,
    ...selections.responsibilities,
  ]);

  return relationshipTrackerTemplates
    .filter((template) => selectedTriggerSet.has(template.trigger))
    .map((relationship) => ({
      id: makeId('relationship'),
      name: t(relationship.nameKey, fallbackTitle(relationship.trigger)),
      relationshipType: t(relationship.relationshipTypeKey, 'Other'),
      groupName: t(relationship.groupNameKey, 'Other'),
      frequency: relationship.frequency,
      todoTitle: t(relationship.todoTitleKey, 'Follow Up'),
      notes: relationship.notesKey ? t(relationship.notesKey, '') : undefined,
    }));
}

function buildSummary(categoryNames: string[], selections: OnboardingSelections): string {
  const highlightedAreas = categoryNames.slice(0, 4).join(', ');
  const relationshipCount = selections.relationships.length;
  const assetCount = selections.assets.length;

  if (relationshipCount > 0 && assetCount > 0) {
    return `Life Buddy built a starter system around ${highlightedAreas}, with ${relationshipCount} relationship tracker${relationshipCount === 1 ? '' : 's'} and ${assetCount} managed asset${assetCount === 1 ? '' : 's'}.`;
  }

  return `Life Buddy built a starter system around ${highlightedAreas} so you can start tracking without creating KPIs manually.`;
}

export function generateSetupFromSelections(
  selections: OnboardingSelections
): GeneratedOnboardingSetup {
  const activeTriggers = activeTriggersFromSelections(selections);
  const matchingRules = lifeLibraryRules.filter((rule) => activeTriggers.includes(rule.trigger));

  const activeCategoryIds = new Set<string>();
  const activeKpiIds = new Set<string>();
  const activeActivityIds = new Set<string>();
  const activityReasonsById = new Map<string, string[]>();
  const kpiReasonsById = new Map<string, string[]>();

  for (const rule of matchingRules) {
    const reasonLabel = getOptionLabel(rule.trigger);
    rule.categories.forEach((categoryId) => activeCategoryIds.add(categoryId));
    rule.kpis.forEach((kpiId) => {
      activeKpiIds.add(kpiId);
      const nextReasons = kpiReasonsById.get(kpiId) ?? [];
      if (!nextReasons.includes(reasonLabel)) {
        nextReasons.push(reasonLabel);
      }
      kpiReasonsById.set(kpiId, nextReasons);
    });
    rule.activities.forEach((activityId) => {
      activeActivityIds.add(activityId);
      const nextReasons = activityReasonsById.get(activityId) ?? [];
      if (!nextReasons.includes(reasonLabel)) {
        nextReasons.push(reasonLabel);
      }
      activityReasonsById.set(activityId, nextReasons);
    });
  }

  for (const activityId of activeActivityIds) {
    const activity = activityById.get(activityId);
    if (!activity) continue;
    activeKpiIds.add(activity.kpiId);
  }

  for (const kpiId of activeKpiIds) {
    const kpi = kpiById.get(kpiId);
    if (!kpi) continue;
    activeCategoryIds.add(kpi.categoryId);
  }

  if (activeCategoryIds.size === 0) {
    ['health', 'relationships', 'productivity'].forEach((categoryId) =>
      activeCategoryIds.add(categoryId)
    );
    ['health-sleep-rhythm', 'relationships-touchpoints', 'productivity-weekly-review'].forEach(
      (kpiId) => activeKpiIds.add(kpiId)
    );
  }

  const generatedCategories = [...activeCategoryIds]
    .map((categoryId) =>
      createGeneratedCategory(
        categoryId,
        activeKpiIds,
        activeActivityIds,
        activityReasonsById,
        kpiReasonsById
      )
    )
    .filter((category): category is GeneratedOnboardingCategory => Boolean(category))
    .filter((category) => category.kpis.length > 0);

  const categoryNames = generatedCategories.map((category) => category.name);

  return {
    summary: buildSummary(categoryNames, selections),
    categories: generatedCategories,
    relationships: buildRelationshipTrackers(selections),
    reminderPreferences: defaultReminderPreferences,
  };
}
