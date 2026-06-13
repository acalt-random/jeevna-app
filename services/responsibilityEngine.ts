import { Category, KPI, Subtask, SubtaskLog, SubtaskFrequency } from '@/context/AppDataContext';
import { getNextScheduledDate, getOccurrencesInRange } from '@/services/scheduleEngine';
import { ActivitySchedule } from '@/types/schedule';

export type ActivityStatus = 'Not Started' | 'Due' | 'Completed' | 'Missed' | 'Rescheduled';

export interface ResponsibilityItem {
  id: string;
  subtaskId: string;
  title: string;
  category: string;
  kpiName: string;
  frequency: SubtaskFrequency;
  targetCount: number;
  status: ActivityStatus;
  dueDate?: string;
  lastCompletedDate?: string;
  completedDate?: string;
  daysOverdue: number;
  isDueToday: boolean;
  isOverdue: boolean;
  isCompletedToday: boolean;
}

export interface CategoryResponsibilityScore {
  categoryId: string;
  categoryName: string;
  responsibilityScore: number;
  dueToday: number;
  overdue: number;
  completedToday: number;
  totalResponsibilities: number;
}

export interface ResponsibilitySnapshot {
  all: ResponsibilityItem[];
  dueToday: ResponsibilityItem[];
  overdue: ResponsibilityItem[];
  completedToday: ResponsibilityItem[];
  categoryScores: CategoryResponsibilityScore[];
}

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function addFrequency(dateValue: string, frequency: SubtaskFrequency): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (frequency === 'daily') {
    date.setDate(date.getDate() + 1);
  } else if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === 'quarterly') {
    date.setMonth(date.getMonth() + 3);
  } else if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function daysBetween(startYmd: string, endYmd: string): number {
  const [startYear, startMonth, startDay] = startYmd.split('-').map(Number);
  const [endYear, endMonth, endDay] = endYmd.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function compareYmd(left: string, right: string): number {
  return left.localeCompare(right);
}

function completedDatesForSubtask(subtaskId: string, subtaskLogs: SubtaskLog[]): string[] {
  return subtaskLogs
    .filter((log) => log.subtaskId === subtaskId && log.completed)
    .map((log) => log.date)
    .sort((left, right) => left.localeCompare(right));
}

function completedDatesUntil(subtaskId: string, subtaskLogs: SubtaskLog[], throughDate: string): string[] {
  return completedDatesForSubtask(subtaskId, subtaskLogs).filter((date) => date <= throughDate);
}

function scoreForResponsibility(item: ResponsibilityItem): number {
  if (item.isOverdue) return 0;
  if (item.isCompletedToday) return item.status === 'Rescheduled' ? 85 : 100;
  if (item.isDueToday) return item.status === 'Not Started' ? 40 : 65;
  return 100;
}

function buildResponsibilityItem(
  subtask: Subtask,
  categoryName: string,
  kpiName: string,
  subtaskLogs: SubtaskLog[],
  today: string,
  schedule?: ActivitySchedule
): ResponsibilityItem {
  const completedDates = completedDatesUntil(subtask.id, subtaskLogs, today);
  const completedToday = completedDates.includes(today);
  const lastCompletedDate = completedDates.length > 0 ? completedDates[completedDates.length - 1] : undefined;
  const lastCompletedBeforeToday = completedDates.filter((date) => date < today).slice(-1)[0];

  if (schedule?.enabled) {
    const dueOccurrences = getOccurrencesInRange(schedule, schedule.startDate, today);
    const latestDueDate = dueOccurrences[dueOccurrences.length - 1];
    if (completedToday) {
      const wasOverdueBeforeCompletion =
        latestDueDate !== undefined && latestDueDate < today && !dueOccurrences.includes(lastCompletedBeforeToday ?? '');

      return {
        id: `responsibility:${subtask.id}`,
        subtaskId: subtask.id,
        title: subtask.name,
        category: categoryName,
        kpiName,
        frequency: subtask.frequency,
        targetCount: subtask.targetCount,
        status: wasOverdueBeforeCompletion ? 'Rescheduled' : 'Completed',
        dueDate: latestDueDate ?? today,
        lastCompletedDate,
        completedDate: today,
        daysOverdue: 0,
        isDueToday: false,
        isOverdue: false,
        isCompletedToday: true,
      };
    }

    if (latestDueDate && latestDueDate < today) {
      const completedForLatestDue = completedDates.includes(latestDueDate);
      if (!completedForLatestDue) {
        return {
          id: `responsibility:${subtask.id}`,
          subtaskId: subtask.id,
          title: subtask.name,
          category: categoryName,
          kpiName,
          frequency: subtask.frequency,
          targetCount: subtask.targetCount,
          status: 'Missed',
          dueDate: latestDueDate,
          lastCompletedDate,
          daysOverdue: daysBetween(latestDueDate, today),
          isDueToday: false,
          isOverdue: true,
          isCompletedToday: false,
        };
      }
    }

    const isDueToday = dueOccurrences.includes(today);
    if (isDueToday) {
      return {
        id: `responsibility:${subtask.id}`,
        subtaskId: subtask.id,
        title: subtask.name,
        category: categoryName,
        kpiName,
        frequency: subtask.frequency,
        targetCount: subtask.targetCount,
        status: lastCompletedDate ? 'Due' : 'Not Started',
        dueDate: today,
        lastCompletedDate,
        daysOverdue: 0,
        isDueToday: true,
        isOverdue: false,
        isCompletedToday: false,
      };
    }

    const nextDueDate = getNextScheduledDate(schedule, today);
    return {
      id: `responsibility:${subtask.id}`,
      subtaskId: subtask.id,
      title: subtask.name,
      category: categoryName,
      kpiName,
      frequency: subtask.frequency,
      targetCount: subtask.targetCount,
      status: 'Not Started',
      dueDate: nextDueDate,
      lastCompletedDate,
      daysOverdue: 0,
      isDueToday: false,
      isOverdue: false,
      isCompletedToday: false,
    };
  }

  // Custom activities do not yet have an interval model, so in v1 they are treated as
  // "check today" responsibilities until a richer scheduler exists.
  if (subtask.frequency === 'custom') {
    return {
      id: `responsibility:${subtask.id}`,
      subtaskId: subtask.id,
      title: subtask.name,
      category: categoryName,
      kpiName,
      frequency: subtask.frequency,
      targetCount: subtask.targetCount,
      status: completedToday ? 'Completed' : lastCompletedDate ? 'Due' : 'Not Started',
      dueDate: today,
      lastCompletedDate,
      completedDate: completedToday ? today : undefined,
      daysOverdue: 0,
      isDueToday: !completedToday,
      isOverdue: false,
      isCompletedToday: completedToday,
    };
  }

  if (completedToday) {
    const priorDueDate = lastCompletedBeforeToday
      ? addFrequency(lastCompletedBeforeToday, subtask.frequency)
      : undefined;
    const wasOverdueBeforeCompletion =
      priorDueDate !== undefined && compareYmd(priorDueDate, today) < 0;

    return {
      id: `responsibility:${subtask.id}`,
      subtaskId: subtask.id,
      title: subtask.name,
      category: categoryName,
      kpiName,
      frequency: subtask.frequency,
      targetCount: subtask.targetCount,
      status: wasOverdueBeforeCompletion ? 'Rescheduled' : 'Completed',
      dueDate: priorDueDate ?? today,
      lastCompletedDate,
      completedDate: today,
      daysOverdue: 0,
      isDueToday: false,
      isOverdue: false,
      isCompletedToday: true,
    };
  }

  if (!lastCompletedDate) {
    return {
      id: `responsibility:${subtask.id}`,
      subtaskId: subtask.id,
      title: subtask.name,
      category: categoryName,
      kpiName,
      frequency: subtask.frequency,
      targetCount: subtask.targetCount,
      status: 'Not Started',
      dueDate: today,
      daysOverdue: 0,
      isDueToday: true,
      isOverdue: false,
      isCompletedToday: false,
    };
  }

  const nextDueDate = addFrequency(lastCompletedDate, subtask.frequency);

  if (compareYmd(nextDueDate, today) < 0) {
    return {
      id: `responsibility:${subtask.id}`,
      subtaskId: subtask.id,
      title: subtask.name,
      category: categoryName,
      kpiName,
      frequency: subtask.frequency,
      targetCount: subtask.targetCount,
      status: 'Missed',
      dueDate: nextDueDate,
      lastCompletedDate,
      daysOverdue: daysBetween(nextDueDate, today),
      isDueToday: false,
      isOverdue: true,
      isCompletedToday: false,
    };
  }

  if (compareYmd(nextDueDate, today) === 0) {
    return {
      id: `responsibility:${subtask.id}`,
      subtaskId: subtask.id,
      title: subtask.name,
      category: categoryName,
      kpiName,
      frequency: subtask.frequency,
      targetCount: subtask.targetCount,
      status: 'Due',
      dueDate: nextDueDate,
      lastCompletedDate,
      daysOverdue: 0,
      isDueToday: true,
      isOverdue: false,
      isCompletedToday: false,
    };
  }

  return {
    id: `responsibility:${subtask.id}`,
    subtaskId: subtask.id,
    title: subtask.name,
    category: categoryName,
    kpiName,
    frequency: subtask.frequency,
    targetCount: subtask.targetCount,
    status: 'Not Started',
    dueDate: nextDueDate,
    lastCompletedDate,
    daysOverdue: 0,
    isDueToday: false,
    isOverdue: false,
    isCompletedToday: false,
  };
}

export function buildResponsibilitySnapshot(params: {
  categories: Category[];
  kpis: KPI[];
  subtasks: Subtask[];
  subtaskLogs: SubtaskLog[];
  activitySchedules?: ActivitySchedule[];
  today?: string;
}): ResponsibilitySnapshot {
  const { categories, kpis, subtasks, subtaskLogs, activitySchedules = [], today = todayYMD() } = params;

  const kpiById = new Map(kpis.map((kpi) => [kpi.id, kpi]));
  const scheduleByActivityId = new Map(
    activitySchedules
      .filter((schedule) => schedule.enabled)
      .map((schedule) => [schedule.activityId, schedule])
  );

  const all = subtasks
    .map((subtask) => {
      const kpi = kpiById.get(subtask.kpiId);
      if (!kpi) return null;

      return buildResponsibilityItem(
        subtask,
        kpi.category,
        kpi.name,
        subtaskLogs,
        today,
        scheduleByActivityId.get(subtask.id)
      );
    })
    .filter((item): item is ResponsibilityItem => item !== null);

  const dueToday = all
    .filter((item) => item.isDueToday)
    .sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === 'Not Started' ? -1 : 1;
      }
      return left.title.localeCompare(right.title);
    });

  const overdue = all
    .filter((item) => item.isOverdue)
    .sort((left, right) => right.daysOverdue - left.daysOverdue || left.title.localeCompare(right.title));

  const completedToday = all
    .filter((item) => item.isCompletedToday)
    .sort((left, right) => left.title.localeCompare(right.title));

  const categoryScores = categories
    .map((category) => {
      const items = all.filter((item) => item.category === category.name);
      if (items.length === 0) {
        return {
          categoryId: category.id,
          categoryName: category.name,
          responsibilityScore: 0,
          dueToday: 0,
          overdue: 0,
          completedToday: 0,
          totalResponsibilities: 0,
        };
      }

      const total = items.reduce((sum, item) => sum + scoreForResponsibility(item), 0);
      return {
        categoryId: category.id,
        categoryName: category.name,
        responsibilityScore: Math.round(total / items.length),
        dueToday: items.filter((item) => item.isDueToday).length,
        overdue: items.filter((item) => item.isOverdue).length,
        completedToday: items.filter((item) => item.isCompletedToday).length,
        totalResponsibilities: items.length,
      };
    })
    .sort((left, right) => right.responsibilityScore - left.responsibilityScore);

  // Ensure categories inferred only from KPIs still receive a score even if the category record
  // has not been materialized separately.
  const inferredCategoryNames = new Set(kpis.map((kpi) => kpi.category));
  for (const categoryName of inferredCategoryNames) {
    if (categoryScores.some((score) => score.categoryName === categoryName)) continue;

    const items = all.filter((item) => item.category === categoryName);
    categoryScores.push({
      categoryId: `inferred:${categoryName}`,
      categoryName,
      responsibilityScore:
        items.length > 0
          ? Math.round(items.reduce((sum, item) => sum + scoreForResponsibility(item), 0) / items.length)
          : 0,
      dueToday: items.filter((item) => item.isDueToday).length,
      overdue: items.filter((item) => item.isOverdue).length,
      completedToday: items.filter((item) => item.isCompletedToday).length,
      totalResponsibilities: items.length,
    });
  }

  return {
    all,
    dueToday,
    overdue,
    completedToday,
    categoryScores,
  };
}
