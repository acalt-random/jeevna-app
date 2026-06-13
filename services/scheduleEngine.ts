import { ActivitySchedule, ScheduleRecurrence } from '@/types/schedule';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0);
}

function clampDayOfMonth(year: number, monthIndex: number, preferredDay: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(preferredDay, lastDay), 12, 0, 0, 0);
}

function weekdayCode(date: Date): string {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
}

function sortDateAsc(left: string, right: string) {
  return left.localeCompare(right);
}

export function compareDateOnly(left: string, right: string) {
  return left.localeCompare(right);
}

export function normalizeTimeValue(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return undefined;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return undefined;
  }

  return `${pad(hours)}:${pad(minutes)}`;
}

export function formatScheduleRecurrence(recurrence: ScheduleRecurrence): string {
  return recurrence.charAt(0).toUpperCase() + recurrence.slice(1);
}

export function buildDateTime(dateOnly: string, time?: string): string {
  return `${dateOnly}T${normalizeTimeValue(time) ?? '09:00'}:00`;
}

export function buildDurationEnd(dateOnly: string, time?: string, durationMinutes = 30): string {
  const normalizedTime = normalizeTimeValue(time) ?? '09:00';
  const [hours, minutes] = normalizedTime.split(':').map(Number);
  const start = parseDateOnly(dateOnly);
  start.setHours(hours, minutes, 0, 0);
  start.setMinutes(start.getMinutes() + durationMinutes);
  return `${toDateOnly(start)}T${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
}

export function normalizeActivitySchedule(input: Partial<ActivitySchedule>): ActivitySchedule {
  const now = new Date().toISOString();
  return {
    id: input.id ?? `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    activityId: input.activityId ?? '',
    startDate: input.startDate ?? toDateOnly(new Date()),
    endDate: input.endDate?.trim() || undefined,
    time: normalizeTimeValue(input.time),
    durationMinutes:
      typeof input.durationMinutes === 'number' && input.durationMinutes > 0
        ? Math.round(input.durationMinutes)
        : undefined,
    recurrence: input.recurrence ?? 'weekly',
    daysOfWeek: input.daysOfWeek?.length ? Array.from(new Set(input.daysOfWeek)) : undefined,
    dayOfMonth:
      typeof input.dayOfMonth === 'number' && input.dayOfMonth >= 1 && input.dayOfMonth <= 31
        ? Math.round(input.dayOfMonth)
        : undefined,
    enabled: input.enabled ?? true,
    calendarLinked: input.calendarLinked ?? false,
    calendarProvider: input.calendarProvider ?? 'none',
    externalCalendarEventId: input.externalCalendarEventId?.trim() || undefined,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function buildScheduleLabel(schedule?: ActivitySchedule | null): string {
  if (!schedule || !schedule.enabled) return 'No schedule';
  const recurrence = formatScheduleRecurrence(schedule.recurrence);
  return schedule.time ? `${recurrence} at ${schedule.time}` : recurrence;
}

export function isScheduleActiveOnDate(schedule: ActivitySchedule, dateOnly: string): boolean {
  if (!schedule.enabled) return false;
  if (compareDateOnly(dateOnly, schedule.startDate) < 0) return false;
  if (schedule.endDate && compareDateOnly(dateOnly, schedule.endDate) > 0) return false;
  return true;
}

export function isScheduledForDate(schedule: ActivitySchedule, dateOnly: string): boolean {
  if (!isScheduleActiveOnDate(schedule, dateOnly)) return false;

  const date = parseDateOnly(dateOnly);
  const startDate = parseDateOnly(schedule.startDate);

  if (schedule.recurrence === 'once') {
    return dateOnly === schedule.startDate;
  }

  if (schedule.recurrence === 'daily') {
    return true;
  }

  if (schedule.recurrence === 'weekly') {
    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      return schedule.daysOfWeek.includes(weekdayCode(date));
    }
    return date.getDay() === startDate.getDay();
  }

  if (schedule.recurrence === 'monthly') {
    const day = schedule.dayOfMonth ?? startDate.getDate();
    return date.getDate() === Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
  }

  if (schedule.recurrence === 'quarterly') {
    const monthsDiff =
      (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
    if (monthsDiff < 0 || monthsDiff % 3 !== 0) return false;
    const day = schedule.dayOfMonth ?? startDate.getDate();
    return date.getDate() === Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
  }

  if (schedule.recurrence === 'yearly') {
    const day = schedule.dayOfMonth ?? startDate.getDate();
    return (
      date.getMonth() === startDate.getMonth() &&
      date.getDate() === Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate())
    );
  }

  return false;
}

export function getOccurrencesInRange(
  schedule: ActivitySchedule,
  fromDate: string,
  toDate: string
): string[] {
  if (compareDateOnly(fromDate, toDate) > 0) return [];

  const occurrences: string[] = [];
  let cursor = parseDateOnly(fromDate);
  const end = parseDateOnly(toDate);

  while (cursor <= end) {
    const candidate = toDateOnly(cursor);
    if (isScheduledForDate(schedule, candidate)) {
      occurrences.push(candidate);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return occurrences.sort(sortDateAsc);
}

export function getNextScheduledDate(
  schedule: ActivitySchedule,
  fromDate: string
): string | undefined {
  const startCursor = compareDateOnly(fromDate, schedule.startDate) > 0 ? fromDate : schedule.startDate;
  const cursor = parseDateOnly(startCursor);

  for (let offset = 0; offset < 730; offset += 1) {
    const candidate = toDateOnly(cursor);
    if (isScheduledForDate(schedule, candidate)) {
      return candidate;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return undefined;
}

export function getPreviousScheduledDate(
  schedule: ActivitySchedule,
  fromDate: string
): string | undefined {
  const cursor = parseDateOnly(fromDate);

  for (let offset = 0; offset < 730; offset += 1) {
    const candidate = toDateOnly(cursor);
    if (isScheduledForDate(schedule, candidate)) {
      return candidate;
    }
    cursor.setDate(cursor.getDate() - 1);
    if (compareDateOnly(toDateOnly(cursor), schedule.startDate) < 0) break;
  }

  return undefined;
}

export function getNextDueSummary(schedule?: ActivitySchedule | null, fromDate?: string): string | undefined {
  if (!schedule || !schedule.enabled) return undefined;
  const baseDate = fromDate ?? toDateOnly(new Date());
  const nextDate = getNextScheduledDate(schedule, baseDate);
  if (!nextDate) return undefined;
  return schedule.time ? `${nextDate} at ${schedule.time}` : nextDate;
}

export function touchesSchedule(schedule: ActivitySchedule): ActivitySchedule {
  return {
    ...schedule,
    updatedAt: new Date().toISOString(),
  };
}

export function defaultDayOfMonthFor(dateOnly: string): number {
  return parseDateOnly(dateOnly).getDate();
}

export function monthlyDateFor(year: number, monthIndex: number, dayOfMonth: number): string {
  return toDateOnly(clampDayOfMonth(year, monthIndex, dayOfMonth));
}
