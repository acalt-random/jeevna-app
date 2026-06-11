import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import {
  defaultLifeBuddyScoringPreferences,
  ScoringSection,
  usePreferences,
} from '@/context/PreferencesContext';
import { useTheme } from '@/context/ThemeContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type PriorityItem = {
  id: string;
  title: string;
  description: string;
  priority: number;
};

type AttentionPerson = {
  id: string;
  name: string;
  groupName: string;
  relationshipType: string;
  score: number;
  daysSinceContact: number | null;
};

type OverdueTodo = {
  id: string;
  title: string;
  personName: string;
  relationshipType: string;
  dueDate: string;
  overdueDays: number;
};

type WeakCategory = {
  id: string;
  name: string;
  score: number;
  kpiCount: number;
} | null;

type PendingKpi = {
  id: string;
  name: string;
  category: string;
  unit: string;
  missedDays: number;
};

type PendingSubtask = {
  id: string;
  name: string;
  kpiName: string;
  category: string;
};

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isBeforeDate(dateA: string, dateB: string): boolean {
  return dateA.localeCompare(dateB) < 0;
}

function daysSinceDate(dateValue?: string): number | null {
  if (!dateValue) return null;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  const diffMs = today.getTime() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function relationshipScoreFromDays(daysSinceContact: number | null): number {
  if (daysSinceContact === null) return 0;

  const maxDays = 90;
  const rawScore = Math.round((1 - daysSinceContact / maxDays) * 100);
  return Math.max(0, Math.min(100, rawScore));
}

function getConfiguredWeight(
  preferences: Record<string, number>,
  defaults: Record<string, number>,
  label: string,
  fallbackLabel: string
): number {
  return preferences[label] ?? defaults[label] ?? defaults[fallbackLabel] ?? 1;
}

function normalizeCategoryKey(categoryName: string): string {
  const normalized = categoryName.trim().toLowerCase();
  if (normalized.includes('health')) return 'Health';
  if (
    normalized.includes('relationship') ||
    normalized.includes('social') ||
    normalized.includes('people')
  ) {
    return 'Relationships';
  }
  if (normalized.includes('finance') || normalized.includes('money')) return 'Finance';
  if (
    normalized.includes('career') ||
    normalized.includes('work') ||
    normalized.includes('business')
  ) {
    return 'Career';
  }
  if (
    normalized.includes('learn') ||
    normalized.includes('study') ||
    normalized.includes('education')
  ) {
    return 'Learning';
  }
  return 'Other';
}

function normalizeRelationshipKey(relationshipType?: string): string {
  const normalized = (relationshipType ?? '').trim().toLowerCase();
  if (
    normalized.includes('partner') ||
    normalized.includes('spouse') ||
    normalized.includes('wife') ||
    normalized.includes('husband') ||
    normalized.includes('girlfriend') ||
    normalized.includes('boyfriend')
  ) {
    return 'Partner';
  }
  if (
    normalized.includes('parent') ||
    normalized.includes('mother') ||
    normalized.includes('father') ||
    normalized.includes('mom') ||
    normalized.includes('dad')
  ) {
    return 'Parent';
  }
  if (
    normalized.includes('child') ||
    normalized.includes('son') ||
    normalized.includes('daughter')
  ) {
    return 'Child';
  }
  if (
    normalized.includes('sibling') ||
    normalized.includes('brother') ||
    normalized.includes('sister')
  ) {
    return 'Sibling';
  }
  if (normalized.includes('best friend')) return 'Best Friend';
  if (normalized.includes('mentor')) return 'Mentor';
  if (
    normalized.includes('colleague') ||
    normalized.includes('coworker') ||
    normalized.includes('co-worker')
  ) {
    return 'Colleague';
  }
  if (normalized.includes('acquaintance')) return 'Acquaintance';
  if (normalized.includes('friend')) return 'Friend';
  return 'Other';
}

function getRelationshipImpactKey(relationshipType?: string): string {
  const relationshipKey = normalizeRelationshipKey(relationshipType);
  if (relationshipKey === 'Parent') return 'Parent Relationship';
  if (relationshipKey === 'Partner') return 'Partner Relationship';
  if (relationshipKey === 'Child') return 'Child Relationship';
  if (relationshipKey === 'Friend' || relationshipKey === 'Best Friend') {
    return 'Friend Relationship';
  }
  return 'Friend Relationship';
}

function getKpiImpactKey(categoryName: string): string {
  const categoryKey = normalizeCategoryKey(categoryName);
  if (categoryKey === 'Health') return 'Health KPI';
  if (categoryKey === 'Finance') return 'Financial KPI';
  if (categoryKey === 'Career') return 'Career KPI';
  if (categoryKey === 'Learning') return 'Learning KPI';

  const normalized = categoryName.trim().toLowerCase();
  if (
    normalized.includes('recreation') ||
    normalized.includes('fun') ||
    normalized.includes('leisure')
  ) {
    return 'Recreation KPI';
  }

  return 'Habit KPI';
}

function getOverdueUrgencyKey(overdueDays: number): string {
  if (overdueDays >= 8) return '8-14 Days Overdue';
  if (overdueDays >= 4) return '4-7 Days Overdue';
  if (overdueDays >= 1) return '1-3 Days Overdue';
  return 'Due Today';
}

function getRelationshipUrgencyKey(daysSinceContact: number | null): string {
  if ((daysSinceContact ?? 0) >= 30) return 'No Contact 30+ Days';
  return 'No Contact 14+ Days';
}

function getKpiUrgencyKey(missedDays: number): string {
  if (missedDays >= 14) return 'KPI Missed 14 Days';
  if (missedDays >= 7) return 'KPI Missed 7 Days';
  return 'KPI Missed 3 Days';
}

function getMissedKpiDays(
  kpiId: string,
  entriesByDate: Map<string, Record<string, string>>,
  maxDays = 14
): number {
  let missedDays = 0;

  for (let dayOffset = 0; dayOffset < maxDays; dayOffset += 1) {
    const dateKey = dateKeyDaysAgo(dayOffset);
    const actuals = entriesByDate.get(dateKey);
    const value = actuals?.[kpiId];

    if (value !== undefined && value !== '') {
      break;
    }

    missedDays += 1;
  }

  return missedDays;
}

function getLatestContactDate(
  lastContactDate?: string,
  activityDates: string[] = []
): string | undefined {
  const candidates = [lastContactDate, ...activityDates].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );

  if (candidates.length === 0) return undefined;
  return [...candidates].sort((a, b) => b.localeCompare(a))[0];
}

function kpiContribution(
  target: number,
  weight: number,
  actualValue: string | undefined
): number {
  const parsed = parseFloat(actualValue || '0');
  const safeActual = Number.isNaN(parsed) ? 0 : parsed;

  if (target <= 0) return 0;

  const contribution = (safeActual / target) * weight;
  return Math.min(weight, contribution);
}

function PriorityCard({ item }: { item: PriorityItem }) {
  const { theme } = useTheme();

  return (
    <SectionCard style={styles.priorityCard}>
      <Text style={[styles.priorityTitle, { color: theme.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.priorityDescription, { color: theme.textSecondary }]}>{item.description}</Text>
    </SectionCard>
  );
}

function ModalWeightSection({
  title,
  items,
}: {
  title: string;
  items: [string, number][];
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.modalWeightSection}>
      <Text style={[styles.modalSectionLabel, { color: theme.primary }]}>{title}</Text>
      {items.map(([label, value]) => (
        <View
          key={`${title}-${label}`}
          style={[styles.modalWeightRow, { borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.modalWeightLabel, { color: theme.textSecondary }]}>{label}</Text>
          <Text style={[styles.modalWeightValue, { color: theme.textPrimary }]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function LifeBuddyScreen() {
  const {
    categories,
    kpis,
    entries,
    latestActuals,
    subtasks,
    subtaskLogs,
    people,
    personActivities,
    personTodos,
  } = useAppData();
  const { lifeBuddyScoringPreferences } = usePreferences();
  const { theme } = useTheme();
  const deviceType = useDeviceType();
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  const today = todayYMD();

  const weightSections = useMemo<
    { key: ScoringSection; title: string; items: [string, number][] }[]
  >(
    () => [
      {
        key: 'categoryImportance',
        title: 'Current Category Weights',
        items: Object.entries(lifeBuddyScoringPreferences.categoryImportance),
      },
      {
        key: 'relationshipImportance',
        title: 'Current Relationship Weights',
        items: Object.entries(lifeBuddyScoringPreferences.relationshipImportance),
      },
      {
        key: 'urgencyWeights',
        title: 'Current Urgency Weights',
        items: Object.entries(lifeBuddyScoringPreferences.urgencyWeights),
      },
      {
        key: 'impactWeights',
        title: 'Current Impact Weights',
        items: Object.entries(lifeBuddyScoringPreferences.impactWeights),
      },
    ],
    [lifeBuddyScoringPreferences]
  );

  const todayEntry = useMemo(() => {
    return entries.find((entry) => entry.date === today) ?? null;
  }, [entries, today]);

  const entriesByDate = useMemo(() => {
    return new Map(entries.map((entry) => [entry.date, entry.actuals] as const));
  }, [entries]);

  const todayActuals = useMemo(() => {
    return todayEntry?.actuals ?? {};
  }, [todayEntry]);

  const weakestCategory = useMemo<WeakCategory>(() => {
    const rows = categories
      .map((category) => {
        const categoryKpis = kpis.filter((kpi) => kpi.category === category.name);
        if (categoryKpis.length === 0) return null;

        const totalWeight = categoryKpis.reduce((sum, kpi) => sum + kpi.weight, 0);
        const scoreValue = categoryKpis.reduce((sum, kpi) => {
          const actualValue = todayEntry
            ? todayActuals[kpi.id]
            : latestActuals[kpi.id];
          return sum + kpiContribution(kpi.target, kpi.weight, actualValue);
        }, 0);

        const score = totalWeight > 0 ? Math.round((scoreValue / totalWeight) * 100) : 0;
        return {
          id: category.id,
          name: category.name,
          score,
          kpiCount: categoryKpis.length,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length === 0) return null;
    return rows.reduce((lowest, row) => (row.score < lowest.score ? row : lowest));
  }, [categories, kpis, latestActuals, todayActuals, todayEntry]);

  const peopleNeedingAttention = useMemo<AttentionPerson[]>(() => {
    return people
      .map((person) => {
        const activityDates = personActivities
          .filter((activity) => activity.personId === person.id)
          .map((activity) => activity.date);

        const latestContactDate = getLatestContactDate(person.lastContactDate, activityDates);
        const daysSinceContact = daysSinceDate(latestContactDate);
        const score = relationshipScoreFromDays(daysSinceContact);

        return {
          id: person.id,
          name: person.name,
          groupName: person.groupName,
          relationshipType: person.relationshipType,
          score,
          daysSinceContact,
        };
      })
      .filter((person) => person.score < 70)
      .sort((a, b) => a.score - b.score);
  }, [people, personActivities]);

  const overdueRelationshipTodos = useMemo<OverdueTodo[]>(() => {
    return personTodos
      .filter((todo) => !todo.completed && todo.dueDate && isBeforeDate(todo.dueDate, today))
      .map((todo) => {
        const person = people.find((item) => item.id === todo.personId);
        return {
          id: todo.id,
          title: todo.title,
          personName: person?.name ?? 'Unknown person',
          relationshipType: person?.relationshipType ?? 'Other',
          dueDate: todo.dueDate ?? '',
          overdueDays: Math.max(0, daysSinceDate(todo.dueDate) ?? 0),
        };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [people, personTodos, today]);

  const pendingKpiEntries = useMemo<PendingKpi[]>(() => {
    return kpis.filter((kpi) => {
      const value = todayActuals[kpi.id];
      return value === undefined || value === '';
    }).map((kpi) => ({
      id: kpi.id,
      name: kpi.name,
      category: kpi.category,
      unit: kpi.unit,
      missedDays: getMissedKpiDays(kpi.id, entriesByDate),
    }));
  }, [entriesByDate, kpis, todayActuals]);

  const pendingSubtasksToday = useMemo<PendingSubtask[]>(() => {
    return subtasks
      .filter((subtask) => {
        return !subtaskLogs.some(
          (log) => log.subtaskId === subtask.id && log.date === today && log.completed
        );
      })
      .map((subtask) => {
        const kpi = kpis.find((item) => item.id === subtask.kpiId);
        return {
          id: subtask.id,
          name: subtask.name,
          kpiName: kpi?.name ?? 'Unknown KPI',
          category: kpi?.category ?? 'Unknown category',
        };
      });
  }, [kpis, subtasks, subtaskLogs, today]);

  const scoreCategoryRecommendation = useCallback(
    (categoryName: string, urgencyLabel = 'Due Today') => {
      const normalizedCategory = normalizeCategoryKey(categoryName);
      const impactKey = getKpiImpactKey(categoryName);

      // User-configurable weights are injected here for category-based Life Buddy priorities.
      const importance = getConfiguredWeight(
        lifeBuddyScoringPreferences.categoryImportance,
        defaultLifeBuddyScoringPreferences.categoryImportance,
        normalizedCategory,
        'Other'
      );
      const urgency = getConfiguredWeight(
        lifeBuddyScoringPreferences.urgencyWeights,
        defaultLifeBuddyScoringPreferences.urgencyWeights,
        urgencyLabel,
        'Due Today'
      );
      const impact = getConfiguredWeight(
        lifeBuddyScoringPreferences.impactWeights,
        defaultLifeBuddyScoringPreferences.impactWeights,
        impactKey,
        'Habit KPI'
      );

      return importance * urgency * impact;
    },
    [lifeBuddyScoringPreferences]
  );

  const scoreRelationshipRecommendation = useCallback(
    (relationshipType: string, urgencyLabel: string) => {
      const relationshipKey = normalizeRelationshipKey(relationshipType);
      const impactKey = getRelationshipImpactKey(relationshipType);

      // User-configurable weights are injected here for relationship-based Life Buddy priorities.
      const importance = getConfiguredWeight(
        lifeBuddyScoringPreferences.relationshipImportance,
        defaultLifeBuddyScoringPreferences.relationshipImportance,
        relationshipKey,
        'Other'
      );
      const urgency = getConfiguredWeight(
        lifeBuddyScoringPreferences.urgencyWeights,
        defaultLifeBuddyScoringPreferences.urgencyWeights,
        urgencyLabel,
        'No Contact 14+ Days'
      );
      const impact = getConfiguredWeight(
        lifeBuddyScoringPreferences.impactWeights,
        defaultLifeBuddyScoringPreferences.impactWeights,
        impactKey,
        'Friend Relationship'
      );

      return importance * urgency * impact;
    },
    [lifeBuddyScoringPreferences]
  );

  const suggestedActions = useMemo(() => {
    const suggestions: string[] = [];

    if (peopleNeedingAttention.length > 0) {
      const person = peopleNeedingAttention[0];
      suggestions.push(
        `Contact ${person.name} today because their relationship score is ${person.score}.`
      );
    }

    if (overdueRelationshipTodos.length > 0) {
      const todo = overdueRelationshipTodos[0];
      suggestions.push(
        `Complete the overdue relationship task "${todo.title}" for ${todo.personName}.`
      );
    }

    if (pendingKpiEntries.length > 0) {
      suggestions.push(
        `Log today's KPI entry for ${pendingKpiEntries[0].name}.`
      );
    }

    if (weakestCategory) {
      suggestions.push(
        `Review ${weakestCategory.name}, which is your weakest category at ${weakestCategory.score}/100.`
      );
    }

    if (pendingSubtasksToday.length > 0) {
      const subtask = pendingSubtasksToday[0];
      suggestions.push(
        `Complete the pending to-do "${subtask.name}" for ${subtask.kpiName}.`
      );
    }

    return suggestions;
  }, [
    overdueRelationshipTodos,
    pendingKpiEntries,
    pendingSubtasksToday,
    peopleNeedingAttention,
    weakestCategory,
  ]);

  const todaysPriorities = useMemo<PriorityItem[]>(() => {
    const priorities: PriorityItem[] = [];

    overdueRelationshipTodos.forEach((todo) => {
      priorities.push({
        id: `overdue-${todo.id}`,
        title: `Finish "${todo.title}"`,
        description: `Overdue for ${todo.personName} since ${todo.dueDate}.`,
        priority: scoreRelationshipRecommendation(
          todo.relationshipType,
          getOverdueUrgencyKey(todo.overdueDays)
        ),
      });
    });

    peopleNeedingAttention.forEach((person) => {
      priorities.push({
        id: `person-${person.id}`,
        title: `Reach out to ${person.name}`,
        description:
          person.daysSinceContact === null
            ? `No recent contact is recorded for this ${person.groupName.toLowerCase()} relationship.`
            : `${person.groupName} relationship score is ${person.score}. Last contact was ${person.daysSinceContact} day(s) ago.`,
        priority: scoreRelationshipRecommendation(
          person.relationshipType,
          getRelationshipUrgencyKey(person.daysSinceContact)
        ),
      });
    });

    pendingKpiEntries.forEach((kpi) => {
      priorities.push({
        id: `kpi-${kpi.id}`,
        title: `Log ${kpi.name}`,
        description: `Today's KPI entry is still missing for ${kpi.category}.`,
        priority: scoreCategoryRecommendation(
          kpi.category,
          getKpiUrgencyKey(kpi.missedDays)
        ),
      });
    });

    pendingSubtasksToday.forEach((subtask) => {
      priorities.push({
        id: `subtask-${subtask.id}`,
        title: `Complete ${subtask.name}`,
        description: `Pending to-do for ${subtask.kpiName} in ${subtask.category}.`,
        priority: scoreCategoryRecommendation(subtask.category, 'Due Today'),
      });
    });

    if (weakestCategory) {
      priorities.push({
        id: `weak-category-${weakestCategory.id}`,
        title: `Review ${weakestCategory.name}`,
        description: `It is your weakest category today at ${weakestCategory.score}/100.`,
        priority: scoreCategoryRecommendation(weakestCategory.name, 'Due Today'),
      });
    }

    return priorities
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
  }, [
    overdueRelationshipTodos,
    pendingKpiEntries,
    pendingSubtasksToday,
    peopleNeedingAttention,
    scoreCategoryRecommendation,
    scoreRelationshipRecommendation,
    weakestCategory,
  ]);

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Life Buddy"
          subtitle="Rule-based guidance from your Life KPI data."
          rightAccessory={
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="How Life Buddy prioritizes actions"
              style={[
                styles.infoButton,
                {
                  backgroundColor: theme.buttonSecondary,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={() => setShowScoringInfo(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.infoButtonText, { color: theme.primary }]}>i</Text>
            </TouchableOpacity>
          }
        />

        <ResponsiveGrid>
          <SectionCard>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Today&apos;s Priorities</Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{todaysPriorities.length}</Text>
            <Text style={[styles.statHint, { color: theme.textSecondary }]}>Top actions surfaced for today</Text>
          </SectionCard>
          <SectionCard>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>People Needing Attention</Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{peopleNeedingAttention.length}</Text>
            <Text style={[styles.statHint, { color: theme.textSecondary }]}>Relationship score below 70</Text>
          </SectionCard>
          <SectionCard>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Pending KPI Entries</Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{pendingKpiEntries.length}</Text>
            <Text style={[styles.statHint, { color: theme.textSecondary }]}>KPIs still missing today</Text>
          </SectionCard>
        </ResponsiveGrid>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Today&apos;s Priorities</Text>
        {todaysPriorities.length === 0 ? (
          <EmptyState
            title="Nothing urgent right now"
            message="You're caught up for today. Life Buddy has no immediate priorities to surface."
          />
        ) : (
          <ResponsiveGrid>
            {todaysPriorities.map((item) => (
              <PriorityCard key={item.id} item={item} />
            ))}
          </ResponsiveGrid>
        )}

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>People Needing Attention</Text>
        {peopleNeedingAttention.length === 0 ? (
          <EmptyState
            title="Relationships look healthy"
            message="No one currently has a relationship score below 70."
          />
        ) : (
          peopleNeedingAttention.map((person) => (
            <SectionCard key={person.id}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{person.name}</Text>
                  <Text style={[styles.itemMeta, { color: theme.primary }]}>{person.groupName}</Text>
                  <Text style={[styles.itemHint, { color: theme.textSecondary }]}>
                    {person.daysSinceContact === null
                      ? 'No contact date recorded yet.'
                      : `Last contact was ${person.daysSinceContact} day(s) ago.`}
                  </Text>
                </View>
                <Text style={[styles.alertScore, { color: theme.danger }]}>{person.score}</Text>
              </View>
            </SectionCard>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Overdue Relationship To-Dos</Text>
        {overdueRelationshipTodos.length === 0 ? (
          <EmptyState
            title="No overdue relationship to-dos"
            message="All relationship follow-ups are either done or still on time."
          />
        ) : (
          overdueRelationshipTodos.map((todo) => (
            <SectionCard key={todo.id}>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{todo.title}</Text>
              <Text style={[styles.itemMeta, { color: theme.primary }]}>{todo.personName}</Text>
              <Text style={[styles.itemHint, { color: theme.textSecondary }]}>Due date: {todo.dueDate}</Text>
            </SectionCard>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Weakest Category</Text>
        {!weakestCategory ? (
          <EmptyState
            title="No category insight yet"
            message="Add categories and KPIs to let Life Buddy identify a weak category."
          />
        ) : (
          <SectionCard>
            <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{weakestCategory.name}</Text>
            <Text style={[styles.bigScore, { color: theme.warning }]}>{weakestCategory.score} / 100</Text>
            <Text style={[styles.itemHint, { color: theme.textSecondary }]}>
              Based on your latest available KPI values across {weakestCategory.kpiCount} KPI(s).
            </Text>
          </SectionCard>
        )}

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Pending KPI Entries</Text>
        {pendingKpiEntries.length === 0 ? (
          <EmptyState
            title="All KPI entries are logged"
            message="You've entered values for every KPI today."
          />
        ) : (
          pendingKpiEntries.map((kpi) => (
            <SectionCard key={kpi.id}>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{kpi.name}</Text>
              <Text style={[styles.itemMeta, { color: theme.primary }]}>{kpi.category}</Text>
              <Text style={[styles.itemHint, { color: theme.textSecondary }]}>Expected unit: {kpi.unit}</Text>
            </SectionCard>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Suggested Actions</Text>
        {suggestedActions.length === 0 ? (
          <EmptyState
            title="No suggestions to show"
            message="Life Buddy has nothing new to recommend from your current data."
          />
        ) : (
          suggestedActions.map((suggestion, index) => (
            <SectionCard key={`${index}-${suggestion}`}>
              <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>{suggestion}</Text>
            </SectionCard>
          ))
        )}

        <Modal
          visible={showScoringInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowScoringInfo(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowScoringInfo(false)}
            />
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.xl,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                How Life Buddy Prioritizes Actions
              </Text>

              <Text style={[styles.modalSectionLabel, { color: theme.primary }]}>Formula</Text>
              <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
                Priority Score = Importance x Urgency x Impact
              </Text>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={{ paddingBottom: 4 }}
                showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalSectionLabel, { color: theme.primary }]}>Factors</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                  - Importance: how important the life area or relationship is
                </Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                  - Urgency: how overdue or time-sensitive the action is
                </Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                  - Impact: how much the action can improve the user&apos;s life
                </Text>

                {weightSections.map((section) => (
                  <ModalWeightSection
                    key={section.key}
                    title={section.title}
                    items={section.items}
                  />
                ))}

                <Text style={[styles.modalSectionLabel, { color: theme.primary }]}>Priority Bands</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- 700+ Critical</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- 500-699 Very High</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- 300-499 High</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- 150-299 Medium</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- 50-149 Low</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- Below 50 Optional</Text>

                <Text style={[styles.modalNote, { color: theme.textMuted }]}>
                  You can customize these weights in Preferences -&gt; Life Buddy Settings.
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.buttonPrimary,
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                onPress={() => setShowScoringInfo(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </PageContainer>
    </ScrollView>
  );

  if (deviceType === 'desktop') {
    return <DesktopShell title="Life Buddy">{pageContent}</DesktopShell>;
  }

  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>{pageContent}</SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statHint: {
    fontSize: 14,
    color: '#64748b',
  },
  priorityCard: {
    minHeight: 132,
  },
  priorityTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  priorityDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 14,
    color: '#93c5fd',
    marginBottom: 6,
  },
  itemHint: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  alertScore: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fb7185',
  },
  bigScore: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fbbf24',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
  },
  infoButton: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  infoButtonText: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '82%',
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 16,
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 6,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  modalBullet: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
  },
  modalScroll: {
    maxHeight: 440,
  },
  modalWeightSection: {
    marginTop: 8,
  },
  modalWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  modalWeightLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalWeightValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalNote: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
    marginBottom: 18,
  },
  modalButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
