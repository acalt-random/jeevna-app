import { useDeviceType } from '@/hooks/useDeviceType';
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

interface ResponsiveGridProps {
  children: React.ReactNode;
  style?: any;
  gap?: number;
}

interface ResponsiveGridItemProps {
  children: React.ReactNode;
  style?: any;
  mobileSpan?: number;
  tabletSpan?: number;
  desktopSpan?: number;
}

export function ResponsiveGridItem({ children }: ResponsiveGridItemProps) {
  return <>{children}</>;
}

export function ResponsiveGrid({ children, style, gap = 12 }: ResponsiveGridProps) {
  const deviceType = useDeviceType();
  const { width } = useWindowDimensions();

  const totalColumns = deviceType === 'phone' ? 1 : deviceType === 'tablet' ? 6 : 12;
  const items = React.Children.toArray(children);
  const normalizedGap = Math.max(8, gap);
  const itemGapOffset = normalizedGap / 2;
  const usableWidth = Math.max(320, width);

  return (
    <View style={[styles.grid, { marginHorizontal: -itemGapOffset }, style]}>
      {items.map((child, index) => (
        (() => {
          const isGridItem =
            React.isValidElement(child) && child.type === ResponsiveGridItem;
          const itemProps = (isGridItem ? child.props : {}) as ResponsiveGridItemProps;
          const span =
            deviceType === 'phone'
              ? itemProps.mobileSpan ?? 1
              : deviceType === 'tablet'
                ? itemProps.tabletSpan ?? 3
                : itemProps.desktopSpan ?? 3;
          const clampedSpan = Math.max(1, Math.min(totalColumns, span));
          const widthPercent = `${(clampedSpan / totalColumns) * 100}%`;
          const minWidth =
            deviceType === 'phone'
              ? usableWidth - normalizedGap
              : deviceType === 'tablet'
                ? 280
                : clampedSpan >= 6
                  ? 420
                  : 260;

          return (
            <View
              key={index}
              style={[
                styles.item,
                {
                  width: widthPercent,
                  paddingHorizontal: itemGapOffset,
                  marginBottom: normalizedGap,
                  minWidth,
                },
                itemProps.style,
              ]}>
              {isGridItem ? itemProps.children : child}
            </View>
          );
        })()
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
    flexShrink: 0,
  },
});
