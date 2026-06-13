import { ExportPackage } from '@/types/export';

export function createExportPackage(data: ExportPackage): ExportPackage {
  return {
    ...data,
    exportedAt: data.exportedAt || new Date().toISOString(),
  };
}

export function exportPackageToJson(data: ExportPackage): string {
  return JSON.stringify(createExportPackage(data), null, 2);
}
