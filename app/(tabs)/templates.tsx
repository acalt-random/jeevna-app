import { DesktopShell } from '@/components/DesktopShell';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import { templatePacks, TemplatePack } from '@/src/data/templatePacks';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function TemplatesScreen() {
  const { applyTemplatePack } = useAppData();
  const deviceType = useDeviceType();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleApply = (pack: TemplatePack) => {
    const { id, title, blurb, ...payload } = pack;
    applyTemplatePack(payload);
    setSuccessMessage(title);
  };

  // Auto-redirect to home after showing success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successMessage, router]);

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Template packs"
          subtitle="Add starter categories and KPIs without duplicating existing names."
        />

          {successMessage ? (
            <Text style={styles.feedback}>{successMessage} template installed.</Text>
          ) : null}

          {templatePacks.map((pack) => (
            <SectionCard key={pack.id}>
              <Text style={styles.packTitle}>{pack.title}</Text>
              <Text style={styles.packBlurb}>{pack.blurb}</Text>
              <Text style={styles.packMeta}>
                {pack.categories.length} categories · {pack.kpis.length} KPIs
              </Text>
              <TouchableOpacity style={styles.button} onPress={() => handleApply(pack)} activeOpacity={0.8}>
                <Text style={styles.buttonText}>Apply pack</Text>
              </TouchableOpacity>
            </SectionCard>
          ))}
        </PageContainer>
      </ScrollView>
    );

  if (deviceType === 'desktop') {
    return (
      <DesktopShell title="Templates">
        {pageContent}
      </DesktopShell>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {pageContent}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  feedback: {
    fontSize: 14,
    color: '#86efac',
    textAlign: 'center',
    marginBottom: 16,
  },
  packTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 6,
  },
  packBlurb: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 8,
  },
  packMeta: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
