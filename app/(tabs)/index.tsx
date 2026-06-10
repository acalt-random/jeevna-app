import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';
import { SectionCard } from '@/components/SectionCard';
import { KPI, useAppData } from '@/context/AppDataContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

// ─── Pure logic (unchanged) ───────────────────────────────────────────────────

function kpiContribution(kpi: KPI, actuals: Record<string, string>): number {
  const actualValue = parseFloat(actuals[kpi.id] || '0');
  const safeActual = isNaN(actualValue) ? 0 : actualValue;
  let kpiScore = 0;
  if (kpi.target > 0) {
    kpiScore = (safeActual / kpi.target) * kpi.weight;
  }
  if (kpiScore > kpi.weight) kpiScore = kpi.weight;
  return kpiScore;
}

function computeOverallScore(kpis: KPI[], actuals: Record<string, string>): number {
  let totalScore = 0;
  for (const kpi of kpis) totalScore += kpiContribution(kpi, actuals);
  if (totalScore > 100) totalScore = 100;
  return Math.round(totalScore);
}

function statusForScore(score: number): { label: string; color: string; barColor: string; glow: string } {
  if (score >= 80) return { label: 'Strong',          color: '#34d399', barColor: '#10b981', glow: '#10b98140' };
  if (score >= 50) return { label: 'Stable',          color: '#fbbf24', barColor: '#f59e0b', glow: '#f59e0b40' };
  return              { label: 'Needs Attention', color: '#fb7185', barColor: '#f43f5e', glow: '#f43f5e40' };
}

function averageScores(entriesSlice: { totalScore: number }[]): number {
  if (entriesSlice.length === 0) return 0;
  return Math.round(entriesSlice.reduce((acc, e) => acc + e.totalScore, 0) / entriesSlice.length);
}

function trendFromEntries(sortedOldestFirst: { totalScore: number }[]): string {
  if (sortedOldestFirst.length < 2) return 'Stable';
  const diff = sortedOldestFirst[sortedOldestFirst.length - 1].totalScore - sortedOldestFirst[0].totalScore;
  if (diff > 3) return 'Improving ↑';
  if (diff < -3) return 'Declining ↓';
  return 'Stable →';
}

function todayYMDLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function previousDayYMD(ymd: string): string {
  const [y, mo, da] = ymd.split('-').map(Number);
  const d = new Date(y, mo - 1, da);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreaks(entries: { date: string }[]): { current: number; longest: number } {
  const entryDates = new Set(entries.map((e) => e.date));
  let current = 0;
  let day = todayYMDLocal();
  while (entryDates.has(day)) { current++; day = previousDayYMD(day); }
  const sorted = [...entryDates].sort((a, b) => a.localeCompare(b));
  if (sorted.length === 0) return { current, longest: 0 };
  let longest = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (previousDayYMD(sorted[i]) === sorted[i - 1]) { run++; } else { run = 1; }
    if (run > longest) longest = run;
  }
  return { current, longest };
}

// ─── Visual sub-components ────────────────────────────────────────────────────

/** Large glowing score ring */
function ScoreRing({ score, status }: { score: number; status: ReturnType<typeof statusForScore> }) {
  return (
    <View style={[ringStyles.wrap, { shadowColor: status.glow, shadowOpacity: 1, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 12 }]}>
      <View style={[ringStyles.ring, { borderColor: status.barColor }]}>
        <Text style={[ringStyles.number, { color: status.color }]}>{score}</Text>
        <Text style={ringStyles.denom}>/100</Text>
        <Text style={[ringStyles.label, { color: status.color }]}>{status.label}</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ring: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  number: {
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
  },
  denom: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

/** Streak pill */
function StreakCard({ current, longest }: { current: number; longest: number }) {
  return (
    <View style={streakStyles.card}>
      <Text style={streakStyles.flame}>🔥</Text>
      <Text style={streakStyles.number}>{current}</Text>
      <Text style={streakStyles.unit}>day streak</Text>
      <Text style={streakStyles.longest}>Best: {longest}d</Text>
    </View>
  );
}

const streakStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b44',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    flex: 1,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  flame: { fontSize: 28, marginBottom: 4 },
  number: { fontSize: 36, fontWeight: '900', color: '#fbbf24', lineHeight: 40 },
  unit: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  longest: { fontSize: 12, color: '#64748b', marginTop: 6 },
});

/** Insight row inside panel */
function InsightRow({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <View style={insightStyles.row}>
      <Text style={insightStyles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={insightStyles.label}>{label}</Text>
        <Text style={[insightStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

const insightStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  icon: { fontSize: 18, marginTop: 2 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
  },
});

/** Category card with colored left border + chunky progress bar */
function CategoryCard({ name, score100, status }: { name: string; score100: number; status: ReturnType<typeof statusForScore> }) {
  return (
    <View style={[catStyles.card, { borderLeftColor: status.barColor, shadowColor: status.glow }]}>
      <View style={catStyles.header}>
        <Text style={catStyles.name}>{name}</Text>
        <Text style={[catStyles.score, { color: status.color }]}>
          {score100}<Text style={catStyles.denom}>/100</Text>
        </Text>
      </View>
      <Text style={[catStyles.badge, { color: status.color }]}>{status.label}</Text>
      <View style={catStyles.track}>
        <View style={[catStyles.fill, {
          width: `${Math.min(100, Math.max(0, score100))}%` as any,
          backgroundColor: status.barColor,
          shadowColor: status.barColor,
        }]} />
      </View>
    </View>
  );
}

const catStyles = StyleSheet.create({
  card: {
    backgroundColor: '#131c2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    flex: 1,
    marginRight: 8,
  },
  score: {
    fontSize: 22,
    fontWeight: '900',
  },
  denom: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { categories, kpis, entries, latestActuals, latestScore, loadSampleData, clearAllData } = useAppData();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const deviceType = useDeviceType();

  // landscape = tall enough content area but width > height on mobile/tablet
  const isLandscape = width > height;

  const overallScore  = latestScore ?? computeOverallScore(kpis, latestActuals);
  const overallStatus = statusForScore(overallScore);

  const categoryRows = useMemo(() => {
    return categories.map((cat) => {
      const kpisInCat = kpis.filter((k) => k.category === cat.name);
      let achieved = 0, maxWeight = 0;
      for (const kpi of kpisInCat) {
        maxWeight += kpi.weight;
        achieved  += kpiContribution(kpi, latestActuals);
      }
      const score100 = maxWeight > 0 ? Math.round((achieved / maxWeight) * 100) : 0;
      return { id: cat.id, name: cat.name, score100, maxWeight, status: statusForScore(score100) };
    });
  }, [categories, kpis, latestActuals]);

  const focusCategory  = useMemo(() => {
    const w = categoryRows.filter((c) => c.maxWeight > 0);
    return w.length ? w.reduce((a, c) => (c.score100 < a.score100 ? c : a)) : null;
  }, [categoryRows]);

  const strongCategory = useMemo(() => {
    const w = categoryRows.filter((c) => c.maxWeight > 0);
    return w.length ? w.reduce((a, c) => (c.score100 > a.score100 ? c : a)) : null;
  }, [categoryRows]);

  const lastSevenChronological = useMemo(() => {
    return [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  }, [entries]);

  const sevenDayAverage = useMemo(() =>
    lastSevenChronological.length ? averageScores(lastSevenChronological) : null,
    [lastSevenChronological]
  );

  const trendLabel = useMemo(() => trendFromEntries(lastSevenChronological), [lastSevenChronological]);
  const streaks    = useMemo(() => computeStreaks(entries), [entries]);

  // ── Trend colour ──
  const trendColor = trendLabel.includes('↑') ? '#34d399' : trendLabel.includes('↓') ? '#fb7185' : '#fbbf24';

  // ── Testing panel (shared) ──
  const testingPanel = (
    <SectionCard style={styles.testingCard}>
      <Text style={styles.testingLabel}>Testing</Text>
      <View style={styles.testingRow}>
        <TouchableOpacity style={styles.testingBtnLoad} onPress={loadSampleData} activeOpacity={0.8}>
          <Text style={styles.testingBtnLoadText}>Load Sample Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testingBtnClear} onPress={clearAllData} activeOpacity={0.8}>
          <Text style={styles.testingBtnClearText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
    </SectionCard>
  );

  const lifeBuddyPanel = (
    <SectionCard style={styles.lifeBuddyCard}>
      <View style={styles.lifeBuddyRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.lifeBuddyLabel}>Life Buddy</Text>
          <Text style={styles.lifeBuddyTitle}>Get today&apos;s guided next steps</Text>
          <Text style={styles.lifeBuddyHint}>
            Review priorities, weak areas, relationship follow-ups, and missing KPI entries.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.lifeBuddyButton}
          onPress={() => router.push('/life-buddy')}
          activeOpacity={0.8}
        >
          <Text style={styles.lifeBuddyButtonText}>Open Life Buddy</Text>
        </TouchableOpacity>
      </View>
    </SectionCard>
  );

  // ── Insights panel (shared) ──
  const insightsPanel = (
    <View style={[styles.insightsCard, isLandscape && !deviceType.includes('desktop') ? { flex: 1 } : {}]}>
      <Text style={styles.insightsTitle}>Insights</Text>
      <InsightRow
        icon="🎯"
        label="Focus Area"
        value={focusCategory?.name ?? 'Add KPIs to see focus area'}
        valueColor={focusCategory ? '#fb7185' : undefined}
      />
      <InsightRow
        icon="💪"
        label="Strongest Area"
        value={strongCategory?.name ?? 'Add KPIs to see strongest area'}
        valueColor={strongCategory ? '#34d399' : undefined}
      />
      <InsightRow
        icon="📊"
        label="7-Day Average"
        value={sevenDayAverage !== null ? `${sevenDayAverage} / 100` : 'No entries yet'}
      />
      <InsightRow
        icon="📈"
        label="Trend (last 7 days)"
        value={lastSevenChronological.length < 2 ? 'Stable →' : trendLabel}
        valueColor={trendColor}
      />
    </View>
  );

  // ── Category grid ──
  const categoryGrid = (
    <>
      <Text style={styles.sectionTitle}>By category</Text>
      {categories.length === 0 ? (
        <EmptyState title="No Categories Yet" message="Add categories to break down your score." />
      ) : (
        <ResponsiveGrid>
          {categoryRows.map((row) => (
            <TouchableOpacity
              key={row.id}
              onPress={() => router.push(`/category/${encodeURIComponent(row.name)}`)}
              activeOpacity={0.8}
              style={{ flex: 1 }}
            >
              <CategoryCard name={row.name} score100={row.score100} status={row.status} />
            </TouchableOpacity>
          ))}
        </ResponsiveGrid>
      )}
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DESKTOP layout
  // ─────────────────────────────────────────────────────────────────────────
  if (deviceType === 'desktop') {
    return (
      <DesktopShell title="Life Status">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <Text style={styles.screenTitle}>Life status</Text>
          <Text style={styles.screenSubtitle}>Your personal performance dashboard</Text>

          {lifeBuddyPanel}
          {testingPanel}

          <View style={styles.desktopTopRow}>
            {/* Score ring */}
            <View style={styles.desktopScoreCol}>
              <ScoreRing score={overallScore} status={overallStatus} />
              <Text style={styles.desktopScoreLabel}>Overall Score</Text>
            </View>

            {/* Streak */}
            <View style={styles.desktopStreakCol}>
              <StreakCard current={streaks.current} longest={streaks.longest} />
            </View>

            {/* Insights */}
            <View style={styles.desktopInsightsCol}>
              {insightsPanel}
            </View>
          </View>

          {categoryGrid}
        </ScrollView>
      </DesktopShell>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE / TABLET — portrait & landscape
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0f1e' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <PageContainer>
          <Text style={styles.screenTitle}>Life status</Text>
          <Text style={styles.screenSubtitle}>Your personal performance dashboard</Text>

          {lifeBuddyPanel}
          {testingPanel}

          {isLandscape ? (
            // ── Landscape: score + streak side-by-side, insights alongside ──
            <View style={styles.landscapeTopRow}>
              <View style={styles.landscapeScoreCol}>
                <ScoreRing score={overallScore} status={overallStatus} />
                <StreakCard current={streaks.current} longest={streaks.longest} />
              </View>
              <View style={styles.landscapeInsightsCol}>
                {insightsPanel}
              </View>
            </View>
          ) : (
            // ── Portrait: stacked ──
            <>
              <View style={styles.portraitHeroRow}>
                <View style={styles.portraitScoreWrap}>
                  <ScoreRing score={overallScore} status={overallStatus} />
                </View>
                <View style={styles.portraitStreakWrap}>
                  <StreakCard current={streaks.current} longest={streaks.longest} />
                </View>
              </View>
              {insightsPanel}
            </>
          )}

          {categoryGrid}
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 18,
    fontWeight: '500',
  },

  // ── Testing ──
  testingCard: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
    backgroundColor: '#0f172a',
  },
  lifeBuddyCard: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    marginBottom: 20,
    backgroundColor: '#0f1b33',
  },
  lifeBuddyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lifeBuddyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  lifeBuddyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  lifeBuddyHint: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  lifeBuddyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifeBuddyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  testingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  testingRow: { flexDirection: 'row', gap: 10 },
  testingBtnLoad: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  testingBtnLoadText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  testingBtnClear: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  testingBtnClearText: { color: '#fca5a5', fontSize: 13, fontWeight: '700' },

  // ── Insights panel ──
  insightsCard: {
    backgroundColor: '#0f1a2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    padding: 18,
    marginBottom: 20,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e2e8f0',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Section heading ──
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ── Portrait mobile layout ──
  portraitHeroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  portraitScoreWrap: {
    flex: 1,
    alignItems: 'center',
  },
  portraitStreakWrap: {
    flex: 1,
  },

  // ── Landscape mobile layout ──
  landscapeTopRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  landscapeScoreCol: {
    width: 160,
    alignItems: 'center',
    gap: 12,
  },
  landscapeInsightsCol: {
    flex: 1,
  },

  // ── Desktop layout ──
  desktopTopRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 28,
    alignItems: 'flex-start',
  },
  desktopScoreCol: {
    width: 180,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
  },
  desktopScoreLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  desktopStreakCol: {
    width: 150,
  },
  desktopInsightsCol: {
    flex: 1,
  },
});
