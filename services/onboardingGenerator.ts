import { defaultReminderPreferences, ReminderPreferences } from '@/context/PreferencesContext';
import {
  GeneratedOnboardingActivity,
  GeneratedOnboardingCategory,
  GeneratedOnboardingKpi,
  GeneratedOnboardingSetup,
  GeneratedRelationshipTracker,
  OnboardingAnswers,
  OnboardingQuestion,
} from '@/types/onboarding';

const DEFAULT_CATEGORY_NAMES = [
  'Health',
  'Finance',
  'Relationships',
  'Career',
  'Learning',
  'Personal Admin',
] as const;

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: 'focus',
    title: 'Big Picture',
    prompt: 'What do you most want Life Buddy to help you improve right now?',
    placeholder: 'Example: I want more energy, less financial stress, and better routines.',
    helperText: 'Share the season you are in. Life Buddy will use this to personalize the setup summary.',
  },
  {
    id: 'health',
    title: 'Health',
    prompt: 'What health habit or outcome matters most to you right now?',
    placeholder: 'Example: Track gym 4 days a week, walk daily, or sleep 8 hours.',
  },
  {
    id: 'finance',
    title: 'Finance',
    prompt: 'What money goal or habit do you want to stay on top of?',
    placeholder: 'Example: Save 5 lakh this year, review expenses weekly, or stick to a budget.',
  },
  {
    id: 'relationships',
    title: 'Relationships',
    prompt: 'Who are the important people you want to stay connected with, and how often?',
    placeholder: 'Example: Call parents weekly and meet college friends monthly.',
  },
  {
    id: 'career',
    title: 'Career',
    prompt: 'What work or career progress do you want to move forward consistently?',
    placeholder: 'Example: Deep work 2 hours daily, practice interviewing, or update my resume weekly.',
  },
  {
    id: 'learning',
    title: 'Learning',
    prompt: 'What do you want to keep learning or studying?',
    placeholder: 'Example: Read 20 pages a day, finish one course this quarter, or study 4 days a week.',
  },
  {
    id: 'personalAdmin',
    title: 'Personal Admin',
    prompt: 'What planning, home, or life admin habit would help you feel more in control?',
    placeholder: 'Example: Weekly planning, inbox cleanup, meal prep, or monthly paperwork review.',
  },
];

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function extractFirstNumber(text: string, fallback: number): number {
  const match = text.match(/(\d+(\.\d+)?)/);
  if (!match) return fallback;
  const parsed = parseFloat(match[1]);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function detectFrequency(
  text: string
): 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time' {
  if (
    text.includes('daily') ||
    text.includes('every day') ||
    text.includes('per day') ||
    text.includes('a day')
  ) {
    return 'daily';
  }
  if (
    text.includes('monthly') ||
    text.includes('every month') ||
    text.includes('per month') ||
    text.includes('a month')
  ) {
    return 'monthly';
  }
  if (text.includes('quarter') || text.includes('quarterly')) {
    return 'quarterly';
  }
  if (text.includes('year') || text.includes('annual') || text.includes('yearly')) {
    return 'yearly';
  }
  if (text.includes('once')) {
    return 'one-time';
  }
  return 'weekly';
}

function cadenceTargetCount(
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time',
  text: string,
  fallback: number
): number {
  const number = extractFirstNumber(text, fallback);
  if (frequency === 'one-time') return 1;
  return Math.max(1, Math.round(number));
}

function createActivity(
  name: string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time',
  targetCount: number
): GeneratedOnboardingActivity {
  return {
    id: makeId('activity'),
    name,
    frequency: frequency === 'one-time' ? 'custom' : frequency,
    targetCount,
  };
}

function createKpi(
  categoryName: string,
  name: string,
  target: number,
  unit: string,
  weight: number,
  activities: GeneratedOnboardingActivity[]
): GeneratedOnboardingKpi {
  return {
    id: makeId('kpi'),
    name,
    categoryName,
    target,
    unit,
    weight,
    activities,
  };
}

function parseHealthKpi(answer: string): GeneratedOnboardingKpi {
  const normalized = normalize(answer);
  const frequency = detectFrequency(normalized);

  if (normalized.includes('sleep')) {
    return createKpi(
      'Health',
      'Sleep Duration',
      extractFirstNumber(normalized, 8),
      'hours/day',
      10,
      [createActivity('Sleep routine', 'daily', 1)]
    );
  }

  if (normalized.includes('weight') || normalized.includes('lose')) {
    return createKpi(
      'Health',
      'Weight Progress',
      extractFirstNumber(normalized, 10),
      normalized.includes('kg') ? 'kg' : 'units',
      9,
      [createActivity('Weekly weigh-in', 'weekly', 1)]
    );
  }

  if (normalized.includes('walk')) {
    const target = extractFirstNumber(normalized, 30);
    return createKpi(
      'Health',
      'Walking Consistency',
      target,
      normalized.includes('step') ? 'steps/day' : 'minutes/day',
      8,
      [createActivity('Daily walk', 'daily', 1)]
    );
  }

  const activityName =
    normalized.includes('gym') || normalized.includes('workout') ? 'Gym workout' : 'Exercise session';
  const targetCount = cadenceTargetCount(frequency, normalized, frequency === 'monthly' ? 16 : 4);

  return createKpi(
    'Health',
    'Exercise Frequency',
    targetCount,
    frequency === 'monthly' ? 'days/month' : 'times/week',
    10,
    [createActivity(activityName, frequency === 'monthly' ? 'weekly' : frequency, 1)]
  );
}

function parseFinanceKpi(answer: string): GeneratedOnboardingKpi {
  const normalized = normalize(answer);
  const frequency = detectFrequency(normalized);

  if (normalized.includes('expense') || normalized.includes('budget')) {
    return createKpi(
      'Finance',
      'Expense Review',
      cadenceTargetCount(frequency, normalized, 4),
      frequency === 'monthly' ? 'reviews/month' : 'reviews/week',
      8,
      [createActivity('Review expenses', frequency, 1)]
    );
  }

  return createKpi(
    'Finance',
    normalized.includes('invest') ? 'Investment Progress' : 'Savings Progress',
    extractFirstNumber(normalized, normalized.includes('lakh') ? 5 : 1),
    normalized.includes('lakh')
      ? `lakh/${frequency === 'yearly' ? 'year' : 'month'}`
      : normalized.includes('year')
        ? 'goal/year'
        : 'goal/month',
    9,
    [createActivity(normalized.includes('invest') ? 'Investment review' : 'Savings review', frequency, 1)]
  );
}

function parseRelationshipKpi(answer: string): GeneratedOnboardingKpi {
  const normalized = normalize(answer);
  const frequency = detectFrequency(normalized);
  const title =
    normalized.includes('parent')
      ? 'Parent Connection'
      : normalized.includes('friend')
        ? 'Friend Connection'
        : 'Relationship Touchpoints';

  return createKpi(
    'Relationships',
    title,
    cadenceTargetCount(frequency, normalized, frequency === 'monthly' ? 2 : 1),
    frequency === 'monthly' ? 'touchpoints/month' : 'touchpoints/week',
    10,
    [
      createActivity(
        normalized.includes('meet')
          ? 'Meaningful meetup'
          : normalized.includes('message')
            ? 'Thoughtful message'
            : 'Call or check in',
        frequency,
        1
      ),
    ]
  );
}

function parseCareerKpi(answer: string): GeneratedOnboardingKpi {
  const normalized = normalize(answer);
  const frequency = detectFrequency(normalized);

  if (normalized.includes('deep work')) {
    return createKpi(
      'Career',
      'Deep Work Hours',
      extractFirstNumber(normalized, 2),
      'hours/day',
      8,
      [createActivity('Deep work block', 'daily', 1)]
    );
  }

  const activityTitle = normalized.includes('resume')
    ? 'Resume or LinkedIn update'
    : normalized.includes('interview')
      ? 'Interview practice'
      : normalized.includes('job')
        ? 'Job search session'
        : 'Career progress activity';

  return createKpi(
    'Career',
    'Career Progress',
    cadenceTargetCount(frequency, normalized, 1),
    frequency === 'daily' ? 'sessions/day' : 'sessions/week',
    8,
    [createActivity(activityTitle, frequency, 1)]
  );
}

function parseLearningKpi(answer: string): GeneratedOnboardingKpi {
  const normalized = normalize(answer);
  const frequency = detectFrequency(normalized);

  if (normalized.includes('read') || normalized.includes('book')) {
    return createKpi(
      'Learning',
      'Reading Progress',
      extractFirstNumber(normalized, 20),
      normalized.includes('page') ? 'pages/day' : 'sessions/week',
      6,
      [createActivity('Read 20 pages', normalized.includes('page') ? 'daily' : frequency, 1)]
    );
  }

  return createKpi(
    'Learning',
    normalized.includes('course') ? 'Course Progress' : 'Study Consistency',
    cadenceTargetCount(frequency, normalized, 4),
    frequency === 'monthly' ? 'sessions/month' : 'sessions/week',
    6,
    [createActivity(normalized.includes('course') ? 'Course study session' : 'Study session', frequency, 1)]
  );
}

function parsePersonalAdminKpi(answer: string): GeneratedOnboardingKpi {
  const normalized = normalize(answer);
  const frequency = detectFrequency(normalized);

  return createKpi(
    'Personal Admin',
    normalized.includes('plan') ? 'Weekly Planning' : 'Personal Admin Rhythm',
    cadenceTargetCount(frequency, normalized, 1),
    frequency === 'daily' ? 'sessions/day' : 'sessions/week',
    5,
    [
      createActivity(
        normalized.includes('meal') ? 'Meal prep' : normalized.includes('inbox') ? 'Inbox cleanup' : 'Weekly planning',
        frequency,
        1
      ),
    ]
  );
}

function parseRelationshipTrackers(answer: string): GeneratedRelationshipTracker[] {
  const normalized = normalize(answer);
  const frequency = detectFrequency(normalized);
  const defaultTitle = normalized.includes('meet')
    ? 'Schedule time together'
    : normalized.includes('message')
      ? 'Send a thoughtful message'
      : 'Check in';

  const matchers: {
    key: string;
    label: string;
    relationshipType: string;
    groupName: string;
    todoTitle: string;
  }[] = [
    {
      key: 'partner',
      label: 'Partner',
      relationshipType: 'Partner',
      groupName: 'Family',
      todoTitle: normalized.includes('date') ? 'Plan a date' : defaultTitle,
    },
    {
      key: 'parents',
      label: 'Parents',
      relationshipType: 'Parent',
      groupName: 'Family',
      todoTitle: normalized.includes('call') ? 'Call parents' : defaultTitle,
    },
    {
      key: 'family',
      label: 'Family',
      relationshipType: 'Other',
      groupName: 'Family',
      todoTitle: defaultTitle,
    },
    {
      key: 'friends',
      label: 'Friends',
      relationshipType: 'Friend',
      groupName: 'College',
      todoTitle: normalized.includes('meet') ? 'Meet friends' : defaultTitle,
    },
    {
      key: 'mentor',
      label: 'Mentor',
      relationshipType: 'Mentor',
      groupName: 'Other',
      todoTitle: defaultTitle,
    },
  ];

  const detected = matchers.filter((matcher) => normalized.includes(matcher.key));
  const trackers = (detected.length > 0
    ? detected
    : [
        {
          key: 'important-person',
          label: 'Important Person',
          relationshipType: 'Other',
          groupName: 'Other',
          todoTitle: defaultTitle,
        },
      ]) as typeof matchers;

  return trackers.map((tracker) => ({
    id: makeId('relationship'),
    name: tracker.label,
    relationshipType: tracker.relationshipType,
    groupName: tracker.groupName,
    frequency,
    todoTitle: tracker.todoTitle,
    notes: answer.trim(),
  }));
}

function createBaseCategories(answers: OnboardingAnswers): GeneratedOnboardingCategory[] {
  const healthAnswer = answers.health.trim();
  const financeAnswer = answers.finance.trim();
  const relationshipAnswer = answers.relationships.trim();
  const careerAnswer = answers.career.trim();
  const learningAnswer = answers.learning.trim();
  const personalAdminAnswer = answers.personalAdmin.trim();

  const definitions: { name: (typeof DEFAULT_CATEGORY_NAMES)[number]; kpi: GeneratedOnboardingKpi }[] = [
    {
      name: 'Health',
      kpi: parseHealthKpi(healthAnswer || 'Track gym 4 days a week'),
    },
    {
      name: 'Finance',
      kpi: parseFinanceKpi(financeAnswer || 'Save money monthly'),
    },
    {
      name: 'Relationships',
      kpi: parseRelationshipKpi(relationshipAnswer || 'Connect with important people weekly'),
    },
    {
      name: 'Career',
      kpi: parseCareerKpi(careerAnswer || 'Complete career progress activity weekly'),
    },
    {
      name: 'Learning',
      kpi: parseLearningKpi(learningAnswer || 'Study or read 4 days a week'),
    },
    {
      name: 'Personal Admin',
      kpi: parsePersonalAdminKpi(personalAdminAnswer || 'Weekly planning'),
    },
  ];

  return DEFAULT_CATEGORY_NAMES.map((name) => {
    const definition = definitions.find((item) => item.name === name);
    return {
      id: makeId('category'),
      name,
      kpis: definition ? [definition.kpi] : [],
    };
  });
}

export function deriveReminderPreferences(answers: OnboardingAnswers): ReminderPreferences {
  const combined = normalize(
    `${answers.focus} ${answers.health} ${answers.finance} ${answers.relationships} ${answers.career} ${answers.learning} ${answers.personalAdmin}`
  );

  return {
    kpiReminders: !combined.includes('no reminders') && !combined.includes('less reminders'),
    relationshipReminders: !combined.includes('no relationship reminders'),
    weeklyReview: !combined.includes('skip weekly review'),
  };
}

export function generateOnboardingSetup(answers: OnboardingAnswers): GeneratedOnboardingSetup {
  const summaryBase = answers.focus.trim()
    ? answers.focus.trim()
    : 'Build a simple, consistent personal operating system.';

  return {
    summary: `Life Buddy heard: ${summaryBase}`,
    categories: createBaseCategories(answers),
    relationships: parseRelationshipTrackers(
      answers.relationships.trim() || 'Call parents weekly and meet friends monthly'
    ),
    reminderPreferences: {
      ...defaultReminderPreferences,
      ...deriveReminderPreferences(answers),
    },
  };
}
