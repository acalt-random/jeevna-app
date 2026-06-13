import { AuditEntry } from '@/types/audit';
import { ConsentRecord } from '@/types/consent';
import { Insight, Review } from '@/types/entities';

export interface ExportPackage {
  version: string;
  exportedAt: string;
  appVersion: string;
  locale: unknown;
  preferences: unknown;
  categories: unknown[];
  kpis: unknown[];
  activities: unknown[];
  entries: unknown[];
  reviews: Review[];
  insights: Insight[];
  consents: ConsentRecord[];
  auditLog: AuditEntry[];
}
