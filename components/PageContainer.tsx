import { useDeviceType } from '@/hooks/useDeviceType';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface PageContainerProps {
  children: React.ReactNode;
  style?: any;
}

export function PageContainer({ children, style }: PageContainerProps) {
  const deviceType = useDeviceType();

  return (
    <View style={[styles.container, deviceType === 'web' && styles.webContainer, style]}>
      {deviceType === 'web' ? (
        <View style={styles.webContent}>
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0f172a',
    padding: 20,
  },
  webContainer: {
    alignItems: 'center',
    padding: 0,
  },
  webContent: {
    width: '100%',
    maxWidth: 1100,
    padding: 20,
  },
});