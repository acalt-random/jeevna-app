import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';
import { SectionCard } from '@/components/SectionCard';
import { StatCard } from '@/components/StatCard';
import { KPI, useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import React, { useMemo } from 'react';
import { Alert, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today and the six days before it (local calendar), oldest first. */
function last7DateKeys(): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    keys.push(dateKey(d));
  }
  return keys;
}

function kpiContribution(kpi: KPI, actuals: Record<string, string>): number {
  const actualValue = parseFloat(actuals[kpi.id] || '0');
  const safeActual = isNaN(actualValue) ? 0 : actualValue;

  let kpiScore = 0;
  if (kpi.target > 0) {
    kpiScore = (safeActual / kpi.target) * kpi.weight;
  }
  if (kpiScore > kpi.weight) {
    kpiScore = kpi.weight;
  }
  return kpiScore;
}

/** Category score 0–100 for one day’s actuals (same idea as Home). */
function categoryScore100(categoryName: string, kpis: KPI[], actuals: Record<string, string>): number {
  const kpisInCat = kpis.filter((k) => k.category === categoryName);
  let achieved = 0;
  let maxWeight = 0;
  for (const kpi of kpisInCat) {
    maxWeight += kpi.weight;
    achieved += kpiContribution(kpi, actuals);
  }
  if (maxWeight <= 0) return 0;
  return Math.round((achieved / maxWeight) * 100);
}

type ShareStats = {
  daysWithData: number;
  avgWeekScore: number | null;
  best: { date: string; totalScore: number } | null;
  worst: { date: string; totalScore: number } | null;
  strongest: { name: string; avg: number } | null;
  weakest: { name: string; avg: number } | null;
};

function buildWeeklyShareText(s: ShareStats): string {
  const lines = ['Life KPI — Weekly summary (last 7 days)', ''];

  if (s.daysWithData === 0) {
    lines.push('No entries saved for this week yet.');
    lines.push('');
    lines.push('Average score: —');
    lines.push('Best day: —');
    lines.push('Worst day: —');
    lines.push('Strongest category: —');
    lines.push('Weakest category: —');
    return lines.join('\n');
  }

  lines.push(
    `Average score: ${s.avgWeekScore} / 100 (${s.daysWithData} day(s) with data)`
  );
  lines.push(`Best day: ${s.best!.date} (${s.best!.totalScore} / 100)`);
  lines.push(`Worst day: ${s.worst!.date} (${s.worst!.totalScore} / 100)`);
  lines.push(
    s.strongest
      ? `Strongest category: ${s.strongest.name} (${s.strongest.avg} / 100 avg)`
      : 'Strongest category: — (not enough data)'
  );
  lines.push(
    s.weakest
      ? `Weakest category: ${s.weakest.name} (${s.weakest.avg} / 100 avg)`
      : 'Weakest category: — (not enough data)'
  );

  return lines.join('\n');
}

export default function WeeklySummaryScreen() {
  const { entries, categories, kpis } = useAppData();
  const { theme } = useTheme();
  const deviceType = useDeviceType();

  const stats = useMemo(() => {
    const weekDates = last7DateKeys();
    const weekSet = new Set(weekDates);
    const inWeek = entries.filter((e) => weekSet.has(e.date));

    const avgWeekScore =
      inWeek.length === 0 ? null : Math.round(inWeek.reduce((s, e) => s + e.totalScore, 0) / inWeek.length);

    let best: { date: string; totalScore: number } | null = null;
    let worst: { date: string; totalScore: number } | null = null;
    for (const e of inWeek) {
      if (!best || e.totalScore > best.totalScore) best = { date: e.date, totalScore: e.totalScore };
      if (!worst || e.totalScore < worst.totalScore) worst = { date: e.date, totalScore: e.totalScore };
    }

    const categoryRows = categories.map((cat) => {
      const hasKpis = kpis.some((k) => k.category === cat.name);
      if (!hasKpis) {
        return { id: cat.id, name: cat.name, avg: null as number | null, hasKpis: false };
      }
      const scores: number[] = [];
      for (const e of inWeek) {
        scores.push(categoryScore100(cat.name, kpis, e.actuals));
      }
      const avg = scores.length === 0 ? null : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return { id: cat.id, name: cat.name, avg, hasKpis: true };
    });

    const withAvg = categoryRows.filter((r) => r.hasKpis && r.avg !== null) as {
      id: string;
      name: string;
      avg: number;
      hasKpis: true;
    }[];

    let weakest: { name: string; avg: number } | null = null;
    let strongest: { name: string; avg: number } | null = null;
    if (withAvg.length > 0) {
      weakest = withAvg.reduce((a, b) => (b.avg < a.avg ? b : a));
      strongest = withAvg.reduce((a, b) => (b.avg > a.avg ? b : a));
    }

    return {
      weekDates,
      daysWithData: inWeek.length,
      avgWeekScore,
      best,
      worst,
      categoryRows,
      weakest,
      strongest,
    };
  }, [entries, categories, kpis]);

  const handleShareSummary = async () => {
    const message = buildWeeklyShareText({
      daysWithData: stats.daysWithData,
      avgWeekScore: stats.avgWeekScore,
      best: stats.best,
      worst: stats.worst,
      strongest: stats.strongest,
      weakest: stats.weakest,
    });

    try {
      await Share.share({
        message,
        title: 'Weekly summary',
      });
    } catch {
      Alert.alert('Share failed', 'Could not open the share dialog.');
    }
  };

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Weekly summary"
          subtitle="Last 7 days of entries, averaged and compared."
        />

          <TouchableOpacity
            style={[styles.shareButton, { borderColor: theme.primary, backgroundColor: theme.buttonSecondary, borderRadius: theme.borderRadius.md }]}
            onPress={handleShareSummary}
            activeOpacity={0.8}
          >
            <Text style={[styles.shareButtonText, { color: theme.primary }]}>Share summary</Text>
          </TouchableOpacity>

          {stats.daysWithData === 0 ? (
            <EmptyState
              title="No Entries This Week"
              message="Save daily entries to build your weekly summary."
            />
          ) : (
            <>
              <StatCard
                title="Average Score"
                value={`${stats.avgWeekScore} / 100`}
                subtitle={`${stats.daysWithData} day(s) with data`}
              />

              <ResponsiveGrid>
                <StatCard
                  title="Best Day"
                  value={stats.best?.date ?? '—'}
                  subtitle={`${stats.best?.totalScore ?? '—'} / 100`}
                />
                <StatCard
                  title="Worst Day"
                  value={stats.worst?.date ?? '—'}
                  subtitle={`${stats.worst?.totalScore ?? '—'} / 100`}
                />
              </ResponsiveGrid>

              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Category averages (week)</Text>
              <Text style={[styles.sectionHint, { color: theme.textMuted }]}>Averaged over days you saved an entry this week.</Text>

              {stats.categoryRows.filter((r) => r.hasKpis).length === 0 ? (
                <EmptyState
                  title="No Categories with KPIs"
                  message="Add KPIs to categories to see breakdowns."
                />
              ) : (
                stats.categoryRows
                  .filter((r) => r.hasKpis)
                  .map((row) => (
                    <SectionCard key={row.id}>
                      <View style={styles.catRow}>
                        <Text style={[styles.catName, { color: theme.textPrimary }]}>{row.name}</Text>
                        <Text style={[styles.catAvg, { color: theme.textSecondary }]}>
                          {row.avg !== null ? `${row.avg} / 100` : 'No data this week'}
                        </Text>
                      </View>
                    </SectionCard>
                  ))
              )}

              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Weekly insights</Text>
              <SectionCard>
                <Text style={[styles.insightLabel, { color: theme.primary }]}>Weakest category</Text>
                <Text style={[styles.insightValue, { color: theme.textPrimary }]}>
                  {stats.weakest ? `${stats.weakest.name} (${stats.weakest.avg} / 100 avg)` : 'Not enough category data yet'}
                </Text>
                <Text style={[styles.insightLabel, styles.insightSpacer, { color: theme.primary }]}>Strongest category</Text>
                <Text style={[styles.insightValue, { color: theme.textPrimary }]}>
                  {stats.strongest
                    ? `${stats.strongest.name} (${stats.strongest.avg} / 100 avg)`
                    : 'Not enough category data yet'}
                </Text>
              </SectionCard>
            </>
          )}
        </PageContainer>
      </ScrollView>
    );

  if (deviceType === 'desktop') {
    return (
      <DesktopShell title="Weekly">
        {pageContent}
      </DesktopShell>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {pageContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 14,
  },
  shareButton: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  shareButtonText: {
    color: '#93c5fd',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    flex: 1,
    marginRight: 12,
  },
  catAvg: {
    fontSize: 15,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  insightSpacer: {
    marginTop: 14,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginTop: 4,
  },
});
