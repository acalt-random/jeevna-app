import { useDeviceType } from '@/hooks/useDeviceType';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ResponsiveGridProps {
  children: React.ReactNode;
  style?: any;
}

export function ResponsiveGrid({ children, style }: ResponsiveGridProps) {
  const deviceType = useDeviceType();

  const numColumns = deviceType === 'phone' ? 1 : deviceType === 'tablet' ? 2 : deviceType === 'web' ? 3 : 4;
  const items = React.Children.toArray(children);

  return (
    <View style={[styles.grid, style]}>
      {items.map((child, index) => (
        <View
          key={index}
          style={[
            styles.item,
            numColumns > 1 && { width: `${100 / numColumns}%` },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  item: {
    paddingHorizontal: 6,
    marginBottom: 12,
  },
});