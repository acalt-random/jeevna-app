import { Platform } from 'react-native';

import { featureFlags, FeatureFlagDefinition, FeatureFlagKey } from '@/src/config/featureFlags';
import { SupportedCountryCode } from '@/src/data/countries';
import { getCurrentPlan, hasEntitlement } from '@/services/entitlementService';
import { PlanId } from '@/types/entitlements';

export interface FeatureFlagContext {
  countryCode?: SupportedCountryCode;
  platform?: 'ios' | 'android' | 'web';
  plan?: PlanId;
}

function meetsPlanRequirement(definition: FeatureFlagDefinition, plan: PlanId): boolean {
  if (!definition.minimumPlan) return true;

  const entitlementByPlan = {
    plus: 'unlimited_kpis',
    premium: 'premium_life_library',
    family: 'family_sharing',
    business: 'advanced_analytics',
  } as const;

  const required = entitlementByPlan[definition.minimumPlan as keyof typeof entitlementByPlan];
  return required ? hasEntitlement(required, plan) : definition.minimumPlan === plan;
}

export function isFeatureEnabled(
  key: FeatureFlagKey,
  context: FeatureFlagContext = {}
): boolean {
  const definition = featureFlags[key];
  if (!definition?.enabled) return false;

  const platform = context.platform ?? (Platform.OS as 'ios' | 'android' | 'web');
  const countryCode = context.countryCode;
  const plan = context.plan ?? getCurrentPlan();

  if (definition.platforms && !definition.platforms.includes(platform)) {
    return false;
  }

  if (definition.countries && countryCode && !definition.countries.includes(countryCode)) {
    return false;
  }

  return meetsPlanRequirement(definition, plan);
}

export function getFeatureFlags(): Record<FeatureFlagKey, FeatureFlagDefinition> {
  return featureFlags;
}
