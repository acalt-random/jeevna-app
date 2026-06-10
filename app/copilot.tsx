import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import React, { useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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
  score: number;
  daysSinceContact: number | null;
};

type OverdueTodo = {
  id: string;
  title: string;
  personName: string;
  dueDate: string;
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
  return (
    <SectionCard style={styles.priorityCard}>
      <Text style={styles.priorityTitle}>{item.title}</Text>
      <Text style={styles.priorityDescription}>{item.description}</Text>
    </SectionCard>
  );
}

export default function CopilotScreen() {
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
  const deviceType = useDeviceType();

  const today = todayYMD();

  const todayEntry = useMemo(() => {
    return entries.find((entry) => entry.date === today) ?? null;
  }, [entries, today]);

  const todayActuals = todayEntry?.actuals ?? {};

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
          dueDate: todo.dueDate ?? '',
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
    }));
  }, [kpis, todayActuals]);

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
        priority: 100,
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
        priority: 90 - person.score,
      });
    });

    pendingKpiEntries.forEach((kpi) => {
      priorities.push({
        id: `kpi-${kpi.id}`,
        title: `Log ${kpi.name}`,
        description: `Today's KPI entry is still missing for ${kpi.category}.`,
        priority: 70,
      });
    });

    pendingSubtasksToday.forEach((subtask) => {
      priorities.push({
        id: `subtask-${subtask.id}`,
        title: `Complete ${subtask.name}`,
        description: `Pending to-do for ${subtask.kpiName} in ${subtask.category}.`,
        priority: 60,
      });
    });

    if (weakestCategory) {
      priorities.push({
        id: `weak-category-${weakestCategory.id}`,
        title: `Review ${weakestCategory.name}`,
        description: `It is your weakest category today at ${weakestCategory.score}/100.`,
        priority: 50,
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
    weakestCategory,
  ]);

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Copilot"
          subtitle="Rule-based guidance from your Life KPI data."
        />

        <ResponsiveGrid>
          <SectionCard>
            <Text style={styles.statLabel}>Today&apos;s Priorities</Text>
            <Text style={styles.statValue}>{todaysPriorities.length}</Text>
            <Text style={styles.statHint}>Top actions surfaced for today</Text>
          </SectionCard>
          <SectionCard>
            <Text style={styles.statLabel}>People Needing Attention</Text>
            <Text style={styles.statValue}>{peopleNeedingAttention.length}</Text>
            <Text style={styles.statHint}>Relationship score below 70</Text>
          </SectionCard>
          <SectionCard>
            <Text style={styles.statLabel}>Pending KPI Entries</Text>
            <Text style={styles.statValue}>{pendingKpiEntries.length}</Text>
            <Text style={styles.statHint}>KPIs still missing today</Text>
          </SectionCard>
        </ResponsiveGrid>

        <Text style={styles.sectionTitle}>Today&apos;s Priorities</Text>
        {todaysPriorities.length === 0 ? (
          <EmptyState
            title="Nothing urgent right now"
            message="You're caught up for today. Copilot has no immediate priorities to surface."
          />
        ) : (
          <ResponsiveGrid>
            {todaysPriorities.map((item) => (
              <PriorityCard key={item.id} item={item} />
            ))}
          </ResponsiveGrid>
        )}

        <Text style={styles.sectionTitle}>People Needing Attention</Text>
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
                  <Text style={styles.itemTitle}>{person.name}</Text>
                  <Text style={styles.itemMeta}>{person.groupName}</Text>
                  <Text style={styles.itemHint}>
                    {person.daysSinceContact === null
                      ? 'No contact date recorded yet.'
                      : `Last contact was ${person.daysSinceContact} day(s) ago.`}
                  </Text>
                </View>
                <Text style={styles.alertScore}>{person.score}</Text>
              </View>
            </SectionCard>
          ))
        )}

        <Text style={styles.sectionTitle}>Overdue Relationship To-Dos</Text>
        {overdueRelationshipTodos.length === 0 ? (
          <EmptyState
            title="No overdue relationship to-dos"
            message="All relationship follow-ups are either done or still on time."
          />
        ) : (
          overdueRelationshipTodos.map((todo) => (
            <SectionCard key={todo.id}>
              <Text style={styles.itemTitle}>{todo.title}</Text>
              <Text style={styles.itemMeta}>{todo.personName}</Text>
              <Text style={styles.itemHint}>Due date: {todo.dueDate}</Text>
            </SectionCard>
          ))
        )}

        <Text style={styles.sectionTitle}>Weakest Category</Text>
        {!weakestCategory ? (
          <EmptyState
            title="No category insight yet"
            message="Add categories and KPIs to let Copilot identify a weak category."
          />
        ) : (
          <SectionCard>
            <Text style={styles.itemTitle}>{weakestCategory.name}</Text>
            <Text style={styles.bigScore}>{weakestCategory.score} / 100</Text>
            <Text style={styles.itemHint}>
              Based on your latest available KPI values across {weakestCategory.kpiCount} KPI(s).
            </Text>
          </SectionCard>
        )}

        <Text style={styles.sectionTitle}>Pending KPI Entries</Text>
        {pendingKpiEntries.length === 0 ? (
          <EmptyState
            title="All KPI entries are logged"
            message="You've entered values for every KPI today."
          />
        ) : (
          pendingKpiEntries.map((kpi) => (
            <SectionCard key={kpi.id}>
              <Text style={styles.itemTitle}>{kpi.name}</Text>
              <Text style={styles.itemMeta}>{kpi.category}</Text>
              <Text style={styles.itemHint}>Expected unit: {kpi.unit}</Text>
            </SectionCard>
          ))
        )}

        <Text style={styles.sectionTitle}>Suggested Actions</Text>
        {suggestedActions.length === 0 ? (
          <EmptyState
            title="No suggestions to show"
            message="Copilot has nothing new to recommend from your current data."
          />
        ) : (
          suggestedActions.map((suggestion, index) => (
            <SectionCard key={`${index}-${suggestion}`}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </SectionCard>
          ))
        )}
      </PageContainer>
    </ScrollView>
  );

  if (deviceType === 'desktop') {
    return <DesktopShell title="Copilot">{pageContent}</DesktopShell>;
  }

  return <SafeAreaView style={styles.screen}>{pageContent}</SafeAreaView>;
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
});
