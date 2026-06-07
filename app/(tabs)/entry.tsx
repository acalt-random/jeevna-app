import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import React, { useEffect, useMemo, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from 'react-native';

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function EntryScreen() {
  const { kpis, entries, saveEntry } = useAppData();
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState('');
  const [score, setScore] = useState<number | null>(null);

  const sortedKpis = useMemo(() => {
    return [...kpis].sort((a, b) => a.category.localeCompare(b.category));
  }, [kpis]);

  useEffect(() => {
    const today = todayYMD();
    const todayEntry = entries.find((e) => e.date === today);
    if (todayEntry) {
      setActuals({ ...todayEntry.actuals });
      setScore(todayEntry.totalScore);
    }
  }, [entries]);

  const handleActualChange = (kpiId: string, value: string) => {
    setActuals((prev) => ({
      ...prev,
      [kpiId]: value,
    }));
  };

  const deviceType = useDeviceType();

  const handleSave = () => {
    let totalScore = 0;

    for (const kpi of kpis) {
      const actualValue = parseFloat(actuals[kpi.id] || '0');
      const safeActual = isNaN(actualValue) ? 0 : actualValue;

      let kpiScore = 0;
      if (kpi.target > 0) {
        kpiScore = (safeActual / kpi.target) * kpi.weight;
      }

      if (kpiScore > kpi.weight) {
        kpiScore = kpi.weight;
      }

      totalScore += kpiScore;
    }

    if (totalScore > 100) {
      totalScore = 100;
    }

    const rounded = Math.round(totalScore);
    saveEntry(actuals, rounded);
    setScore(rounded);
    setSaveMessage('Data saved successfully');

    console.log('Actual entries:', actuals);
    console.log('Total score:', rounded);
  };

  if (kpis.length === 0) {
    const noKpiContent = (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <PageContainer>
          <EmptyState
            title="No KPIs Yet"
            message="Please add KPIs first to start tracking your daily progress."
          />
        </PageContainer>
      </ScrollView>
    );

    if (deviceType === 'desktop') {
      return (
        <DesktopShell title="Entry">
          {noKpiContent}
        </DesktopShell>
      );
    }

    return (
      <SafeAreaView style={{ flex: 1 }}>
        {noKpiContent}
      </SafeAreaView>
    );
  }

  const mainContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Daily Entry"
          subtitle="Log today's KPI results and track your daily progress."
        />

          {sortedKpis.map((kpi) => (
            <SectionCard key={kpi.id}>
              <Text style={styles.kpiName}>{kpi.name}</Text>
              <Text style={styles.kpiMeta}>Category: {kpi.category}</Text>
              <Text style={styles.kpiMeta}>
                Target: {kpi.target} {kpi.unit}
              </Text>
              <Text style={styles.kpiMeta}>Weight: {kpi.weight}</Text>

              <TextInput
                style={styles.input}
                value={actuals[kpi.id] || ''}
                onChangeText={(value) => handleActualChange(kpi.id, value)}
                keyboardType="numeric"
                placeholder={`Enter actual (${kpi.unit})`}
                placeholderTextColor="#888"
              />
            </SectionCard>
          ))}

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>

          {saveMessage ? <Text style={styles.success}>{saveMessage}</Text> : null}
          {score !== null ? (
            <Text style={styles.score}>{"Today's Score:"} {score}/100</Text>
          ) : null}
        </PageContainer>
      </ScrollView>
  );

  return deviceType === 'desktop' ? (
    <DesktopShell title="Entry">
      {mainContent}
    </DesktopShell>
  ) : (
    <SafeAreaView style={{ flex: 1 }}>
      {mainContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
  },
  kpiName: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 6,
  },
  kpiMeta: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  input: {
    marginTop: 12,
    backgroundColor: '#0f172a',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  success: {
    color: '#22c55e',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  score: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 22,
    fontWeight: '700',
  },
});