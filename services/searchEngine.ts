import { Category, KPI, Person, Subtask } from '@/context/AppDataContext';
import { TemplatePack } from '@/src/data/templatePacks';

export type SearchEntityType = 'category' | 'kpi' | 'activity' | 'relationship' | 'template';

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  keywords: string[];
  score: number;
  categoryName?: string;
  kpiId?: string;
  personId?: string;
  subtaskId?: string;
  templateId?: string;
}

export interface SearchIndexInput {
  categories: Category[];
  kpis: KPI[];
  subtasks: Subtask[];
  people: Person[];
  templates: TemplatePack[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function buildSearchText(parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function subsequenceScore(query: string, text: string): number {
  if (!query) return 0;
  let queryIndex = 0;
  let matched = 0;

  for (let i = 0; i < text.length && queryIndex < query.length; i += 1) {
    if (text[i] === query[queryIndex]) {
      matched += 1;
      queryIndex += 1;
    }
  }

  return queryIndex === query.length ? matched / Math.max(text.length, 1) : 0;
}

function scoreMatch(query: string, text: string, keywords: string[]): number {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  const normalizedText = normalize(text);
  if (normalizedText === normalizedQuery) return 140;
  if (normalizedText.startsWith(normalizedQuery)) return 120;
  if (normalizedText.includes(normalizedQuery)) return 95;

  for (const keyword of keywords) {
    const normalizedKeyword = normalize(keyword);
    if (normalizedKeyword === normalizedQuery) return 110;
    if (normalizedKeyword.startsWith(normalizedQuery)) return 92;
    if (normalizedKeyword.includes(normalizedQuery)) return 82;
  }

  const fuzzyScore = subsequenceScore(normalizedQuery, normalizedText);
  if (fuzzyScore > 0) {
    return Math.round(fuzzyScore * 70);
  }

  return 0;
}

export function buildSearchIndex(input: SearchIndexInput): SearchResult[] {
  const { categories, kpis, subtasks, people, templates } = input;

  const categoryResults: SearchResult[] = categories.map((category) => ({
    id: `category:${category.id}`,
    type: 'category',
    title: category.name,
    subtitle: 'Category',
    keywords: [category.name],
    score: 0,
    categoryName: category.name,
  }));

  const kpiResults: SearchResult[] = kpis.map((kpi) => ({
    id: `kpi:${kpi.id}`,
    type: 'kpi',
    title: kpi.name,
    subtitle: `${kpi.category} | target ${kpi.target} ${kpi.unit}`,
    keywords: [kpi.name, kpi.category, kpi.unit],
    score: 0,
    categoryName: kpi.category,
    kpiId: kpi.id,
  }));

  const kpiById = new Map(kpis.map((kpi) => [kpi.id, kpi]));
  const activityResults: SearchResult[] = subtasks.map((subtask) => {
    const parentKpi = kpiById.get(subtask.kpiId);
    return {
      id: `activity:${subtask.id}`,
      type: 'activity',
      title: subtask.name,
      subtitle: parentKpi
        ? `${parentKpi.category} | ${parentKpi.name} | ${subtask.frequency}`
        : subtask.frequency,
      keywords: [
        subtask.name,
        subtask.frequency,
        parentKpi?.name ?? '',
        parentKpi?.category ?? '',
      ],
      score: 0,
      categoryName: parentKpi?.category,
      kpiId: subtask.kpiId,
      subtaskId: subtask.id,
    };
  });

  const relationshipResults: SearchResult[] = people.map((person) => ({
    id: `relationship:${person.id}`,
    type: 'relationship',
    title: person.name,
    subtitle: `${person.relationshipType} | ${person.groupName}`,
    keywords: [person.name, person.relationshipType, person.groupName, person.notes ?? ''],
    score: 0,
    personId: person.id,
  }));

  const templateResults: SearchResult[] = templates.map((template) => ({
    id: `template:${template.id}`,
    type: 'template',
    title: template.title,
    subtitle: template.blurb,
    keywords: [
      template.title,
      template.blurb,
      ...template.categories,
      ...template.kpis.flatMap((kpi) => [kpi.name, kpi.category]),
    ],
    score: 0,
    templateId: template.id,
  }));

  return [
    ...categoryResults,
    ...kpiResults,
    ...activityResults,
    ...relationshipResults,
    ...templateResults,
  ];
}

export function searchEntities(query: string, searchIndex: SearchResult[]): SearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  return searchIndex
    .map((item) => {
      const score = scoreMatch(
        normalizedQuery,
        buildSearchText([item.title, item.subtitle]),
        item.keywords
      );
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      return left.title.localeCompare(right.title);
    });
}

export function groupSearchResults(results: SearchResult[]): Record<SearchEntityType, SearchResult[]> {
  return {
    category: results.filter((item) => item.type === 'category'),
    kpi: results.filter((item) => item.type === 'kpi'),
    activity: results.filter((item) => item.type === 'activity'),
    relationship: results.filter((item) => item.type === 'relationship'),
    template: results.filter((item) => item.type === 'template'),
  };
}
