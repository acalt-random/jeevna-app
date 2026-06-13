import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Category, KPI, Subtask } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';
import { prepareCalendarEvent } from '@/services/calendarIntegrationService';
import {
  defaultDayOfMonthFor,
  normalizeActivitySchedule,
} from '@/services/scheduleEngine';
import { ActivitySchedule, CalendarProvider, ScheduleRecurrence } from '@/types/schedule';

const RECURRENCE_OPTIONS: ScheduleRecurrence[] = [
  'once',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
];
const DAY_OPTIONS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const CALENDAR_OPTIONS: CalendarProvider[] = ['none', 'google', 'apple', 'outlook'];

interface ScheduleActivityModalProps {
  visible: boolean;
  subtask: Subtask | null;
  kpi?: KPI;
  category?: Category;
  initialSchedule?: ActivitySchedule;
  onSave: (schedule: ActivitySchedule) => void;
  onDelete?: (scheduleId: string) => void;
  onClose: () => void;
}

function providerLabel(provider: CalendarProvider): string {
  if (provider === 'none') return 'Do not add to calendar';
  if (provider === 'google') return 'Add to Google Calendar';
  if (provider === 'apple') return 'Add to Apple Calendar';
  return 'Add to Outlook Calendar';
}

export function ScheduleActivityModal({
  visible,
  subtask,
  kpi,
  category,
  initialSchedule,
  onSave,
  onDelete,
  onClose,
}: ScheduleActivityModalProps) {
  const { theme } = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [recurrence, setRecurrence] = useState<ScheduleRecurrence>('weekly');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [enabled, setEnabled] = useState(true);
  const [calendarProvider, setCalendarProvider] = useState<CalendarProvider>('none');

  useEffect(() => {
    const source = initialSchedule
      ? initialSchedule
      : normalizeActivitySchedule({
          activityId: subtask?.id ?? '',
        });

    setStartDate(source.startDate);
    setEndDate(source.endDate ?? '');
    setTime(source.time ?? '');
    setDurationMinutes(String(source.durationMinutes ?? 30));
    setRecurrence(source.recurrence);
    setDaysOfWeek(source.daysOfWeek ?? []);
    setDayOfMonth(String(source.dayOfMonth ?? defaultDayOfMonthFor(source.startDate)));
    setEnabled(source.enabled);
    setCalendarProvider(source.calendarProvider ?? 'none');
  }, [initialSchedule, subtask]);

  const schedulePreview = useMemo(
    () =>
      normalizeActivitySchedule({
        ...initialSchedule,
        activityId: subtask?.id ?? '',
        startDate,
        endDate: endDate || undefined,
        time,
        durationMinutes: Number.parseInt(durationMinutes, 10) || 30,
        recurrence,
        daysOfWeek: recurrence === 'weekly' ? daysOfWeek : undefined,
        dayOfMonth:
          recurrence === 'monthly' || recurrence === 'quarterly'
            ? Number.parseInt(dayOfMonth, 10) || defaultDayOfMonthFor(startDate)
            : undefined,
        enabled,
        calendarProvider,
        calendarLinked: calendarProvider !== 'none',
      }),
    [
      calendarProvider,
      dayOfMonth,
      daysOfWeek,
      durationMinutes,
      enabled,
      endDate,
      initialSchedule,
      recurrence,
      startDate,
      subtask?.id,
      time,
    ]
  );

  const handleSave = async () => {
    if (!subtask) return;

    if (calendarProvider !== 'none' && kpi) {
      const result = await prepareCalendarEvent({
        provider: calendarProvider,
        subtask,
        schedule: schedulePreview,
        kpi,
        category,
      });

      Alert.alert(
        'Calendar event prepared',
        `${result.message}\n\n${result.payload.title}\n${result.payload.startDateTime}`
      );
    }

    onSave(schedulePreview);
    onClose();
  };

  const toggleDay = (day: string) => {
    setDaysOfWeek((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
              borderRadius: theme.borderRadius.lg,
            },
          ]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Schedule {subtask?.name ?? 'Activity'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Start date</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.textPrimary }]}>End date</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="Optional YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />

            <View style={styles.row}>
              <View style={styles.flexField}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Time</Text>
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder="09:00"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </View>
              <View style={styles.flexField}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Duration</Text>
                <TextInput
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                  keyboardType="numeric"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.textPrimary }]}>Recurrence</Text>
            <View style={styles.optionWrap}>
              {RECURRENCE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor:
                        recurrence === option ? theme.buttonPrimary : theme.buttonSecondary,
                      borderColor:
                        recurrence === option ? theme.buttonPrimary : theme.cardBorder,
                      borderRadius: theme.borderRadius.sm,
                    },
                  ]}
                  onPress={() => setRecurrence(option)}
                  activeOpacity={0.84}>
                  <Text
                    style={[
                      styles.optionChipText,
                      { color: recurrence === option ? '#ffffff' : theme.textPrimary },
                    ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {recurrence === 'weekly' ? (
              <>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Days of week</Text>
                <View style={styles.optionWrap}>
                  {DAY_OPTIONS.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: daysOfWeek.includes(day)
                            ? theme.buttonPrimary
                            : theme.buttonSecondary,
                          borderColor: daysOfWeek.includes(day)
                            ? theme.buttonPrimary
                            : theme.cardBorder,
                          borderRadius: theme.borderRadius.sm,
                        },
                      ]}
                      onPress={() => toggleDay(day)}
                      activeOpacity={0.84}>
                      <Text
                        style={[
                          styles.optionChipText,
                          { color: daysOfWeek.includes(day) ? '#ffffff' : theme.textPrimary },
                        ]}>
                        {day.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}

            {recurrence === 'monthly' || recurrence === 'quarterly' ? (
              <>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Day of month</Text>
                <TextInput
                  value={dayOfMonth}
                  onChangeText={setDayOfMonth}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </>
            ) : null}

            <Text style={[styles.label, { color: theme.textPrimary }]}>Calendar</Text>
            <View style={styles.optionWrap}>
              {CALENDAR_OPTIONS.map((provider) => (
                <TouchableOpacity
                  key={provider}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor:
                        calendarProvider === provider ? theme.buttonPrimary : theme.buttonSecondary,
                      borderColor:
                        calendarProvider === provider ? theme.buttonPrimary : theme.cardBorder,
                      borderRadius: theme.borderRadius.sm,
                    },
                  ]}
                  onPress={() => setCalendarProvider(provider)}
                  activeOpacity={0.84}>
                  <Text
                    style={[
                      styles.optionChipText,
                      { color: calendarProvider === provider ? '#ffffff' : theme.textPrimary },
                    ]}>
                    {providerLabel(provider)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.toggleRow,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={() => setEnabled((current) => !current)}
              activeOpacity={0.84}>
              <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>
                {enabled ? 'Schedule enabled' : 'Schedule disabled'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.actions}>
            {initialSchedule && onDelete ? (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.buttonSecondary,
                    borderColor: theme.danger,
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                onPress={() => {
                  onDelete(initialSchedule.id);
                  onClose();
                }}
                activeOpacity={0.84}>
                <Text style={[styles.secondaryButtonText, { color: theme.danger }]}>Delete</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: theme.buttonSecondary,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={onClose}
              activeOpacity={0.84}>
              <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.buttonPrimary,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={handleSave}
              activeOpacity={0.84}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  card: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '88%',
    borderWidth: 1,
    padding: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flexField: {
    flex: 1,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  optionChip: {
    minHeight: 34,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleRow: {
    minHeight: 46,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 4,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  primaryButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
