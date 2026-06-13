import AsyncStorage from '@react-native-async-storage/async-storage';

import { ConsentRecord, ConsentType } from '@/types/consent';

const CONSENT_KEY = 'lifeKpi_consents';
const CONSENT_VERSION = '1.0.0';

const consentTypes: ConsentType[] = [
  'ai_processing',
  'analytics',
  'notifications',
  'health_data',
  'calendar_access',
  'contacts_access',
  'public_profile',
  'benchmarking',
];

function createDefaultConsent(consentType: ConsentType): ConsentRecord {
  return {
    consentType,
    granted: false,
    version: CONSENT_VERSION,
    source: 'local-placeholder',
  };
}

export async function getConsents(): Promise<ConsentRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    const stored = raw ? (JSON.parse(raw) as ConsentRecord[]) : [];
    const storedMap = new Map(stored.map((record) => [record.consentType, record]));
    return consentTypes.map((consentType) => storedMap.get(consentType) ?? createDefaultConsent(consentType));
  } catch (error) {
    console.error('Error loading consents', error);
    return consentTypes.map(createDefaultConsent);
  }
}

export async function updateConsent(
  consentType: ConsentType,
  granted: boolean,
  source = 'preferences'
): Promise<ConsentRecord> {
  const current = await getConsents();
  const nextRecord: ConsentRecord = {
    ...(current.find((record) => record.consentType === consentType) ?? createDefaultConsent(consentType)),
    consentType,
    granted,
    grantedAt: granted ? new Date().toISOString() : undefined,
    revokedAt: granted ? undefined : new Date().toISOString(),
    version: CONSENT_VERSION,
    source,
  };

  const next = current.map((record) => (record.consentType === consentType ? nextRecord : record));
  await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(next));
  return nextRecord;
}
