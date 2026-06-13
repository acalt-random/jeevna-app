import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import i18n from '@/src/localization/i18n';

import { CategoryCard } from '@/components/CategoryCard';
import { CategoryGrid } from '@/components/CategoryGrid';
import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveGrid, ResponsiveGridItem } from '@/components/ResponsiveGrid';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useTheme } from '@/context/ThemeContext';
import { buildLifeLibraryPackApplyPayload, getAvailableLifeLibraryPacks, getLocalizedPackDescription, getLocalizedPackTitle } from '@/services/lifeLibraryPackService';
import { buildLifeBuddySuggestions } from '@/services/suggestionEngine';
import { categoryIconMap } from '@/src/design/icons';
import { lifeLibraryActivities, lifeLibraryCategories, lifeLibraryKpis } from '@/src/data/lifeLibrary';

function fallbackLabel(value: string): string {
  return value
    .replace(/^activity-/, '')
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function TemplatesScreen() {
  const {
    applyLifeLibraryPack,
    addCategory,
    addKPI,
    addSubtask,
    categories,
    kpis,
    subtasks,
  } = useAppData();
  const { localePreferences, onboardingProfile, suggestionDismissedUntil } = usePreferences();
  const { theme } = useTheme();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const categoryById = useMemo(
    () => new Map(lifeLibraryCategories.map((item) => [item.id, item])),
    []
  );
  const kpiById = useMemo(() => new Map(lifeLibraryKpis.map((item) => [item.id, item])), []);

  const packs = useMemo(() => getAvailableLifeLibraryPacks(localePreferences), [localePreferences]);

  const suggestions = useMemo(
    () =>
      buildLifeBuddySuggestions({
        profile: onboardingProfile,
        activeCategories: categories,
        activeKpis: kpis,
        activeSubtasks: subtasks,
        suggestionDismissedUntil,
        limit: 12,
      }),
    [categories, kpis, onboardingProfile, subtasks, suggestionDismissedUntil]
  );

  const recommendedCategories = useMemo(() => {
    const seen = new Set<string>();
    return suggestions
      .filter((item) => item.categoryId && !seen.has(item.categoryId))
      .map((item) => {
        seen.add(item.categoryId!);
        const category = categoryById.get(item.categoryId!);
        if (!category) return null;

        const localizedName = i18n.t(category.nameKey, { defaultValue: fallbackLabel(category.id) });
        return {
          id: category.id,
          name: localizedName,
          description: i18n.t(category.descriptionKey, {
            defaultValue: `${localizedName} starter ideas from your profile.`,
          }),
          suggestedCount: suggestions.filter((suggestion) => suggestion.categoryId === category.id).length,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, 6);
  }, [categoryById, suggestions]);

  const exploreCategories = useMemo(
    () =>
      lifeLibraryCategories.map((category) => {
        const localizedName = i18n.t(category.nameKey, { defaultValue: fallbackLabel(category.id) });
        return {
          id: category.id,
          name: localizedName,
          description: i18n.t(category.descriptionKey, {
            defaultValue: `${localizedName} ideas from the Life Library.`,
          }),
          kpiCount: lifeLibraryKpis.filter((kpi) => kpi.categoryId === category.id).length,
        };
      }),
    []
  );

  const activitiesToTry = useMemo(() => {
    const suggestionBacked = suggestions
      .filter((item) => item.type === 'activity' && item.activityLibraryId)
      .map((item) => {
        const activity = lifeLibraryActivities.find(
          (libraryActivity) => libraryActivity.id === item.activityLibraryId
        );
        const category = item.categoryId ? categoryById.get(item.categoryId) : undefined;
        const localizedCategory = category
          ? i18n.t(category.nameKey, { defaultValue: fallbackLabel(category.id) })
          : item.category;

        return {
          id: item.activityLibraryId!,
          title: item.title,
          categoryName: localizedCategory,
          frequency: item.frequency,
          recommended: item.recommended,
          importanceScore: item.importanceScore,
          reason: item.reason,
          kpiId: item.kpiId ?? activity?.kpiId,
        };
      });

    if (suggestionBacked.length >= 8) return suggestionBacked.slice(0, 8);

    const seen = new Set(suggestionBacked.map((item) => item.id));
    const fallbackItems = lifeLibraryActivities
      .filter((activity) => !seen.has(activity.id))
      .sort((left, right) => {
        if (left.recommended !== right.recommended) {
          return left.recommended ? -1 : 1;
        }
        return right.importanceScore - left.importanceScore;
      })
      .slice(0, 8 - suggestionBacked.length)
      .map((activity) => {
        const kpi = kpiById.get(activity.kpiId);
        const category = kpi ? categoryById.get(kpi.categoryId) : undefined;
        return {
          id: activity.id,
          title: i18n.t(activity.nameKey, { defaultValue: fallbackLabel(activity.id) }),
          categoryName: category
            ? i18n.t(category.nameKey, { defaultValue: fallbackLabel(category.id) })
            : 'Other',
          frequency: activity.defaultFrequency,
          recommended: activity.recommended,
          importanceScore: activity.importanceScore,
          reason: 'Life Library',
          kpiId: activity.kpiId,
        };
      });

    return [...suggestionBacked, ...fallbackItems];
  }, [categoryById, kpiById, suggestions]);

  const handleApplyPack = (packId: string) => {
    const pack = packs.find((item) => item.id === packId);
    if (!pack) return;
    applyLifeLibraryPack(buildLifeLibraryPackApplyPayload(pack));
    setSuccessMessage(`${getLocalizedPackTitle(pack)} installed.`);
  };

  const handleActivateActivity = (activityId: string) => {
    const activity = lifeLibraryActivities.find((item) => item.id === activityId);
    if (!activity) return;

    const kpiTemplate = kpiById.get(activity.kpiId);
    if (!kpiTemplate) return;

    const categoryTemplate = categoryById.get(kpiTemplate.categoryId);
    if (!categoryTemplate) return;

    const categoryName = i18n.t(categoryTemplate.nameKey, {
      defaultValue: fallbackLabel(categoryTemplate.id),
    });
    const kpiName = i18n.t(kpiTemplate.nameKey, {
      defaultValue: fallbackLabel(kpiTemplate.id),
    });
    const activityName = i18n.t(activity.nameKey, {
      defaultValue: fallbackLabel(activity.id),
    });

    const existingCategory = categories.find(
      (item) => item.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );
    if (!existingCategory) {
      addCategory(categoryName);
    }

    const existingKpi =
      kpis.find(
        (item) =>
          item.category.trim().toLowerCase() === categoryName.trim().toLowerCase() &&
          item.name.trim().toLowerCase() === kpiName.trim().toLowerCase()
      ) ??
      addKPI({
        name: kpiName,
        category: categoryName,
        target: kpiTemplate.target,
        unit: kpiTemplate.unit,
        weight: kpiTemplate.weight,
      });

    const existingSubtask = subtasks.find(
      (item) =>
        item.kpiId === existingKpi.id &&
        item.name.trim().toLowerCase() === activityName.trim().toLowerCase()
    );

    if (!existingSubtask) {
      addSubtask({
        kpiId: existingKpi.id,
        name: activityName,
        frequency: activity.defaultFrequency,
        targetCount: activity.targetCount,
      });
    }

    setSuccessMessage(`${activityName} activated in ${categoryName}.`);
  };

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Life Library"
          subtitle="Explore starter categories, activities, and packs you can activate without duplicates."
        />

        {successMessage ? (
          <Text style={[styles.feedback, { color: theme.success }]}>{successMessage}</Text>
        ) : null}

        <SectionCard
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.cardBorder,
          }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recommended For You</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Life Buddy is surfacing the categories your profile points toward next.
          </Text>

          {recommendedCategories.length === 0 ? (
            <EmptyState
              title="No recommendations yet"
              subtitle="Finish onboarding or activate more areas and the library will tailor itself."
            />
          ) : (
            <CategoryGrid
              items={recommendedCategories}
              keyExtractor={(item) => item.id}
              renderItem={(item) => (
                <CategoryCard
                  title={item.name}
                  subtitle={item.description}
                  badgeText={`${item.suggestedCount} suggestions`}
                  iconName={(categoryIconMap[item.name] || 'dashboard') as never}
                  onPress={() =>
                    router.push({
                      pathname: '/category/[categoryName]',
                      params: { categoryName: item.name },
                    })
                  }
                />
              )}
            />
          )}
        </SectionCard>

        <SectionCard>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Explore by Category</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Open a category command center and use it as the front door into that life area.
          </Text>

          <CategoryGrid
            items={exploreCategories}
            keyExtractor={(item) => item.id}
            renderItem={(item) => (
              <CategoryCard
                title={item.name}
                subtitle={item.description}
                badgeText={`${item.kpiCount} KPIs`}
                iconName={(categoryIconMap[item.name] || 'dashboard') as never}
                onPress={() =>
                  router.push({
                    pathname: '/category/[categoryName]',
                    params: { categoryName: item.name },
                  })
                }
              />
            )}
          />
        </SectionCard>

        <SectionCard>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Activities to Try</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Light-weight additions from the library that can become real responsibilities in one tap.
          </Text>

          <ResponsiveGrid gap={14}>
            {activitiesToTry.map((activity) => (
              <ResponsiveGridItem
                key={activity.id}
                mobileSpan={1}
                tabletSpan={3}
                desktopSpan={4}>
                <View
                  style={[
                    styles.activityCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.cardBorder,
                      borderRadius: theme.borderRadius.lg,
                    },
                  ]}>
                  <View style={styles.activityHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>
                        {activity.title}
                      </Text>
                      <Text style={[styles.activityMeta, { color: theme.textSecondary }]}>
                        {activity.categoryName} • {activity.frequency}
                      </Text>
                    </View>
                    {activity.recommended ? (
                      <View
                        style={[
                          styles.recommendedBadge,
                          {
                            backgroundColor: theme.secondaryBackground,
                            borderColor: `${theme.primary}55`,
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}>
                        <Text style={[styles.recommendedBadgeText, { color: theme.primary }]}>
                          Recommended
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={[styles.activityReason, { color: theme.textMuted }]}>
                    {activity.reason}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.activateButton,
                      {
                        backgroundColor: theme.buttonPrimary,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => handleActivateActivity(activity.id)}
                    activeOpacity={0.84}>
                    <Text style={styles.activateButtonText}>Activate</Text>
                  </TouchableOpacity>
                </View>
              </ResponsiveGridItem>
            ))}
          </ResponsiveGrid>
        </SectionCard>

        <SectionCard>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Starter Packs</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Packs are still here when you want a faster install, but categories and activities come first.
          </Text>

          <ResponsiveGrid gap={14}>
            {packs.map((pack) => (
              <ResponsiveGridItem key={pack.id} mobileSpan={1} tabletSpan={3} desktopSpan={4}>
                <View
                  style={[
                    styles.packCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.cardBorder,
                      borderRadius: theme.borderRadius.lg,
                    },
                  ]}>
                  <Text style={[styles.packTitle, { color: theme.textPrimary }]}>
                    {getLocalizedPackTitle(pack)}
                  </Text>
                  <Text style={[styles.packBlurb, { color: theme.textSecondary }]}>
                    {getLocalizedPackDescription(pack)}
                  </Text>
                  <Text style={[styles.packMeta, { color: theme.textMuted }]}>
                    {pack.categoryIds.length} categories • {pack.kpiIds.length} KPIs •{' '}
                    {pack.activityIds.length} activities
                  </Text>
                  <Text style={[styles.packMeta, { color: theme.textMuted }]}>
                    {pack.difficulty} • about {pack.estimatedSetupMinutes} min
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.activateButton,
                      {
                        backgroundColor: theme.buttonPrimary,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => handleApplyPack(pack.id)}
                    activeOpacity={0.84}>
                    <Text style={styles.activateButtonText}>Apply pack</Text>
                  </TouchableOpacity>
                </View>
              </ResponsiveGridItem>
            ))}
          </ResponsiveGrid>
        </SectionCard>
      </PageContainer>
    </ScrollView>
  );

  return <DesktopShell title="Life Library">{pageContent}</DesktopShell>;
}

const styles = StyleSheet.create({
  feedback: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  activityCard: {
    borderWidth: 1,
    padding: 16,
    minHeight: 196,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  activityReason: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  recommendedBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  activateButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 'auto',
  },
  activateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  packCard: {
    borderWidth: 1,
    padding: 16,
    minHeight: 214,
  },
  packTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  packBlurb: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  packMeta: {
    fontSize: 13,
    marginBottom: 8,
  },
});
