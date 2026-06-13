export type ScheduleRecurrence =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export type CalendarProvider = 'google' | 'apple' | 'outlook' | 'none';

export interface ActivitySchedule {
  id: string;
  activityId: string;
  startDate: string;
  endDate?: string;
  time?: string;
  durationMinutes?: number;
  recurrence: ScheduleRecurrence;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  enabled: boolean;
  calendarLinked?: boolean;
  calendarProvider?: CalendarProvider;
  externalCalendarEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventPayload {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  recurrenceRule?: string;
  sourceActivityId: string;
  sourceKpiId: string;
  sourceCategoryId: string;
}
