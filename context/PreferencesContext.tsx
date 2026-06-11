import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export const LIFE_BUDDY_SCORING_PREFERENCES_KEY = 'lifeKpi_lifeBuddyScoringPreferences';

export type ScoringSection =
  | 'categoryImportance'
  | 'relationshipImportance'
  | 'urgencyWeights'
  | 'impactWeights';

export type WeightMap = Record<string, number>;

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
  lifeBuddyScoringPreferences: LifeBuddyScoringPreferences;
  updateLifeBuddyScoringPreference: (
    section: ScoringSection,
    label: string,
    value: number
  ) => void;
  resetLifeBuddyScoringPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [lifeBuddyScoringPreferences, setLifeBuddyScoringPreferences] =
    useState<LifeBuddyScoringPreferences>(defaultLifeBuddyScoringPreferences);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedValue = await AsyncStorage.getItem(LIFE_BUDDY_SCORING_PREFERENCES_KEY);
        if (savedValue) {
          const parsed = JSON.parse(savedValue) as Partial<LifeBuddyScoringPreferences>;
          setLifeBuddyScoringPreferences(mergeWithDefaults(parsed));
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

  const value = useMemo<PreferencesContextValue>(() => {
    return {
      lifeBuddyScoringPreferences,
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
  }, [lifeBuddyScoringPreferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }

  return context;
}
