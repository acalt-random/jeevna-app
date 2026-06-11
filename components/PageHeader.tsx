import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Text, View } from 'react-native';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  style?: any;
  rightAccessory?: React.ReactNode;
}

export function PageHeader({ title, subtitle, style, rightAccessory }: PageHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[{ marginBottom: theme.spacing.xl, paddingTop: 8 }, style]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: theme.spacing.md,
        }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: theme.textPrimary,
              marginBottom: 6,
            }}>
            {title}
          </Text>
        </View>
        {rightAccessory ? <View>{rightAccessory}</View> : null}
      </View>
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
