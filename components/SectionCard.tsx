import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { View } from 'react-native';

interface SectionCardProps {
  children: React.ReactNode;
  style?: any;
}

export function SectionCard({ children, style }: SectionCardProps) {
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
          marginBottom: theme.spacing.md,
          shadowColor: theme.shadowColor,
          shadowOpacity: theme.shadowOpacity,
          shadowRadius: theme.shadowRadius,
          shadowOffset: { width: 0, height: 8 },
          elevation: theme.elevation,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
