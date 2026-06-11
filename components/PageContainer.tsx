import { useDeviceType } from '@/hooks/useDeviceType';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { useWindowDimensions, View } from 'react-native';

interface PageContainerProps {
  children: React.ReactNode;
  style?: any;
}

export function PageContainer({ children, style }: PageContainerProps) {
  const deviceType = useDeviceType();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = deviceType === 'web' || deviceType === 'desktop';
  const horizontalPadding = width >= 1440 ? theme.spacing.xl : theme.spacing.lg;
  const maxWidth = width >= 1800 ? 1560 : width >= 1440 ? 1480 : 1380;

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: theme.background,
          paddingHorizontal: isLargeScreen ? 0 : horizontalPadding,
          paddingVertical: isLargeScreen ? 0 : theme.spacing.lg,
        },
        isLargeScreen
          ? {
              alignItems: 'center',
              padding: 0,
            }
          : null,
        style,
      ]}>
      {isLargeScreen ? (
        <View
          style={{
            width: '100%',
            maxWidth,
            paddingHorizontal: horizontalPadding,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.xl,
          }}>
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  );
}
