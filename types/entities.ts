export const ENTITY_SCHEMA_VERSION = 1;

export interface EntityMetadata {
  id: string;
  stableId: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  version: number;
}

export interface Review extends EntityMetadata {
  title: string;
  summary?: string;
  categoryId?: string;
  reviewDate?: string;
}

export interface Insight extends EntityMetadata {
  title: string;
  summary?: string;
  categoryId?: string;
  source?: string;
}
