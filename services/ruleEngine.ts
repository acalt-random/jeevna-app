import { defaultReminderPreferences } from '@/context/PreferencesContext';
import {
  assetOptions,
  interestOptions,
  lifeLibraryActivities,
  lifeLibraryCategories,
  lifeLibraryKpis,
  lifeLibraryRules,
  priorityOptions,
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
  [...roleOptions, ...relationshipOptions, ...assetOptions, ...interestOptions, ...priorityOptions].map(
    (option) => [option.id, option.label]
  )
);

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
    name: template.name,
    kpis: matchingKpis.map((kpi) => ({
      id: makeId('kpi'),
      name: kpi.name,
      categoryName: template.name,
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
          name: activity.name,
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
    ...selections.relationships,
    ...selections.assets,
    ...selections.interests,
    ...selections.priorities,
    ])
  );
}

function buildRelationshipTrackers(selections: OnboardingSelections): GeneratedRelationshipTracker[] {
  const selectedTriggerSet = new Set(selections.relationships);

  return relationshipTrackerTemplates
    .filter((template) => selectedTriggerSet.has(template.trigger))
    .map((relationship) => ({
      id: makeId('relationship'),
      ...relationship,
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
    const reasonLabel = triggerLabelById.get(rule.trigger) ?? rule.trigger;
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
