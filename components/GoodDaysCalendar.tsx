import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/components/SectionCard';
import { useTheme } from '@/context/ThemeContext';
import { GoodDaysMonthSummary } from '@/services/goodDaysEngine';

interface GoodDaysCalendarProps {
  summary: GoodDaysMonthSummary;
}

function statusColor(status: GoodDaysMonthSummary['cells'][number]['status'], theme: ReturnType<typeof useTheme>['theme']) {
  if (status === 'good') return theme.success;
  if (status === 'neutral') return theme.warning;
  if (status === 'bad') return theme.danger;
  return theme.cardBorder;
}

export function GoodDaysCalendar({ summary }: GoodDaysCalendarProps) {
  const { theme } = useTheme();

  return (
    <SectionCard>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Good Days Calendar</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{summary.monthLabel}</Text>

      <View style={styles.headerRow}>
        <View style={styles.headerBlock}>
          <Text style={[styles.bigCount, { color: theme.textPrimary }]}>
            {summary.goodDays} / {summary.daysElapsed}
          </Text>
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>
            Good Days This Month
          </Text>
        </View>
        <View style={styles.headerBlock}>
          <Text style={[styles.bigCount, { color: theme.textPrimary }]}>
            {summary.bestGoodDayStreak}
          </Text>
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>
            Best streak
          </Text>
        </View>
      </View>

      <Text style={[styles.message, { color: theme.textPrimary }]}>{summary.message}</Text>
      <Text style={[styles.helperText, { color: theme.textMuted }]}>Progress, not perfection</Text>

      <View style={styles.grid}>
        {summary.cells.map((cell) => (
          <View
            key={cell.date}
            style={[
              styles.cell,
              {
                backgroundColor: `${statusColor(cell.status, theme)}22`,
                borderColor: `${statusColor(cell.status, theme)}55`,
                borderRadius: theme.borderRadius.sm,
              },
            ]}>
            <Text style={[styles.cellText, { color: theme.textPrimary }]}>{cell.dayOfMonth}</Text>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        {[
          { label: 'Good', key: 'good' as const },
          { label: 'Neutral', key: 'neutral' as const },
          { label: 'Bad', key: 'bad' as const },
          { label: 'No Data', key: 'no_data' as const },
        ].map((item) => (
          <View key={item.key} style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                {
                  backgroundColor: `${statusColor(item.key, theme)}22`,
                  borderColor: `${statusColor(item.key, theme)}55`,
                  borderRadius: theme.borderRadius.sm,
                },
              ]}
            />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 10,
  },
  headerBlock: {
    minWidth: 120,
  },
  bigCount: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 3,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  message: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    marginBottom: 14,
  },
  cell: {
    width: 34,
    height: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 12,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
