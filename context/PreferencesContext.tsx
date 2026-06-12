import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export const LIFE_BUDDY_SCORING_PREFERENCES_KEY = 'lifeKpi_lifeBuddyScoringPreferences';
export const ONBOARDING_COMPLETED_KEY = 'lifeKpi_onboardingCompleted';
export const REMINDER_PREFERENCES_KEY = 'lifeKpi_reminderPreferences';
export const ONBOARDING_PROFILE_KEY = 'lifeKpi_onboardingProfile';
export const SUGGESTION_DISMISSALS_KEY = 'lifeKpi_suggestionDismissals';

export type ScoringSection =
  | 'categoryImportance'
  | 'relationshipImportance'
  | 'urgencyWeights'
  | 'impactWeights';

export type WeightMap = Record<string, number>;

export interface ReminderPreferences {
  kpiReminders: boolean;
  relationshipReminders: boolean;
  weeklyReview: boolean;
}

export interface OnboardingProfile {
  roles: string[];
  relationships: string[];
  assets: string[];
  interests: string[];
  priorities: string[];
}

export interface LifeBuddyScoringPreferences {
  categoryImportance: WeightMap;
  relationshipImportance: WeightMap;
  urgencyWeights: WeightMap;
  impactWeights: WeightMap;
}

export const defaultLifeBuddyScoringPreferences: LifeBuddyScoringPreferences = {
  categoryImportance: {
    Health: 10,
    Relationships: 10,
    Finance: 8,
    Career: 8,
    Learning: 6,
    Other: 5,
  },
  relationshipImportance: {
    Partner: 10,
    Parent: 10,
    Child: 10,
    Sibling: 8,
    'Best Friend': 8,
    Friend: 6,
    Mentor: 7,
    Colleague: 4,
    Acquaintance: 2,
    Other: 5,
  },
  urgencyWeights: {
    'Due Today': 10,
    '1-3 Days Overdue': 8,
    '4-7 Days Overdue': 9,
    '8-14 Days Overdue': 10,
    'No Contact 14+ Days': 8,
    'No Contact 30+ Days': 10,
    'KPI Missed 3 Days': 5,
    'KPI Missed 7 Days': 8,
    'KPI Missed 14 Days': 10,
  },
  impactWeights: {
    'Parent Relationship': 10,
    'Partner Relationship': 10,
    'Child Relationship': 10,
    'Health KPI': 10,
    'Financial KPI': 9,
    'Career KPI': 8,
    'Friend Relationship': 7,
    'Learning KPI': 6,
    'Habit KPI': 5,
    'Recreation KPI': 3,
  },
};

export const defaultReminderPreferences: ReminderPreferences = {
  kpiReminders: true,
  relationshipReminders: true,
  weeklyReview: true,
};

function clampWeight(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value)));
}

function mergeWithDefaults(
  value?: Partial<LifeBuddyScoringPreferences> | null
): LifeBuddyScoringPreferences {
  return {
    categoryImportance: {
      ...defaultLifeBuddyScoringPreferences.categoryImportance,
      ...(value?.categoryImportance ?? {}),
    },
    relationshipImportance: {
      ...defaultLifeBuddyScoringPreferences.relationshipImportance,
      ...(value?.relationshipImportance ?? {}),
    },
    urgencyWeights: {
      ...defaultLifeBuddyScoringPreferences.urgencyWeights,
      ...(value?.urgencyWeights ?? {}),
    },
    impactWeights: {
      ...defaultLifeBuddyScoringPreferences.impactWeights,
      ...(value?.impactWeights ?? {}),
    },
  };
}

interface PreferencesContextValue {
  preferencesHydrated: boolean;
  onboardingCompleted: boolean;
  reminderPreferences: ReminderPreferences;
  onboardingProfile: OnboardingProfile;
  suggestionDismissedUntil: Record<string, string>;
  lifeBuddyScoringPreferences: LifeBuddyScoringPreferences;
  setOnboardingCompleted: (value: boolean) => void;
  setOnboardingProfile: (profile: OnboardingProfile) => void;
  dismissSuggestionUntil: (suggestionId: string, untilDate: string) => void;
  updateReminderPreference: (key: keyof ReminderPreferences, value: boolean) => void;
  resetReminderPreferences: () => void;
  updateLifeBuddyScoringPreference: (
    section: ScoringSection,
    label: string,
    value: number
  ) => void;
  resetLifeBuddyScoringPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const defaultOnboardingProfile: OnboardingProfile = {
  roles: [],
  relationships: [],
  assets: [],
  interests: [],
  priorities: [],
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [lifeBuddyScoringPreferences, setLifeBuddyScoringPreferences] =
    useState<LifeBuddyScoringPreferences>(defaultLifeBuddyScoringPreferences);
  const [reminderPreferences, setReminderPreferences] =
    useState<ReminderPreferences>(defaultReminderPreferences);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingProfile, setOnboardingProfile] =
    useState<OnboardingProfile>(defaultOnboardingProfile);
  const [suggestionDismissedUntil, setSuggestionDismissedUntil] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedValue = await AsyncStorage.getItem(LIFE_BUDDY_SCORING_PREFERENCES_KEY);
        if (savedValue) {
          const parsed = JSON.parse(savedValue) as Partial<LifeBuddyScoringPreferences>;
          setLifeBuddyScoringPreferences(mergeWithDefaults(parsed));
        }

        const savedReminderPreferences = await AsyncStorage.getItem(REMINDER_PREFERENCES_KEY);
        if (savedReminderPreferences) {
          const parsed = JSON.parse(savedReminderPreferences) as Partial<ReminderPreferences>;
          setReminderPreferences({
            ...defaultReminderPreferences,
            ...parsed,
          });
        }

        const savedOnboardingCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        if (savedOnboardingCompleted !== null) {
          setOnboardingCompleted(savedOnboardingCompleted === 'true');
        }

        const savedOnboardingProfile = await AsyncStorage.getItem(ONBOARDING_PROFILE_KEY);
        if (savedOnboardingProfile) {
          const parsed = JSON.parse(savedOnboardingProfile) as Partial<OnboardingProfile>;
          setOnboardingProfile({
            ...defaultOnboardingProfile,
            ...parsed,
            roles: parsed.roles ?? [],
            relationships: parsed.relationships ?? [],
            assets: parsed.assets ?? [],
            interests: parsed.interests ?? [],
            priorities: parsed.priorities ?? [],
          });
        }

        const savedDismissals = await AsyncStorage.getItem(SUGGESTION_DISMISSALS_KEY);
        if (savedDismissals) {
          setSuggestionDismissedUntil(JSON.parse(savedDismissals) as Record<string, string>);
        }
      } catch (error) {
        console.error('Error loading Life Buddy scoring preferences', error);
      } finally {
        setIsHydrated(true);
      }
    };

    loadPreferences();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(
      LIFE_BUDDY_SCORING_PREFERENCES_KEY,
      JSON.stringify(lifeBuddyScoringPreferences)
    ).catch((error) => {
      console.error('Error saving Life Buddy scoring preferences', error);
    });
  }, [isHydrated, lifeBuddyScoringPreferences]);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(
      REMINDER_PREFERENCES_KEY,
      JSON.stringify(reminderPreferences)
    ).catch((error) => {
      console.error('Error saving reminder preferences', error);
    });
  }, [isHydrated, reminderPreferences]);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, onboardingCompleted ? 'true' : 'false').catch(
      (error) => {
        console.error('Error saving onboarding status', error);
      }
    );
  }, [isHydrated, onboardingCompleted]);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(onboardingProfile)).catch(
      (error) => {
        console.error('Error saving onboarding profile', error);
      }
    );
  }, [isHydrated, onboardingProfile]);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(
      SUGGESTION_DISMISSALS_KEY,
      JSON.stringify(suggestionDismissedUntil)
    ).catch((error) => {
      console.error('Error saving suggestion dismissals', error);
    });
  }, [isHydrated, suggestionDismissedUntil]);

  const value = useMemo<PreferencesContextValue>(() => {
    return {
      preferencesHydrated: isHydrated,
      onboardingCompleted,
      reminderPreferences,
      onboardingProfile,
      suggestionDismissedUntil,
      lifeBuddyScoringPreferences,
      setOnboardingCompleted,
      setOnboardingProfile,
      dismissSuggestionUntil: (suggestionId, untilDate) => {
        setSuggestionDismissedUntil((prev) => ({
          ...prev,
          [suggestionId]: untilDate,
        }));
      },
      updateReminderPreference: (key, value) => {
        setReminderPreferences((prev) => ({
          ...prev,
          [key]: value,
        }));
      },
      resetReminderPreferences: () => {
        setReminderPreferences(defaultReminderPreferences);
      },
      updateLifeBuddyScoringPreference: (section, label, value) => {
        setLifeBuddyScoringPreferences((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [label]: clampWeight(value),
          },
        }));
      },
      resetLifeBuddyScoringPreferences: () => {
        setLifeBuddyScoringPreferences(defaultLifeBuddyScoringPreferences);
      },
    };
  }, [
    isHydrated,
    lifeBuddyScoringPreferences,
    onboardingCompleted,
    onboardingProfile,
    reminderPreferences,
    suggestionDismissedUntil,
  ]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }

  return context;
}
