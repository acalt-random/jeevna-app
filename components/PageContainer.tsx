import { useDeviceType } from '@/hooks/useDeviceType';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { View } from 'react-native';

interface PageContainerProps {
  children: React.ReactNode;
  style?: any;
}

export function PageContainer({ children, style }: PageContainerProps) {
  const deviceType = useDeviceType();
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: theme.background,
          padding: theme.spacing.lg,
        },
        deviceType === 'web'
          ? {
              alignItems: 'center',
              padding: 0,
            }
          : null,
        style,
      ]}>
      {deviceType === 'web' ? (
        <View
          style={{
            width: '100%',
            maxWidth: 1120,
            padding: theme.spacing.xl,
          }}>
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  );
}
