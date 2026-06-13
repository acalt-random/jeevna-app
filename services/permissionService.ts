import AsyncStorage from '@react-native-async-storage/async-storage';

import { PermissionRecord, PermissionStatus, PermissionType } from '@/types/permissions';

const PERMISSIONS_KEY = 'lifeKpi_permissions';

const permissionTypes: PermissionType[] = [
  'notifications',
  'microphone',
  'calendar',
  'contacts',
  'health',
  'camera',
  'location',
];

function createDefaultPermission(permissionType: PermissionType): PermissionRecord {
  return {
    permissionType,
    status: 'not_requested',
    source: 'local-placeholder',
  };
}

export async function getPermissions(): Promise<PermissionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(PERMISSIONS_KEY);
    const stored = raw ? (JSON.parse(raw) as PermissionRecord[]) : [];
    const storedMap = new Map(stored.map((record) => [record.permissionType, record]));
    return permissionTypes.map(
      (permissionType) => storedMap.get(permissionType) ?? createDefaultPermission(permissionType)
    );
  } catch (error) {
    console.error('Error loading permissions', error);
    return permissionTypes.map(createDefaultPermission);
  }
}

export async function setPermissionStatus(
  permissionType: PermissionType,
  status: PermissionStatus,
  source = 'system'
): Promise<PermissionRecord> {
  const current = await getPermissions();
  const nextRecord: PermissionRecord = {
    ...(current.find((record) => record.permissionType === permissionType) ??
      createDefaultPermission(permissionType)),
    permissionType,
    status,
    source,
    updatedAt: new Date().toISOString(),
  };
  const next = current.map((record) => (record.permissionType === permissionType ? nextRecord : record));
  await AsyncStorage.setItem(PERMISSIONS_KEY, JSON.stringify(next));
  return nextRecord;
}
