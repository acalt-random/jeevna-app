import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface DesktopShellProps {
  children: React.ReactNode;
  title: string;
}

export function DesktopShell({ children, title }: DesktopShellProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: theme.background,
      }}>
      <View
        style={{
          width: 260,
          backgroundColor: theme.secondaryBackground,
          padding: theme.spacing.lg,
          paddingTop: theme.spacing.xxl,
          borderRightWidth: 1,
          borderRightColor: theme.cardBorder,
        }}>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            color: theme.textPrimary,
            marginBottom: theme.spacing.xxl,
          }}>
          Life KPI
        </Text>
        <TouchableOpacity
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginBottom: 8,
            borderRadius: theme.borderRadius.md,
            backgroundColor: theme.buttonSecondary,
          }}
          onPress={() => navigateTo('/(tabs)')}>
          <Text style={{ fontSize: 16, color: theme.textPrimary, fontWeight: '600' }}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={navItemStyle(theme)}
          onPress={() => navigateTo('/(tabs)/entry')}>
          <Text style={{ fontSize: 16, color: theme.textSecondary }}>Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={navItemStyle(theme)}
          onPress={() => navigateTo('/(tabs)/kpis')}>
          <Text style={{ fontSize: 16, color: theme.textSecondary }}>KPIs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={navItemStyle(theme)}
          onPress={() => navigateTo('/(tabs)/categories')}>
          <Text style={{ fontSize: 16, color: theme.textSecondary }}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={navItemStyle(theme)}
          onPress={() => navigateTo('/(tabs)/history')}>
          <Text style={{ fontSize: 16, color: theme.textSecondary }}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={navItemStyle(theme)}
          onPress={() => navigateTo('/(tabs)/weekly')}>
          <Text style={{ fontSize: 16, color: theme.textSecondary }}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={navItemStyle(theme)}
          onPress={() => navigateTo('/life-buddy')}>
          <Text style={{ fontSize: 16, color: theme.textSecondary }}>Life Buddy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={navItemStyle(theme)}
          onPress={() => navigateTo('/preferences')}>
          <Text style={{ fontSize: 16, color: theme.textSecondary }}>Preferences</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={navItemStyle(theme)}
          onPress={() => navigateTo('/(tabs)/templates')}>
          <Text style={{ fontSize: 16, color: theme.textSecondary }}>Templates</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <View
          style={{
            height: 68,
            backgroundColor: theme.secondaryBackground,
            justifyContent: 'center',
            paddingHorizontal: theme.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.cardBorder,
          }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: theme.textPrimary }}>{title}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: theme.spacing.md }}>
          {children}
        </View>
      </View>
    </View>
  );
}

function navItemStyle(theme: ReturnType<typeof useTheme>['theme']) {
  return {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: theme.borderRadius.md,
  } as const;
}
