import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuditEntry } from '@/types/audit';

const AUDIT_LOG_KEY = 'lifeKpi_auditLog';
const DEFAULT_ACTOR_ID = 'local-user';
const DEFAULT_WORKSPACE_ID = 'local-workspace';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function appendAuditEntry(
  entry: Omit<AuditEntry, 'id' | 'timestamp' | 'actorId' | 'workspaceId'> &
    Partial<Pick<AuditEntry, 'actorId' | 'workspaceId'>>
): Promise<AuditEntry> {
  const nextEntry: AuditEntry = {
    id: makeId('audit'),
    actorId: entry.actorId ?? DEFAULT_ACTOR_ID,
    workspaceId: entry.workspaceId ?? DEFAULT_WORKSPACE_ID,
    timestamp: new Date().toISOString(),
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
  };

  try {
    const current = await getAuditLog();
    await AsyncStorage.setItem(AUDIT_LOG_KEY, JSON.stringify([...current, nextEntry]));
  } catch (error) {
    console.error('Error saving audit log entry', error);
  }

  return nextEntry;
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(AUDIT_LOG_KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch (error) {
    console.error('Error loading audit log', error);
    return [];
  }
}

export async function clearAuditLog(): Promise<void> {
  await AsyncStorage.removeItem(AUDIT_LOG_KEY);
}
