import { Category, KPI, Subtask, SubtaskFrequency } from '@/context/AppDataContext';
import { OnboardingProfile } from '@/context/PreferencesContext';
import {
  assetOptions,
  interestOptions,
  lifeLibraryActivities,
  lifeLibraryCategories,
  lifeLibraryKpis,
  lifeLibraryRules,
  priorityOptions,
  relationshipOptions,
  roleOptions,
} from '@/src/data/lifeLibrary';

export interface LifeBuddySuggestion {
  id: string;
  title: string;
  type: 'activity' | 'kpi';
  category: string;
  reason: string;
  sourceTriggers: string[];
  importanceScore: number;
  frequency: SubtaskFrequency;
  recommended: boolean;
  kpiId?: string;
  kpiName?: string;
  activityName?: string;
  activityLibraryId?: string;
  targetCount?: number;
  categoryId?: string;
}

type TriggerLabel = {
  id: string;
  label: string;
};

const triggerLabels = new Map<string, string>(
  [...roleOptions, ...relationshipOptions, ...assetOptions, ...interestOptions, ...priorityOptions].map(
    (option: TriggerLabel) => [option.id, option.label]
  )
);

const categoryById = new Map(lifeLibraryCategories.map((category) => [category.id, category]));
const kpiById = new Map(lifeLibraryKpis.map((kpi) => [kpi.id, kpi]));

function uniqueTriggers(profile: OnboardingProfile): string[] {
  return Array.from(
    new Set([
      ...profile.roles,
      ...profile.relationships,
      ...profile.assets,
      ...profile.interests,
      ...profile.priorities,
    ])
  );
}

function isStillDismissed(untilDate?: string): boolean {
  if (!untilDate) return false;
  const today = new Date();
  const until = new Date(untilDate);
  return !Number.isNaN(until.getTime()) && until >= today;
}

function categoryKey(name: string): string {
  return name.trim().toLowerCase();
}

function kpiKey(categoryName: string, name: string): string {
  return `${categoryName.trim().toLowerCase()}::${name.trim().toLowerCase()}`;
}

function activityKey(kpiId: string, name: string): string {
  return `${kpiId.trim()}::${name.trim().toLowerCase()}`;
}

function categoryMatchesIds(activeCategories: Category[]): Set<string> {
  const keys = new Set(activeCategories.map((category) => categoryKey(category.name)));
  const ids = new Set<string>();

  for (const category of lifeLibraryCategories) {
    if (keys.has(categoryKey(category.name))) {
      ids.add(category.id);
    }
  }

  return ids;
}

function activeLibraryKpiIds(activeKpis: KPI[]): Set<string> {
  const activeKeys = new Set(activeKpis.map((kpi) => kpiKey(kpi.category, kpi.name)));
  const ids = new Set<string>();

  for (const kpi of lifeLibraryKpis) {
    const category = categoryById.get(kpi.categoryId);
    if (!category) continue;
    if (activeKeys.has(kpiKey(category.name, kpi.name))) {
      ids.add(kpi.id);
    }
  }

  return ids;
}

function activeLibraryActivityKeys(activeSubtasks: Subtask[], activeKpis: KPI[]): Set<string> {
  const kpiLookup = new Map(activeKpis.map((kpi) => [kpi.id, kpi]));
  const keys = new Set<string>();

  for (const subtask of activeSubtasks) {
    const parentKpi = kpiLookup.get(subtask.kpiId);
    if (!parentKpi) continue;

    const libraryKpi = lifeLibraryKpis.find(
      (kpi) =>
        kpi.name.trim().toLowerCase() === parentKpi.name.trim().toLowerCase() &&
        categoryById.get(kpi.categoryId)?.name.trim().toLowerCase() ===
          parentKpi.category.trim().toLowerCase()
    );

    if (!libraryKpi) continue;
    keys.add(activityKey(libraryKpi.id, subtask.name));
  }

  return keys;
}

export function buildLifeBuddySuggestions(params: {
  profile: OnboardingProfile;
  activeCategories: Category[];
  activeKpis: KPI[];
  activeSubtasks: Subtask[];
  suggestionDismissedUntil: Record<string, string>;
  limit?: number;
}): LifeBuddySuggestion[] {
  const {
    profile,
    activeCategories,
    activeKpis,
    activeSubtasks,
    suggestionDismissedUntil,
    limit = 8,
  } = params;

  const triggers = uniqueTriggers(profile);
  if (triggers.length === 0) return [];

  const activeCategoryIds = categoryMatchesIds(activeCategories);
  const activeKpiIds = activeLibraryKpiIds(activeKpis);
  const activeActivityKeys = activeLibraryActivityKeys(activeSubtasks, activeKpis);

  const suggestions = new Map<string, LifeBuddySuggestion>();

  for (const rule of lifeLibraryRules) {
    if (!triggers.includes(rule.trigger)) continue;

    const reasonLabel = triggerLabels.get(rule.trigger) ?? rule.trigger;

    for (const activityId of rule.activities) {
      const activity = lifeLibraryActivities.find((item) => item.id === activityId);
      if (!activity) continue;

      const kpi = kpiById.get(activity.kpiId);
      if (!kpi) continue;

      const category = categoryById.get(kpi.categoryId);
      if (!category) continue;

      if (activeActivityKeys.has(activityKey(kpi.id, activity.name))) continue;

      const suggestionId = `activity:${activity.id}`;
      if (isStillDismissed(suggestionDismissedUntil[suggestionId])) continue;

      const existing = suggestions.get(suggestionId);
      const sourceTriggers = existing?.sourceTriggers ?? [];
      if (!sourceTriggers.includes(reasonLabel)) {
        sourceTriggers.push(reasonLabel);
      }

      suggestions.set(suggestionId, {
        id: suggestionId,
        title: activity.name,
        type: 'activity',
        category: category.name,
        reason: sourceTriggers.join(', '),
        sourceTriggers,
        importanceScore: activity.importanceScore,
        frequency: activity.defaultFrequency,
        recommended: activity.recommended,
        kpiId: kpi.id,
        kpiName: kpi.name,
        activityName: activity.name,
        activityLibraryId: activity.id,
        targetCount: activity.targetCount,
        categoryId: category.id,
      });
    }

    for (const kpiId of rule.kpis) {
      const kpi = kpiById.get(kpiId);
      if (!kpi) continue;
      if (activeKpiIds.has(kpi.id)) continue;

      const category = categoryById.get(kpi.categoryId);
      if (!category) continue;

      const suggestionId = `kpi:${kpi.id}`;
      if (isStillDismissed(suggestionDismissedUntil[suggestionId])) continue;

      const topActivity = lifeLibraryActivities
        .filter((activity) => activity.kpiId === kpi.id)
        .sort((left, right) => {
          if (left.recommended !== right.recommended) {
            return left.recommended ? -1 : 1;
          }
          return right.importanceScore - left.importanceScore;
        })[0];

      const existing = suggestions.get(suggestionId);
      const sourceTriggers = existing?.sourceTriggers ?? [];
      if (!sourceTriggers.includes(reasonLabel)) {
        sourceTriggers.push(reasonLabel);
      }

      suggestions.set(suggestionId, {
        id: suggestionId,
        title: kpi.name,
        type: 'kpi',
        category: category.name,
        reason: sourceTriggers.join(', '),
        sourceTriggers,
        importanceScore: topActivity?.importanceScore ?? 5,
        frequency: topActivity?.defaultFrequency ?? kpi.recommendedFrequency,
        recommended: topActivity?.recommended ?? true,
        kpiId: kpi.id,
        kpiName: kpi.name,
        categoryId: category.id,
      });
    }

    for (const categoryId of rule.categories) {
      if (activeCategoryIds.has(categoryId)) continue;

      const category = categoryById.get(categoryId);
      if (!category) continue;

      const categoryKpis = lifeLibraryKpis.filter((kpi) => kpi.categoryId === categoryId);
      const candidateKpi = categoryKpis.find((kpi) => !activeKpiIds.has(kpi.id)) ?? categoryKpis[0];
      if (!candidateKpi) continue;

      const topActivity = lifeLibraryActivities
        .filter((activity) => activity.kpiId === candidateKpi.id)
        .sort((left, right) => {
          if (left.recommended !== right.recommended) {
            return left.recommended ? -1 : 1;
          }
          return right.importanceScore - left.importanceScore;
        })[0];

      const suggestionId = `category:${category.id}`;
      if (isStillDismissed(suggestionDismissedUntil[suggestionId])) continue;

      const existing = suggestions.get(suggestionId);
      const sourceTriggers = existing?.sourceTriggers ?? [];
      if (!sourceTriggers.includes(reasonLabel)) {
        sourceTriggers.push(reasonLabel);
      }

      suggestions.set(suggestionId, {
        id: suggestionId,
        title: topActivity?.name ?? candidateKpi.name,
        type: 'activity',
        category: category.name,
        reason: sourceTriggers.join(', '),
        sourceTriggers,
        importanceScore: topActivity?.importanceScore ?? 5,
        frequency: topActivity?.defaultFrequency ?? candidateKpi.recommendedFrequency,
        recommended: topActivity?.recommended ?? true,
        kpiId: candidateKpi.id,
        kpiName: candidateKpi.name,
        activityName: topActivity?.name,
        categoryId: category.id,
      });
    }
  }

  return [...suggestions.values()]
    .sort((left, right) => {
      if (left.recommended !== right.recommended) {
        return left.recommended ? -1 : 1;
      }
      if (left.importanceScore !== right.importanceScore) {
        return right.importanceScore - left.importanceScore;
      }
      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}
