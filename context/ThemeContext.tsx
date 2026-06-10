import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  AppTheme,
  defaultThemeId,
  getThemeById,
  isThemeId,
  themeOptions,
  ThemeId,
} from '@/constants/themes';

const STORAGE_KEY = 'lifeKpi_selectedTheme';

type ThemeContextValue = {
  theme: AppTheme;
  themes: AppTheme[];
  selectedThemeId: ThemeId;
  setSelectedThemeId: (themeId: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [selectedThemeId, setSelectedThemeIdState] = useState<ThemeId>(defaultThemeId);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedThemeId = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedThemeId && isThemeId(savedThemeId)) {
          setSelectedThemeIdState(savedThemeId);
        }
      } catch (error) {
        console.error('Error loading selected theme', error);
      } finally {
        setIsHydrated(true);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(STORAGE_KEY, selectedThemeId).catch((error) => {
      console.error('Error saving selected theme', error);
    });
  }, [isHydrated, selectedThemeId]);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme: getThemeById(selectedThemeId),
      themes: themeOptions,
      selectedThemeId,
      setSelectedThemeId: setSelectedThemeIdState,
    };
  }, [selectedThemeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within an AppThemeProvider');
  }

  return context;
}
