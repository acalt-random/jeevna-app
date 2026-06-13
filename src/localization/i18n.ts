import * as Localization from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import bn from './bn.json';
import en from './en.json';
import hi from './hi.json';
import kn from './kn.json';
import ml from './ml.json';
import mr from './mr.json';
import ta from './ta.json';
import te from './te.json';

export const supportedLanguages = ['en', 'hi', 'kn', 'ta', 'te', 'ml', 'mr', 'bn'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

const supportedLanguageSet = new Set<string>(supportedLanguages);

export function getBestSupportedLanguage(locale?: string | null): SupportedLanguage {
  const normalized = locale?.toLowerCase().trim();
  if (!normalized) return 'en';

  if (supportedLanguageSet.has(normalized)) {
    return normalized as SupportedLanguage;
  }

  const languageCode = normalized.split('-')[0];
  if (supportedLanguageSet.has(languageCode)) {
    return languageCode as SupportedLanguage;
  }

  return 'en';
}

export function detectDeviceLanguage(): SupportedLanguage {
  const locale = Localization.getLocales()[0]?.languageTag ?? Localization.getLocales()[0]?.languageCode;
  return getBestSupportedLanguage(locale);
}

export const languageResources = {
  en: { translation: en },
  hi: { translation: hi },
  kn: { translation: kn },
  ta: { translation: ta },
  te: { translation: te },
  ml: { translation: ml },
  mr: { translation: mr },
  bn: { translation: bn },
} as const;

const i18n = createInstance();

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    lng: detectDeviceLanguage(),
    fallbackLng: 'en',
    supportedLngs: supportedLanguages as unknown as string[],
    interpolation: {
      escapeValue: false,
    },
    resources: languageResources,
  });
}

export default i18n;
