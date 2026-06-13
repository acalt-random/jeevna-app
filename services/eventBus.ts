import AsyncStorage from '@react-native-async-storage/async-storage';

import { DomainEvent } from '@/types/events';

const EVENT_LOG_KEY = 'lifeKpi_eventLog';
const DEFAULT_ACTOR_ID = 'local-user';
const DEFAULT_WORKSPACE_ID = 'local-workspace';

type EventListener = (event: DomainEvent) => void;

const listeners = new Set<EventListener>();

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function emitDomainEvent(
  event: Omit<DomainEvent, 'id' | 'timestamp' | 'actorId' | 'workspaceId'> &
    Partial<Pick<DomainEvent, 'actorId' | 'workspaceId'>>
): Promise<DomainEvent> {
  const nextEvent: DomainEvent = {
    id: makeId('evt'),
    actorId: event.actorId ?? DEFAULT_ACTOR_ID,
    workspaceId: event.workspaceId ?? DEFAULT_WORKSPACE_ID,
    timestamp: new Date().toISOString(),
    eventName: event.eventName,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata: event.metadata,
  };

  try {
    const current = await getEventLog();
    await AsyncStorage.setItem(EVENT_LOG_KEY, JSON.stringify([...current, nextEvent]));
  } catch (error) {
    console.error('Error saving domain event', error);
  }

  console.log('[eventBus]', nextEvent.eventName, nextEvent);
  listeners.forEach((listener) => listener(nextEvent));
  return nextEvent;
}

export async function getEventLog(): Promise<DomainEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(EVENT_LOG_KEY);
    return raw ? (JSON.parse(raw) as DomainEvent[]) : [];
  } catch (error) {
    console.error('Error loading event log', error);
    return [];
  }
}

export async function clearEventLog(): Promise<void> {
  await AsyncStorage.removeItem(EVENT_LOG_KEY);
}

export function subscribeToEvents(listener: EventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
