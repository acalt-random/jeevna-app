import { Theme as NavigationTheme } from '@react-navigation/native';

export type ThemeId =
  | 'midnight-focus'
  | 'calm-blue'
  | 'warm-sunset'
  | 'forest-growth'
  | 'minimal-light'
  | 'premium-dark';

export type AppTheme = {
  id: ThemeId;
  name: string;
  isDark: boolean;
  background: string;
  secondaryBackground: string;
  cardBackground: string;
  cardBorder: string;
  primary: string;
  secondary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
  buttonPrimary: string;
  buttonSecondary: string;
  inputBackground: string;
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
};

const sharedShape = {
  borderRadius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
};

export const appThemes: Record<ThemeId, AppTheme> = {
  'midnight-focus': {
    id: 'midnight-focus',
    name: 'Midnight Focus',
    isDark: true,
    background: '#081120',
    secondaryBackground: '#0f1b33',
    cardBackground: '#13233d',
    cardBorder: '#243b63',
    primary: '#60a5fa',
    secondary: '#1d4ed8',
    accent: '#a78bfa',
    textPrimary: '#f8fbff',
    textSecondary: '#c5d4ec',
    textMuted: '#7e95b8',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#fb7185',
    buttonPrimary: '#2563eb',
    buttonSecondary: '#1e3a5f',
    inputBackground: '#0c1729',
    shadowColor: '#020817',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
    ...sharedShape,
  },
  'calm-blue': {
    id: 'calm-blue',
    name: 'Calm Blue',
    isDark: true,
    background: '#0d1824',
    secondaryBackground: '#152536',
    cardBackground: '#1b3146',
    cardBorder: '#2a4d68',
    primary: '#7dd3fc',
    secondary: '#0ea5e9',
    accent: '#c4b5fd',
    textPrimary: '#f4fbff',
    textSecondary: '#d2e8f3',
    textMuted: '#87a7bc',
    success: '#4ade80',
    warning: '#facc15',
    danger: '#f87171',
    buttonPrimary: '#0284c7',
    buttonSecondary: '#1e3a5f',
    inputBackground: '#132230',
    shadowColor: '#0a1622',
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 7,
    ...sharedShape,
  },
  'warm-sunset': {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    isDark: true,
    background: '#1a1120',
    secondaryBackground: '#2a1730',
    cardBackground: '#341d3c',
    cardBorder: '#5a325c',
    primary: '#fb923c',
    secondary: '#f97316',
    accent: '#f472b6',
    textPrimary: '#fff7f2',
    textSecondary: '#f0d8d0',
    textMuted: '#bc938f',
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#fb7185',
    buttonPrimary: '#ea580c',
    buttonSecondary: '#4b223f',
    inputBackground: '#261327',
    shadowColor: '#14080f',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 8,
    ...sharedShape,
  },
  'forest-growth': {
    id: 'forest-growth',
    name: 'Forest Growth',
    isDark: true,
    background: '#0d1712',
    secondaryBackground: '#15231c',
    cardBackground: '#1d3027',
    cardBorder: '#31523f',
    primary: '#4ade80',
    secondary: '#16a34a',
    accent: '#a3e635',
    textPrimary: '#f5fff7',
    textSecondary: '#d0e8d6',
    textMuted: '#84a58d',
    success: '#22c55e',
    warning: '#facc15',
    danger: '#f87171',
    buttonPrimary: '#15803d',
    buttonSecondary: '#21352a',
    inputBackground: '#13201a',
    shadowColor: '#09110d',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
    ...sharedShape,
  },
  'minimal-light': {
    id: 'minimal-light',
    name: 'Minimal Light',
    isDark: false,
    background: '#f6f8fb',
    secondaryBackground: '#eef2f7',
    cardBackground: '#ffffff',
    cardBorder: '#dbe4ef',
    primary: '#2563eb',
    secondary: '#1d4ed8',
    accent: '#7c3aed',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    buttonPrimary: '#2563eb',
    buttonSecondary: '#e2e8f0',
    inputBackground: '#f8fafc',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    ...sharedShape,
  },
  'premium-dark': {
    id: 'premium-dark',
    name: 'Premium Dark',
    isDark: true,
    background: '#0a0b0f',
    secondaryBackground: '#13151c',
    cardBackground: '#191c25',
    cardBorder: '#2a3140',
    primary: '#8b5cf6',
    secondary: '#6366f1',
    accent: '#22d3ee',
    textPrimary: '#fafaff',
    textSecondary: '#d6d9e2',
    textMuted: '#8b93a7',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#fb7185',
    buttonPrimary: '#7c3aed',
    buttonSecondary: '#202432',
    inputBackground: '#10131b',
    shadowColor: '#02040a',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 9,
    ...sharedShape,
  },
};

export const themeOptions = Object.values(appThemes);
export const defaultThemeId: ThemeId = 'midnight-focus';

export function getThemeById(themeId: ThemeId): AppTheme {
  return appThemes[themeId];
}

export function isThemeId(value: string): value is ThemeId {
  return value in appThemes;
}

export function createNavigationTheme(appTheme: AppTheme): NavigationTheme {
  return {
    dark: appTheme.isDark,
    colors: {
      primary: appTheme.primary,
      background: appTheme.background,
      card: appTheme.cardBackground,
      text: appTheme.textPrimary,
      border: appTheme.cardBorder,
      notification: appTheme.accent,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800',
      },
    },
  };
}
