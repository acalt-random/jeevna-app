export type DomainEventName =
  | 'CATEGORY_CREATED'
  | 'KPI_CREATED'
  | 'ACTIVITY_CREATED'
  | 'ACTIVITY_COMPLETED'
  | 'ENTRY_LOGGED'
  | 'SUGGESTION_ACTIVATED'
  | 'ONBOARDING_COMPLETED'
  | 'LANGUAGE_CHANGED'
  | 'COUNTRY_CHANGED';

export type DomainEntityType =
  | 'category'
  | 'kpi'
  | 'activity'
  | 'entry'
  | 'suggestion'
  | 'onboarding'
  | 'language'
  | 'locale'
  | 'country'
  | 'system';

export interface DomainEvent {
  id: string;
  eventName: DomainEventName;
  entityType: DomainEntityType;
  entityId: string;
  actorId: string;
  workspaceId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
