import { Category, KPI, Subtask, SubtaskLog } from '@/context/AppDataContext';
import { ActivitySchedule } from '@/types/schedule';
import { buildResponsibilitySnapshot } from '@/services/responsibilityEngine';

export type GoodDayStatus = 'good' | 'neutral' | 'bad' | 'no_data';

export interface GoodDayCell {
  date: string;
  dayOfMonth: number;
  status: GoodDayStatus;
  dueCount: number;
  completedCount: number;
  score: number | null;
}

export interface GoodDaysMonthSummary {
  monthLabel: string;
  daysElapsed: number;
  goodDays: number;
  bestGoodDayStreak: number;
  message: string;
  cells: GoodDayCell[];
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function buildMonthDays(year: number, monthIndex: number, today: Date): string[] {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const daysElapsed =
    year === today.getFullYear() && monthIndex === today.getMonth() ? today.getDate() : lastDay;
  const result: string[] = [];

  for (let day = 1; day <= daysElapsed; day += 1) {
    result.push(`${year}-${pad(monthIndex + 1)}-${pad(day)}`);
  }

  return result;
}

function statusForScore(score: number | null, dueCount: number, completedCount: number): GoodDayStatus {
  if (dueCount === 0 && completedCount === 0) return 'no_data';
  if (score === null) return 'no_data';
  if (score >= 0.8) return 'good';
  if (score >= 0.5) return 'neutral';
  return 'bad';
}

export function buildGoodDaysMonthSummary(params: {
  categories: Category[];
  kpis: KPI[];
  subtasks: Subtask[];
  subtaskLogs: SubtaskLog[];
  activitySchedules?: ActivitySchedule[];
  year?: number;
  monthIndex?: number;
}): GoodDaysMonthSummary {
  const today = new Date();
  const year = params.year ?? today.getFullYear();
  const monthIndex = params.monthIndex ?? today.getMonth();
  const dates = buildMonthDays(year, monthIndex, today);

  let bestStreak = 0;
  let currentStreak = 0;

  const cells = dates.map((date) => {
    const snapshot = buildResponsibilitySnapshot({
      categories: params.categories,
      kpis: params.kpis,
      subtasks: params.subtasks,
      subtaskLogs: params.subtaskLogs,
      activitySchedules: params.activitySchedules ?? [],
      today: date,
    });

    const dueCount = snapshot.dueToday.length + snapshot.completedToday.length;
    const completedCount = snapshot.completedToday.length;
    const score = dueCount > 0 ? completedCount / dueCount : null;
    const status = statusForScore(score, dueCount, completedCount);

    if (status === 'good') {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }

    return {
      date,
      dayOfMonth: Number(date.slice(-2)),
      status,
      dueCount,
      completedCount,
      score,
    };
  });

  const goodDays = cells.filter((cell) => cell.status === 'good').length;
  const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return {
    monthLabel,
    daysElapsed: dates.length,
    goodDays,
    bestGoodDayStreak: bestStreak,
    message:
      goodDays > 0
        ? `You had ${goodDays} good days this month`
        : 'Progress, not perfection',
    cells,
  };
}
