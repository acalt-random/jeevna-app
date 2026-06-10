import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Text, View } from 'react-native';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  style?: any;
}

export function PageHeader({ title, subtitle, style }: PageHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[{ marginBottom: theme.spacing.xl, paddingTop: 8 }, style]}>
      <Text
        style={{
          fontSize: 30,
          fontWeight: '800',
          color: theme.textPrimary,
          marginBottom: 6,
        }}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontSize: 15,
            color: theme.textSecondary,
            lineHeight: 22,
          }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
