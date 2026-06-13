export type PlanId = 'free' | 'plus' | 'premium' | 'family' | 'business';

export type EntitlementKey =
  | 'unlimited_kpis'
  | 'ai_buddy'
  | 'cloud_sync'
  | 'advanced_analytics'
  | 'family_sharing'
  | 'export_pdf'
  | 'premium_life_library';

export interface PlanEntitlements {
  plan: PlanId;
  entitlements: Record<EntitlementKey, boolean>;
}
