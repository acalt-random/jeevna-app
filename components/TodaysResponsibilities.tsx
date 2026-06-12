import { SectionCard } from '@/components/SectionCard';
import { useTheme } from '@/context/ThemeContext';
import { ResponsibilityItem } from '@/services/responsibilityEngine';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ResponsibilityListProps {
  title: string;
  items: ResponsibilityItem[];
  emptyText: string;
  onOpenCategory: (categoryName: string) => void;
  onToggleComplete?: (item: ResponsibilityItem) => void;
}

function StatusPill({ label }: { label: ResponsibilityItem['status'] }) {
  const { theme } = useTheme();

  const colors =
    label === 'Completed'
      ? { background: `${theme.success}22`, text: theme.success }
      : label === 'Rescheduled'
        ? { background: `${theme.warning}22`, text: theme.warning }
        : label === 'Missed'
          ? { background: `${theme.danger}22`, text: theme.danger }
          : { background: theme.buttonSecondary, text: theme.textSecondary };

  return (
    <View
      style={[
        styles.statusPill,
        {
          backgroundColor: colors.background,
          borderColor: theme.cardBorder,
          borderRadius: theme.borderRadius.sm,
        },
      ]}>
      <Text style={[styles.statusPillText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function ResponsibilityList({
  title,
  items,
  emptyText,
  onOpenCategory,
  onToggleComplete,
}: ResponsibilityListProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.countText, { color: theme.textMuted }]}>{items.length}</Text>
      </View>

      {items.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{emptyText}</Text>
      ) : (
        items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.itemCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
              },
            ]}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {item.category} | {item.kpiName}
                </Text>
              </View>
              <StatusPill label={item.status} />
            </View>

            <Text style={[styles.itemHint, { color: theme.textMuted }]}>
              {item.isOverdue && item.dueDate
                ? `Overdue by ${item.daysOverdue} day(s) since ${item.dueDate}`
                : item.isDueToday
                  ? `Due today | ${item.frequency} | target ${item.targetCount}`
                  : item.completedDate
                    ? `Completed on ${item.completedDate}`
                    : `${item.frequency} | target ${item.targetCount}`}
            </Text>

            <View style={styles.actionsRow}>
              {onToggleComplete ? (
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: theme.borderRadius.sm,
                    },
                  ]}
                  onPress={() => onToggleComplete(item)}
                  activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>
                    {item.isCompletedToday ? 'Undo' : 'Complete'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.buttonSecondary,
                    borderColor: theme.cardBorder,
                    borderRadius: theme.borderRadius.sm,
                  },
                ]}
                onPress={() => onOpenCategory(item.category)}
                activeOpacity={0.85}>
                <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                  Open Category
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

interface TodaysResponsibilitiesProps {
  dueToday: ResponsibilityItem[];
  overdue: ResponsibilityItem[];
  completedToday: ResponsibilityItem[];
  onOpenCategory: (categoryName: string) => void;
  onToggleComplete: (item: ResponsibilityItem) => void;
}

export function TodaysResponsibilities({
  dueToday,
  overdue,
  completedToday,
  onOpenCategory,
  onToggleComplete,
}: TodaysResponsibilitiesProps) {
  const { theme } = useTheme();

  return (
    <SectionCard>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Today&apos;s Responsibilities</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Activities now behave like living responsibilities with state, due timing, and accountability.
      </Text>

      <ResponsibilityList
        title="Due Today"
        items={dueToday}
        emptyText="No responsibilities are due today."
        onOpenCategory={onOpenCategory}
        onToggleComplete={onToggleComplete}
      />
      <ResponsibilityList
        title="Overdue"
        items={overdue}
        emptyText="Nothing is overdue right now."
        onOpenCategory={onOpenCategory}
        onToggleComplete={onToggleComplete}
      />
      <ResponsibilityList
        title="Completed Today"
        items={completedToday}
        emptyText="Nothing completed yet today."
        onOpenCategory={onOpenCategory}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  sectionBlock: {
    marginTop: 6,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemCard: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  itemMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  itemHint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  primaryButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
