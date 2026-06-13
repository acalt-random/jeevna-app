import i18n from '@/src/localization/i18n';
import { lifeLibraryActivities, lifeLibraryCategories, lifeLibraryKpis, lifeLibraryPacks } from '@/src/data/lifeLibrary';
import { LocalePreferences } from '@/services/localeService';
import { LifeLibraryPack, LifeLibraryPackApplyPayload } from '@/types/lifeLibraryPack';

const categoryById = new Map(lifeLibraryCategories.map((item) => [item.id, item]));
const kpiById = new Map(lifeLibraryKpis.map((item) => [item.id, item]));
const activityById = new Map(lifeLibraryActivities.map((item) => [item.id, item]));

function fallbackLabel(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getLocalizedPackTitle(pack: LifeLibraryPack): string {
  return i18n.t(pack.titleKey, { defaultValue: fallbackLabel(pack.id) });
}

function getDefaultPackDescription(pack: LifeLibraryPack): string {
  const title = fallbackLabel(pack.id);
  if (pack.tags.length > 0) {
    return `${title} for ${pack.tags.slice(0, 3).join(', ')}.`;
  }
  return `${title} starter pack.`;
}

export function getLocalizedPackDescription(pack: LifeLibraryPack): string {
  return i18n.t(pack.descriptionKey, { defaultValue: getDefaultPackDescription(pack) });
}

export function getAvailableLifeLibraryPacks(localePreferences?: LocalePreferences): LifeLibraryPack[] {
  return lifeLibraryPacks.filter((pack) => {
    if (pack.archived) return false;
    if (!localePreferences) return true;
    const countryMatches =
      pack.countryCodes.length === 0 || pack.countryCodes.includes(localePreferences.countryCode);
    const localeMatches =
      pack.localeCodes.length === 0 || pack.localeCodes.includes(localePreferences.locale);
    return countryMatches && localeMatches;
  });
}

export function buildLifeLibraryPackApplyPayload(pack: LifeLibraryPack): LifeLibraryPackApplyPayload {
  const categories = pack.categoryIds
    .map((categoryId) => categoryById.get(categoryId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((category) => ({
      stableId: category.id,
      name: i18n.t(category.nameKey, { defaultValue: fallbackLabel(category.id) }),
    }));

  const categoriesByStableId = new Map(categories.map((category) => [category.stableId, category.name]));

  const kpis = pack.kpiIds
    .map((kpiId) => kpiById.get(kpiId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((kpi) => ({
      stableId: kpi.id,
      categoryStableId: kpi.categoryId,
      categoryName: categoriesByStableId.get(kpi.categoryId) ?? fallbackLabel(kpi.categoryId),
      name: i18n.t(kpi.nameKey, { defaultValue: fallbackLabel(kpi.id) }),
      target: kpi.target,
      unit: kpi.unit,
      weight: kpi.weight,
    }));

  const activities = pack.activityIds
    .map((activityId) => activityById.get(activityId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((activity) => ({
      stableId: activity.id,
      kpiStableId: activity.kpiId,
      name: i18n.t(activity.nameKey, { defaultValue: fallbackLabel(activity.id) }),
      frequency: activity.frequency,
      targetCount: activity.targetCount,
    }));

  return {
    stableId: pack.stableId,
    categories,
    kpis,
    activities,
  };
}

export function findLifeLibraryPackById(packId: string): LifeLibraryPack | undefined {
  return lifeLibraryPacks.find((pack) => pack.id === packId || pack.stableId === packId);
}
