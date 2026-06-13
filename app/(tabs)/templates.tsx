import { DesktopShell } from '@/components/DesktopShell';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveGrid, ResponsiveGridItem } from '@/components/ResponsiveGrid';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useTheme } from '@/context/ThemeContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import {
  buildLifeLibraryPackApplyPayload,
  getAvailableLifeLibraryPacks,
  getLocalizedPackDescription,
  getLocalizedPackTitle,
} from '@/services/lifeLibraryPackService';
import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function TemplatesScreen() {
  const { applyLifeLibraryPack } = useAppData();
  const { localePreferences } = usePreferences();
  const { theme } = useTheme();
  const deviceType = useDeviceType();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const packs = useMemo(() => getAvailableLifeLibraryPacks(localePreferences), [localePreferences]);

  const handleApply = (packId: string) => {
    const pack = packs.find((item) => item.id === packId);
    if (!pack) return;
    applyLifeLibraryPack(buildLifeLibraryPackApplyPayload(pack));
    setSuccessMessage(getLocalizedPackTitle(pack));
  };

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Life Library Packs"
          subtitle="Starter packs powered by the Life Library. Apply categories, KPIs, and activities without duplicates."
        />

        {successMessage ? (
          <Text style={[styles.feedback, { color: theme.success }]}>{successMessage} installed.</Text>
        ) : null}

        <ResponsiveGrid gap={14}>
          {packs.map((pack) => (
            <ResponsiveGridItem key={pack.id} mobileSpan={1} tabletSpan={3} desktopSpan={4}>
              <SectionCard>
                <Text style={[styles.packTitle, { color: theme.textPrimary }]}>
                  {getLocalizedPackTitle(pack)}
                </Text>
                <Text style={[styles.packBlurb, { color: theme.textSecondary }]}>
                  {getLocalizedPackDescription(pack)}
                </Text>
                <Text style={[styles.packMeta, { color: theme.textMuted }]}>
                  {pack.categoryIds.length} categories · {pack.kpiIds.length} KPIs · {pack.activityIds.length} activities
                </Text>
                <Text style={[styles.packMeta, { color: theme.textMuted }]}>
                  {pack.difficulty} · about {pack.estimatedSetupMinutes} min
                </Text>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={() => handleApply(pack.id)}
                  activeOpacity={0.8}>
                  <Text style={styles.buttonText}>Apply pack</Text>
                </TouchableOpacity>
              </SectionCard>
            </ResponsiveGridItem>
          ))}
        </ResponsiveGrid>
      </PageContainer>
    </ScrollView>
  );

  if (deviceType === 'desktop') {
    return <DesktopShell title="Life Library Packs">{pageContent}</DesktopShell>;
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>{pageContent}</SafeAreaView>;
}

const styles = StyleSheet.create({
  feedback: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
  },
  packTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  packBlurb: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  packMeta: {
    fontSize: 13,
    marginBottom: 8,
  },
  button: {
    minHeight: 42,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
