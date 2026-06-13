import { DesktopShell } from '@/components/DesktopShell';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import {
  LifeBuddyScoringPreferences,
  ScoringSection,
  usePreferences,
} from '@/context/PreferencesContext';
import { getLocaleDisplayLabel, localeDefinitions } from '@/src/data/locales';
import { useTheme } from '@/context/ThemeContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import { appendAuditEntry, getAuditLog } from '@/services/auditLogService';
import { getConsents, updateConsent } from '@/services/consentService';
import { getEventLog } from '@/services/eventBus';
import { exportPackageToJson } from '@/services/exportService';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ConsentRecord, ConsentType } from '@/types/consent';

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

function WeightControlRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.weightRow,
        {
          borderBottomColor: theme.cardBorder,
        },
      ]}>
      <View style={styles.weightTextBlock}>
        <Text style={[styles.weightLabel, { color: theme.textPrimary }]}>{label}</Text>
      </View>
      <View style={styles.weightControls}>
        <TouchableOpacity
          style={[
            styles.stepButton,
            {
              backgroundColor: theme.buttonSecondary,
              borderColor: theme.cardBorder,
              borderRadius: theme.borderRadius.sm,
            },
          ]}
          onPress={() => onChange(value - 1)}
          activeOpacity={0.8}>
          <Text style={[styles.stepButtonText, { color: theme.textPrimary }]}>-</Text>
        </TouchableOpacity>
        <View
          style={[
            styles.valueBadge,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.cardBorder,
              borderRadius: theme.borderRadius.sm,
            },
          ]}>
          <Text style={[styles.valueText, { color: theme.textPrimary }]}>{value}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.stepButton,
            {
              backgroundColor: theme.buttonSecondary,
              borderColor: theme.cardBorder,
              borderRadius: theme.borderRadius.sm,
            },
          ]}
          onPress={() => onChange(value + 1)}
          activeOpacity={0.8}>
          <Text style={[styles.stepButtonText, { color: theme.textPrimary }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TogglePreferenceRow({
  title,
  subtitle,
  value,
  onToggle,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.weightRow,
        {
          borderBottomColor: theme.cardBorder,
        },
      ]}>
      <View style={styles.weightTextBlock}>
        <Text style={[styles.weightLabel, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.toggleBadge,
          {
            backgroundColor: value ? theme.buttonPrimary : theme.buttonSecondary,
            borderColor: value ? theme.buttonPrimary : theme.cardBorder,
            borderRadius: theme.borderRadius.sm,
          },
        ]}
        onPress={onToggle}
        activeOpacity={0.85}>
        <Text style={[styles.toggleBadgeText, { color: value ? '#ffffff' : theme.textPrimary }]}>
          {value ? 'On' : 'Off'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function LifeBuddyWeightSection({
  title,
  section,
  values,
  onChange,
}: {
  title: string;
  section: ScoringSection;
  values: LifeBuddyScoringPreferences[ScoringSection];
  onChange: (section: ScoringSection, label: string, value: number) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.preferenceGroup}>
      <Text style={[styles.groupTitle, { color: theme.primary }]}>{title}</Text>
      {Object.entries(values).map(([label, value]) => (
        <WeightControlRow
          key={`${section}-${label}`}
          label={label}
          value={value}
          onChange={(nextValue) => onChange(section, label, nextValue)}
        />
      ))}
    </View>
  );
}

export default function PreferencesScreen() {
  const { theme, themes, selectedThemeId, setSelectedThemeId } = useTheme();
  const { categories, kpis, subtasks, entries } = useAppData();
  const {
    onboardingCompleted,
    onboardingProfile,
    reminderPreferences,
    updateReminderPreference,
    resetReminderPreferences,
    lifeBuddyScoringPreferences,
    localePreferences,
    updateLifeBuddyScoringPreference,
    resetLifeBuddyScoringPreferences,
    selectedLanguage,
    setSelectedLocale,
  } = usePreferences();
  const deviceType = useDeviceType();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [auditCount, setAuditCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [lastExportSummary, setLastExportSummary] = useState<string | null>(null);

  useEffect(() => {
    const loadPlatformFoundations = async () => {
      const [loadedConsents, auditLog, eventLog] = await Promise.all([
        getConsents(),
        getAuditLog(),
        getEventLog(),
      ]);
      setConsents(loadedConsents);
      setAuditCount(auditLog.length);
      setEventCount(eventLog.length);
    };

    loadPlatformFoundations().catch((error) => {
      console.error('Error loading platform foundation data', error);
    });
  }, []);

  const handleToggleConsent = async (consentType: ConsentType, granted: boolean) => {
    const nextRecord = await updateConsent(consentType, granted);
    setConsents((current) =>
      current.map((record) => (record.consentType === consentType ? nextRecord : record))
    );
    await appendAuditEntry({
      action: 'CONSENT_UPDATED',
      entityType: 'consent',
      entityId: consentType,
      after: nextRecord,
    });
  };

  const handleExportJson = async () => {
    const [consentRecords, auditLog] = await Promise.all([getConsents(), getAuditLog()]);
    const exportJson = exportPackageToJson({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appVersion,
      locale: localePreferences,
      preferences: {
        onboardingCompleted,
        onboardingProfile,
        reminderPreferences,
        selectedLanguage,
        localePreferences,
      },
      categories,
      kpis,
      activities: subtasks,
      entries,
      reviews: [],
      insights: [],
      consents: consentRecords,
      auditLog,
    });

    setLastExportSummary(`Generated ${exportJson.length.toLocaleString()} characters of JSON.`);
    Alert.alert('Export JSON Ready', 'A local JSON export package was generated successfully.');
  };

  const consentLabels: Record<ConsentType, { title: string; subtitle: string }> = {
    ai_processing: {
      title: 'AI processing',
      subtitle: 'Placeholder consent for future AI-assisted processing.',
    },
    analytics: {
      title: 'Analytics',
      subtitle: 'Placeholder consent for privacy-aware product analytics.',
    },
    notifications: {
      title: 'Notifications',
      subtitle: 'Placeholder consent for reminders and proactive notifications.',
    },
    health_data: {
      title: 'Health data',
      subtitle: 'Placeholder consent for future health integrations.',
    },
    calendar_access: {
      title: 'Calendar access',
      subtitle: 'Placeholder consent for calendar sync and scheduling features.',
    },
    contacts_access: {
      title: 'Contacts access',
      subtitle: 'Placeholder consent for contact-based workflows.',
    },
    public_profile: {
      title: 'Public profile',
      subtitle: 'Placeholder consent for optional community-facing identity features.',
    },
    benchmarking: {
      title: 'Benchmarking',
      subtitle: 'Placeholder consent for anonymized comparisons and insights.',
    },
  };

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

          <Text style={[styles.groupTitle, { color: theme.primary }]}>Locale</Text>
          <View style={styles.languageRow}>
            {localeDefinitions.filter((locale) => locale.recommended).map((locale) => {
              const isSelected = localePreferences.locale === locale.id;
              return (
                <TouchableOpacity
                  key={locale.id}
                  style={[
                    styles.languageChip,
                    {
                      backgroundColor: isSelected ? theme.buttonPrimary : theme.buttonSecondary,
                      borderColor: isSelected ? theme.buttonPrimary : theme.cardBorder,
                      borderRadius: theme.borderRadius.sm,
                    },
                  ]}
                  onPress={() => setSelectedLocale(locale.id)}
                  activeOpacity={0.85}>
                  <Text
                    style={[
                      styles.languageChipText,
                      { color: isSelected ? '#ffffff' : theme.textPrimary },
                    ]}>
                    {getLocaleDisplayLabel(locale).replace('\n', ' · ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

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
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Life Buddy Settings</Text>
          <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
            Customize the importance, urgency, and impact weights Life Buddy shows in its scoring guidance.
          </Text>

          <LifeBuddyWeightSection
            title="Category Importance"
            section="categoryImportance"
            values={lifeBuddyScoringPreferences.categoryImportance}
            onChange={updateLifeBuddyScoringPreference}
          />
          <LifeBuddyWeightSection
            title="Relationship Importance"
            section="relationshipImportance"
            values={lifeBuddyScoringPreferences.relationshipImportance}
            onChange={updateLifeBuddyScoringPreference}
          />
          <LifeBuddyWeightSection
            title="Urgency Weights"
            section="urgencyWeights"
            values={lifeBuddyScoringPreferences.urgencyWeights}
            onChange={updateLifeBuddyScoringPreference}
          />
          <LifeBuddyWeightSection
            title="Impact Weights"
            section="impactWeights"
            values={lifeBuddyScoringPreferences.impactWeights}
            onChange={updateLifeBuddyScoringPreference}
          />

          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: theme.buttonSecondary,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
              },
            ]}
            onPress={resetLifeBuddyScoringPreferences}
            activeOpacity={0.85}>
            <Text style={[styles.resetButtonText, { color: theme.textPrimary }]}>Reset to Defaults</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.cardBorder,
          }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Notifications</Text>
          <TogglePreferenceRow
            title="KPI reminders"
            subtitle="Default reminder preference for logging your KPIs."
            value={reminderPreferences.kpiReminders}
            onToggle={() => updateReminderPreference('kpiReminders', !reminderPreferences.kpiReminders)}
          />
          <TogglePreferenceRow
            title="Relationship reminders"
            subtitle="Default reminder preference for following up with people."
            value={reminderPreferences.relationshipReminders}
            onToggle={() =>
              updateReminderPreference(
                'relationshipReminders',
                !reminderPreferences.relationshipReminders
              )
            }
          />
          <TogglePreferenceRow
            title="Weekly review"
            subtitle="Default reminder preference for your weekly reset and review."
            value={reminderPreferences.weeklyReview}
            onToggle={() => updateReminderPreference('weeklyReview', !reminderPreferences.weeklyReview)}
          />
          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: theme.buttonSecondary,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
              },
            ]}
            onPress={resetReminderPreferences}
            activeOpacity={0.85}>
            <Text style={[styles.resetButtonText, { color: theme.textPrimary }]}>Reset Reminder Defaults</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.cardBorder,
          }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Consent</Text>
          <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
            Local placeholder controls for future data and platform permissions.
          </Text>
          {consents.map((record) => (
            <TogglePreferenceRow
              key={record.consentType}
              title={consentLabels[record.consentType].title}
              subtitle={consentLabels[record.consentType].subtitle}
              value={record.granted}
              onToggle={() => handleToggleConsent(record.consentType, !record.granted)}
            />
          ))}
        </SectionCard>

        <SectionCard
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.cardBorder,
          }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Data</Text>
          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: theme.buttonSecondary,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
                marginTop: 0,
                marginBottom: 12,
              },
            ]}
            onPress={() => {
              handleExportJson().catch((error) => {
                console.error('Error exporting JSON', error);
                Alert.alert('Export failed', 'Could not generate the JSON export package.');
              });
            }}
            activeOpacity={0.85}>
            <Text style={[styles.resetButtonText, { color: theme.textPrimary }]}>Export JSON</Text>
          </TouchableOpacity>
          {lastExportSummary ? (
            <Text style={[styles.exportHint, { color: theme.textSecondary }]}>{lastExportSummary}</Text>
          ) : null}
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
            title="Locale"
            subtitle={`${localePreferences.locale} • ${localePreferences.countryCode} • ${localePreferences.currencyCode}`}
          />
          <PlaceholderRow
            title="Timezone"
            subtitle={localePreferences.timezone}
          />
          <PlaceholderRow
            title="Onboarding"
            subtitle={onboardingCompleted ? 'Completed' : 'Not completed'}
          />
          <PlaceholderRow
            title="Privacy Policy"
            subtitle="Placeholder for future privacy policy link and legal information."
          />
        </SectionCard>

        <SectionCard
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.cardBorder,
          }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Debug Foundations</Text>
          <PlaceholderRow title="Audit log entries" subtitle={`${auditCount} local audit records`} />
          <PlaceholderRow title="Domain events" subtitle={`${eventCount} local event records`} />
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
  preferenceGroup: {
    marginTop: 10,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  languageChip: {
    minHeight: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  languageChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  weightTextBlock: {
    flex: 1,
  },
  weightLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  toggleSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  weightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepButtonText: {
    fontSize: 18,
    fontWeight: '800',
  },
  valueBadge: {
    minWidth: 42,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleBadge: {
    minWidth: 62,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  toggleBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  resetButton: {
    minHeight: 46,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  exportHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
});
