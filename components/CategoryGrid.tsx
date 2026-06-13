import React from 'react';

import { ResponsiveGrid, ResponsiveGridItem } from '@/components/ResponsiveGrid';

interface CategoryGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function CategoryGrid<T>({ items, renderItem, keyExtractor }: CategoryGridProps<T>) {
  return (
    <ResponsiveGrid gap={14}>
      {items.map((item) => (
        <ResponsiveGridItem
          key={keyExtractor(item)}
          mobileSpan={1}
          tabletSpan={3}
          desktopSpan={4}>
          {renderItem(item)}
        </ResponsiveGridItem>
      ))}
    </ResponsiveGrid>
  );
}
