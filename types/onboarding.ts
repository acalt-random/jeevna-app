import { ReminderPreferences } from '@/context/PreferencesContext';
import { SubtaskFrequency } from '@/context/AppDataContext';

export type OnboardingQuestionId =
  | 'focus'
  | 'health'
  | 'finance'
  | 'relationships'
  | 'career'
  | 'learning'
  | 'personalAdmin';

export interface OnboardingQuestion {
  id: OnboardingQuestionId;
  title: string;
  prompt: string;
  placeholder: string;
  helperText?: string;
}

export type OnboardingAnswers = Record<OnboardingQuestionId, string>;

export interface GeneratedOnboardingActivity {
  id: string;
  name: string;
  frequency: SubtaskFrequency;
  targetCount: number;
}

export interface GeneratedOnboardingKpi {
  id: string;
  name: string;
  categoryName: string;
  target: number;
  unit: string;
  weight: number;
  activities: GeneratedOnboardingActivity[];
}

export interface GeneratedOnboardingCategory {
  id: string;
  name: string;
  kpis: GeneratedOnboardingKpi[];
}

export interface GeneratedRelationshipTracker {
  id: string;
  name: string;
  relationshipType: string;
  groupName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  todoTitle: string;
  notes?: string;
}

export interface GeneratedOnboardingSetup {
  summary: string;
  categories: GeneratedOnboardingCategory[];
  relationships: GeneratedRelationshipTracker[];
  reminderPreferences: ReminderPreferences;
}
