import { SectionCard } from '@/components/SectionCard';
import { useTheme } from '@/context/ThemeContext';
import { GeneratedOnboardingActivity, GeneratedOnboardingCategory } from '@/types/onboarding';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type RecommendationItem = {
  activity: GeneratedOnboardingActivity;
  categoryName: string;
  kpiName: string;
};

interface LifeBuddyRecommendationsProps {
  categories: GeneratedOnboardingCategory[];
  isCustomizing: boolean;
  onActivateAllRecommended: () => void;
  onStartCustomizing: () => void;
  onContinue: () => void;
  onToggleActivity: (activityId: string) => void;
}

function formatFrequency(activity: GeneratedOnboardingActivity): string {
  const count = activity.targetCount ?? 1;
  return `${activity.frequency} x${count}`;
}

function RecommendationRow({
  item,
  isCustomizing,
  onToggle,
}: {
  item: RecommendationItem;
  isCustomizing: boolean;
  onToggle: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.rowCard,
        {
          backgroundColor: theme.background,
          borderColor: item.activity.selected ? theme.primary : theme.cardBorder,
          borderRadius: theme.borderRadius.md,
        },
      ]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{item.activity.name}</Text>
        <Text style={[styles.rowMeta, { color: theme.textSecondary }]}>
          {formatFrequency(item.activity)}
        </Text>
        <Text style={[styles.rowReason, { color: theme.textMuted }]}>
          {t('onboarding.recommendations.reasonLabel')}: {' '}
          {item.activity.reason ?? t('onboarding.recommendations.fallbackReason')}
        </Text>
        <Text style={[styles.rowHint, { color: theme.textMuted }]}>
          {item.categoryName} {'->'} {item.kpiName}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.statusPill,
          {
            backgroundColor: item.activity.selected ? theme.buttonPrimary : theme.buttonSecondary,
            borderColor: item.activity.selected ? theme.buttonPrimary : theme.cardBorder,
            borderRadius: theme.borderRadius.sm,
            opacity: isCustomizing ? 1 : item.activity.selected ? 1 : 0.82,
          },
        ]}
        onPress={isCustomizing ? onToggle : undefined}
        disabled={!isCustomizing}
        activeOpacity={0.85}>
        <Text
          style={[
            styles.statusPillText,
            { color: item.activity.selected ? '#ffffff' : theme.textPrimary },
          ]}>
          {item.activity.selected
            ? t('onboarding.recommendations.selected')
            : t('onboarding.recommendations.available')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function LifeBuddyRecommendations({
  categories,
  isCustomizing,
  onActivateAllRecommended,
  onStartCustomizing,
  onContinue,
  onToggleActivity,
}: LifeBuddyRecommendationsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const flattenedItems: RecommendationItem[] = categories.flatMap((category) =>
    category.kpis.flatMap((kpi) =>
      kpi.activities.map((activity) => ({
        activity,
        categoryName: category.name,
        kpiName: kpi.name,
      }))
    )
  );

  const sortedItems = [...flattenedItems].sort((left, right) => {
    const leftRecommended = left.activity.recommended ? 1 : 0;
    const rightRecommended = right.activity.recommended ? 1 : 0;
    if (leftRecommended !== rightRecommended) {
      return rightRecommended - leftRecommended;
    }
    return (right.activity.importanceScore ?? 0) - (left.activity.importanceScore ?? 0);
  });

  const recommendedItems = sortedItems.filter((item) => item.activity.recommended);
  const optionalItems = sortedItems.filter((item) => !item.activity.recommended);

  return (
    <View>
      <SectionCard
        style={{
          backgroundColor: theme.secondaryBackground,
          borderColor: theme.cardBorder,
        }}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('onboarding.recommendations.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('onboarding.recommendations.subtitle')}
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.buttonPrimary,
                borderRadius: theme.borderRadius.md,
              },
            ]}
            onPress={onActivateAllRecommended}
            activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>
              {t('onboarding.recommendations.activateAll')}
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
            onPress={onStartCustomizing}
            activeOpacity={0.85}>
            <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
              {t('onboarding.recommendations.customize')}
            </Text>
          </TouchableOpacity>

          {isCustomizing ? (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: theme.buttonSecondary,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={onContinue}
              activeOpacity={0.85}>
              <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                {t('common.continue')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {t('onboarding.recommendations.recommendedTitle')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          {t('onboarding.recommendations.recommendedSubtitle')}
        </Text>
        {recommendedItems.map((item) => (
          <RecommendationRow
            key={item.activity.id}
            item={item}
            isCustomizing={isCustomizing}
            onToggle={() => onToggleActivity(item.activity.id)}
          />
        ))}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {t('onboarding.recommendations.optionalTitle')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          {t('onboarding.recommendations.optionalSubtitle')}
        </Text>
        {optionalItems.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {t('onboarding.recommendations.optionalEmpty')}
          </Text>
        ) : (
          optionalItems.map((item) => (
            <RecommendationRow
              key={item.activity.id}
              item={item}
              isCustomizing={isCustomizing}
              onToggle={() => onToggleActivity(item.activity.id)}
            />
          ))
        )}
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  buttonRow: {
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
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  rowCard: {
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  rowReason: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  rowHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  statusPill: {
    minWidth: 90,
    minHeight: 34,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
