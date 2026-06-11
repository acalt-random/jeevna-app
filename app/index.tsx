import { usePreferences } from '@/context/PreferencesContext';
import { useTheme } from '@/context/ThemeContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootIndexScreen() {
  const { preferencesHydrated, onboardingCompleted } = usePreferences();
  const { theme } = useTheme();

  if (!preferencesHydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.background,
        }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <Redirect href={onboardingCompleted ? '/(tabs)' : '/onboarding'} />;
}
