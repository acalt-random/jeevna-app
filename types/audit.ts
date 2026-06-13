export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  workspaceId: string;
  timestamp: string;
  before?: unknown;
  after?: unknown;
}
