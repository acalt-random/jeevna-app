import { EntitlementKey, PlanEntitlements, PlanId } from '@/types/entitlements';

const defaultEntitlementsByPlan: Record<PlanId, Record<EntitlementKey, boolean>> = {
  free: {
    unlimited_kpis: false,
    ai_buddy: false,
    cloud_sync: false,
    advanced_analytics: false,
    family_sharing: false,
    export_pdf: false,
    premium_life_library: false,
  },
  plus: {
    unlimited_kpis: true,
    ai_buddy: false,
    cloud_sync: false,
    advanced_analytics: false,
    family_sharing: false,
    export_pdf: false,
    premium_life_library: false,
  },
  premium: {
    unlimited_kpis: true,
    ai_buddy: true,
    cloud_sync: true,
    advanced_analytics: true,
    family_sharing: false,
    export_pdf: true,
    premium_life_library: true,
  },
  family: {
    unlimited_kpis: true,
    ai_buddy: true,
    cloud_sync: true,
    advanced_analytics: true,
    family_sharing: true,
    export_pdf: true,
    premium_life_library: true,
  },
  business: {
    unlimited_kpis: true,
    ai_buddy: true,
    cloud_sync: true,
    advanced_analytics: true,
    family_sharing: true,
    export_pdf: true,
    premium_life_library: true,
  },
};

let currentPlan: PlanId = 'free';

export function getCurrentPlan(): PlanId {
  return currentPlan;
}

export function setCurrentPlan(plan: PlanId): void {
  currentPlan = plan;
}

export function getPlanEntitlements(plan: PlanId = currentPlan): PlanEntitlements {
  return {
    plan,
    entitlements: { ...defaultEntitlementsByPlan[plan] },
  };
}

export function hasEntitlement(
  entitlement: EntitlementKey,
  plan: PlanId = currentPlan
): boolean {
  return defaultEntitlementsByPlan[plan][entitlement];
}
