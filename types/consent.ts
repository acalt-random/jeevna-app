export type ConsentType =
  | 'ai_processing'
  | 'analytics'
  | 'notifications'
  | 'health_data'
  | 'calendar_access'
  | 'contacts_access'
  | 'public_profile'
  | 'benchmarking';

export interface ConsentRecord {
  consentType: ConsentType;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  version: string;
  source: string;
}
