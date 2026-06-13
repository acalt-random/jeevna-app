import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface BrandLogoProps {
  size?: number;
}

export function BrandLogo({ size = 72 }: BrandLogoProps) {
  const { theme } = useTheme();
  const coreSize = Math.round(size * 0.42);

  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderColor: theme.cardBorder,
          backgroundColor: theme.secondaryBackground,
        },
      ]}>
      <View
        style={[
          styles.orbit,
          {
            width: size * 0.82,
            height: size * 0.82,
            borderColor: `${theme.accent}66`,
          },
        ]}
      />
      <View
        style={[
          styles.orbit,
          {
            width: size * 0.58,
            height: size * 0.58,
            borderColor: `${theme.primary}88`,
          },
        ]}
      />
      <View
        style={[
          styles.core,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
            backgroundColor: theme.buttonPrimary,
          },
        ]}>
        <MaterialIcons name="track-changes" size={Math.round(size * 0.24)} color="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  orbit: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 999,
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
