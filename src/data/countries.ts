export const supportedCountryCodes = [
  'IN',
  'US',
  'GB',
  'CA',
  'AU',
  'SG',
  'AE',
  'ES',
  'MX',
  'AR',
  'CO',
  'FR',
  'DE',
  'BR',
  'PT',
  'CN',
  'TW',
  'RU',
  'JP',
  'KR',
  'SA',
  'TR',
  'ID',
  'PL',
  'IT',
  'NL',
] as const;

export type SupportedCountryCode = (typeof supportedCountryCodes)[number];

export interface CountryDefinition {
  code: SupportedCountryCode;
  nameKey: string;
  defaultCurrencyCode: string;
  defaultTimezone: string;
  defaultLocale: string;
}

export const defaultCountryCode: SupportedCountryCode = 'IN';

export const countries: CountryDefinition[] = [
  { code: 'IN', nameKey: 'countries.IN', defaultCurrencyCode: 'INR', defaultTimezone: 'Asia/Calcutta', defaultLocale: 'en-IN' },
  { code: 'US', nameKey: 'countries.US', defaultCurrencyCode: 'USD', defaultTimezone: 'America/New_York', defaultLocale: 'en-US' },
  { code: 'GB', nameKey: 'countries.GB', defaultCurrencyCode: 'GBP', defaultTimezone: 'Europe/London', defaultLocale: 'en-GB' },
  { code: 'CA', nameKey: 'countries.CA', defaultCurrencyCode: 'CAD', defaultTimezone: 'America/Toronto', defaultLocale: 'en-CA' },
  { code: 'AU', nameKey: 'countries.AU', defaultCurrencyCode: 'AUD', defaultTimezone: 'Australia/Sydney', defaultLocale: 'en-AU' },
  { code: 'SG', nameKey: 'countries.SG', defaultCurrencyCode: 'SGD', defaultTimezone: 'Asia/Singapore', defaultLocale: 'en-SG' },
  { code: 'AE', nameKey: 'countries.AE', defaultCurrencyCode: 'AED', defaultTimezone: 'Asia/Dubai', defaultLocale: 'en-AE' },
  { code: 'ES', nameKey: 'countries.ES', defaultCurrencyCode: 'EUR', defaultTimezone: 'Europe/Madrid', defaultLocale: 'es-ES' },
  { code: 'MX', nameKey: 'countries.MX', defaultCurrencyCode: 'MXN', defaultTimezone: 'America/Mexico_City', defaultLocale: 'es-MX' },
  { code: 'AR', nameKey: 'countries.AR', defaultCurrencyCode: 'ARS', defaultTimezone: 'America/Argentina/Buenos_Aires', defaultLocale: 'es-AR' },
  { code: 'CO', nameKey: 'countries.CO', defaultCurrencyCode: 'COP', defaultTimezone: 'America/Bogota', defaultLocale: 'es-CO' },
  { code: 'FR', nameKey: 'countries.FR', defaultCurrencyCode: 'EUR', defaultTimezone: 'Europe/Paris', defaultLocale: 'fr-FR' },
  { code: 'DE', nameKey: 'countries.DE', defaultCurrencyCode: 'EUR', defaultTimezone: 'Europe/Berlin', defaultLocale: 'de-DE' },
  { code: 'BR', nameKey: 'countries.BR', defaultCurrencyCode: 'BRL', defaultTimezone: 'America/Sao_Paulo', defaultLocale: 'pt-BR' },
  { code: 'PT', nameKey: 'countries.PT', defaultCurrencyCode: 'EUR', defaultTimezone: 'Europe/Lisbon', defaultLocale: 'pt-PT' },
  { code: 'CN', nameKey: 'countries.CN', defaultCurrencyCode: 'CNY', defaultTimezone: 'Asia/Shanghai', defaultLocale: 'zh-CN' },
  { code: 'TW', nameKey: 'countries.TW', defaultCurrencyCode: 'TWD', defaultTimezone: 'Asia/Taipei', defaultLocale: 'zh-TW' },
  { code: 'RU', nameKey: 'countries.RU', defaultCurrencyCode: 'RUB', defaultTimezone: 'Europe/Moscow', defaultLocale: 'ru-RU' },
  { code: 'JP', nameKey: 'countries.JP', defaultCurrencyCode: 'JPY', defaultTimezone: 'Asia/Tokyo', defaultLocale: 'ja-JP' },
  { code: 'KR', nameKey: 'countries.KR', defaultCurrencyCode: 'KRW', defaultTimezone: 'Asia/Seoul', defaultLocale: 'ko-KR' },
  { code: 'SA', nameKey: 'countries.SA', defaultCurrencyCode: 'SAR', defaultTimezone: 'Asia/Riyadh', defaultLocale: 'ar-SA' },
  { code: 'TR', nameKey: 'countries.TR', defaultCurrencyCode: 'TRY', defaultTimezone: 'Europe/Istanbul', defaultLocale: 'tr-TR' },
  { code: 'ID', nameKey: 'countries.ID', defaultCurrencyCode: 'IDR', defaultTimezone: 'Asia/Jakarta', defaultLocale: 'id-ID' },
  { code: 'PL', nameKey: 'countries.PL', defaultCurrencyCode: 'PLN', defaultTimezone: 'Europe/Warsaw', defaultLocale: 'pl-PL' },
  { code: 'IT', nameKey: 'countries.IT', defaultCurrencyCode: 'EUR', defaultTimezone: 'Europe/Rome', defaultLocale: 'it-IT' },
  { code: 'NL', nameKey: 'countries.NL', defaultCurrencyCode: 'EUR', defaultTimezone: 'Europe/Amsterdam', defaultLocale: 'nl-NL' },
];

export const countryByCode = new Map(countries.map((country) => [country.code, country]));
