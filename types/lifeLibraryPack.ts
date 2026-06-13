export interface LifeLibraryPack {
  id: string;
  stableId: string;
  titleKey: string;
  descriptionKey: string;
  categoryIds: string[];
  kpiIds: string[];
  activityIds: string[];
  ruleIds: string[];
  countryCodes: string[];
  localeCodes: string[];
  tags: string[];
  recommendedFor: string[];
  difficulty: 'easy' | 'medium' | 'advanced';
  estimatedSetupMinutes: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  version: number;
}

export interface LifeLibraryPackApplyPayload {
  stableId: string;
  categories: { stableId: string; name: string }[];
  kpis: {
    stableId: string;
    categoryStableId: string;
    categoryName: string;
    name: string;
    target: number;
    unit: string;
    weight: number;
  }[];
  activities: {
    stableId: string;
    kpiStableId: string;
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    targetCount: number;
  }[];
}
