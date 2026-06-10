import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Text, View } from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  style?: any;
}

export function StatCard({ title, value, subtitle, style }: StatCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.cardBackground,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          marginBottom: theme.spacing.sm,
          shadowColor: theme.shadowColor,
          shadowOpacity: theme.shadowOpacity * 0.9,
          shadowRadius: theme.shadowRadius,
          shadowOffset: { width: 0, height: 8 },
          elevation: theme.elevation,
        },
        style,
      ]}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: theme.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginBottom: theme.spacing.sm,
        }}>
        {title}
      </Text>
      <Text
        style={{
          fontSize: 26,
          fontWeight: '800',
          color: theme.textPrimary,
          marginBottom: 4,
        }}>
        {value}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontSize: 14,
            color: theme.textSecondary,
            lineHeight: 20,
          }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
