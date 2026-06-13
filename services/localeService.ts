import * as Localization from 'expo-localization';

import {
  countries,
  countryByCode,
  defaultCountryCode,
  SupportedCountryCode,
} from '@/src/data/countries';
import { localeDefinitions } from '@/src/data/locales';

export interface LocalePreferences {
  countryCode: SupportedCountryCode;
  languageCode: string;
  locale: string;
  currencyCode: string;
  timezone: string;
}

function normalizeCountryCode(value?: string | null): SupportedCountryCode {
  const code = value?.toUpperCase().trim();
  if (!code) return defaultCountryCode;

  const match = countries.find((country) => country.code === code);
  return match?.code ?? defaultCountryCode;
}

export function buildLocalePreferences(params: {
  countryCode?: string | null;
  languageCode?: string | null;
  locale?: string | null;
  currencyCode?: string | null;
  timezone?: string | null;
}): LocalePreferences {
  const countryCode = normalizeCountryCode(params.countryCode);
  const normalizedLocale = params.locale?.trim();
  const normalizedLanguageCode =
    params.languageCode?.trim().toLowerCase() ??
    normalizedLocale?.split('-')[0]?.toLowerCase() ??
    'en';

  const exactLocaleMatch =
    localeDefinitions.find(
      (entry) => entry.countryCode === countryCode && entry.languageCode === normalizedLanguageCode
    ) ?? null;
  const localeIdMatch =
    localeDefinitions.find((entry) => entry.id.toLowerCase() === normalizedLocale?.toLowerCase()) ??
    null;
  const countryLocaleMatch =
    localeDefinitions.find((entry) => entry.countryCode === countryCode) ?? null;

  const country = countryByCode.get(countryCode)!;

  return {
    countryCode,
    languageCode:
      params.languageCode?.trim().toLowerCase() ||
      localeIdMatch?.languageCode ||
      exactLocaleMatch?.languageCode ||
      countryLocaleMatch?.languageCode ||
      'en',
    locale:
      normalizedLocale ||
      localeIdMatch?.id ||
      exactLocaleMatch?.id ||
      `${normalizedLanguageCode}-${countryCode}`,
    currencyCode:
      params.currencyCode?.trim().toUpperCase() ||
      localeIdMatch?.currencyCode ||
      exactLocaleMatch?.currencyCode ||
      countryLocaleMatch?.currencyCode ||
      country.defaultCurrencyCode,
    timezone:
      params.timezone?.trim() ||
      localeIdMatch?.timezone ||
      exactLocaleMatch?.timezone ||
      countryLocaleMatch?.timezone ||
      country.defaultTimezone,
  };
}

export function detectDeviceLocalePreferences(): LocalePreferences {
  const locale = Localization.getLocales()[0];
  const calendar = Localization.getCalendars()[0];

  return buildLocalePreferences({
    countryCode: locale?.regionCode ?? defaultCountryCode,
    languageCode: locale?.languageCode ?? locale?.languageTag,
    locale: locale?.languageTag,
    currencyCode: locale?.currencyCode ?? null,
    timezone: calendar?.timeZone ?? null,
  });
}

export function createDateFormatter(
  locale: string,
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, options);
}

export function formatDate(
  value: Date | number | string,
  localePreferences: LocalePreferences,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = value instanceof Date ? value : new Date(value);
  return createDateFormatter(localePreferences.locale, {
    timeZone: localePreferences.timezone,
    ...options,
  }).format(date);
}

export function formatCurrency(
  value: number,
  localePreferences: LocalePreferences,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(localePreferences.locale, {
    style: 'currency',
    currency: localePreferences.currencyCode,
    ...options,
  }).format(value);
}

export function formatNumber(
  value: number,
  localePreferences: LocalePreferences,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(localePreferences.locale, options).format(value);
}

export function getCurrentTimeInTimezone(localePreferences: LocalePreferences): string {
  return formatDate(new Date(), localePreferences, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: localePreferences.timezone,
  });
}

export function getTimezoneLabel(localePreferences: LocalePreferences): string {
  return localePreferences.timezone.replace(/_/g, ' ');
}
