import { DesktopShell } from '@/components/DesktopShell';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';
import { SectionCard } from '@/components/SectionCard';
import { useTheme } from '@/context/ThemeContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import Constants from 'expo-constants';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function PlaceholderRow({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.cardBorder,
      }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 20 }}>{subtitle}</Text>
    </View>
  );
}

export default function PreferencesScreen() {
  const { theme, themes, selectedThemeId, setSelectedThemeId } = useTheme();
  const deviceType = useDeviceType();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Preferences"
          subtitle="Appearance, notifications, data and app settings."
        />

        <SectionCard
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.cardBorder,
          }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Appearance</Text>
          <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
            Choose the look that feels best for your daily workflow.
          </Text>

          <ResponsiveGrid>
            {themes.map((option) => {
              const isSelected = option.id === selectedThemeId;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.themeOptionCard,
                    {
                      backgroundColor: option.cardBackground,
                      borderColor: isSelected ? option.primary : option.cardBorder,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={() => setSelectedThemeId(option.id)}
                  activeOpacity={0.85}>
                  <Text style={[styles.themeOptionTitle, { color: option.textPrimary }]}>{option.name}</Text>
                  <Text style={[styles.themeOptionSubtitle, { color: option.textSecondary }]}>
                    {option.isDark ? 'Premium dark mood' : 'Bright minimal mood'}
                  </Text>
                  <View style={styles.themeSwatchRow}>
                    {[option.primary, option.accent, option.cardBackground].map((color, index) => (
                      <View
                        key={`${option.id}-${index}`}
                        style={[
                          styles.themeSwatch,
                          {
                            backgroundColor: color,
                            borderColor: option.cardBorder,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ResponsiveGrid>

          <PlaceholderRow
            title="Dark / Light mode"
            subtitle="Placeholder for future system mode or manual mode controls."
          />
          <PlaceholderRow
            title="Font size"
            subtitle="Placeholder for future text scaling and reading comfort controls."
          />
        </SectionCard>

        <SectionCard
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.cardBorder,
          }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Notifications</Text>
          <PlaceholderRow
            title="KPI reminders"
            subtitle="Placeholder for future daily KPI reminder settings."
          />
          <PlaceholderRow
            title="Relationship reminders"
            subtitle="Placeholder for future people follow-up reminder settings."
          />
        </SectionCard>

        <SectionCard
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.cardBorder,
          }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Data</Text>
          <PlaceholderRow
            title="Export data"
            subtitle="Placeholder for future data export and portability tools."
          />
          <PlaceholderRow
            title="Import data"
            subtitle="Placeholder for future import and restore workflows."
          />
          <PlaceholderRow
            title="Backup"
            subtitle="Placeholder for future backup and sync options."
          />
        </SectionCard>

        <SectionCard
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.cardBorder,
          }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>About</Text>
          <PlaceholderRow
            title="App version"
            subtitle={`Current version: ${appVersion}`}
          />
          <PlaceholderRow
            title="Current theme"
            subtitle={theme.name}
          />
          <PlaceholderRow
            title="Privacy Policy"
            subtitle="Placeholder for future privacy policy link and legal information."
          />
        </SectionCard>
      </PageContainer>
    </ScrollView>
  );

  if (deviceType === 'desktop') {
    return <DesktopShell title="Preferences">{pageContent}</DesktopShell>;
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>{pageContent}</SafeAreaView>;
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  themeOptionCard: {
    minHeight: 132,
    borderWidth: 1.5,
    padding: 14,
    justifyContent: 'space-between',
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  themeOptionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  themeSwatchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  themeSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
});
