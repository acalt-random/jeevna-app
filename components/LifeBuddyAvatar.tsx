import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface LifeBuddyAvatarProps {
  size?: number;
}

export function LifeBuddyAvatar({ size = 56 }: LifeBuddyAvatarProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.shell,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.secondaryBackground,
          borderColor: theme.cardBorder,
          shadowColor: theme.shadowColor,
          shadowOpacity: theme.shadowOpacity,
          shadowRadius: theme.shadowRadius,
          shadowOffset: { width: 0, height: 8 },
          elevation: theme.elevation,
        },
      ]}>
      <View
        style={[
          styles.glow,
          {
            width: size * 0.76,
            height: size * 0.76,
            borderRadius: (size * 0.76) / 2,
            backgroundColor: `${theme.accent}22`,
          },
        ]}
      />
      <View
        style={[
          styles.core,
          {
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: (size * 0.5) / 2,
            backgroundColor: theme.buttonPrimary,
          },
        ]}>
        <MaterialIcons name="explore" size={Math.round(size * 0.24)} color="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  glow: {
    position: 'absolute',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
