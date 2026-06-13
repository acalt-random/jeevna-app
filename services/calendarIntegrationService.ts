import { Category, KPI, Subtask } from '@/context/AppDataContext';
import {
  ActivitySchedule,
  CalendarEventPayload,
  CalendarProvider,
} from '@/types/schedule';
import { buildDateTime, buildDurationEnd } from '@/services/scheduleEngine';

function buildRecurrenceRule(schedule: ActivitySchedule): string | undefined {
  if (schedule.recurrence === 'once') return undefined;
  const base = `FREQ=${schedule.recurrence.toUpperCase()}`;
  if (schedule.recurrence === 'weekly' && schedule.daysOfWeek?.length) {
    return `${base};BYDAY=${schedule.daysOfWeek
      .map((day) => day.slice(0, 2).toUpperCase())
      .join(',')}`;
  }
  if ((schedule.recurrence === 'monthly' || schedule.recurrence === 'quarterly') && schedule.dayOfMonth) {
    return `${base};BYMONTHDAY=${schedule.dayOfMonth}`;
  }
  return base;
}

export function buildCalendarEventPayload(params: {
  subtask: Subtask;
  schedule: ActivitySchedule;
  kpi: KPI;
  category?: Category;
}): CalendarEventPayload {
  const { subtask, schedule, kpi, category } = params;

  return {
    title: `Life KPI: ${subtask.name}`,
    description: `Linked to Life KPI activity under ${kpi.name}. Complete this in Life KPI after doing it.`,
    startDateTime: buildDateTime(schedule.startDate, schedule.time),
    endDateTime: buildDurationEnd(schedule.startDate, schedule.time, schedule.durationMinutes ?? 30),
    recurrenceRule: buildRecurrenceRule(schedule),
    sourceActivityId: subtask.id,
    sourceKpiId: kpi.id,
    sourceCategoryId: category?.id ?? `category:${kpi.category}`,
  };
}

export async function prepareCalendarEvent(params: {
  provider: CalendarProvider;
  subtask: Subtask;
  schedule: ActivitySchedule;
  kpi: KPI;
  category?: Category;
}): Promise<{ success: boolean; payload: CalendarEventPayload; provider: CalendarProvider; message: string }> {
  const payload = buildCalendarEventPayload(params);
  const providerLabel =
    params.provider === 'google'
      ? 'Google Calendar'
      : params.provider === 'apple'
        ? 'Apple Calendar'
        : params.provider === 'outlook'
          ? 'Outlook Calendar'
          : 'calendar';

  return {
    success: true,
    payload,
    provider: params.provider,
    message:
      params.provider === 'none'
        ? 'Schedule saved without calendar push.'
        : `Prepared a ${providerLabel} event payload for local confirmation.`,
  };
}

export async function updateCalendarEvent(): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'Calendar sync updates are not implemented yet.',
  };
}

export async function deleteCalendarEvent(): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'Calendar event deletion is not implemented yet.',
  };
}

export async function syncCalendarEventChanges(): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'Two-way calendar sync is not implemented yet.',
  };
}
