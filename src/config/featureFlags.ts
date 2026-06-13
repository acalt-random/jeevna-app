import { SupportedCountryCode } from '@/src/data/countries';
import { PlanId } from '@/types/entitlements';

export type FeatureFlagKey =
  | 'aiBuddy'
  | 'familyAccounts'
  | 'sharedKpis'
  | 'calendarSync'
  | 'healthIntegrations'
  | 'watchApp'
  | 'globalSearch'
  | 'lifeBuddySuggestions'
  | 'multilingual'
  | 'countrySupport';

export interface FeatureFlagDefinition {
  enabled: boolean;
  countries?: SupportedCountryCode[];
  platforms?: ('ios' | 'android' | 'web')[];
  minimumPlan?: PlanId;
}

export const featureFlags: Record<FeatureFlagKey, FeatureFlagDefinition> = {
  aiBuddy: { enabled: false, minimumPlan: 'premium' },
  familyAccounts: { enabled: false, minimumPlan: 'family' },
  sharedKpis: { enabled: false, minimumPlan: 'family' },
  calendarSync: { enabled: false, minimumPlan: 'plus' },
  healthIntegrations: { enabled: false, minimumPlan: 'premium', platforms: ['ios', 'android'] },
  watchApp: { enabled: false, minimumPlan: 'premium', platforms: ['ios', 'android'] },
  globalSearch: { enabled: true },
  lifeBuddySuggestions: { enabled: true },
  multilingual: { enabled: true },
  countrySupport: { enabled: true, countries: ['IN', 'US', 'GB', 'CA', 'AU', 'SG', 'AE'] },
};
