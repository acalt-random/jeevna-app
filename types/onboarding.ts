import { ReminderPreferences } from '@/context/PreferencesContext';
import { SubtaskFrequency } from '@/context/AppDataContext';

export type OnboardingStepId =
  | 'language'
  | 'region'
  | 'roles'
  | 'lifeStages'
  | 'relationships'
  | 'responsibilities'
  | 'assets'
  | 'interests'
  | 'priorities'
  | 'currentFocus';

export interface OnboardingOption {
  id: string;
  labelKey?: string;
  label?: string;
  descriptionKey?: string;
  description?: string;
  groupKey?: string;
  groupLabel?: string;
  icon?: string;
  searchText?: string;
}

export interface OnboardingStep {
  id: OnboardingStepId;
  titleKey?: string;
  title?: string;
  subtitleKey?: string;
  subtitle?: string;
  helperTextKey?: string;
  helperText?: string;
  options: OnboardingOption[];
  singleSelect?: boolean;
  maxSelections?: number;
}

export interface OnboardingSelections {
  locale: string[];
  language: string[];
  region: string[];
  roles: string[];
  lifeStages: string[];
  relationships: string[];
  responsibilities: string[];
  assets: string[];
  interests: string[];
  priorities: string[];
  currentFocus: string[];
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
  nameKey: string;
  frequency: SubtaskFrequency;
  targetCount: number;
  importanceScore: number;
  recommended: boolean;
  defaultFrequency: SubtaskFrequency;
}

export interface LifeLibraryKpiTemplate {
  id: string;
  categoryId: string;
  nameKey: string;
  target: number;
  unit: string;
  weight: number;
  recommendedFrequency: SubtaskFrequency;
}

export interface LifeLibraryCategory {
  id: string;
  nameKey: string;
  descriptionKey: string;
}

export interface LifeLibraryRule {
  trigger: string;
  categories: string[];
  kpis: string[];
  activities: string[];
}

export interface RelationshipTrackerTemplate {
  trigger: string;
  nameKey: string;
  relationshipTypeKey: string;
  groupNameKey: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  todoTitleKey: string;
  notesKey?: string;
}
