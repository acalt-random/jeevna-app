import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { GlobalSearchButton } from '@/components/GlobalSearchModal';
import { useTheme } from '@/context/ThemeContext';
import { useDeviceType } from '@/hooks/useDeviceType';

const SIDEBAR_COLLAPSED_KEY = 'lifeKpi_sidebarCollapsed';

type NavItem = {
  label: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const navItems: NavItem[] = [
  { label: 'Home', route: '/(tabs)', icon: 'home' },
  { label: 'Entry', route: '/(tabs)/entry', icon: 'edit-note' },
  { label: 'KPIs', route: '/(tabs)/kpis', icon: 'show-chart' },
  { label: 'Categories', route: '/(tabs)/categories', icon: 'dashboard' },
  { label: 'History', route: '/(tabs)/history', icon: 'history' },
  { label: 'Weekly', route: '/(tabs)/weekly', icon: 'calendar-view-week' },
  { label: 'Preferences', route: '/preferences', icon: 'tune' },
  { label: 'Life Library', route: '/(tabs)/templates', icon: 'auto-awesome-motion' },
];

interface DesktopShellProps {
  children: React.ReactNode;
  title: string;
}

function pathMatches(currentPath: string, route: string) {
  if (route === '/(tabs)') {
    return currentPath === '/(tabs)' || currentPath === '/';
  }

  return currentPath.startsWith(route);
}

function SidebarContent({
  collapsed,
  currentPath,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed: boolean;
  currentPath: string;
  onNavigate: (route: string) => void;
  onToggleCollapse?: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: collapsed ? 88 : 260,
          backgroundColor: theme.secondaryBackground,
          borderRightColor: theme.cardBorder,
          paddingHorizontal: collapsed ? theme.spacing.sm : theme.spacing.lg,
        },
      ]}>
      <View style={styles.sidebarTop}>
        <View style={[styles.brandRow, collapsed && styles.brandRowCollapsed]}>
          <View
            style={[
              styles.brandBadge,
              {
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
              },
            ]}>
            <MaterialIcons name="insights" size={22} color={theme.primary} />
          </View>
          {!collapsed ? (
            <View style={styles.brandCopy}>
              <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>Life KPI</Text>
              <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>
                Personal operating system
              </Text>
            </View>
          ) : null}
        </View>

        {onToggleCollapse ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            activeOpacity={0.84}
            onPress={onToggleCollapse}
            style={[
              styles.collapseButton,
              {
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
              },
            ]}>
            <MaterialIcons
              name={collapsed ? 'keyboard-double-arrow-right' : 'keyboard-double-arrow-left'}
              size={20}
              color={theme.textPrimary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.navStack}>
        {navItems.map((item) => {
          const active = pathMatches(currentPath, item.route);

          return (
            <TouchableOpacity
              key={item.route}
              activeOpacity={0.84}
              onPress={() => onNavigate(item.route)}
              style={[
                styles.navItem,
                {
                  backgroundColor: active ? theme.background : 'transparent',
                  borderColor: active ? theme.cardBorder : 'transparent',
                  borderRadius: theme.borderRadius.md,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                },
              ]}>
              <MaterialIcons
                name={item.icon}
                size={20}
                color={active ? theme.primary : theme.textSecondary}
              />
              {!collapsed ? (
                <Text
                  style={[
                    styles.navLabel,
                    { color: active ? theme.textPrimary : theme.textSecondary },
                  ]}>
                  {item.label}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function DesktopShell({ children, title }: DesktopShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const deviceType = useDeviceType();
  const { theme } = useTheme();
  const isDesktop = deviceType === 'desktop';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      .then((value) => {
        if (value === 'true') {
          setSidebarCollapsed(true);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      AsyncStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)).catch(() => undefined);
      return next;
    });
  };

  const handleNavigate = (route: string) => {
    setDrawerOpen(false);
    router.push(route as never);
  };

  const sidebar = (
    <SidebarContent
      collapsed={sidebarCollapsed}
      currentPath={pathname}
      onNavigate={handleNavigate}
      onToggleCollapse={isDesktop ? handleToggleCollapse : undefined}
    />
  );

  if (isDesktop) {
    return (
      <View style={[styles.shell, { backgroundColor: theme.background }]}>
        {sidebar}
        <View style={styles.mainColumn}>
          <View
            style={[
              styles.headerBar,
              {
                backgroundColor: theme.secondaryBackground,
                borderBottomColor: theme.cardBorder,
                paddingHorizontal: theme.spacing.lg,
              },
            ]}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{title}</Text>
            </View>
            <GlobalSearchButton compact />
          </View>
          <View style={[styles.mainBody, { backgroundColor: theme.background }]}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.mobileShell, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.mobileHeader,
          {
            backgroundColor: theme.secondaryBackground,
            borderBottomColor: theme.cardBorder,
            paddingHorizontal: theme.spacing.md,
          },
        ]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open navigation"
          activeOpacity={0.84}
          onPress={() => setDrawerOpen(true)}
          style={[
            styles.mobileHeaderButton,
            {
              backgroundColor: theme.background,
              borderColor: theme.cardBorder,
              borderRadius: theme.borderRadius.md,
            },
          ]}>
          <MaterialIcons name="menu" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.mobileHeaderTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>

        <GlobalSearchButton compact />
      </View>

      <View style={styles.mobileContent}>{children}</View>

      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerRoot}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
          <SafeAreaView
            style={[
              styles.drawerPanel,
              {
                backgroundColor: theme.secondaryBackground,
                borderRightColor: theme.cardBorder,
              },
            ]}>
            <ScrollView contentContainerStyle={styles.drawerScroll}>
              <SidebarContent
                collapsed={false}
                currentPath={pathname}
                onNavigate={handleNavigate}
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    paddingTop: 28,
    borderRightWidth: 1,
  },
  sidebarTop: {
    gap: 14,
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandRowCollapsed: {
    justifyContent: 'center',
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCopy: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  brandSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  collapseButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  navStack: {
    gap: 6,
  },
  navItem: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  mainColumn: {
    flex: 1,
  },
  headerBar: {
    height: 68,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  mainBody: {
    flex: 1,
    paddingTop: 8,
  },
  mobileShell: {
    flex: 1,
  },
  mobileHeader: {
    minHeight: 62,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileHeaderButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  mobileContent: {
    flex: 1,
  },
  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.44)',
  },
  drawerPanel: {
    width: 296,
    borderRightWidth: 1,
  },
  drawerScroll: {
    flexGrow: 1,
  },
});
