import { DesktopShell } from '@/components/DesktopShell';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { TemplatePackPayload, useAppData } from '@/context/AppDataContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

type Pack = TemplatePackPayload & { id: string; title: string; blurb: string };

const TEMPLATE_PACKS: Pack[] = [
  {
    id: 'health',
    title: 'Health',
    blurb: 'Fitness, sleep, and daily wellness habits.',
    categories: ['Fitness', 'Sleep', 'Nutrition', 'Mindfulness'],
    kpis: [
      { name: 'Workouts', category: 'Fitness', target: 4, unit: 'sessions', weight: 12 },
      { name: 'Steps', category: 'Fitness', target: 8000, unit: 'steps', weight: 10 },
      { name: 'Sleep hours', category: 'Sleep', target: 8, unit: 'hours', weight: 15 },
      { name: 'Water glasses', category: 'Nutrition', target: 8, unit: 'glasses', weight: 8 },
      { name: 'Meditation minutes', category: 'Mindfulness', target: 15, unit: 'minutes', weight: 8 },
    ],
  },
  {
    id: 'productivity',
    title: 'Productivity',
    blurb: 'Deep work, tasks, and communication.',
    categories: ['Deep Work', 'Tasks', 'Communication'],
    kpis: [
      { name: 'Deep work blocks', category: 'Deep Work', target: 3, unit: 'blocks', weight: 15 },
      { name: 'Tasks completed', category: 'Tasks', target: 5, unit: 'tasks', weight: 12 },
      { name: 'Inbox zero', category: 'Communication', target: 1, unit: 'done', weight: 8 },
      { name: 'Planning session', category: 'Tasks', target: 1, unit: 'session', weight: 7 },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    blurb: 'Spending awareness, saving, and investing habits.',
    categories: ['Spending', 'Saving', 'Investing'],
    kpis: [
      { name: 'Days on budget', category: 'Spending', target: 7, unit: 'days', weight: 12 },
      { name: 'Savings contribution', category: 'Saving', target: 200, unit: 'dollars', weight: 15 },
      { name: 'Investment review', category: 'Investing', target: 1, unit: 'session', weight: 8 },
    ],
  },
  {
    id: 'learning',
    title: 'Learning',
    blurb: 'Reading, courses, and deliberate practice.',
    categories: ['Reading', 'Courses', 'Practice'],
    kpis: [
      { name: 'Pages read', category: 'Reading', target: 25, unit: 'pages', weight: 10 },
      { name: 'Course lessons', category: 'Courses', target: 2, unit: 'lessons', weight: 12 },
      { name: 'Practice hours', category: 'Practice', target: 2, unit: 'hours', weight: 14 },
    ],
  },
  {
    id: 'balanced',
    title: 'Balanced Life',
    blurb: 'A little bit across health, work, money, learning, and people.',
    categories: ['Health', 'Work', 'Finance', 'Learning', 'Relationships'],
    kpis: [
      { name: 'Movement', category: 'Health', target: 30, unit: 'minutes', weight: 10 },
      { name: 'Focused work', category: 'Work', target: 4, unit: 'hours', weight: 12 },
      { name: 'Money check-in', category: 'Finance', target: 1, unit: 'session', weight: 8 },
      { name: 'Learning time', category: 'Learning', target: 45, unit: 'minutes', weight: 10 },
      { name: 'Quality time', category: 'Relationships', target: 1, unit: 'session', weight: 10 },
    ],
  },
];

export default function TemplatesScreen() {
  const { applyTemplatePack } = useAppData();
  const deviceType = useDeviceType();
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  const handleApply = (pack: Pack) => {
    const { id, title, blurb, ...payload } = pack;
    applyTemplatePack(payload);
    setLastApplied(title);
  };

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Template packs"
          subtitle="Add starter categories and KPIs without duplicating existing names."
        />

          {lastApplied ? (
            <Text style={styles.feedback}>Applied &quot;{lastApplied}&quot; — check Categories and KPIs.</Text>
          ) : null}

          {TEMPLATE_PACKS.map((pack) => (
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
