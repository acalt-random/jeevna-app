export type IllustrationKey =
  | 'welcome'
  | 'emptyState'
  | 'lifeBuddy'
  | 'health'
  | 'finance'
  | 'relationships'
  | 'home'
  | 'vehicle'
  | 'pets'
  | 'success';

export const illustrationConfig: Record<
  IllustrationKey,
  { icon: string; accent: 'primary' | 'secondary' | 'success' }
> = {
  welcome: { icon: 'track-changes', accent: 'primary' },
  emptyState: { icon: 'inbox', accent: 'secondary' },
  lifeBuddy: { icon: 'explore', accent: 'primary' },
  health: { icon: 'favorite', accent: 'success' },
  finance: { icon: 'show-chart', accent: 'secondary' },
  relationships: { icon: 'favorite-border', accent: 'primary' },
  home: { icon: 'home', accent: 'secondary' },
  vehicle: { icon: 'two-wheeler', accent: 'secondary' },
  pets: { icon: 'pets', accent: 'success' },
  success: { icon: 'check-circle', accent: 'success' },
};
