import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { buildScheduleLabel, getNextDueSummary } from '@/services/scheduleEngine';
import { ActivitySchedule } from '@/types/schedule';

interface ActivityScheduleCardProps {
  schedule?: ActivitySchedule;
  onPress: () => void;
}

export function ActivityScheduleCard({ schedule, onPress }: ActivityScheduleCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.inputBackground,
          borderColor: theme.cardBorder,
          borderRadius: theme.borderRadius.md,
        },
      ]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>Schedule</Text>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          {buildScheduleLabel(schedule)}
        </Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {schedule?.enabled
            ? `Next due: ${getNextDueSummary(schedule) ?? 'Not available'}`
            : 'No active schedule yet'}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.buttonSecondary,
            borderColor: theme.cardBorder,
            borderRadius: theme.borderRadius.sm,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.84}>
        <Text style={[styles.buttonText, { color: theme.textPrimary }]}>
          {schedule ? 'Edit' : 'Schedule'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
