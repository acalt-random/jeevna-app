import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface Category {
  id: string;
  name: string;
}

export interface KPI {
  id: string;
  name: string;
  category: string;
  target: number;
  unit: string;
  weight: number;
}

// ─── NEW: Subtask models ───────────────────────────────────────────────────────

export type SubtaskFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface Subtask {
  id: string;
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
export interface DayEntry {
  id: string;
  date: string;
  actuals: Record<string, string>;
  totalScore: number;
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

const SAMPLE_KP_IDS = {
  sleep: 'sample-k-sleep',
  workout: 'sample-k-workout',
  deepWork: 'sample-k-deep-work',
  reading: 'sample-k-reading',
  savings: 'sample-k-savings',
} as const;

const SAMPLE_CATEGORIES: Category[] = [
  { id: 'sample-c-health', name: 'Health' },
  { id: 'sample-c-career', name: 'Career' },
  { id: 'sample-c-learning', name: 'Learning' },
  { id: 'sample-c-finance', name: 'Finance' },
];

const SAMPLE_KPIS: KPI[] = [
  {
    id: SAMPLE_KP_IDS.sleep,
    name: 'Sleep',
    category: 'Health',
    target: 8,
    unit: 'hours',
    weight: 25,
  },
  {
    id: SAMPLE_KP_IDS.workout,
    name: 'Workout',
    category: 'Health',
    target: 30,
    unit: 'min',
    weight: 15,
  },
  {
    id: SAMPLE_KP_IDS.deepWork,
    name: 'Deep Work',
    category: 'Career',
    target: 4,
    unit: 'hours',
    weight: 25,
  },
  {
    id: SAMPLE_KP_IDS.reading,
    name: 'Reading',
    category: 'Learning',
    target: 30,
    unit: 'min',
    weight: 15,
  },
  {
    id: SAMPLE_KP_IDS.savings,
    name: 'Savings Check',
    category: 'Finance',
    target: 1,
    unit: 'yes/no',
    weight: 20,
  },
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
  addSubtask: (subtask: Omit<Subtask, 'id'>) => void;
  updateSubtask: (subtask: Subtask) => void;
  deleteSubtask: (id: string) => void;
  toggleSubtaskLog: (subtaskId: string, date: string) => void;
  // ─── People To-dos ───
  peopleTodos: PeopleTodo[];
  addPeopleTodo: (peopleTodo: Omit<PeopleTodo, 'id'>) => void;
  deletePeopleTodo: (id: string) => void;
  getPeopleTodosForKpi: (kpiId: string) => PeopleTodo[];
  // ──────────────────────
  addCategory: (name: string) => void;
  updateCategory: (id: string, newName: string) => void;
  addKPI: (kpi: { name: string; category: string; target: number; unit: string; weight: number }) => void;
  updateKPI: (updatedKpi: KPI) => void;
  deleteKPI: (id: string) => void;
  deleteCategory: (id: string) => boolean;
  saveEntry: (actuals: Record<string, string>, totalScore: number) => void;
  applyTemplatePack: (pack: TemplatePackPayload) => void;
  // ─── NEW: Contacts ───
  savedContacts: SavedContact[];
  addSavedContact: (contact: Omit<SavedContact, 'id'>) => void;
  deleteSavedContact: (id: string) => void;
  getContactsForKpi: (kpiId: string) => SavedContact[];
  // ──────────────────────
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
  // ──────────
  const [isHydrated, setIsHydrated] = useState(false);

  // ─── Load all data from AsyncStorage on mount ──────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      console.log('loading data starts');
      try {
        const savedCategories = await AsyncStorage.getItem('categories');
        if (savedCategories) {
          setCategories(JSON.parse(savedCategories));
        }
        const savedKpis = await AsyncStorage.getItem('kpis');
        if (savedKpis) {
          setKpis(JSON.parse(savedKpis));
        }
        const savedEntries = await AsyncStorage.getItem('entries');
        if (savedEntries) {
          setEntries(JSON.parse(savedEntries));
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
          setSubtasks(JSON.parse(savedSubtasks));
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

  // ──────────────────────────────────────────────────────────────────────────

  const saveEntry = (actuals: Record<string, string>, totalScore: number) => {
    const date = todayYMD();
    const roundedScore = Math.round(totalScore);

    setEntries((prev) => {
      const index = prev.findIndex((e) => e.date === date);
      const nextEntry: DayEntry = {
        id: index >= 0 ? prev[index].id : Date.now().toString(),
        date,
        actuals: { ...actuals },
        totalScore: roundedScore,
      };
      if (index >= 0) {
        return prev.map((e, i) => (i === index ? nextEntry : e));
      }
      return [...prev, nextEntry];
    });

    setLatestActuals({ ...actuals });
    setLatestScore(roundedScore);
  };

  const addCategory = (name: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: name.trim(),
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const cat = categories.find((c) => c.id === id);
    if (!cat) return;

    const oldName = cat.name;

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
    );

    setKpis((prev) =>
      prev.map((k) => (k.category === oldName ? { ...k, category: trimmed } : k))
    );
  };

  const addKPI = (kpi: { name: string; category: string; target: number; unit: string; weight: number }) => {
    console.log('addKPI called with', kpi);
    const newKPI: KPI = {
      id: Date.now().toString(),
      ...kpi,
    };
    console.log('newKPI:', newKPI);
    setKpis(prev => [...prev, newKPI]);
  };

  const updateKPI = (updatedKpi: KPI) => {
    setKpis((prev) => prev.map((k) => (k.id === updatedKpi.id ? updatedKpi : k)));
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

  const addSubtask = (subtask: Omit<Subtask, 'id'>) => {
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      ...subtask,
    };
    setSubtasks(prev => [...prev, newSubtask]);
  };

  const updateSubtask = (updated: Subtask) => {
    setSubtasks(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
    // Clean up logs for the deleted subtask
    setSubtaskLogs(prev => prev.filter(l => l.subtaskId !== id));
  };

  /** Toggle a subtask's completed state for a given date. Creates or flips the log. */
  const toggleSubtaskLog = (subtaskId: string, date: string) => {
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
  };

  // ─── NEW: People To-dos ─────────────────────────────────────────────────────

  const addPeopleTodo = (peopleTodo: Omit<PeopleTodo, 'id'>) => {
    const newTodo: PeopleTodo = {
      id: Date.now().toString(),
      ...peopleTodo,
    };
    setPeopleTodos(prev => [...prev, newTodo]);
  };

  const deletePeopleTodo = (id: string) => {
    setPeopleTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const getPeopleTodosForKpi = (kpiId: string) => peopleTodos.filter(todo => todo.kpiId === kpiId);

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
        next.push({ id: `tpl-c-${idStamp}-${catIndex++}`, name });
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
        next.push({
          id: `tpl-k-${idStamp}-${kpiIndex++}`,
          name,
          category: cat,
          target: k.target,
          unit: k.unit.trim(),
          weight: k.weight,
        });
      }
      return next;
    });
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
      return {
        id: `sample-entry-${date}`,
        date,
        actuals,
        totalScore: totalScoreFromActuals(SAMPLE_KPIS, actuals),
      };
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
        addCategory,
        updateCategory,
        addKPI,
        updateKPI,
        deleteKPI,
        deleteCategory,
        saveEntry,
        applyTemplatePack,
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
