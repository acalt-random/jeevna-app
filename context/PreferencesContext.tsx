import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import i18n, {
  getBestSupportedLanguage,
  SupportedLanguage,
} from '@/src/localization/i18n';
import {
  buildLocalePreferences,
  detectDeviceLocalePreferences,
  LocalePreferences,
} from '@/services/localeService';
import { appendAuditEntry } from '@/services/auditLogService';
import { emitDomainEvent } from '@/services/eventBus';

export const LIFE_BUDDY_SCORING_PREFERENCES_KEY = 'lifeKpi_lifeBuddyScoringPreferences';
export const ONBOARDING_COMPLETED_KEY = 'lifeKpi_onboardingCompleted';
export const REMINDER_PREFERENCES_KEY = 'lifeKpi_reminderPreferences';
export const ONBOARDING_PROFILE_KEY = 'lifeKpi_onboardingProfile';
export const SUGGESTION_DISMISSALS_KEY = 'lifeKpi_suggestionDismissals';
export const APP_LANGUAGE_KEY = 'lifeKpi_selectedLanguage';
export const APP_LOCALE_PREFERENCES_KEY = 'lifeKpi_localePreferences';

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
  selectedLanguage: SupportedLanguage;
  selectedLocale: string;
  localePreferences: LocalePreferences;
  setOnboardingCompleted: (value: boolean) => void;
  setOnboardingProfile: (profile: OnboardingProfile) => void;
  setSelectedLanguage: (language: SupportedLanguage) => void;
  setSelectedLocale: (localeId: string) => void;
  setCountryCode: (countryCode: LocalePreferences['countryCode']) => void;
  updateLocalePreferences: (value: Partial<LocalePreferences>) => void;
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
  locale: [],
  language: [],
  region: [],
  roles: [],
  lifeStages: [],
  relationships: [],
  responsibilities: [],
  assets: [],
  interests: [],
  priorities: [],
  currentFocus: [],
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [lifeBuddyScoringPreferences, setLifeBuddyScoringPreferences] =
    useState<LifeBuddyScoringPreferences>(defaultLifeBuddyScoringPreferences);
  const [reminderPreferences, setReminderPreferences] =
    useState<ReminderPreferences>(defaultReminderPreferences);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingProfile, setOnboardingProfile] =
    useState<OnboardingProfile>(defaultOnboardingProfile);
  const [localePreferences, setLocalePreferences] =
    useState<LocalePreferences>(detectDeviceLocalePreferences());
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>(getBestSupportedLanguage(detectDeviceLocalePreferences().languageCode));
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
          const parsed = JSON.parse(savedOnboardingProfile) as Partial<OnboardingProfile> & {
            language?: string[];
          };
          setOnboardingProfile({
            ...defaultOnboardingProfile,
            ...parsed,
            locale: parsed.locale ?? parsed.language ?? [],
            language: parsed.language ?? [],
            region: parsed.region ?? [],
            roles: parsed.roles ?? [],
            lifeStages: parsed.lifeStages ?? [],
            relationships: parsed.relationships ?? [],
            responsibilities: parsed.responsibilities ?? [],
            assets: parsed.assets ?? [],
            interests: parsed.interests ?? [],
            priorities: parsed.priorities ?? [],
            currentFocus: parsed.currentFocus ?? parsed.priorities ?? [],
          });
        }

        const savedDismissals = await AsyncStorage.getItem(SUGGESTION_DISMISSALS_KEY);
        if (savedDismissals) {
          setSuggestionDismissedUntil(JSON.parse(savedDismissals) as Record<string, string>);
        }

        const savedLocalePreferences = await AsyncStorage.getItem(APP_LOCALE_PREFERENCES_KEY);
        const hydratedLocalePreferences = savedLocalePreferences
          ? buildLocalePreferences(JSON.parse(savedLocalePreferences) as Partial<LocalePreferences>)
          : detectDeviceLocalePreferences();

        const savedLanguage = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
        const nextLanguage = getBestSupportedLanguage(
          savedLanguage ?? hydratedLocalePreferences.languageCode
        );
        const nextLocalePreferences = buildLocalePreferences({
          ...hydratedLocalePreferences,
          languageCode: nextLanguage,
        });
        setLocalePreferences(nextLocalePreferences);
        setSelectedLanguage(nextLanguage);
        await i18n.changeLanguage(nextLanguage);
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

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(APP_LANGUAGE_KEY, selectedLanguage).catch((error) => {
      console.error('Error saving selected language', error);
    });
    i18n.changeLanguage(selectedLanguage).catch((error) => {
      console.error('Error changing app language', error);
    });
  }, [isHydrated, selectedLanguage]);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(APP_LOCALE_PREFERENCES_KEY, JSON.stringify(localePreferences)).catch(
      (error) => {
        console.error('Error saving locale preferences', error);
      }
    );
  }, [isHydrated, localePreferences]);

  const value = useMemo<PreferencesContextValue>(() => {
    return {
      preferencesHydrated: isHydrated,
      onboardingCompleted,
      reminderPreferences,
      onboardingProfile,
      suggestionDismissedUntil,
      lifeBuddyScoringPreferences,
      selectedLanguage,
      selectedLocale: localePreferences.locale,
      localePreferences,
      setOnboardingCompleted,
      setOnboardingProfile,
      setSelectedLanguage: (language) => {
        setSelectedLanguage(language);
        setLocalePreferences((current) =>
          buildLocalePreferences({
            countryCode: current.countryCode,
            languageCode: language,
          })
        );
        void emitDomainEvent({
          eventName: 'LANGUAGE_CHANGED',
          entityType: 'language',
          entityId: language,
          metadata: { languageCode: language },
        });
        void appendAuditEntry({
          action: 'LANGUAGE_CHANGED',
          entityType: 'language',
          entityId: language,
          after: { languageCode: language },
        });
      },
      setSelectedLocale: (localeId) => {
        const nextLocale = buildLocalePreferences({
          locale: localeId,
          timezone: localePreferences.timezone,
        });
        const nextLanguage = getBestSupportedLanguage(nextLocale.languageCode);
        setLocalePreferences(nextLocale);
        setSelectedLanguage(nextLanguage);
        void emitDomainEvent({
          eventName: 'LANGUAGE_CHANGED',
          entityType: 'locale',
          entityId: localeId,
          metadata: {
            locale: localeId,
            languageCode: nextLocale.languageCode,
            countryCode: nextLocale.countryCode,
          },
        });
        void appendAuditEntry({
          action: 'LOCALE_CHANGED',
          entityType: 'locale',
          entityId: localeId,
          after: nextLocale,
        });
      },
      setCountryCode: (countryCode) => {
        setLocalePreferences((current) =>
          buildLocalePreferences({
            countryCode,
            languageCode: current.languageCode,
          })
        );
        void emitDomainEvent({
          eventName: 'COUNTRY_CHANGED',
          entityType: 'country',
          entityId: countryCode,
          metadata: { countryCode },
        });
        void appendAuditEntry({
          action: 'COUNTRY_CHANGED',
          entityType: 'country',
          entityId: countryCode,
          after: { countryCode },
        });
      },
      updateLocalePreferences: (value) => {
        setLocalePreferences((current) =>
          buildLocalePreferences({
            ...current,
            ...value,
          })
        );
      },
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
    localePreferences,
    selectedLanguage,
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
