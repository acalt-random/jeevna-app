export interface LocaleDefinition {
  id: string;
  languageCode: string;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  nativeName: string;
  englishName: string;
  countryName: string;
  recommended?: boolean;
}

export const localeDefinitions: LocaleDefinition[] = [
  { id: 'en-IN', languageCode: 'en', countryCode: 'IN', currencyCode: 'INR', timezone: 'Asia/Calcutta', nativeName: 'English', englishName: 'English', countryName: 'India', recommended: true },
  { id: 'hi-IN', languageCode: 'hi', countryCode: 'IN', currencyCode: 'INR', timezone: 'Asia/Calcutta', nativeName: 'हिन्दी', englishName: 'Hindi', countryName: 'India', recommended: true },
  { id: 'kn-IN', languageCode: 'kn', countryCode: 'IN', currencyCode: 'INR', timezone: 'Asia/Calcutta', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', countryName: 'India', recommended: true },
  { id: 'ta-IN', languageCode: 'ta', countryCode: 'IN', currencyCode: 'INR', timezone: 'Asia/Calcutta', nativeName: 'தமிழ்', englishName: 'Tamil', countryName: 'India', recommended: true },
  { id: 'te-IN', languageCode: 'te', countryCode: 'IN', currencyCode: 'INR', timezone: 'Asia/Calcutta', nativeName: 'తెలుగు', englishName: 'Telugu', countryName: 'India', recommended: true },
  { id: 'ml-IN', languageCode: 'ml', countryCode: 'IN', currencyCode: 'INR', timezone: 'Asia/Calcutta', nativeName: 'മലയാളം', englishName: 'Malayalam', countryName: 'India', recommended: true },
  { id: 'mr-IN', languageCode: 'mr', countryCode: 'IN', currencyCode: 'INR', timezone: 'Asia/Calcutta', nativeName: 'मराठी', englishName: 'Marathi', countryName: 'India', recommended: true },
  { id: 'bn-IN', languageCode: 'bn', countryCode: 'IN', currencyCode: 'INR', timezone: 'Asia/Calcutta', nativeName: 'বাংলা', englishName: 'Bengali', countryName: 'India', recommended: true },
  { id: 'gu-IN', languageCode: 'gu', countryCode: 'IN', currencyCode: 'INR', timezone: 'Asia/Calcutta', nativeName: 'ગુજરાતી', englishName: 'Gujarati', countryName: 'India' },
  { id: 'pa-IN', languageCode: 'pa', countryCode: 'IN', currencyCode: 'INR', timezone: 'Asia/Calcutta', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', countryName: 'India' },
  { id: 'en-US', languageCode: 'en', countryCode: 'US', currencyCode: 'USD', timezone: 'America/New_York', nativeName: 'English', englishName: 'English', countryName: 'USA' },
  { id: 'en-GB', languageCode: 'en', countryCode: 'GB', currencyCode: 'GBP', timezone: 'Europe/London', nativeName: 'English', englishName: 'English', countryName: 'UK' },
  { id: 'en-AU', languageCode: 'en', countryCode: 'AU', currencyCode: 'AUD', timezone: 'Australia/Sydney', nativeName: 'English', englishName: 'English', countryName: 'Australia' },
  { id: 'en-CA', languageCode: 'en', countryCode: 'CA', currencyCode: 'CAD', timezone: 'America/Toronto', nativeName: 'English', englishName: 'English', countryName: 'Canada' },
  { id: 'en-SG', languageCode: 'en', countryCode: 'SG', currencyCode: 'SGD', timezone: 'Asia/Singapore', nativeName: 'English', englishName: 'English', countryName: 'Singapore' },
  { id: 'en-AE', languageCode: 'en', countryCode: 'AE', currencyCode: 'AED', timezone: 'Asia/Dubai', nativeName: 'English', englishName: 'English', countryName: 'UAE' },
  { id: 'es-ES', languageCode: 'es', countryCode: 'ES', currencyCode: 'EUR', timezone: 'Europe/Madrid', nativeName: 'Español', englishName: 'Spanish', countryName: 'Spain' },
  { id: 'es-MX', languageCode: 'es', countryCode: 'MX', currencyCode: 'MXN', timezone: 'America/Mexico_City', nativeName: 'Español', englishName: 'Spanish', countryName: 'Mexico' },
  { id: 'es-US', languageCode: 'es', countryCode: 'US', currencyCode: 'USD', timezone: 'America/New_York', nativeName: 'Español', englishName: 'Spanish', countryName: 'USA' },
  { id: 'es-AR', languageCode: 'es', countryCode: 'AR', currencyCode: 'ARS', timezone: 'America/Argentina/Buenos_Aires', nativeName: 'Español', englishName: 'Spanish', countryName: 'Argentina' },
  { id: 'es-CO', languageCode: 'es', countryCode: 'CO', currencyCode: 'COP', timezone: 'America/Bogota', nativeName: 'Español', englishName: 'Spanish', countryName: 'Colombia' },
  { id: 'fr-FR', languageCode: 'fr', countryCode: 'FR', currencyCode: 'EUR', timezone: 'Europe/Paris', nativeName: 'Français', englishName: 'French', countryName: 'France' },
  { id: 'fr-CA', languageCode: 'fr', countryCode: 'CA', currencyCode: 'CAD', timezone: 'America/Toronto', nativeName: 'Français', englishName: 'French', countryName: 'Canada' },
  { id: 'de-DE', languageCode: 'de', countryCode: 'DE', currencyCode: 'EUR', timezone: 'Europe/Berlin', nativeName: 'Deutsch', englishName: 'German', countryName: 'Germany' },
  { id: 'pt-BR', languageCode: 'pt', countryCode: 'BR', currencyCode: 'BRL', timezone: 'America/Sao_Paulo', nativeName: 'Português', englishName: 'Portuguese', countryName: 'Brazil' },
  { id: 'pt-PT', languageCode: 'pt', countryCode: 'PT', currencyCode: 'EUR', timezone: 'Europe/Lisbon', nativeName: 'Português', englishName: 'Portuguese', countryName: 'Portugal' },
  { id: 'zh-CN', languageCode: 'zh', countryCode: 'CN', currencyCode: 'CNY', timezone: 'Asia/Shanghai', nativeName: '中文', englishName: 'Chinese', countryName: 'China' },
  { id: 'zh-TW', languageCode: 'zh', countryCode: 'TW', currencyCode: 'TWD', timezone: 'Asia/Taipei', nativeName: '中文', englishName: 'Chinese', countryName: 'Taiwan' },
  { id: 'ru-RU', languageCode: 'ru', countryCode: 'RU', currencyCode: 'RUB', timezone: 'Europe/Moscow', nativeName: 'Русский', englishName: 'Russian', countryName: 'Russia' },
  { id: 'ja-JP', languageCode: 'ja', countryCode: 'JP', currencyCode: 'JPY', timezone: 'Asia/Tokyo', nativeName: '日本語', englishName: 'Japanese', countryName: 'Japan' },
  { id: 'ko-KR', languageCode: 'ko', countryCode: 'KR', currencyCode: 'KRW', timezone: 'Asia/Seoul', nativeName: '한국어', englishName: 'Korean', countryName: 'South Korea' },
  { id: 'ar-AE', languageCode: 'ar', countryCode: 'AE', currencyCode: 'AED', timezone: 'Asia/Dubai', nativeName: 'العربية', englishName: 'Arabic', countryName: 'UAE' },
  { id: 'ar-SA', languageCode: 'ar', countryCode: 'SA', currencyCode: 'SAR', timezone: 'Asia/Riyadh', nativeName: 'العربية', englishName: 'Arabic', countryName: 'Saudi Arabia' },
  { id: 'tr-TR', languageCode: 'tr', countryCode: 'TR', currencyCode: 'TRY', timezone: 'Europe/Istanbul', nativeName: 'Türkçe', englishName: 'Turkish', countryName: 'Turkey' },
  { id: 'id-ID', languageCode: 'id', countryCode: 'ID', currencyCode: 'IDR', timezone: 'Asia/Jakarta', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', countryName: 'Indonesia' },
  { id: 'pl-PL', languageCode: 'pl', countryCode: 'PL', currencyCode: 'PLN', timezone: 'Europe/Warsaw', nativeName: 'Polski', englishName: 'Polish', countryName: 'Poland' },
  { id: 'it-IT', languageCode: 'it', countryCode: 'IT', currencyCode: 'EUR', timezone: 'Europe/Rome', nativeName: 'Italiano', englishName: 'Italian', countryName: 'Italy' },
  { id: 'nl-NL', languageCode: 'nl', countryCode: 'NL', currencyCode: 'EUR', timezone: 'Europe/Amsterdam', nativeName: 'Nederlands', englishName: 'Dutch', countryName: 'Netherlands' },
];

export const localeDefinitionById = new Map(localeDefinitions.map((locale) => [locale.id, locale]));

export function getLocaleDisplayLabel(locale: LocaleDefinition): string {
  return `${locale.nativeName}\n${locale.englishName} — ${locale.countryName}`;
}
