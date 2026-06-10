import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Text, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  message: string;
  style?: any;
}

export function EmptyState({ title, message, style }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          padding: theme.spacing.xl,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.cardBackground,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          marginBottom: theme.spacing.lg,
          shadowColor: theme.shadowColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: theme.shadowOpacity,
          shadowRadius: theme.shadowRadius,
          elevation: theme.elevation,
        },
        style,
      ]}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '800',
          color: theme.textPrimary,
          marginBottom: theme.spacing.sm,
          textAlign: 'center',
        }}>
        {title}
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: theme.textSecondary,
          textAlign: 'center',
          lineHeight: 24,
        }}>
        {message}
      </Text>
    </View>
  );
}
