import { ReminderPreferences } from '@/context/PreferencesContext';
import { SubtaskFrequency } from '@/context/AppDataContext';

export type OnboardingStepId =
  | 'roles'
  | 'relationships'
  | 'assets'
  | 'interests'
  | 'priorities';

export interface OnboardingOption {
  id: string;
  label: string;
  description: string;
  group?: string;
  icon?: string;
}

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  subtitle: string;
  helperText?: string;
  options: OnboardingOption[];
}

export interface OnboardingSelections {
  roles: string[];
  relationships: string[];
  assets: string[];
  interests: string[];
  priorities: string[];
}

export interface GeneratedOnboardingActivity {
  id: string;
  name: string;
  frequency: SubtaskFrequency;
  targetCount: number;
  importanceScore?: number;
  recommended?: boolean;
  defaultFrequency?: SubtaskFrequency;
  reason?: string;
  sourceTriggers?: string[];
  selected?: boolean;
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

export interface LifeLibraryActivityTemplate {
  id: string;
  kpiId: string;
  name: string;
  frequency: SubtaskFrequency;
  targetCount: number;
  importanceScore: number;
  recommended: boolean;
  defaultFrequency: SubtaskFrequency;
}

export interface LifeLibraryKpiTemplate {
  id: string;
  categoryId: string;
  name: string;
  target: number;
  unit: string;
  weight: number;
  recommendedFrequency: SubtaskFrequency;
}

export interface LifeLibraryCategory {
  id: string;
  name: string;
  description: string;
}

export interface LifeLibraryRule {
  trigger: string;
  categories: string[];
  kpis: string[];
  activities: string[];
}

export interface RelationshipTrackerTemplate {
  trigger: string;
  name: string;
  relationshipType: string;
  groupName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  todoTitle: string;
  notes?: string;
}
