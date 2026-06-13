import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { appendAuditEntry } from '@/services/auditLogService';
import { emitDomainEvent } from '@/services/eventBus';
import { ENTITY_SCHEMA_VERSION, EntityMetadata } from '@/types/entities';
import { LifeLibraryPackApplyPayload } from '@/types/lifeLibraryPack';

type EntityInput<T extends EntityMetadata> = Omit<T, keyof EntityMetadata>;

export interface Category extends EntityMetadata {
  name: string;
}

export interface KPI extends EntityMetadata {
  name: string;
  category: string;
  target: number;
  unit: string;
  weight: number;
}

// ─── NEW: Subtask models ───────────────────────────────────────────────────────

export type SubtaskFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface Subtask extends EntityMetadata {
  kpiId: string;
  name: string;
  frequency: SubtaskFrequency;
  targetCount: number;
}

export type PeopleActivityType = 'Meet' | 'Call' | 'Message' | 'Date' | 'Other';

export interface PeopleTodo extends Subtask {
  type: 'people';
  contactId: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  activityType: PeopleActivityType;
}

export interface SubtaskLog {
  id: string;
  subtaskId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface SavedContact {
  id: string;
  kpiId: string;
  contactId: string;
  name: string;
  phoneNumber?: string;
  email?: string;
}

export interface Person {
  id: string;
  name: string;
  relationshipType: string;
  groupName: string;
  phone?: string;
  notes?: string;
  lastContactDate?: string;
}

export interface PersonActivity {
  id: string;
  personId: string;
  activityType: 'Call' | 'Meet' | 'Message' | 'Date' | 'Other';
  date: string;
  notes?: string;
}

export interface PersonTodo {
  id: string;
  personId: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  dueDate?: string;
  completed: boolean;
  completedDate?: string;
  notes?: string;
}

export const PEOPLE_GROUPS = [
  'Family',
  'School Friends',
  'College',
  'Workplace 1',
  'Workplace 2',
  'Neighbourhood',
  'Other',
] as const;

export type PeopleGroupName = (typeof PEOPLE_GROUPS)[number];

// ──────────────────────────────────────────────────────────────────────────────

/** Data for applying a starter pack (categories + KPIs). Duplicates are skipped. */
export interface TemplatePackPayload {
  categories: string[];
  kpis: {
    name: string;
    category: string;
    target: number;
    unit: string;
    weight: number;
  }[];
}

/** One saved daily log: actuals keyed by KPI id, score for that day. */
export interface DayEntry extends EntityMetadata {
  date: string;
  actuals: Record<string, string>;
  notes?: Record<string, string>;
  totalScore: number;
}

export interface ManagedEntry extends EntityMetadata {
  kpiId: string;
  date: string;
  actual: string;
  notes?: string;
}

export interface EntryMutationResult {
  success: boolean;
  error?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createEntityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEntityMetadata(prefix: string, id?: string): EntityMetadata {
  const timestamp = nowIso();
  const nextId = id ?? createEntityId(prefix);

  return {
    id: nextId,
    stableId: nextId,
    createdAt: timestamp,
    updatedAt: timestamp,
    archived: false,
    version: ENTITY_SCHEMA_VERSION,
  };
}

function ensureEntityMetadata<T extends { id?: string }>(
  entity: T,
  prefix: string,
  fallbackId?: string
): T & EntityMetadata {
  const metadata = entity as Partial<EntityMetadata>;
  const nextId = entity.id ?? fallbackId ?? createEntityId(prefix);
  const createdAt =
    typeof metadata.createdAt === 'string' && metadata.createdAt ? metadata.createdAt : nowIso();
  const updatedAt =
    typeof metadata.updatedAt === 'string' && metadata.updatedAt ? metadata.updatedAt : createdAt;
  const stableId =
    typeof metadata.stableId === 'string' && metadata.stableId ? metadata.stableId : nextId;
  const archived = typeof metadata.archived === 'boolean' ? metadata.archived : false;
  const version =
    typeof metadata.version === 'number' && Number.isFinite(metadata.version)
      ? metadata.version
      : ENTITY_SCHEMA_VERSION;

  return {
    ...entity,
    id: nextId,
    stableId,
    createdAt,
    updatedAt,
    archived,
    version,
  } as T & EntityMetadata;
}

function touchEntity<T extends EntityMetadata>(entity: T): T {
  return {
    ...entity,
    updatedAt: nowIso(),
    version: entity.version + 1,
  };
}

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local calendar date string for `daysAgo` (0 = today, 1 = yesterday, …). */
function dateKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Last 7 local days, oldest first (matches History / Weekly windows). */
function lastSevenDateKeysOldestFirst(): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    keys.push(dateKeyDaysAgo(i));
  }
  return keys;
}

function totalScoreFromActuals(kpis: KPI[], actuals: Record<string, string>): number {
  let total = 0;
  for (const kpi of kpis) {
    const actualValue = parseFloat(actuals[kpi.id] || '0');
    const safe = isNaN(actualValue) ? 0 : actualValue;
    let part = 0;
    if (kpi.target > 0) {
      part = (safe / kpi.target) * kpi.weight;
    }
    if (part > kpi.weight) {
      part = kpi.weight;
    }
    total += part;
  }
  if (total > 100) {
    total = 100;
  }
  return Math.round(total);
}

function parseManagedEntryId(entryId: string): { date: string; kpiId: string } | null {
  const separatorIndex = entryId.indexOf('::');
  if (separatorIndex <= 0) return null;

  return {
    date: entryId.slice(0, separatorIndex),
    kpiId: entryId.slice(separatorIndex + 2),
  };
}

function cleanNotesMap(notes?: Record<string, string>): Record<string, string> | undefined {
  if (!notes) return undefined;

  const next = Object.fromEntries(
    Object.entries(notes)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value.length > 0)
  );

  return Object.keys(next).length > 0 ? next : undefined;
}

function normalizeCategory(category: Partial<Category>): Category {
  return ensureEntityMetadata(
    {
      name: category.name?.trim() || 'Untitled Category',
      ...category,
    },
    'category'
  );
}

function normalizeKpi(kpi: Partial<KPI>): KPI {
  return ensureEntityMetadata(
    {
      name: kpi.name?.trim() || 'Untitled KPI',
      category: kpi.category?.trim() || 'Other',
      target: typeof kpi.target === 'number' ? kpi.target : 0,
      unit: kpi.unit ?? '',
      weight: typeof kpi.weight === 'number' ? kpi.weight : 0,
      ...kpi,
    },
    'kpi'
  );
}

function normalizeSubtask(subtask: Partial<Subtask>): Subtask {
  return ensureEntityMetadata(
    {
      kpiId: subtask.kpiId ?? '',
      name: subtask.name?.trim() || 'Untitled Activity',
      frequency: subtask.frequency ?? 'weekly',
      targetCount: typeof subtask.targetCount === 'number' ? subtask.targetCount : 1,
      ...subtask,
    },
    'activity'
  );
}

function normalizeDayEntry(entry: Partial<DayEntry>): DayEntry {
  const date = entry.date?.trim() || todayYMD();

  return ensureEntityMetadata(
    {
      date,
      actuals: entry.actuals ?? {},
      notes: cleanNotesMap(entry.notes),
      totalScore: typeof entry.totalScore === 'number' ? entry.totalScore : 0,
      ...entry,
    },
    'entry',
    entry.id ?? `entry-${date}`
  );
}

const SAMPLE_KP_IDS = {
  sleep: 'sample-k-sleep',
  workout: 'sample-k-workout',
  deepWork: 'sample-k-deep-work',
  reading: 'sample-k-reading',
  savings: 'sample-k-savings',
} as const;

const SAMPLE_CATEGORIES: Category[] = [
  normalizeCategory({ id: 'sample-c-health', name: 'Health' }),
  normalizeCategory({ id: 'sample-c-career', name: 'Career' }),
  normalizeCategory({ id: 'sample-c-learning', name: 'Learning' }),
  normalizeCategory({ id: 'sample-c-finance', name: 'Finance' }),
];

const SAMPLE_KPIS: KPI[] = [
  normalizeKpi({
    id: SAMPLE_KP_IDS.sleep,
    name: 'Sleep',
    category: 'Health',
    target: 8,
    unit: 'hours',
    weight: 25,
  }),
  normalizeKpi({
    id: SAMPLE_KP_IDS.workout,
    name: 'Workout',
    category: 'Health',
    target: 30,
    unit: 'min',
    weight: 15,
  }),
  normalizeKpi({
    id: SAMPLE_KP_IDS.deepWork,
    name: 'Deep Work',
    category: 'Career',
    target: 4,
    unit: 'hours',
    weight: 25,
  }),
  normalizeKpi({
    id: SAMPLE_KP_IDS.reading,
    name: 'Reading',
    category: 'Learning',
    target: 30,
    unit: 'min',
    weight: 15,
  }),
  normalizeKpi({
    id: SAMPLE_KP_IDS.savings,
    name: 'Savings Check',
    category: 'Finance',
    target: 1,
    unit: 'yes/no',
    weight: 20,
  }),
];

/** One row per day (oldest → newest): realistic inputs; scores end up varied. */
const SAMPLE_DAY_INPUTS: Record<keyof typeof SAMPLE_KP_IDS, string>[] = [
  { sleep: '6', workout: '12', deepWork: '2', reading: '8', savings: '0' },
  { sleep: '7', workout: '20', deepWork: '2.5', reading: '15', savings: '1' },
  { sleep: '5.5', workout: '10', deepWork: '1.5', reading: '5', savings: '0' },
  { sleep: '8', workout: '30', deepWork: '4', reading: '28', savings: '1' },
  { sleep: '6.5', workout: '18', deepWork: '3', reading: '20', savings: '1' },
  { sleep: '7.5', workout: '25', deepWork: '3.5', reading: '22', savings: '0' },
  { sleep: '8', workout: '28', deepWork: '3', reading: '30', savings: '1' },
];

interface AppDataContextType {
  categories: Category[];
  kpis: KPI[];
  entries: DayEntry[];
  latestActuals: Record<string, string>;
  latestScore: number | null;
  // ─── NEW ───
  subtasks: Subtask[];
  subtaskLogs: SubtaskLog[];
  addSubtask: (subtask: EntityInput<Subtask>) => Subtask;
  updateSubtask: (subtask: Subtask) => void;
  deleteSubtask: (id: string) => void;
  toggleSubtaskLog: (subtaskId: string, date: string) => void;
  // ─── People To-dos ───
  peopleTodos: PeopleTodo[];
  addPeopleTodo: (peopleTodo: EntityInput<PeopleTodo>) => void;
  deletePeopleTodo: (id: string) => void;
  getPeopleTodosForKpi: (kpiId: string) => PeopleTodo[];
  // ──────────────────────
  personActivities: PersonActivity[];
  addPersonActivity: (activity: Omit<PersonActivity, 'id'>) => void;
  deletePersonActivity: (activityId: string) => void;
  getActivitiesForPerson: (personId: string) => PersonActivity[];
  // ─── Person To-Dos ───
  personTodos: PersonTodo[];
  addPersonTodo: (todo: Omit<PersonTodo, 'id'>) => PersonTodo;
  updatePersonTodo: (todo: PersonTodo) => void;
  deletePersonTodo: (todoId: string) => void;
  togglePersonTodo: (todoId: string) => void;
  getTodosForPerson: (personId: string) => PersonTodo[];
  // ──────────────────────
  addCategory: (name: string) => void;
  updateCategory: (id: string, newName: string) => void;
  addKPI: (kpi: {
    name: string;
    category: string;
    target: number;
    unit: string;
    weight: number;
  }) => KPI;
  updateKPI: (updatedKpi: KPI) => void;
  deleteKPI: (id: string) => void;
  deleteCategory: (id: string) => boolean;
  saveEntry: (
    actuals: Record<string, string>,
    totalScore: number,
    notes?: Record<string, string>
  ) => void;
  createEntry: (entry: EntityInput<ManagedEntry>) => EntryMutationResult;
  updateEntry: (
    entryId: string,
    updates: Partial<Pick<ManagedEntry, 'date' | 'actual' | 'notes'>>
  ) => EntryMutationResult;
  deleteEntry: (entryId: string) => EntryMutationResult;
  duplicateEntry: (
    entryId: string,
    overrides?: Partial<Pick<ManagedEntry, 'date' | 'actual' | 'notes'>>
  ) => EntryMutationResult;
  applyTemplatePack: (pack: TemplatePackPayload) => void;
  applyLifeLibraryPack: (pack: LifeLibraryPackApplyPayload) => void;
  // ─── NEW: Contacts ───
  savedContacts: SavedContact[];
  addSavedContact: (contact: Omit<SavedContact, 'id'>) => void;
  deleteSavedContact: (id: string) => void;
  getContactsForKpi: (kpiId: string) => SavedContact[];
  // ──────────────────────
  // ─── People CRM ───
  people: Person[];
  addPerson: (person: Omit<Person, 'id'>) => Person;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string) => void;
  getRelationshipsScore: (personId: string) => number;
  // ──────────────────
  loadSampleData: () => void;
  clearAllData: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [latestActuals, setLatestActuals] = useState<Record<string, string>>({});
  const [latestScore, setLatestScore] = useState<number | null>(null);
  // ─── NEW ───
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtaskLogs, setSubtaskLogs] = useState<SubtaskLog[]>([]);
  const [savedContacts, setSavedContacts] = useState<SavedContact[]>([]);
  const [peopleTodos, setPeopleTodos] = useState<PeopleTodo[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [personActivities, setPersonActivities] = useState<PersonActivity[]>([]);
  const [personTodos, setPersonTodos] = useState<PersonTodo[]>([]);
  // ──────────
  const [isHydrated, setIsHydrated] = useState(false);

  const syncLatestEntryState = (nextEntries: DayEntry[]) => {
    if (nextEntries.length === 0) {
      setLatestActuals({});
      setLatestScore(null);
      return;
    }

    const latestEntry = [...nextEntries].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    setLatestActuals(latestEntry?.actuals ?? {});
    setLatestScore(latestEntry?.totalScore ?? null);
  };

  // ─── Load all data from AsyncStorage on mount ──────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      console.log('loading data starts');
      try {
        const savedCategories = await AsyncStorage.getItem('categories');
        if (savedCategories) {
          setCategories((JSON.parse(savedCategories) as Partial<Category>[]).map(normalizeCategory));
        }
        const savedKpis = await AsyncStorage.getItem('kpis');
        if (savedKpis) {
          setKpis((JSON.parse(savedKpis) as Partial<KPI>[]).map(normalizeKpi));
        }
        const savedEntries = await AsyncStorage.getItem('entries');
        if (savedEntries) {
          setEntries((JSON.parse(savedEntries) as Partial<DayEntry>[]).map(normalizeDayEntry));
        }
        const savedLatestActuals = await AsyncStorage.getItem('latestActuals');
        if (savedLatestActuals) {
          setLatestActuals(JSON.parse(savedLatestActuals));
        }
        const savedLatestScore = await AsyncStorage.getItem('latestScore');
        if (savedLatestScore !== null) {
          const parsed = JSON.parse(savedLatestScore);
          setLatestScore(typeof parsed === 'number' ? parsed : null);
        }
        // ─── NEW: load subtasks and subtaskLogs ───
        const savedSubtasks = await AsyncStorage.getItem('subtasks');
        if (savedSubtasks) {
          setSubtasks((JSON.parse(savedSubtasks) as Partial<Subtask>[]).map(normalizeSubtask));
        }
        const savedSubtaskLogs = await AsyncStorage.getItem('subtaskLogs');
        if (savedSubtaskLogs) {
          setSubtaskLogs(JSON.parse(savedSubtaskLogs));
        }
        const savedContactsData = await AsyncStorage.getItem('savedContacts');
        if (savedContactsData) {
          setSavedContacts(JSON.parse(savedContactsData));
        }
        const savedPeopleTodos = await AsyncStorage.getItem('peopleTodos');
        if (savedPeopleTodos) {
          setPeopleTodos(JSON.parse(savedPeopleTodos));
        }
        const savedPeople = await AsyncStorage.getItem('people');
        if (savedPeople) {
          const parsedPeople = JSON.parse(savedPeople) as Partial<Person>[];
          setPeople(
            parsedPeople.map((person) => ({
              id: person.id ?? `person-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              name: person.name ?? 'Unknown',
              relationshipType: person.relationshipType ?? 'Other',
              groupName:
                typeof person.groupName === 'string' && person.groupName.trim()
                  ? person.groupName.trim()
                  : 'Other',
              phone: person.phone,
              notes: person.notes,
              lastContactDate: person.lastContactDate,
            }))
          );
        }

        const savedPersonActivities = await AsyncStorage.getItem('personActivities');
        if (savedPersonActivities) {
          setPersonActivities(JSON.parse(savedPersonActivities));
        }
        const savedPersonTodos = await AsyncStorage.getItem('personTodos');
        if (savedPersonTodos) {
          setPersonTodos(JSON.parse(savedPersonTodos));
        }
        // ─────────────────────────────────────────
      } catch (error) {
        console.error('Error loading data from AsyncStorage', error);
      }
      console.log('loading data finishes');
      setIsHydrated(true);
    };
    loadData();
  }, []);

  // ─── Persist existing data ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isHydrated) return;
    const saveCategories = async () => {
      console.log('saving categories:', categories);
      try {
        await AsyncStorage.setItem('categories', JSON.stringify(categories));
      } catch (error) {
        console.error('Error saving categories to AsyncStorage', error);
      }
    };
    saveCategories();
  }, [categories, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const saveKpis = async () => {
      console.log('saving kpis:', kpis);
      try {
        await AsyncStorage.setItem('kpis', JSON.stringify(kpis));
      } catch (error) {
        console.error('Error saving kpis to AsyncStorage', error);
      }
    };
    saveKpis();
  }, [kpis, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const saveEntries = async () => {
      try {
        await AsyncStorage.setItem('entries', JSON.stringify(entries));
      } catch (error) {
        console.error('Error saving entries to AsyncStorage', error);
      }
    };
    saveEntries();
  }, [entries, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const saveLatestActuals = async () => {
      try {
        await AsyncStorage.setItem('latestActuals', JSON.stringify(latestActuals));
      } catch (error) {
        console.error('Error saving latestActuals to AsyncStorage', error);
      }
    };
    saveLatestActuals();
  }, [latestActuals, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const saveLatestScore = async () => {
      try {
        await AsyncStorage.setItem('latestScore', JSON.stringify(latestScore));
      } catch (error) {
        console.error('Error saving latestScore to AsyncStorage', error);
      }
    };
    saveLatestScore();
  }, [latestScore, isHydrated]);

  // ─── NEW: Persist subtasks and subtaskLogs ─────────────────────────────────

  useEffect(() => {
    if (!isHydrated) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem('subtasks', JSON.stringify(subtasks));
      } catch (error) {
        console.error('Error saving subtasks to AsyncStorage', error);
      }
    };
    save();
  }, [subtasks, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem('subtaskLogs', JSON.stringify(subtaskLogs));
      } catch (error) {
        console.error('Error saving subtaskLogs to AsyncStorage', error);
      }
    };
    save();
  }, [subtaskLogs, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem('savedContacts', JSON.stringify(savedContacts));
      } catch (error) {
        console.error('Error saving savedContacts to AsyncStorage', error);
      }
    };
    save();
  }, [savedContacts, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem('peopleTodos', JSON.stringify(peopleTodos));
      } catch (error) {
        console.error('Error saving peopleTodos to AsyncStorage', error);
      }
    };
    save();
  }, [peopleTodos, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem('personActivities', JSON.stringify(personActivities));
      } catch (error) {
        console.error('Error saving personActivities to AsyncStorage', error);
      }
    };
    save();
  }, [personActivities, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem('personTodos', JSON.stringify(personTodos));
      } catch (error) {
        console.error('Error saving personTodos to AsyncStorage', error);
      }
    };
    save();
  }, [personTodos, isHydrated]);

  // ──────────────────────────────────────────────────────────────────────────

  const saveEntry = (
    actuals: Record<string, string>,
    totalScore: number,
    notes?: Record<string, string>
  ) => {
    const date = todayYMD();
    const roundedScore = Math.round(totalScore);

    setEntries((prev) => {
      const index = prev.findIndex((e) => e.date === date);
      const previousEntry = index >= 0 ? prev[index] : undefined;
      const nextEntry = normalizeDayEntry({
        ...(previousEntry ? touchEntity(previousEntry) : createEntityMetadata('entry')),
        id: previousEntry?.id,
        date,
        actuals: { ...actuals },
        notes: cleanNotesMap(notes),
        totalScore: roundedScore,
      });
      const nextEntries =
        index >= 0
          ? prev.map((e, i) => (i === index ? nextEntry : e))
          : [...prev, nextEntry];

      syncLatestEntryState(nextEntries);
      return nextEntries;
    });

    void emitDomainEvent({
      eventName: 'ENTRY_LOGGED',
      entityType: 'entry',
      entityId: date,
      metadata: { kpiCount: Object.keys(actuals).length, totalScore: roundedScore },
    });
    void appendAuditEntry({
      action: 'ENTRY_LOGGED',
      entityType: 'entry',
      entityId: date,
      after: { actuals, totalScore: roundedScore, notes: cleanNotesMap(notes) ?? null },
    });
  };

  const createEntry = (entry: EntityInput<ManagedEntry>): EntryMutationResult => {
    const trimmedDate = entry.date.trim();
    const trimmedActual = entry.actual.trim();
    const trimmedNotes = entry.notes?.trim();
    const kpi = kpis.find((item) => item.id === entry.kpiId);

    if (!kpi) return { success: false, error: 'Please select a valid KPI.' };
    if (!trimmedDate) return { success: false, error: 'Please enter a date.' };
    if (!trimmedActual) return { success: false, error: 'Please enter an actual value.' };
    if (Number.isNaN(parseFloat(trimmedActual))) {
      return { success: false, error: 'Actual value must be numeric.' };
    }

    const existingDay = entries.find((dayEntry) => dayEntry.date === trimmedDate);
    if (existingDay?.actuals[entry.kpiId] !== undefined && existingDay.actuals[entry.kpiId] !== '') {
      return { success: false, error: 'This KPI already has an entry for that date.' };
    }

    setEntries((prev) => {
      const dayIndex = prev.findIndex((dayEntry) => dayEntry.date === trimmedDate);
      const targetDay = dayIndex >= 0 ? prev[dayIndex] : undefined;
      const nextActuals = {
        ...(targetDay?.actuals ?? {}),
        [entry.kpiId]: trimmedActual,
      };
      const nextNotes = cleanNotesMap({
        ...(targetDay?.notes ?? {}),
        [entry.kpiId]: trimmedNotes ?? '',
      });
      const nextDay = normalizeDayEntry({
        ...(targetDay ? touchEntity(targetDay) : createEntityMetadata('entry')),
        id: targetDay?.id,
        date: trimmedDate,
        actuals: nextActuals,
        notes: nextNotes,
        totalScore: totalScoreFromActuals(kpis, nextActuals),
      });

      const nextEntries =
        dayIndex >= 0
          ? prev.map((dayEntry, index) => (index === dayIndex ? nextDay : dayEntry))
          : [...prev, nextDay];

      syncLatestEntryState(nextEntries);
      return nextEntries;
    });

    void emitDomainEvent({
      eventName: 'ENTRY_LOGGED',
      entityType: 'entry',
      entityId: `${trimmedDate}::${entry.kpiId}`,
      metadata: { date: trimmedDate, kpiId: entry.kpiId },
    });
    void appendAuditEntry({
      action: 'ENTRY_CREATED',
      entityType: 'entry',
      entityId: `${trimmedDate}::${entry.kpiId}`,
      after: { date: trimmedDate, kpiId: entry.kpiId, actual: trimmedActual, notes: trimmedNotes ?? null },
    });

    return { success: true };
  };

  const updateEntry = (
    entryId: string,
    updates: Partial<Pick<ManagedEntry, 'date' | 'actual' | 'notes'>>
  ): EntryMutationResult => {
    const parsed = parseManagedEntryId(entryId);
    if (!parsed) return { success: false, error: 'Could not find that entry.' };

    const sourceDay = entries.find((entry) => entry.date === parsed.date);
    const currentActual = sourceDay?.actuals[parsed.kpiId];
    if (!sourceDay || currentActual === undefined || currentActual === '') {
      return { success: false, error: 'Could not find that entry.' };
    }

    const nextDate = updates.date?.trim() || parsed.date;
    const nextActual = updates.actual?.trim() ?? currentActual;
    const nextNotes = updates.notes?.trim() ?? sourceDay.notes?.[parsed.kpiId] ?? '';

    if (!nextDate) return { success: false, error: 'Please enter a date.' };
    if (!nextActual) return { success: false, error: 'Please enter an actual value.' };
    if (Number.isNaN(parseFloat(nextActual))) {
      return { success: false, error: 'Actual value must be numeric.' };
    }

    if (nextDate !== parsed.date) {
      const targetDay = entries.find((entry) => entry.date === nextDate);
      if (targetDay?.actuals[parsed.kpiId] !== undefined && targetDay.actuals[parsed.kpiId] !== '') {
        return { success: false, error: 'This KPI already has an entry for that date.' };
      }
    }

    setEntries((prev) => {
      const nextEntries: DayEntry[] = [];

      prev.forEach((dayEntry) => {
        if (dayEntry.date === parsed.date) {
          const nextActuals = { ...dayEntry.actuals };
          const nextNotesMap = { ...(dayEntry.notes ?? {}) };

          delete nextActuals[parsed.kpiId];
          delete nextNotesMap[parsed.kpiId];

          if (Object.keys(nextActuals).length > 0) {
            nextEntries.push(normalizeDayEntry({
              ...touchEntity(dayEntry),
              actuals: nextActuals,
              notes: cleanNotesMap(nextNotesMap),
              totalScore: totalScoreFromActuals(kpis, nextActuals),
            }));
          }
          return;
        }

        nextEntries.push(dayEntry);
      });

      const targetIndex = nextEntries.findIndex((dayEntry) => dayEntry.date === nextDate);
      const targetDay = targetIndex >= 0 ? nextEntries[targetIndex] : undefined;
      const mergedActuals = {
        ...(targetDay?.actuals ?? {}),
        [parsed.kpiId]: nextActual,
      };
      const mergedNotes = cleanNotesMap({
        ...(targetDay?.notes ?? {}),
        [parsed.kpiId]: nextNotes,
      });
      const nextDay = normalizeDayEntry({
        ...(targetDay ? touchEntity(targetDay) : createEntityMetadata('entry')),
        id: targetDay?.id,
        date: nextDate,
        actuals: mergedActuals,
        notes: mergedNotes,
        totalScore: totalScoreFromActuals(kpis, mergedActuals),
      });

      const mergedEntries =
        targetIndex >= 0
          ? nextEntries.map((dayEntry, index) => (index === targetIndex ? nextDay : dayEntry))
          : [...nextEntries, nextDay];

      syncLatestEntryState(mergedEntries);
      return mergedEntries;
    });

    return { success: true };
  };

  const deleteEntry = (entryId: string): EntryMutationResult => {
    const parsed = parseManagedEntryId(entryId);
    if (!parsed) return { success: false, error: 'Could not find that entry.' };

    const sourceDay = entries.find((entry) => entry.date === parsed.date);
    if (!sourceDay || sourceDay.actuals[parsed.kpiId] === undefined || sourceDay.actuals[parsed.kpiId] === '') {
      return { success: false, error: 'Could not find that entry.' };
    }

    setEntries((prev) => {
      const nextEntries = prev.flatMap((dayEntry) => {
        if (dayEntry.date !== parsed.date) return [dayEntry];

        const nextActuals = { ...dayEntry.actuals };
        const nextNotes = { ...(dayEntry.notes ?? {}) };
        delete nextActuals[parsed.kpiId];
        delete nextNotes[parsed.kpiId];

        if (Object.keys(nextActuals).length === 0) return [];

        return [
          normalizeDayEntry({
            ...touchEntity(dayEntry),
            actuals: nextActuals,
            notes: cleanNotesMap(nextNotes),
            totalScore: totalScoreFromActuals(kpis, nextActuals),
          }),
        ];
      });

      syncLatestEntryState(nextEntries);
      return nextEntries;
    });

    return { success: true };
  };

  const duplicateEntry = (
    entryId: string,
    overrides?: Partial<Pick<ManagedEntry, 'date' | 'actual' | 'notes'>>
  ): EntryMutationResult => {
    const parsed = parseManagedEntryId(entryId);
    if (!parsed) return { success: false, error: 'Could not find that entry.' };

    const sourceDay = entries.find((entry) => entry.date === parsed.date);
    const sourceActual = sourceDay?.actuals[parsed.kpiId];
    if (!sourceDay || sourceActual === undefined || sourceActual === '') {
      return { success: false, error: 'Could not find that entry.' };
    }

    return createEntry({
      kpiId: parsed.kpiId,
      date: overrides?.date?.trim() || todayYMD(),
      actual: overrides?.actual?.trim() || sourceActual,
      notes: overrides?.notes ?? sourceDay.notes?.[parsed.kpiId] ?? '',
    });
  };

  const addCategory = (name: string) => {
    const newCategory = normalizeCategory({
      ...createEntityMetadata('category'),
      name: name.trim(),
    });
    setCategories(prev => [...prev, newCategory]);
    void emitDomainEvent({
      eventName: 'CATEGORY_CREATED',
      entityType: 'category',
      entityId: newCategory.id,
      metadata: { name: newCategory.name },
    });
    void appendAuditEntry({
      action: 'CATEGORY_CREATED',
      entityType: 'category',
      entityId: newCategory.id,
      after: newCategory,
    });
  };

  const updateCategory = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const cat = categories.find((c) => c.id === id);
    if (!cat) return;

    const oldName = cat.name;

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? normalizeCategory({ ...touchEntity(c), name: trimmed }) : c))
    );

    setKpis((prev) =>
      prev.map((k) =>
        k.category === oldName ? normalizeKpi({ ...touchEntity(k), category: trimmed }) : k
      )
    );
  };

  const addKPI = (kpi: {
    name: string;
    category: string;
    target: number;
    unit: string;
    weight: number;
  }): KPI => {
    console.log('addKPI called with', kpi);
    const newKPI = normalizeKpi({
      ...createEntityMetadata('kpi'),
      ...kpi,
    });
    console.log('newKPI:', newKPI);
    setKpis(prev => [...prev, newKPI]);
    void emitDomainEvent({
      eventName: 'KPI_CREATED',
      entityType: 'kpi',
      entityId: newKPI.id,
      metadata: { name: newKPI.name, category: newKPI.category },
    });
    void appendAuditEntry({
      action: 'KPI_CREATED',
      entityType: 'kpi',
      entityId: newKPI.id,
      after: newKPI,
    });
    return newKPI;
  };

  const updateKPI = (updatedKpi: KPI) => {
    setKpis((prev) =>
      prev.map((k) => (k.id === updatedKpi.id ? normalizeKpi(touchEntity(updatedKpi)) : k))
    );
  };

  const deleteKPI = (id: string) => {
    setKpis(prev => prev.filter(k => k.id !== id));
    // Also clean up orphaned subtasks when a KPI is deleted
    setSubtasks(prev => prev.filter(s => s.kpiId !== id));
  };

  const deleteCategory = (id: string): boolean => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return false;
    const hasLinkedKpis = kpis.some((k) => k.category === cat.name);
    if (hasLinkedKpis) return false;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  // ─── NEW: Subtask CRUD ─────────────────────────────────────────────────────

  const addSubtask = (subtask: EntityInput<Subtask>): Subtask => {
    const newSubtask = normalizeSubtask({
      ...createEntityMetadata('activity'),
      ...subtask,
    });
    setSubtasks(prev => [...prev, newSubtask]);
    void emitDomainEvent({
      eventName: 'ACTIVITY_CREATED',
      entityType: 'activity',
      entityId: newSubtask.id,
      metadata: { kpiId: newSubtask.kpiId, name: newSubtask.name },
    });
    void appendAuditEntry({
      action: 'ACTIVITY_CREATED',
      entityType: 'activity',
      entityId: newSubtask.id,
      after: newSubtask,
    });
    return newSubtask;
  };

  const updateSubtask = (updated: Subtask) => {
    setSubtasks(prev =>
      prev.map((s) => (s.id === updated.id ? normalizeSubtask(touchEntity(updated)) : s))
    );
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
    // Clean up logs for the deleted subtask
    setSubtaskLogs(prev => prev.filter(l => l.subtaskId !== id));
  };

  /** Toggle a subtask's completed state for a given date. Creates or flips the log. */
  const toggleSubtaskLog = (subtaskId: string, date: string) => {
    const existing = subtaskLogs.find(l => l.subtaskId === subtaskId && l.date === date);
    const willComplete = existing ? !existing.completed : true;
    setSubtaskLogs(prev => {
      const existing = prev.find(l => l.subtaskId === subtaskId && l.date === date);
      if (existing) {
        return prev.map(l =>
          l.subtaskId === subtaskId && l.date === date
            ? { ...l, completed: !l.completed }
            : l
        );
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${subtaskId}`,
          subtaskId,
          date,
          completed: true,
        },
      ];
    });
    if (willComplete) {
      void emitDomainEvent({
        eventName: 'ACTIVITY_COMPLETED',
        entityType: 'activity',
        entityId: subtaskId,
        metadata: { date },
      });
      void appendAuditEntry({
        action: 'ACTIVITY_COMPLETED',
        entityType: 'activity',
        entityId: subtaskId,
        after: { date, completed: true },
      });
    }
  };

  // ─── NEW: People To-dos ─────────────────────────────────────────────────────

  const addPeopleTodo = (peopleTodo: EntityInput<PeopleTodo>) => {
    const newTodo: PeopleTodo = {
      ...createEntityMetadata('activity'),
      ...peopleTodo,
    };
    setPeopleTodos(prev => [...prev, newTodo]);
  };

  const deletePeopleTodo = (id: string) => {
    setPeopleTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const getPeopleTodosForKpi = (kpiId: string) => peopleTodos.filter(todo => todo.kpiId === kpiId);

  const addPersonActivity = (activity: Omit<PersonActivity, 'id'>) => {
    const newActivity: PersonActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ...activity,
    };
    setPersonActivities(prev => [...prev, newActivity]);
  };

  const deletePersonActivity = (activityId: string) => {
    setPersonActivities(prev => prev.filter((activity) => activity.id !== activityId));
  };

  const getActivitiesForPerson = (personId: string) =>
    personActivities
      .filter((activity) => activity.personId === personId)
      .sort((a, b) => b.date.localeCompare(a.date));

  const addPersonTodo = (todo: Omit<PersonTodo, 'id'>): PersonTodo => {
    const newTodo: PersonTodo = {
      id: `perstodo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ...todo,
    };
    setPersonTodos(prev => [...prev, newTodo]);
    return newTodo;
  };

  const updatePersonTodo = (todo: PersonTodo) => {
    setPersonTodos(prev => prev.map(t => (t.id === todo.id ? todo : t)));
  };

  const deletePersonTodo = (todoId: string) => {
    setPersonTodos(prev => prev.filter(t => t.id !== todoId));
  };

  const togglePersonTodo = (todoId: string) => {
    setPersonTodos(prev =>
      prev.map(t => {
        if (t.id === todoId) {
          return {
            ...t,
            completed: !t.completed,
            completedDate: !t.completed ? todayYMD() : undefined,
          };
        }
        return t;
      })
    );
  };

  const getTodosForPerson = (personId: string): PersonTodo[] =>
    personTodos
      .filter(t => t.personId === personId)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (b.dueDate || '').localeCompare(a.dueDate || '');
      });

  // ──────────────────────────────────────────────────────────────────────────

  const addSavedContact = (contact: Omit<SavedContact, 'id'>) => {
    const newContact: SavedContact = {
      ...contact,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
    setSavedContacts(prev => [...prev, newContact]);
  };

  const deleteSavedContact = (id: string) => {
    setSavedContacts(prev => prev.filter(c => c.id !== id));
  };

  const getContactsForKpi = (kpiId: string): SavedContact[] => {
    return savedContacts.filter(c => c.kpiId === kpiId);
  };

  // ──────────────────────────────────────────────────────────────────────────

  const applyLifeLibraryPack = (pack: LifeLibraryPackApplyPayload) => {
    const categoryMap = new Map(
      categories.map((category) => [category.stableId || category.name.toLowerCase(), category])
    );
    const categoryNameMap = new Map(
      categories.map((category) => [category.name.toLowerCase(), category])
    );
    const nextCategories = [...categories];

    for (const category of pack.categories) {
      const existing =
        categoryMap.get(category.stableId) ?? categoryNameMap.get(category.name.toLowerCase());
      if (existing) {
        categoryMap.set(category.stableId, existing);
        continue;
      }

      const created = normalizeCategory({
        ...createEntityMetadata('category'),
        stableId: category.stableId,
        name: category.name,
      });
      nextCategories.push(created);
      categoryMap.set(category.stableId, created);
      categoryNameMap.set(created.name.toLowerCase(), created);
    }

    const kpiStableMap = new Map(kpis.map((kpi) => [kpi.stableId, kpi]));
    const kpiNameMap = new Map(
      kpis.map((kpi) => [`${kpi.category.toLowerCase()}::${kpi.name.toLowerCase()}`, kpi])
    );
    const nextKpis = [...kpis];

    for (const kpi of pack.kpis) {
      const categoryName =
        categoryMap.get(kpi.categoryStableId)?.name ??
        categoryNameMap.get(kpi.categoryName.toLowerCase())?.name ??
        kpi.categoryName;
      const lookupKey = `${categoryName.toLowerCase()}::${kpi.name.toLowerCase()}`;
      const existing = kpiStableMap.get(kpi.stableId) ?? kpiNameMap.get(lookupKey);
      if (existing) {
        kpiStableMap.set(kpi.stableId, existing);
        continue;
      }

      const created = normalizeKpi({
        ...createEntityMetadata('kpi'),
        stableId: kpi.stableId,
        name: kpi.name,
        category: categoryName,
        target: kpi.target,
        unit: kpi.unit,
        weight: kpi.weight,
      });
      nextKpis.push(created);
      kpiStableMap.set(kpi.stableId, created);
      kpiNameMap.set(lookupKey, created);
    }

    const subtaskStableMap = new Map(subtasks.map((subtask) => [subtask.stableId, subtask]));
    const subtaskNameMap = new Map(
      subtasks.map((subtask) => [`${subtask.kpiId}::${subtask.name.toLowerCase()}`, subtask])
    );
    const nextSubtasks = [...subtasks];

    for (const activity of pack.activities) {
      const parentKpi = kpiStableMap.get(activity.kpiStableId);
      if (!parentKpi) continue;

      const lookupKey = `${parentKpi.id}::${activity.name.toLowerCase()}`;
      const existing = subtaskStableMap.get(activity.stableId) ?? subtaskNameMap.get(lookupKey);
      if (existing) continue;

      const created = normalizeSubtask({
        ...createEntityMetadata('activity'),
        stableId: activity.stableId,
        kpiId: parentKpi.id,
        name: activity.name,
        frequency: activity.frequency,
        targetCount: activity.targetCount,
      });
      nextSubtasks.push(created);
      subtaskStableMap.set(activity.stableId, created);
      subtaskNameMap.set(lookupKey, created);
    }

    setCategories(nextCategories);
    setKpis(nextKpis);
    setSubtasks(nextSubtasks);
  };

  const applyTemplatePack = (pack: TemplatePackPayload) => {
    const seenCatKeys = new Set<string>();
    const categoryNamesInOrder: string[] = [];

    for (const raw of pack.categories) {
      const name = raw.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seenCatKeys.has(key)) continue;
      seenCatKeys.add(key);
      categoryNamesInOrder.push(name);
    }

    for (const k of pack.kpis) {
      const name = k.category.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seenCatKeys.has(key)) continue;
      seenCatKeys.add(key);
      categoryNamesInOrder.push(name);
    }

    const idStamp = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    let catIndex = 0;
    let kpiIndex = 0;

    setCategories((prev) => {
      const existingKeys = new Set(prev.map((c) => c.name.toLowerCase()));
      const next = [...prev];
      for (const name of categoryNamesInOrder) {
        const key = name.toLowerCase();
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        next.push(
          normalizeCategory({
            ...createEntityMetadata('category', `tpl-c-${idStamp}-${catIndex++}`),
            name,
          })
        );
      }
      return next;
    });

    setKpis((prev) => {
      const next = [...prev];
      for (const k of pack.kpis) {
        const name = k.name.trim();
        const cat = k.category.trim();
        if (!name || !cat) continue;
        const dup = next.some(
          (x) =>
            x.name.toLowerCase() === name.toLowerCase() &&
            x.category.toLowerCase() === cat.toLowerCase()
        );
        if (dup) continue;
        next.push(
          normalizeKpi({
            ...createEntityMetadata('kpi', `tpl-k-${idStamp}-${kpiIndex++}`),
            name,
            category: cat,
            target: k.target,
            unit: k.unit.trim(),
            weight: k.weight,
          })
        );
      }
      return next;
    });
  };

  const addPerson = (person: Omit<Person, 'id'>): Person => {
    const id = `person-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newPerson: Person = { ...person, id };
    setPeople((prev) => {
      const updated = [...prev, newPerson];
      AsyncStorage.setItem('people', JSON.stringify(updated)).catch((e) => 
        console.error('Error saving people', e)
      );
      return updated;
    });
    return newPerson;
  };

  const updatePerson = (person: Person) => {
    setPeople((prev) => {
      const updated = prev.map((p) => (p.id === person.id ? person : p));
      AsyncStorage.setItem('people', JSON.stringify(updated)).catch((e) => 
        console.error('Error saving people', e)
      );
      return updated;
    });
  };

  const deletePerson = (id: string) => {
    setPeople((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      AsyncStorage.setItem('people', JSON.stringify(updated)).catch((e) => 
        console.error('Error saving people', e)
      );
      return updated;
    });
  };

  const getRelationshipsScore = (personId: string): number => {
    const person = people.find((p) => p.id === personId);
    if (!person || !person.lastContactDate) return 0;
    
    const lastContact = new Date(person.lastContactDate);
    const today = new Date();
    const daysSinceContact = Math.floor(
      (today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const maxDays = 90;
    const score = Math.max(0, Math.round((1 - daysSinceContact / maxDays) * 100));
    return Math.min(100, score);
  };

  const loadSampleData = () => {
    const dates = lastSevenDateKeysOldestFirst();
    const sampleEntries: DayEntry[] = dates.map((date, index) => {
      const row = SAMPLE_DAY_INPUTS[index];
      const actuals: Record<string, string> = {
        [SAMPLE_KP_IDS.sleep]: row.sleep,
        [SAMPLE_KP_IDS.workout]: row.workout,
        [SAMPLE_KP_IDS.deepWork]: row.deepWork,
        [SAMPLE_KP_IDS.reading]: row.reading,
        [SAMPLE_KP_IDS.savings]: row.savings,
      };
      return normalizeDayEntry({
        ...createEntityMetadata('entry', `sample-entry-${date}`),
        date,
        actuals,
        totalScore: totalScoreFromActuals(SAMPLE_KPIS, actuals),
      });
    });

    const lastEntry = sampleEntries[sampleEntries.length - 1];

    setCategories(SAMPLE_CATEGORIES);
    setKpis(SAMPLE_KPIS);
    setEntries(sampleEntries);
    setLatestActuals({ ...lastEntry.actuals });
    setLatestScore(lastEntry.totalScore);
  };

  const clearAllData = () => {
    setCategories([]);
    setKpis([]);
    setEntries([]);
    setLatestActuals({});
    setLatestScore(null);
    setSubtasks([]);
    setSubtaskLogs([]);
    setSavedContacts([]);
    setPeopleTodos([]);
    setPeople([]);
    setPersonActivities([]);
    setPersonTodos([]);
    AsyncStorage.multiRemove([
      'categories',
      'kpis',
      'entries',
      'latestActuals',
      'latestScore',
      'subtasks',
      'subtaskLogs',
      'savedContacts',
      'peopleTodos',
      'people',
      'personActivities',
      'personTodos',
    ]).catch((err) => console.error('Error clearing AsyncStorage', err));
  };

  return (
    <AppDataContext.Provider
      value={{
        categories,
        kpis,
        entries,
        latestActuals,
        latestScore,
        subtasks,
        subtaskLogs,
        addSubtask,
        updateSubtask,
        deleteSubtask,
        toggleSubtaskLog,
        peopleTodos,
        addPeopleTodo,
        deletePeopleTodo,
        getPeopleTodosForKpi,
        savedContacts,
        addSavedContact,
        deleteSavedContact,
        getContactsForKpi,
        people,
        personActivities,
        addPersonActivity,
        deletePersonActivity,
        getActivitiesForPerson,
        personTodos,
        addPersonTodo,
        updatePersonTodo,
        deletePersonTodo,
        togglePersonTodo,
        getTodosForPerson,
        addPerson,
        updatePerson,
        deletePerson,
        getRelationshipsScore,
        addCategory,
        updateCategory,
        addKPI,
        updateKPI,
        deleteKPI,
        deleteCategory,
        saveEntry,
        createEntry,
        updateEntry,
        deleteEntry,
        duplicateEntry,
        applyTemplatePack,
        applyLifeLibraryPack,
        loadSampleData,
        clearAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
