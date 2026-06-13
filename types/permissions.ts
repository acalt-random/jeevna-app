export type PermissionType =
  | 'notifications'
  | 'microphone'
  | 'calendar'
  | 'contacts'
  | 'health'
  | 'camera'
  | 'location';

export type PermissionStatus = 'unknown' | 'not_requested' | 'granted' | 'denied' | 'blocked';

export interface PermissionRecord {
  permissionType: PermissionType;
  status: PermissionStatus;
  updatedAt?: string;
  source: string;
}
