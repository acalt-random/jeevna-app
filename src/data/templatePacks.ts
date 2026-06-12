import { TemplatePackPayload } from '@/context/AppDataContext';

export type TemplatePack = TemplatePackPayload & {
  id: string;
  title: string;
  blurb: string;
};

export const templatePacks: TemplatePack[] = [
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
    categories: ['Health', 'Career', 'Finance', 'Learning', 'Relationships'],
    kpis: [
      { name: 'Sleep', category: 'Health', target: 8, unit: 'hours', weight: 10 },
      { name: 'Exercise', category: 'Health', target: 20, unit: 'sessions/month', weight: 10 },
      { name: 'Deep Work', category: 'Career', target: 80, unit: 'hours/month', weight: 12 },
      { name: 'Skill Development', category: 'Career', target: 20, unit: 'hours/month', weight: 12 },
      { name: 'Savings', category: 'Finance', target: 20000, unit: 'amount', weight: 12 },
      { name: 'Expense Tracking', category: 'Finance', target: 100, unit: 'percent', weight: 8 },
      { name: 'Reading', category: 'Learning', target: 24, unit: 'books/year', weight: 10 },
      { name: 'Courses', category: 'Learning', target: 4, unit: 'courses/year', weight: 10 },
      { name: 'Family Time', category: 'Relationships', target: 12, unit: 'times/month', weight: 10 },
      { name: 'Friend Meetups', category: 'Relationships', target: 4, unit: 'times/month', weight: 10 },
    ],
  },
];
