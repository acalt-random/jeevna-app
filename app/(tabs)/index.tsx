import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { LifeBuddySuggestions } from '@/components/LifeBuddySuggestions';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveGrid, ResponsiveGridItem } from '@/components/ResponsiveGrid';
import { SectionCard } from '@/components/SectionCard';
import { TodaysResponsibilities } from '@/components/TodaysResponsibilities';
import { MaterialIcons } from '@expo/vector-icons';
import { KPI, useAppData } from '@/context/AppDataContext';
import {
  defaultLifeBuddyScoringPreferences,
  ScoringSection,
  usePreferences,
} from '@/context/PreferencesContext';
import { buildLifeBuddySuggestions, LifeBuddySuggestion } from '@/services/suggestionEngine';
import {
  buildResponsibilitySnapshot,
  ResponsibilityItem,
} from '@/services/responsibilityEngine';
import { lifeLibraryActivities, lifeLibraryKpis } from '@/src/data/lifeLibrary';
import { useTheme } from '@/context/ThemeContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type LifeBuddyAction = {
  actionTargetType: 'category' | 'kpi' | 'person' | 'entry' | 'preferences';
  categoryName?: string;
  kpiId?: string;
  personId?: string;
};

type PriorityItem = {
  id: string;
  title: string;
  description: string;
  priority: number;
  action: LifeBuddyAction;
  buttonLabel: string;
};

type SuggestedActionItem = {
  id: string;
  text: string;
  action: LifeBuddyAction;
  buttonLabel: string;
};

type AttentionPerson = {
  id: string;
  name: string;
  groupName: string;
  relationshipType: string;
  score: number;
  daysSinceContact: number | null;
};

type OverdueTodo = {
  id: string;
  title: string;
  personId?: string;
  personName: string;
  relationshipType: string;
  dueDate: string;
  overdueDays: number;
};

type WeakCategory = {
  id: string;
  name: string;
  score: number;
  kpiCount: number;
} | null;

type PendingKpi = {
  id: string;
  name: string;
  category: string;
  unit: string;
  missedDays: number;
};

type PendingSubtask = {
  id: string;
  name: string;
  kpiName: string;
  category: string;
};

type ParsedCategory = 'Health' | 'Finance' | 'Relationships' | 'Learning' | 'Career' | 'Other';

type CommandSetupPreview = {
  category: ParsedCategory | '';
  kpiName: string;
  target: number;
  unit: string;
  activity: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  targetCount?: number;
  confidence: 'high' | 'low';
  message?: string;
};

const COMMAND_KEYWORDS: Record<ParsedCategory, string[]> = {
  Health: ['gym', 'workout', 'weight', 'sleep', 'walk'],
  Finance: ['save', 'budget', 'expense', 'invest'],
  Relationships: ['call', 'meet', 'parents', 'friends', 'family'],
  Learning: ['read', 'book', 'course', 'study'],
  Career: ['work', 'skill', 'job', 'interview', 'deep work'],
  Other: [],
};

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function dateKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function previousDayYMD(ymd: string): string {
  const [y, mo, da] = ymd.split('-').map(Number);
  const d = new Date(y, mo - 1, da);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function isBeforeDate(dateA: string, dateB: string): boolean {
  return dateA.localeCompare(dateB) < 0;
}

function daysSinceDate(dateValue?: string): number | null {
  if (!dateValue) return null;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  const diffMs = today.getTime() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function relationshipScoreFromDays(daysSinceContact: number | null): number {
  if (daysSinceContact === null) return 0;

  const maxDays = 90;
  const rawScore = Math.round((1 - daysSinceContact / maxDays) * 100);
  return Math.max(0, Math.min(100, rawScore));
}

function kpiContribution(kpi: KPI, actuals: Record<string, string>): number {
  const actualValue = parseFloat(actuals[kpi.id] || '0');
  const safeActual = Number.isNaN(actualValue) ? 0 : actualValue;
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
  return Math.min(100, Math.round(totalScore));
}

function averageScores(entriesSlice: { totalScore: number }[]): number {
  if (entriesSlice.length === 0) return 0;
  return Math.round(entriesSlice.reduce((acc, e) => acc + e.totalScore, 0) / entriesSlice.length);
}

function trendFromEntries(sortedOldestFirst: { totalScore: number }[]): string {
  if (sortedOldestFirst.length < 2) return 'Stable';
  const diff =
    sortedOldestFirst[sortedOldestFirst.length - 1].totalScore - sortedOldestFirst[0].totalScore;
  if (diff > 3) return 'Improving';
  if (diff < -3) return 'Declining';
  return 'Stable';
}

function computeStreaks(entries: { date: string }[]): { current: number; longest: number } {
  const entryDates = new Set(entries.map((e) => e.date));
  let current = 0;
  let day = todayYMD();

  while (entryDates.has(day)) {
    current += 1;
    day = previousDayYMD(day);
  }

  const sorted = [...entryDates].sort((a, b) => a.localeCompare(b));
  if (sorted.length === 0) return { current, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    if (previousDayYMD(sorted[i]) === sorted[i - 1]) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  return { current, longest };
}

function statusForScore(score: number): {
  label: string;
  color: string;
  barColor: string;
  glow: string;
} {
  if (score >= 80) {
    return { label: 'Strong', color: '#34d399', barColor: '#10b981', glow: '#10b98140' };
  }
  if (score >= 50) {
    return { label: 'Stable', color: '#fbbf24', barColor: '#f59e0b', glow: '#f59e0b40' };
  }
  return {
    label: 'Needs Attention',
    color: '#fb7185',
    barColor: '#f43f5e',
    glow: '#f43f5e40',
  };
}

function getConfiguredWeight(
  preferences: Record<string, number>,
  defaults: Record<string, number>,
  label: string,
  fallbackLabel: string
): number {
  return preferences[label] ?? defaults[label] ?? defaults[fallbackLabel] ?? 1;
}

function normalizeCategoryKey(categoryName: string): string {
  const normalized = categoryName.trim().toLowerCase();
  if (normalized.includes('health')) return 'Health';
  if (
    normalized.includes('relationship') ||
    normalized.includes('social') ||
    normalized.includes('people')
  ) {
    return 'Relationships';
  }
  if (normalized.includes('finance') || normalized.includes('money')) return 'Finance';
  if (
    normalized.includes('career') ||
    normalized.includes('work') ||
    normalized.includes('business')
  ) {
    return 'Career';
  }
  if (
    normalized.includes('learn') ||
    normalized.includes('study') ||
    normalized.includes('education')
  ) {
    return 'Learning';
  }
  return 'Other';
}

function normalizeRelationshipKey(relationshipType?: string): string {
  const normalized = (relationshipType ?? '').trim().toLowerCase();
  if (
    normalized.includes('partner') ||
    normalized.includes('spouse') ||
    normalized.includes('wife') ||
    normalized.includes('husband') ||
    normalized.includes('girlfriend') ||
    normalized.includes('boyfriend')
  ) {
    return 'Partner';
  }
  if (
    normalized.includes('parent') ||
    normalized.includes('mother') ||
    normalized.includes('father') ||
    normalized.includes('mom') ||
    normalized.includes('dad')
  ) {
    return 'Parent';
  }
  if (
    normalized.includes('child') ||
    normalized.includes('son') ||
    normalized.includes('daughter')
  ) {
    return 'Child';
  }
  if (
    normalized.includes('sibling') ||
    normalized.includes('brother') ||
    normalized.includes('sister')
  ) {
    return 'Sibling';
  }
  if (normalized.includes('best friend')) return 'Best Friend';
  if (normalized.includes('mentor')) return 'Mentor';
  if (
    normalized.includes('colleague') ||
    normalized.includes('coworker') ||
    normalized.includes('co-worker')
  ) {
    return 'Colleague';
  }
  if (normalized.includes('acquaintance')) return 'Acquaintance';
  if (normalized.includes('friend')) return 'Friend';
  return 'Other';
}

function getRelationshipImpactKey(relationshipType?: string): string {
  const relationshipKey = normalizeRelationshipKey(relationshipType);
  if (relationshipKey === 'Parent') return 'Parent Relationship';
  if (relationshipKey === 'Partner') return 'Partner Relationship';
  if (relationshipKey === 'Child') return 'Child Relationship';
  if (relationshipKey === 'Friend' || relationshipKey === 'Best Friend') {
    return 'Friend Relationship';
  }
  return 'Friend Relationship';
}

function getKpiImpactKey(categoryName: string): string {
  const categoryKey = normalizeCategoryKey(categoryName);
  if (categoryKey === 'Health') return 'Health KPI';
  if (categoryKey === 'Finance') return 'Financial KPI';
  if (categoryKey === 'Career') return 'Career KPI';
  if (categoryKey === 'Learning') return 'Learning KPI';

  const normalized = categoryName.trim().toLowerCase();
  if (
    normalized.includes('recreation') ||
    normalized.includes('fun') ||
    normalized.includes('leisure')
  ) {
    return 'Recreation KPI';
  }

  return 'Habit KPI';
}

function getOverdueUrgencyKey(overdueDays: number): string {
  if (overdueDays >= 8) return '8-14 Days Overdue';
  if (overdueDays >= 4) return '4-7 Days Overdue';
  if (overdueDays >= 1) return '1-3 Days Overdue';
  return 'Due Today';
}

function getRelationshipUrgencyKey(daysSinceContact: number | null): string {
  if ((daysSinceContact ?? 0) >= 30) return 'No Contact 30+ Days';
  return 'No Contact 14+ Days';
}

function getKpiUrgencyKey(missedDays: number): string {
  if (missedDays >= 14) return 'KPI Missed 14 Days';
  if (missedDays >= 7) return 'KPI Missed 7 Days';
  return 'KPI Missed 3 Days';
}

function getMissedKpiDays(
  kpiId: string,
  entriesByDate: Map<string, Record<string, string>>,
  maxDays = 14
): number {
  let missedDays = 0;

  for (let dayOffset = 0; dayOffset < maxDays; dayOffset += 1) {
    const dateKey = dateKeyDaysAgo(dayOffset);
    const actuals = entriesByDate.get(dateKey);
    const value = actuals?.[kpiId];

    if (value !== undefined && value !== '') break;
    missedDays += 1;
  }

  return missedDays;
}

function getLatestContactDate(
  lastContactDate?: string,
  activityDates: string[] = []
): string | undefined {
  const candidates = [lastContactDate, ...activityDates].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );

  if (candidates.length === 0) return undefined;
  return [...candidates].sort((a, b) => b.localeCompare(a))[0];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function normalizeCommandText(value: string): string {
  return value.trim().toLowerCase();
}

function detectCommandCategory(text: string): ParsedCategory | '' {
  const scores = (Object.keys(COMMAND_KEYWORDS) as ParsedCategory[]).map((category) => ({
    category,
    score:
      category === 'Other'
        ? 0
        : COMMAND_KEYWORDS[category].reduce(
            (total, keyword) => total + (text.includes(keyword) ? 1 : 0),
            0
          ),
  }));

  const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
  return bestMatch && bestMatch.score > 0 ? bestMatch.category : '';
}

function extractFirstNumber(text: string): number | null {
  const match = text.match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const parsed = parseFloat(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

function extractFrequency(text: string): CommandSetupPreview['frequency'] {
  if (
    text.includes('every day') ||
    text.includes('daily') ||
    text.includes('per day') ||
    text.includes('a day')
  ) {
    return 'daily';
  }
  if (
    text.includes('every week') ||
    text.includes('weekly') ||
    text.includes('per week') ||
    text.includes('a week')
  ) {
    return 'weekly';
  }
  if (
    text.includes('every month') ||
    text.includes('monthly') ||
    text.includes('per month') ||
    text.includes('a month')
  ) {
    return 'monthly';
  }
  if (text.includes('year') || text.includes('yearly') || text.includes('annual')) {
    return 'yearly';
  }
  return undefined;
}

function buildFallbackPreview(command: string): CommandSetupPreview {
  return {
    category: '',
    kpiName: 'General Goal',
    target: extractFirstNumber(command) ?? 1,
    unit: 'goal',
    activity: command.trim(),
    confidence: 'low',
    message: 'I understood this as a general goal. Please choose a category.',
  };
}

function parseLifeBuddyCommand(command: string): CommandSetupPreview {
  const trimmedCommand = command.trim();
  const normalized = normalizeCommandText(trimmedCommand);
  const detectedCategory = detectCommandCategory(normalized);
  const extractedNumber = extractFirstNumber(normalized);
  const frequency = extractFrequency(normalized);

  if (!detectedCategory) {
    return buildFallbackPreview(trimmedCommand);
  }

  if (detectedCategory === 'Health') {
    if (normalized.includes('weight') || normalized.includes('lose')) {
      return {
        category: 'Health',
        kpiName: 'Weight Loss Progress',
        target: extractedNumber ?? 1,
        unit: normalized.includes('kg') ? 'kg' : 'units',
        activity: 'Weight management check-in',
        confidence: 'high',
      };
    }

    if (normalized.includes('gym') || normalized.includes('workout')) {
      return {
        category: 'Health',
        kpiName: 'Workout Frequency',
        target: extractedNumber ?? 4,
        unit: frequency === 'daily' ? 'times/day' : 'times/week',
        activity: 'Gym workout',
        frequency: frequency ?? 'weekly',
        targetCount: extractedNumber ?? 4,
        confidence: 'high',
      };
    }

    if (normalized.includes('sleep')) {
      return {
        category: 'Health',
        kpiName: 'Sleep Duration',
        target: extractedNumber ?? 8,
        unit: 'hours',
        activity: 'Sleep routine',
        frequency: 'daily',
        targetCount: 1,
        confidence: 'high',
      };
    }

    return {
      category: 'Health',
      kpiName: 'Health Habit',
      target: extractedNumber ?? 1,
      unit: 'times/week',
      activity: trimmedCommand,
      frequency: frequency ?? 'weekly',
      targetCount: extractedNumber ?? 1,
      confidence: 'high',
    };
  }

  if (detectedCategory === 'Finance') {
    return {
      category: 'Finance',
      kpiName: normalized.includes('invest') ? 'Investment Progress' : 'Savings Progress',
      target: extractedNumber ?? 1,
      unit: normalized.includes('lakh')
        ? `lakh${frequency === 'yearly' || normalized.includes('year') ? '/year' : ''}`
        : normalized.includes('expense')
          ? 'expense checks/month'
          : 'amount',
      activity: normalized.includes('budget') ? 'Budget review' : 'Savings contribution',
      frequency: frequency ?? (normalized.includes('year') ? 'yearly' : 'monthly'),
      targetCount: normalized.includes('budget') ? 1 : undefined,
      confidence: 'high',
    };
  }

  if (detectedCategory === 'Relationships') {
    const isParents = normalized.includes('parent');
    const isFriends = normalized.includes('friend');
    return {
      category: 'Relationships',
      kpiName: isParents
        ? 'Parent Connection'
        : isFriends
          ? 'Friends Connection'
          : 'Relationship Touchpoints',
      target: extractedNumber ?? 1,
      unit: frequency === 'monthly' ? 'times/month' : 'times/week',
      activity: normalized.includes('call')
        ? isParents
          ? 'Call parents'
          : 'Call relationship contact'
        : normalized.includes('meet')
          ? isFriends
            ? 'Meet college friends'
            : 'Meet relationship contact'
          : trimmedCommand,
      frequency: frequency ?? 'weekly',
      targetCount: extractedNumber ?? 1,
      confidence: 'high',
    };
  }

  if (detectedCategory === 'Learning') {
    return {
      category: 'Learning',
      kpiName: normalized.includes('course') ? 'Course Progress' : 'Reading Progress',
      target: extractedNumber ?? 1,
      unit: normalized.includes('book') ? 'books/year' : 'sessions/week',
      activity: normalized.includes('course') ? 'Course study session' : 'Reading session',
      frequency: frequency ?? 'weekly',
      targetCount: normalized.includes('book') ? undefined : extractedNumber ?? 1,
      confidence: 'high',
    };
  }

  if (detectedCategory === 'Career') {
    return {
      category: 'Career',
      kpiName: normalized.includes('deep work') ? 'Deep Work Hours' : 'Career Skill Practice',
      target: extractedNumber ?? (normalized.includes('deep work') ? 2 : 1),
      unit: normalized.includes('deep work') ? 'hours/day' : 'sessions/week',
      activity: normalized.includes('interview')
        ? 'Interview preparation'
        : normalized.includes('job')
          ? 'Job search session'
          : normalized.includes('skill')
            ? 'Skill practice'
            : 'Deep work block',
      frequency: frequency ?? (normalized.includes('deep work') ? 'daily' : 'weekly'),
      targetCount: normalized.includes('deep work') ? 1 : extractedNumber ?? 1,
      confidence: 'high',
    };
  }

  return buildFallbackPreview(trimmedCommand);
}

function ScoreRing({
  score,
  status,
}: {
  score: number;
  status: ReturnType<typeof statusForScore>;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        ringStyles.wrap,
        {
          shadowColor: status.glow,
          backgroundColor: theme.secondaryBackground,
          borderColor: theme.cardBorder,
          borderRadius: theme.borderRadius.xl,
        },
      ]}>
      <View style={[ringStyles.ring, { borderColor: status.barColor, backgroundColor: theme.background }]}>
        <Text style={[ringStyles.number, { color: status.color }]}>{score}</Text>
        <Text style={[ringStyles.denom, { color: theme.textMuted }]}>/100</Text>
        <Text style={[ringStyles.label, { color: status.color }]}>{status.label}</Text>
      </View>
    </View>
  );
}

function PriorityCard({
  item,
  onPressAction,
}: {
  item: PriorityItem;
  onPressAction: (action: LifeBuddyAction) => void;
}) {
  const { theme } = useTheme();

  return (
    <SectionCard>
      <Text style={[styles.priorityTitle, { color: theme.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.priorityDescription, { color: theme.textSecondary }]}>{item.description}</Text>
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.buttonSecondary,
            borderColor: theme.cardBorder,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        onPress={() => onPressAction(item.action)}
        activeOpacity={0.8}>
        <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{item.buttonLabel}</Text>
      </TouchableOpacity>
    </SectionCard>
  );
}

function ModalWeightSection({
  title,
  items,
}: {
  title: string;
  items: [string, number][];
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.modalWeightSection}>
      <Text style={[styles.modalSectionLabel, { color: theme.primary }]}>{title}</Text>
      {items.map(([label, value]) => (
        <View
          key={`${title}-${label}`}
          style={[styles.modalWeightRow, { borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.modalWeightLabel, { color: theme.textSecondary }]}>{label}</Text>
          <Text style={[styles.modalWeightValue, { color: theme.textPrimary }]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const {
    categories,
    kpis,
    entries,
    latestActuals,
    latestScore,
    loadSampleData,
    clearAllData,
    subtasks,
    subtaskLogs,
    addCategory,
    addKPI,
    addSubtask,
    toggleSubtaskLog,
    people,
    personActivities,
    personTodos,
  } = useAppData();
  const {
    lifeBuddyScoringPreferences,
    onboardingProfile,
    suggestionDismissedUntil,
    dismissSuggestionUntil,
  } = usePreferences();
  const { theme } = useTheme();
  const deviceType = useDeviceType();
  const router = useRouter();
  const [showScoringInfo, setShowScoringInfo] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [commandPreview, setCommandPreview] = useState<CommandSetupPreview | null>(null);
  const [commandStatus, setCommandStatus] = useState('');
  const [isListening, setIsListening] = useState(false);
  const heardSpeechRef = useRef(false);

  const today = todayYMD();
  const greeting = getGreeting();

  const overallScore = latestScore ?? computeOverallScore(kpis, latestActuals);
  const overallStatus = statusForScore(overallScore);

  const weightSections = useMemo<
    { key: ScoringSection; title: string; items: [string, number][] }[]
  >(
    () => [
      {
        key: 'categoryImportance',
        title: 'Current Category Weights',
        items: Object.entries(lifeBuddyScoringPreferences.categoryImportance),
      },
      {
        key: 'relationshipImportance',
        title: 'Current Relationship Weights',
        items: Object.entries(lifeBuddyScoringPreferences.relationshipImportance),
      },
      {
        key: 'urgencyWeights',
        title: 'Current Urgency Weights',
        items: Object.entries(lifeBuddyScoringPreferences.urgencyWeights),
      },
      {
        key: 'impactWeights',
        title: 'Current Impact Weights',
        items: Object.entries(lifeBuddyScoringPreferences.impactWeights),
      },
    ],
    [lifeBuddyScoringPreferences]
  );

  const todayEntry = useMemo(() => {
    return entries.find((entry) => entry.date === today) ?? null;
  }, [entries, today]);

  const entriesByDate = useMemo(() => {
    return new Map(entries.map((entry) => [entry.date, entry.actuals] as const));
  }, [entries]);

  const todayActuals = useMemo(() => {
    return todayEntry?.actuals ?? {};
  }, [todayEntry]);

  const relationshipCategoryName = useMemo(() => {
    const match = categories.find((category) => {
      const lower = category.name.toLowerCase();
      return lower.includes('relationship') || lower.includes('social') || lower.includes('people');
    });

    return match?.name;
  }, [categories]);

  const responsibilitySnapshot = useMemo(
    () =>
      buildResponsibilitySnapshot({
        categories,
        kpis,
        subtasks,
        subtaskLogs,
        today,
      }),
    [categories, kpis, subtasks, subtaskLogs, today]
  );

  const categoryRows = useMemo(() => {
    return categories.map((cat) => {
      const kpisInCat = kpis.filter((kpi) => kpi.category === cat.name);
      let achieved = 0;
      let maxWeight = 0;
      const responsibilityScore =
        responsibilitySnapshot.categoryScores.find((score) => score.categoryName === cat.name)
          ?.responsibilityScore ?? 0;

      for (const kpi of kpisInCat) {
        maxWeight += kpi.weight;
        achieved += kpiContribution(kpi, latestActuals);
      }

      const score100 = maxWeight > 0 ? Math.round((achieved / maxWeight) * 100) : 0;
      return {
        id: cat.id,
        name: cat.name,
        score100,
        responsibilityScore,
        maxWeight,
        status: statusForScore(score100),
      };
    });
  }, [categories, kpis, latestActuals, responsibilitySnapshot.categoryScores]);

  const weakestCategory = useMemo<WeakCategory>(() => {
    const rows = categories
      .map((category) => {
        const categoryKpis = kpis.filter((kpi) => kpi.category === category.name);
        if (categoryKpis.length === 0) return null;

        const totalWeight = categoryKpis.reduce((sum, kpi) => sum + kpi.weight, 0);
        const scoreValue = categoryKpis.reduce((sum, kpi) => {
          const actualValue = todayEntry ? todayActuals[kpi.id] : latestActuals[kpi.id];
          return sum + kpiContribution(kpi, { [kpi.id]: actualValue ?? '' });
        }, 0);

        const score = totalWeight > 0 ? Math.round((scoreValue / totalWeight) * 100) : 0;
        return {
          id: category.id,
          name: category.name,
          score,
          kpiCount: categoryKpis.length,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length === 0) return null;
    return rows.reduce((lowest, row) => (row.score < lowest.score ? row : lowest));
  }, [categories, kpis, latestActuals, todayActuals, todayEntry]);

  const strongestCategory = useMemo(() => {
    const weightedRows = categoryRows.filter((row) => row.maxWeight > 0);
    if (weightedRows.length === 0) return null;
    return weightedRows.reduce((best, row) => (row.score100 > best.score100 ? row : best));
  }, [categoryRows]);

  const peopleNeedingAttention = useMemo<AttentionPerson[]>(() => {
    return people
      .map((person) => {
        const activityDates = personActivities
          .filter((activity) => activity.personId === person.id)
          .map((activity) => activity.date);

        const latestContactDate = getLatestContactDate(person.lastContactDate, activityDates);
        const daysSinceContact = daysSinceDate(latestContactDate);
        const score = relationshipScoreFromDays(daysSinceContact);

        return {
          id: person.id,
          name: person.name,
          groupName: person.groupName,
          relationshipType: person.relationshipType,
          score,
          daysSinceContact,
        };
      })
      .filter((person) => person.score < 70)
      .sort((a, b) => a.score - b.score);
  }, [people, personActivities]);

  const overdueRelationshipTodos = useMemo<OverdueTodo[]>(() => {
    return personTodos
      .filter((todo) => !todo.completed && todo.dueDate && isBeforeDate(todo.dueDate, today))
      .map((todo) => {
        const person = people.find((item) => item.id === todo.personId);
        return {
          id: todo.id,
          title: todo.title,
          personId: todo.personId,
          personName: person?.name ?? 'Unknown person',
          relationshipType: person?.relationshipType ?? 'Other',
          dueDate: todo.dueDate ?? '',
          overdueDays: Math.max(0, daysSinceDate(todo.dueDate) ?? 0),
        };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [people, personTodos, today]);

  const pendingKpiEntries = useMemo<PendingKpi[]>(() => {
    return kpis
      .filter((kpi) => {
        const value = todayActuals[kpi.id];
        return value === undefined || value === '';
      })
      .map((kpi) => ({
        id: kpi.id,
        name: kpi.name,
        category: kpi.category,
        unit: kpi.unit,
        missedDays: getMissedKpiDays(kpi.id, entriesByDate),
      }));
  }, [entriesByDate, kpis, todayActuals]);

  const pendingSubtasksToday = useMemo<PendingSubtask[]>(
    () =>
      responsibilitySnapshot.dueToday.map((item) => ({
        id: item.subtaskId,
        name: item.title,
        kpiName: item.kpiName,
        category: item.category,
      })),
    [responsibilitySnapshot.dueToday]
  );

  const overdueResponsibilities = useMemo(
    () => responsibilitySnapshot.overdue,
    [responsibilitySnapshot.overdue]
  );

  const lifeBuddySuggestions = useMemo(() => {
    return buildLifeBuddySuggestions({
      profile: onboardingProfile,
      activeCategories: categories,
      activeKpis: kpis,
      activeSubtasks: subtasks,
      suggestionDismissedUntil,
      limit: 6,
    });
  }, [categories, kpis, onboardingProfile, subtasks, suggestionDismissedUntil]);

  const lastSevenChronological = useMemo(() => {
    return [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  }, [entries]);

  const sevenDayAverage = useMemo(() => {
    return lastSevenChronological.length ? averageScores(lastSevenChronological) : null;
  }, [lastSevenChronological]);

  const trendLabel = useMemo(() => trendFromEntries(lastSevenChronological), [lastSevenChronological]);
  const streaks = useMemo(() => computeStreaks(entries), [entries]);

  const scoreCategoryRecommendation = useCallback(
    (categoryName: string, urgencyLabel = 'Due Today') => {
      const normalizedCategory = normalizeCategoryKey(categoryName);
      const impactKey = getKpiImpactKey(categoryName);

      // User-configurable weights are injected here for category-based Life Buddy priorities.
      const importance = getConfiguredWeight(
        lifeBuddyScoringPreferences.categoryImportance,
        defaultLifeBuddyScoringPreferences.categoryImportance,
        normalizedCategory,
        'Other'
      );
      const urgency = getConfiguredWeight(
        lifeBuddyScoringPreferences.urgencyWeights,
        defaultLifeBuddyScoringPreferences.urgencyWeights,
        urgencyLabel,
        'Due Today'
      );
      const impact = getConfiguredWeight(
        lifeBuddyScoringPreferences.impactWeights,
        defaultLifeBuddyScoringPreferences.impactWeights,
        impactKey,
        'Habit KPI'
      );

      return importance * urgency * impact;
    },
    [lifeBuddyScoringPreferences]
  );

  const scoreRelationshipRecommendation = useCallback(
    (relationshipType: string, urgencyLabel: string) => {
      const relationshipKey = normalizeRelationshipKey(relationshipType);
      const impactKey = getRelationshipImpactKey(relationshipType);

      // User-configurable weights are injected here for relationship-based Life Buddy priorities.
      const importance = getConfiguredWeight(
        lifeBuddyScoringPreferences.relationshipImportance,
        defaultLifeBuddyScoringPreferences.relationshipImportance,
        relationshipKey,
        'Other'
      );
      const urgency = getConfiguredWeight(
        lifeBuddyScoringPreferences.urgencyWeights,
        defaultLifeBuddyScoringPreferences.urgencyWeights,
        urgencyLabel,
        'No Contact 14+ Days'
      );
      const impact = getConfiguredWeight(
        lifeBuddyScoringPreferences.impactWeights,
        defaultLifeBuddyScoringPreferences.impactWeights,
        impactKey,
        'Friend Relationship'
      );

      return importance * urgency * impact;
    },
    [lifeBuddyScoringPreferences]
  );

  const handleActionPress = useCallback(
    (action: LifeBuddyAction) => {
      if (action.actionTargetType === 'preferences') {
        router.push('/preferences');
        return;
      }

      if (action.actionTargetType === 'category' && action.categoryName) {
        router.push({
          pathname: '/category/[categoryName]',
          params: { categoryName: action.categoryName },
        });
        return;
      }

      if (action.actionTargetType === 'entry' || action.actionTargetType === 'kpi') {
        router.push({
          pathname: '/(tabs)/entry',
          params: action.kpiId ? { kpiId: action.kpiId } : undefined,
        });
        return;
      }

      if (action.actionTargetType === 'person') {
        if (relationshipCategoryName) {
          router.push({
            pathname: '/category/[categoryName]',
            params: { categoryName: relationshipCategoryName },
          });
          return;
        }
        router.push('/(tabs)');
      }
    },
    [relationshipCategoryName, router]
  );

  const handleActivateSuggestion = useCallback(
    (suggestion: LifeBuddySuggestion) => {
      const categoryName = suggestion.category.trim();
      if (!categoryName) return;

      const existingCategory = categories.find(
        (category) => category.name.trim().toLowerCase() === categoryName.toLowerCase()
      );
      if (!existingCategory) {
        addCategory(categoryName);
      }

      const libraryKpi = suggestion.kpiId
        ? lifeLibraryKpis.find((kpi) => kpi.id === suggestion.kpiId)
        : undefined;
      const kpiName = suggestion.kpiName ?? suggestion.title;

      let activeKpi = kpis.find(
        (kpi) =>
          kpi.name.trim().toLowerCase() === kpiName.trim().toLowerCase() &&
          kpi.category.trim().toLowerCase() === categoryName.toLowerCase()
      );

      if (!activeKpi) {
        activeKpi =
          addKPI({
            name: kpiName,
            category: categoryName,
            target: libraryKpi?.target ?? 1,
            unit: libraryKpi?.unit ?? 'count',
            weight: libraryKpi?.weight ?? Math.max(1, Math.min(10, suggestion.importanceScore)),
          }) ?? activeKpi;
      }

      if (!activeKpi) return;

      if (suggestion.activityName) {
        const existingSubtask = subtasks.find(
          (subtask) =>
            subtask.kpiId === activeKpi?.id &&
            subtask.name.trim().toLowerCase() === suggestion.activityName?.trim().toLowerCase()
        );

        if (!existingSubtask) {
          const libraryActivity = suggestion.activityLibraryId
            ? lifeLibraryActivities.find((activity) => activity.id === suggestion.activityLibraryId)
            : undefined;

          addSubtask({
            kpiId: activeKpi.id,
            name: suggestion.activityName,
            frequency: libraryActivity?.defaultFrequency ?? suggestion.frequency,
            targetCount: suggestion.targetCount ?? libraryActivity?.targetCount ?? 1,
          });
        }
      }
    },
    [addCategory, addKPI, addSubtask, categories, kpis, subtasks]
  );

  const handleDismissSuggestion = useCallback(
    (suggestion: LifeBuddySuggestion) => {
      const dismissUntil = new Date();
      dismissUntil.setDate(dismissUntil.getDate() + 30);
      dismissSuggestionUntil(suggestion.id, dismissUntil.toISOString());
    },
    [dismissSuggestionUntil]
  );

  const handleToggleResponsibility = useCallback(
    (item: ResponsibilityItem) => {
      toggleSubtaskLog(item.subtaskId, today);
    },
    [today, toggleSubtaskLog]
  );

  const suggestedActions = useMemo<SuggestedActionItem[]>(() => {
    const suggestions: SuggestedActionItem[] = [];

    if (peopleNeedingAttention.length > 0) {
      const person = peopleNeedingAttention[0];
      suggestions.push({
        id: `suggest-person-${person.id}`,
        text: `Contact ${person.name} today because their relationship score is ${person.score}.`,
        action: {
          actionTargetType: 'person',
          personId: person.id,
          categoryName: relationshipCategoryName,
        },
        buttonLabel: 'Open Relationship',
      });
    }

    if (overdueRelationshipTodos.length > 0) {
      const todo = overdueRelationshipTodos[0];
      suggestions.push({
        id: `suggest-todo-${todo.id}`,
        text: `Complete the overdue relationship task "${todo.title}" for ${todo.personName}.`,
        action: {
          actionTargetType: 'person',
          personId: todo.personId,
          categoryName: relationshipCategoryName,
        },
        buttonLabel: 'Open Relationship',
      });
    }

    if (pendingKpiEntries.length > 0) {
      suggestions.push({
        id: `suggest-kpi-${pendingKpiEntries[0].id}`,
        text: `Log today's KPI entry for ${pendingKpiEntries[0].name}.`,
        action: {
          actionTargetType: 'entry',
          kpiId: pendingKpiEntries[0].id,
        },
        buttonLabel: 'Log Entry',
      });
    }

    if (weakestCategory) {
      suggestions.push({
        id: `suggest-category-${weakestCategory.id}`,
        text: `Review ${weakestCategory.name}, which is your weakest category at ${weakestCategory.score}/100.`,
        action: {
          actionTargetType: 'category',
          categoryName: weakestCategory.name,
        },
        buttonLabel: 'Open Category',
      });
    }

    if (pendingSubtasksToday.length > 0) {
      const subtask = pendingSubtasksToday[0];
      suggestions.push({
        id: `suggest-subtask-${subtask.id}`,
        text: `Complete the pending to-do "${subtask.name}" for ${subtask.kpiName}.`,
        action: {
          actionTargetType: 'category',
          categoryName: subtask.category,
        },
        buttonLabel: 'Open Category',
      });
    }

    if (overdueResponsibilities.length > 0) {
      const responsibility = overdueResponsibilities[0];
      suggestions.push({
        id: `suggest-responsibility-${responsibility.subtaskId}`,
        text: `Catch up on "${responsibility.title}" for ${responsibility.category}. It is overdue by ${responsibility.daysOverdue} day(s).`,
        action: {
          actionTargetType: 'category',
          categoryName: responsibility.category,
        },
        buttonLabel: 'Open Category',
      });
    }

    return suggestions;
  }, [
    overdueRelationshipTodos,
    overdueResponsibilities,
    pendingKpiEntries,
    pendingSubtasksToday,
    peopleNeedingAttention,
    relationshipCategoryName,
    weakestCategory,
  ]);

  const todaysPriorities = useMemo<PriorityItem[]>(() => {
    const priorities: PriorityItem[] = [];

    overdueRelationshipTodos.forEach((todo) => {
      priorities.push({
        id: `overdue-${todo.id}`,
        title: `Finish "${todo.title}"`,
        description: `Overdue for ${todo.personName} since ${todo.dueDate}.`,
        priority: scoreRelationshipRecommendation(
          todo.relationshipType,
          getOverdueUrgencyKey(todo.overdueDays)
        ),
        action: {
          actionTargetType: 'person',
          personId: todo.personId,
          categoryName: relationshipCategoryName,
        },
        buttonLabel: 'Open Relationship',
      });
    });

    peopleNeedingAttention.forEach((person) => {
      priorities.push({
        id: `person-${person.id}`,
        title: `Reach out to ${person.name}`,
        description:
          person.daysSinceContact === null
            ? `No recent contact is recorded for this ${person.groupName.toLowerCase()} relationship.`
            : `${person.groupName} relationship score is ${person.score}. Last contact was ${person.daysSinceContact} day(s) ago.`,
        priority: scoreRelationshipRecommendation(
          person.relationshipType,
          getRelationshipUrgencyKey(person.daysSinceContact)
        ),
        action: {
          actionTargetType: 'person',
          personId: person.id,
          categoryName: relationshipCategoryName,
        },
        buttonLabel: 'Open Relationship',
      });
    });

    pendingKpiEntries.forEach((kpi) => {
      priorities.push({
        id: `kpi-${kpi.id}`,
        title: `Log ${kpi.name}`,
        description: `Today's KPI entry is still missing for ${kpi.category}.`,
        priority: scoreCategoryRecommendation(kpi.category, getKpiUrgencyKey(kpi.missedDays)),
        action: {
          actionTargetType: 'entry',
          kpiId: kpi.id,
        },
        buttonLabel: 'Log Entry',
      });
    });

    pendingSubtasksToday.forEach((subtask) => {
      priorities.push({
        id: `subtask-${subtask.id}`,
        title: `Complete ${subtask.name}`,
        description: `Pending to-do for ${subtask.kpiName} in ${subtask.category}.`,
        priority: scoreCategoryRecommendation(subtask.category, 'Due Today'),
        action: {
          actionTargetType: 'category',
          categoryName: subtask.category,
        },
        buttonLabel: 'Open Category',
      });
    });

    overdueResponsibilities.forEach((responsibility) => {
      priorities.push({
        id: `responsibility-${responsibility.subtaskId}`,
        title: `Catch up on ${responsibility.title}`,
        description: `${responsibility.category} responsibility is overdue by ${responsibility.daysOverdue} day(s).`,
        priority: scoreCategoryRecommendation(
          responsibility.category,
          getOverdueUrgencyKey(Math.max(1, responsibility.daysOverdue))
        ),
        action: {
          actionTargetType: 'category',
          categoryName: responsibility.category,
        },
        buttonLabel: 'Open Category',
      });
    });

    if (weakestCategory) {
      priorities.push({
        id: `weak-category-${weakestCategory.id}`,
        title: `Review ${weakestCategory.name}`,
        description: `It is your weakest category today at ${weakestCategory.score}/100.`,
        priority: scoreCategoryRecommendation(weakestCategory.name, 'Due Today'),
        action: {
          actionTargetType: 'category',
          categoryName: weakestCategory.name,
        },
        buttonLabel: 'Open Category',
      });
    }

    return priorities.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [
    overdueRelationshipTodos,
    overdueResponsibilities,
    pendingKpiEntries,
    pendingSubtasksToday,
    peopleNeedingAttention,
    relationshipCategoryName,
    scoreCategoryRecommendation,
    scoreRelationshipRecommendation,
    weakestCategory,
  ]);

  const topInsight = useMemo(() => {
    if (todaysPriorities.length > 0) {
      return todaysPriorities[0].description;
    }
    if (weakestCategory) {
      return `${weakestCategory.name} is the softest area today at ${weakestCategory.score}/100.`;
    }
    return 'You are caught up today. Life Buddy has no urgent actions to surface.';
  }, [todaysPriorities, weakestCategory]);

  const handleAskLifeBuddy = useCallback(() => {
    const trimmedCommand = commandInput.trim();
    if (!trimmedCommand) {
      setCommandStatus('Tell Life Buddy what you want to improve first.');
      setCommandPreview(null);
      return;
    }

    setCommandPreview(parseLifeBuddyCommand(trimmedCommand));
    setCommandStatus('');
  }, [commandInput]);

  const handleVoiceInputPress = useCallback(async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      setCommandStatus('Speech recognition unavailable');
      return;
    }

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setCommandStatus('Microphone permission required');
      return;
    }

    setCommandStatus('');
    heardSpeechRef.current = false;
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
      addsPunctuation: true,
    });
  }, [isListening]);

  const handleApplyCommandSetup = useCallback(() => {
    if (!commandPreview) return;

    if (!commandPreview.category) {
      setCommandStatus('Please choose a category by editing manually.');
      return;
    }

    const existingCategory = categories.find(
      (category) => category.name.toLowerCase() === commandPreview.category.toLowerCase()
    );
    if (!existingCategory) {
      addCategory(commandPreview.category);
    }

    const existingKpi = kpis.find(
      (kpi) =>
        kpi.name.toLowerCase() === commandPreview.kpiName.toLowerCase() &&
        kpi.category.toLowerCase() === commandPreview.category.toLowerCase()
    );
    const createdNewKpi = !existingKpi;

    if (!existingKpi) {
      addKPI({
        name: commandPreview.kpiName,
        category: commandPreview.category,
        target: commandPreview.target,
        unit: commandPreview.unit,
        weight:
          commandPreview.category === 'Health' || commandPreview.category === 'Relationships'
            ? 10
            : 8,
      });
    }

    const resolvedKpi =
      existingKpi ??
      {
        id: '__pending__',
        name: commandPreview.kpiName,
        category: commandPreview.category,
      };

    if (commandPreview.frequency && commandPreview.targetCount) {
      const hasExistingSubtask = subtasks.some(
        (subtask) =>
          subtask.kpiId === resolvedKpi.id &&
          subtask.name.toLowerCase() === commandPreview.activity.toLowerCase()
      );

      if (!hasExistingSubtask && existingKpi) {
        addSubtask({
          kpiId: existingKpi.id,
          name: commandPreview.activity,
          frequency: commandPreview.frequency,
          targetCount: commandPreview.targetCount,
        });
      }
    }

    setCommandStatus(
      createdNewKpi && commandPreview.frequency
        ? 'Suggested setup applied. You can add the recurring activity after the KPI appears.'
        : 'Suggested setup applied.'
    );
    setCommandPreview(null);
    setCommandInput('');
  }, [addCategory, addKPI, addSubtask, categories, commandPreview, kpis, subtasks]);

  const priorityPreview = deviceType === 'desktop' ? todaysPriorities.slice(0, 4) : todaysPriorities;
  const peopleAttentionPreview =
    deviceType === 'desktop' ? peopleNeedingAttention.slice(0, 3) : peopleNeedingAttention;
  const overdueTodoPreview =
    deviceType === 'desktop' ? overdueRelationshipTodos.slice(0, 3) : overdueRelationshipTodos;
  const pendingKpiPreview =
    deviceType === 'desktop' ? pendingKpiEntries.slice(0, 4) : pendingKpiEntries;
  const suggestedActionPreview =
    deviceType === 'desktop' ? suggestedActions.slice(0, 4) : suggestedActions;
  const compactCategoryRows = deviceType === 'desktop' ? categoryRows.slice(0, 6) : categoryRows;

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    heardSpeechRef.current = false;
    setCommandStatus('');
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setCommandStatus((currentValue) => {
      if (currentValue) return currentValue;
      return heardSpeechRef.current ? '' : "Couldn't hear anything";
    });
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (!transcript) return;

    heardSpeechRef.current = true;
    setCommandInput(transcript);
    setCommandStatus('');
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);

    if (event.error === 'not-allowed') {
      setCommandStatus('Microphone permission required');
      return;
    }

    if (event.error === 'no-speech' || event.error === 'speech-timeout') {
      setCommandStatus("Couldn't hear anything");
      return;
    }

    if (event.error === 'service-not-allowed') {
      setCommandStatus('Speech recognition unavailable');
      return;
    }

    setCommandStatus('Speech recognition unavailable');
  });

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Home / Life Buddy"
          subtitle={`${greeting}. Your day starts here.`}
          rightAccessory={
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="How Life Buddy prioritizes actions"
              style={[
                styles.infoButton,
                {
                  backgroundColor: theme.buttonSecondary,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={() => setShowScoringInfo(true)}
              activeOpacity={0.8}>
              <Text style={[styles.infoButtonText, { color: theme.primary }]}>i</Text>
            </TouchableOpacity>
          }
        />

        <SectionCard
          style={{
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.cardBorder,
          }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Life Buddy Command</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Describe a goal in plain language and Life Buddy will suggest what to set up.
          </Text>
          <View style={styles.commandInputRow}>
            <TextInput
              style={[
                styles.commandInput,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.textPrimary,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              value={commandInput}
              onChangeText={setCommandInput}
              placeholder="Tell Life Buddy what you want to improve..."
              placeholderTextColor={theme.textMuted}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.micButton,
                {
                  backgroundColor: isListening ? theme.danger : theme.buttonSecondary,
                  borderColor: isListening ? theme.danger : theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={handleVoiceInputPress}
              activeOpacity={0.8}>
              <MaterialIcons
                name={isListening ? 'graphic-eq' : 'keyboard-voice'}
                size={24}
                color={isListening ? '#ffffff' : theme.textPrimary}
              />
            </TouchableOpacity>
          </View>
          <Text
            style={[
              styles.listeningText,
              { color: isListening ? theme.danger : theme.textMuted },
            ]}>
            {isListening ? '🔴 Listening...' : '🎙 Tap the microphone to speak'}
          </Text>
          <View style={styles.commandActionsRow}>
            <TouchableOpacity
              style={[
                styles.commandPrimaryButton,
                {
                  backgroundColor: theme.buttonPrimary,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={handleAskLifeBuddy}
              activeOpacity={0.8}>
              <Text style={styles.primaryActionText}>Ask Life Buddy</Text>
            </TouchableOpacity>
          </View>
          {commandStatus ? (
            <Text
              style={[
                styles.commandStatusText,
                { color: commandStatus.includes('applied') ? theme.success : theme.warning },
              ]}>
              {commandStatus}
            </Text>
          ) : null}
          {commandPreview ? (
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}>
              <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>Suggested Setup</Text>
              {commandPreview.message ? (
                <Text style={[styles.previewMessage, { color: theme.warning }]}>
                  {commandPreview.message}
                </Text>
              ) : null}
              <View style={styles.previewGrid}>
                <View style={styles.previewItem}>
                  <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Category</Text>
                  <Text style={[styles.previewValue, { color: theme.textPrimary }]}>
                    {commandPreview.category || 'Choose category'}
                  </Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={[styles.previewLabel, { color: theme.textMuted }]}>KPI</Text>
                  <Text style={[styles.previewValue, { color: theme.textPrimary }]}>
                    {commandPreview.kpiName}
                  </Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Target</Text>
                  <Text style={[styles.previewValue, { color: theme.textPrimary }]}>
                    {commandPreview.target} {commandPreview.unit}
                  </Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Activity</Text>
                  <Text style={[styles.previewValue, { color: theme.textPrimary }]}>
                    {commandPreview.activity}
                  </Text>
                </View>
              </View>
              <View style={styles.previewActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.commandPrimaryButton,
                    {
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: theme.borderRadius.md,
                      opacity: commandPreview.category ? 1 : 0.6,
                    },
                  ]}
                  onPress={handleApplyCommandSetup}
                  disabled={!commandPreview.category}
                  activeOpacity={0.8}>
                  <Text style={styles.primaryActionText}>Apply Setup</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryActionPill,
                    {
                      backgroundColor: theme.buttonSecondary,
                      borderColor: theme.cardBorder,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/kpis',
                      params: {
                        suggestedCategory: commandPreview.category || 'Choose category',
                        suggestedKpiName: commandPreview.kpiName,
                        suggestedTarget: String(commandPreview.target),
                        suggestedUnit: commandPreview.unit,
                        suggestedWeight: String(
                          commandPreview.category === 'Health' ||
                            commandPreview.category === 'Relationships'
                            ? 10
                            : 8
                        ),
                        suggestedActivity: commandPreview.activity,
                        originalCommand: commandInput.trim(),
                      },
                    })
                  }
                  activeOpacity={0.8}>
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>
                    Edit Manually
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryActionPill,
                    {
                      backgroundColor: theme.buttonSecondary,
                      borderColor: theme.cardBorder,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={() => {
                    setCommandPreview(null);
                    setCommandStatus('');
                  }}
                  activeOpacity={0.8}>
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </SectionCard>

        <ResponsiveGrid style={styles.dashboardGrid} gap={14}>
          <ResponsiveGridItem mobileSpan={1} tabletSpan={6} desktopSpan={8}>
            <SectionCard
              style={{
                backgroundColor: theme.secondaryBackground,
                borderColor: theme.cardBorder,
              }}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Today&apos;s Priorities</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                    Start with the actions most likely to improve today.
                  </Text>
                </View>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.cardBorder,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}>
                  <Text style={[styles.countBadgeText, { color: theme.textPrimary }]}>
                    {todaysPriorities.length}
                  </Text>
                </View>
              </View>

              {todaysPriorities.length === 0 ? (
                <EmptyState
                  title="Nothing urgent right now"
                  message="You're caught up for today. Life Buddy has no immediate priorities to surface."
                />
              ) : (
                <ResponsiveGrid gap={10}>
                  {priorityPreview.map((item) => (
                    <ResponsiveGridItem
                      key={item.id}
                      mobileSpan={1}
                      tabletSpan={6}
                      desktopSpan={priorityPreview.length === 1 ? 12 : 6}>
                      <PriorityCard item={item} onPressAction={handleActionPress} />
                    </ResponsiveGridItem>
                  ))}
                </ResponsiveGrid>
              )}
            </SectionCard>
          </ResponsiveGridItem>

          <ResponsiveGridItem mobileSpan={1} tabletSpan={6} desktopSpan={4}>
            <TodaysResponsibilities
              dueToday={responsibilitySnapshot.dueToday}
              overdue={responsibilitySnapshot.overdue}
              completedToday={responsibilitySnapshot.completedToday}
              onOpenCategory={(categoryName) =>
                handleActionPress({
                  actionTargetType: 'category',
                  categoryName,
                })
              }
              onToggleComplete={handleToggleResponsibility}
            />
          </ResponsiveGridItem>

          <ResponsiveGridItem mobileSpan={1} tabletSpan={6} desktopSpan={4}>
            <SectionCard
              style={{
                backgroundColor: theme.secondaryBackground,
                borderColor: theme.cardBorder,
              }}>
              <View style={styles.compactHeroHeader}>
                <View style={styles.compactHeroCopy}>
                  <Text style={[styles.heroEyebrow, { color: theme.primary }]}>Life Score</Text>
                  <Text style={[styles.compactHeroTitle, { color: theme.textPrimary }]}>
                    {overallScore}/100
                  </Text>
                  <Text style={[styles.compactHeroText, { color: theme.textSecondary }]}>
                    {topInsight}
                  </Text>
                </View>
                <View style={styles.compactScoreWrap}>
                  <ScoreRing score={overallScore} status={overallStatus} />
                </View>
              </View>

              <ResponsiveGrid gap={10}>
                <ResponsiveGridItem mobileSpan={1} tabletSpan={3} desktopSpan={4}>
                  <View
                    style={[
                      styles.metricPanel,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Weakest</Text>
                    <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>
                      {weakestCategory?.name ?? 'No category yet'}
                    </Text>
                    <Text style={[styles.metricText, { color: theme.textSecondary }]}>
                      {weakestCategory ? `${weakestCategory.score}/100` : 'Waiting for more data'}
                    </Text>
                  </View>
                </ResponsiveGridItem>
                <ResponsiveGridItem mobileSpan={1} tabletSpan={3} desktopSpan={4}>
                  <View
                    style={[
                      styles.metricPanel,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Strongest</Text>
                    <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>
                      {strongestCategory?.name ?? 'No category yet'}
                    </Text>
                    <Text style={[styles.metricText, { color: theme.textSecondary }]}>
                      {strongestCategory ? `${strongestCategory.score100}/100` : 'Waiting for more data'}
                    </Text>
                  </View>
                </ResponsiveGridItem>
                <ResponsiveGridItem mobileSpan={1} tabletSpan={6} desktopSpan={4}>
                  <View
                    style={[
                      styles.metricPanel,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Potential Improvement</Text>
                    <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>
                      {weakestCategory ? `${Math.max(0, 100 - weakestCategory.score)} pts` : '0 pts'}
                    </Text>
                    <Text style={[styles.metricText, { color: theme.textSecondary }]}>
                      {weakestCategory
                        ? `Best near-term lift comes from ${weakestCategory.name}.`
                        : 'More data will sharpen this estimate.'}
                    </Text>
                  </View>
                </ResponsiveGridItem>
              </ResponsiveGrid>
            </SectionCard>
          </ResponsiveGridItem>

          <ResponsiveGridItem mobileSpan={1} tabletSpan={3} desktopSpan={3}>
            <SectionCard>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quick Actions</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Jump into the workflows you&apos;re most likely to need.
              </Text>
              <View style={styles.compactActionStack}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={() => router.push('/(tabs)/entry')}
                  activeOpacity={0.8}>
                  <Text style={styles.primaryActionText}>Open Entry</Text>
                </TouchableOpacity>
                <View style={styles.inlineActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionPill,
                      {
                        backgroundColor: theme.buttonSecondary,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => router.push('/(tabs)/kpis')}
                    activeOpacity={0.8}>
                    <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>KPIs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionPill,
                      {
                        backgroundColor: theme.buttonSecondary,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => router.push('/(tabs)/templates')}
                    activeOpacity={0.8}>
                    <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Templates</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionPill,
                      {
                        backgroundColor: theme.buttonSecondary,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => router.push('/preferences')}
                    activeOpacity={0.8}>
                    <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Preferences</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SectionCard>
          </ResponsiveGridItem>

          <ResponsiveGridItem mobileSpan={1} tabletSpan={3} desktopSpan={5}>
            <SectionCard>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Needs Attention</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                    Relationships and follow-ups that need a nudge today.
                  </Text>
                </View>
                <View style={styles.attentionCountRow}>
                  <View
                    style={[
                      styles.miniStat,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}>
                    <Text style={[styles.miniStatValue, { color: theme.textPrimary }]}>
                      {peopleNeedingAttention.length}
                    </Text>
                    <Text style={[styles.miniStatLabel, { color: theme.textMuted }]}>people</Text>
                  </View>
                  <View
                    style={[
                      styles.miniStat,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}>
                    <Text style={[styles.miniStatValue, { color: theme.textPrimary }]}>
                      {overdueRelationshipTodos.length}
                    </Text>
                    <Text style={[styles.miniStatLabel, { color: theme.textMuted }]}>overdue</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.subsectionLabel, { color: theme.textMuted }]}>Relationships</Text>
              {peopleNeedingAttention.length === 0 ? (
                <Text style={[styles.compactEmptyText, { color: theme.textSecondary }]}>
                  No relationship scores are below 70 right now.
                </Text>
              ) : (
                <View style={styles.compactList}>
                  {peopleAttentionPreview.map((person) => (
                    <View
                      key={person.id}
                      style={[styles.compactRowCard, { borderBottomColor: theme.cardBorder }]}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.compactRowTitle, { color: theme.textPrimary }]}>
                          {person.name}
                        </Text>
                        <Text style={[styles.compactRowHint, { color: theme.textSecondary }]}>
                          {person.daysSinceContact === null
                            ? 'No contact date recorded yet.'
                            : `${person.daysSinceContact} day(s) since last contact`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.inlineButton,
                          {
                            backgroundColor: theme.buttonSecondary,
                            borderColor: theme.cardBorder,
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}
                        onPress={() =>
                          handleActionPress({
                            actionTargetType: 'person',
                            personId: person.id,
                            categoryName: relationshipCategoryName,
                          })
                        }
                        activeOpacity={0.8}>
                        <Text style={[styles.inlineButtonText, { color: theme.textPrimary }]}>Open</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.subsectionLabel, { color: theme.textMuted }]}>Overdue To-Dos</Text>
              {overdueRelationshipTodos.length === 0 ? (
                <Text style={[styles.compactEmptyText, { color: theme.textSecondary }]}>
                  No overdue relationship to-dos.
                </Text>
              ) : (
                <View style={styles.compactList}>
                  {overdueTodoPreview.map((todo) => (
                    <View
                      key={todo.id}
                      style={[styles.compactRowCard, { borderBottomColor: theme.cardBorder }]}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.compactRowTitle, { color: theme.textPrimary }]}>
                          {todo.title}
                        </Text>
                        <Text style={[styles.compactRowHint, { color: theme.textSecondary }]}>
                          {todo.personName} · due {todo.dueDate}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.inlineButton,
                          {
                            backgroundColor: theme.buttonSecondary,
                            borderColor: theme.cardBorder,
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}
                        onPress={() =>
                          handleActionPress({
                            actionTargetType: 'person',
                            personId: todo.personId,
                            categoryName: relationshipCategoryName,
                          })
                        }
                        activeOpacity={0.8}>
                        <Text style={[styles.inlineButtonText, { color: theme.textPrimary }]}>Open</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>
          </ResponsiveGridItem>

          <ResponsiveGridItem mobileSpan={1} tabletSpan={6} desktopSpan={4}>
            <SectionCard>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Category Summary</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                The current shape of your life areas at a glance.
              </Text>
              <View style={styles.compactList}>
                {compactCategoryRows.length === 0 ? (
                  <Text style={[styles.compactEmptyText, { color: theme.textSecondary }]}>
                    Add categories and KPIs to let Home highlight your progress.
                  </Text>
                ) : (
                  compactCategoryRows.map((row) => (
                    <TouchableOpacity
                      key={row.id}
                      style={[styles.compactRowCard, { borderBottomColor: theme.cardBorder }]}
                      onPress={() =>
                        router.push({
                          pathname: '/category/[categoryName]',
                          params: { categoryName: row.name },
                        })
                      }
                      activeOpacity={0.8}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.compactRowTitle, { color: theme.textPrimary }]}>
                          {row.name}
                        </Text>
                        <Text style={[styles.compactRowHint, { color: theme.textSecondary }]}>
                          {row.status.label} | Responsibility {row.responsibilityScore}/100
                        </Text>
                      </View>
                      <Text style={[styles.compactScoreValue, { color: row.status.color }]}>
                        {row.score100}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </SectionCard>
          </ResponsiveGridItem>

          <ResponsiveGridItem mobileSpan={1} tabletSpan={3} desktopSpan={4}>
            <SectionCard>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Pending KPI Entries</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Missing logs for today, ready to enter.
              </Text>
              {pendingKpiEntries.length === 0 ? (
                <Text style={[styles.compactEmptyText, { color: theme.textSecondary }]}>
                  All KPI entries are logged.
                </Text>
              ) : (
                <View style={styles.compactList}>
                  {pendingKpiPreview.map((kpi) => (
                    <View
                      key={kpi.id}
                      style={[styles.compactRowCard, { borderBottomColor: theme.cardBorder }]}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.compactRowTitle, { color: theme.textPrimary }]}>
                          {kpi.name}
                        </Text>
                        <Text style={[styles.compactRowHint, { color: theme.textSecondary }]}>
                          {kpi.category} · {kpi.unit}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.inlineButton,
                          {
                            backgroundColor: theme.buttonSecondary,
                            borderColor: theme.cardBorder,
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}
                        onPress={() =>
                          handleActionPress({
                            actionTargetType: 'entry',
                            kpiId: kpi.id,
                          })
                        }
                        activeOpacity={0.8}>
                        <Text style={[styles.inlineButtonText, { color: theme.textPrimary }]}>Log</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>
          </ResponsiveGridItem>

          <ResponsiveGridItem mobileSpan={1} tabletSpan={3} desktopSpan={4}>
            <SectionCard>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Suggested Actions</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Fast nudges generated from your current data.
              </Text>
              {suggestedActions.length === 0 ? (
                <Text style={[styles.compactEmptyText, { color: theme.textSecondary }]}>
                  Life Buddy has nothing new to recommend.
                </Text>
              ) : (
                <View style={styles.compactList}>
                  {suggestedActionPreview.map((suggestion) => (
                    <View
                      key={suggestion.id}
                      style={[styles.compactRowCard, { borderBottomColor: theme.cardBorder }]}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.compactRowHint, { color: theme.textSecondary }]}>
                          {suggestion.text}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.inlineButton,
                          {
                            backgroundColor: theme.buttonSecondary,
                            borderColor: theme.cardBorder,
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}
                        onPress={() => handleActionPress(suggestion.action)}
                        activeOpacity={0.8}>
                        <Text style={[styles.inlineButtonText, { color: theme.textPrimary }]}>Open</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>
          </ResponsiveGridItem>

          <ResponsiveGridItem mobileSpan={1} tabletSpan={6} desktopSpan={4}>
            <LifeBuddySuggestions
              suggestions={lifeBuddySuggestions}
              onActivate={handleActivateSuggestion}
              onDismiss={handleDismissSuggestion}
            />
          </ResponsiveGridItem>

          <ResponsiveGridItem mobileSpan={1} tabletSpan={6} desktopSpan={5}>
            <SectionCard>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Recent Progress / Weekly Summary
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Momentum signals for the last week.
              </Text>
              <ResponsiveGrid gap={10}>
                <ResponsiveGridItem mobileSpan={1} tabletSpan={2} desktopSpan={4}>
                  <View
                    style={[
                      styles.metricPanel,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>7-Day Average</Text>
                    <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>
                      {sevenDayAverage !== null ? `${sevenDayAverage}` : '0'}
                    </Text>
                    <Text style={[styles.metricText, { color: theme.textSecondary }]}>
                      {sevenDayAverage !== null ? 'Average score over your last 7 entries' : 'No entries yet'}
                    </Text>
                  </View>
                </ResponsiveGridItem>
                <ResponsiveGridItem mobileSpan={1} tabletSpan={2} desktopSpan={4}>
                  <View
                    style={[
                      styles.metricPanel,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Trend</Text>
                    <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>{trendLabel}</Text>
                    <Text style={[styles.metricText, { color: theme.textSecondary }]}>
                      Based on the last 7 logged days
                    </Text>
                  </View>
                </ResponsiveGridItem>
                <ResponsiveGridItem mobileSpan={1} tabletSpan={2} desktopSpan={4}>
                  <View
                    style={[
                      styles.metricPanel,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Streak</Text>
                    <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>{streaks.current}</Text>
                    <Text style={[styles.metricText, { color: theme.textSecondary }]}>
                      Longest streak: {streaks.longest} day(s)
                    </Text>
                  </View>
                </ResponsiveGridItem>
              </ResponsiveGrid>
            </SectionCard>
          </ResponsiveGridItem>
        </ResponsiveGrid>

        <SectionCard
          style={[
            styles.testingCard,
            {
              borderColor: theme.cardBorder,
              backgroundColor: theme.secondaryBackground,
              borderRadius: theme.borderRadius.md,
            },
          ]}>
          <Text style={[styles.testingLabel, { color: theme.textMuted }]}>Testing</Text>
          <View style={styles.testingRow}>
            <TouchableOpacity
              style={[
                styles.testingBtnLoad,
                {
                  backgroundColor: theme.buttonPrimary,
                  borderRadius: theme.borderRadius.sm,
                },
              ]}
              onPress={loadSampleData}
              activeOpacity={0.8}>
              <Text style={styles.testingBtnLoadText}>Load Sample Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.testingBtnClear,
                {
                  borderColor: theme.danger,
                  borderRadius: theme.borderRadius.sm,
                },
              ]}
              onPress={clearAllData}
              activeOpacity={0.8}>
              <Text style={[styles.testingBtnClearText, { color: theme.danger }]}>Clear All Data</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        <Modal
          visible={showScoringInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowScoringInfo(false)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowScoringInfo(false)}
            />
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.xl,
                },
              ]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                How Life Buddy Prioritizes Actions
              </Text>

              <Text style={[styles.modalSectionLabel, { color: theme.primary }]}>Formula</Text>
              <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
                Priority Score = Importance x Urgency x Impact
              </Text>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={{ paddingBottom: 4 }}
                showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalSectionLabel, { color: theme.primary }]}>Factors</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                  - Importance: how important the life area or relationship is
                </Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                  - Urgency: how overdue or time-sensitive the action is
                </Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                  - Impact: how much the action can improve the user&apos;s life
                </Text>

                {weightSections.map((section) => (
                  <ModalWeightSection key={section.key} title={section.title} items={section.items} />
                ))}

                <Text style={[styles.modalSectionLabel, { color: theme.primary }]}>Priority Bands</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- 700+ Critical</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- 500-699 Very High</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- 300-499 High</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- 150-299 Medium</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- 50-149 Low</Text>
                <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>- Below 50 Optional</Text>

                <Text style={[styles.modalNote, { color: theme.textMuted }]}>
                  You can customize these weights in Preferences -&gt; Life Buddy Settings.
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.buttonPrimary,
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                onPress={() => setShowScoringInfo(false)}
                activeOpacity={0.8}>
                <Text style={styles.modalButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </PageContainer>
    </ScrollView>
  );

  if (deviceType === 'desktop') {
    return <DesktopShell title="Home / Life Buddy">{pageContent}</DesktopShell>;
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>{pageContent}</SafeAreaView>;
}

const ringStyles = StyleSheet.create({
  wrap: {
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    padding: 12,
  },
  ring: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 34,
  },
  denom: {
    fontSize: 11,
    fontWeight: '600',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});

const styles = StyleSheet.create({
  dashboardGrid: {
    marginBottom: 6,
  },
  commandInputRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginTop: 10,
  },
  commandInput: {
    flex: 1,
    minHeight: 92,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  micButton: {
    width: 52,
    minHeight: 92,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  commandActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  commandPrimaryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commandStatusText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  previewCard: {
    marginTop: 14,
    borderWidth: 1,
    padding: 14,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  previewMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  previewItem: {
    minWidth: 160,
    flex: 1,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  previewActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  countBadge: {
    minWidth: 42,
    minHeight: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countBadgeText: {
    fontSize: 18,
    fontWeight: '800',
  },
  attentionCountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniStat: {
    minWidth: 68,
    minHeight: 54,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  compactHeroHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  compactHeroCopy: {
    flex: 1,
    minWidth: 240,
  },
  compactScoreWrap: {
    width: 140,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  compactHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  compactHeroText: {
    fontSize: 14,
    lineHeight: 20,
  },
  compactActionStack: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  subsectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  priorityTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  priorityDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    minHeight: 42,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inlineActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  secondaryActionPill: {
    minHeight: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  compactList: {
    marginTop: 6,
  },
  compactRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  compactRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  compactRowHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  compactEmptyText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  inlineButton: {
    minHeight: 34,
    minWidth: 60,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inlineButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  compactScoreValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 14,
    marginBottom: 6,
  },
  itemHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  categoryScore: {
    fontSize: 24,
    fontWeight: '900',
  },
  alertScore: {
    fontSize: 22,
    fontWeight: '900',
  },
  bigScore: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  statHint: {
    fontSize: 14,
  },
  metricPanel: {
    minHeight: 110,
    borderWidth: 1,
    padding: 12,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricText: {
    fontSize: 13,
    lineHeight: 18,
  },
  testingCard: {
    marginTop: 4,
  },
  testingLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  testingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  testingBtnLoad: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  testingBtnLoadText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  testingBtnClear: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  testingBtnClearText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoButton: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  infoButtonText: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '82%',
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 16,
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 6,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  modalBullet: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
  },
  modalScroll: {
    maxHeight: 440,
  },
  modalWeightSection: {
    marginTop: 8,
  },
  modalWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  modalWeightLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalWeightValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalNote: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
    marginBottom: 18,
  },
  modalButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
