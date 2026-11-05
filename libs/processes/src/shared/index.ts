import * as v from 'valibot';

export const importResourceSchema = v.picklist(['categories', 'products', 'variants', 'inventory']);
export type ImportResource = v.InferOutput<typeof importResourceSchema>;
export const exportResourceSchema = v.picklist([
  'categories',
  'products',
  'variants',
  'inventory',
  'orders',
  'sales-report',
]);
export type ExportResource = v.InferOutput<typeof exportResourceSchema>;
export const processStateSchema = v.picklist([
  'queued',
  'running',
  'awaiting_confirmation',
  'completed',
  'completed_with_errors',
  'failed',
  'cancelled',
]);
export type ProcessState = v.InferOutput<typeof processStateSchema>;
export const fileFormatSchema = v.picklist(['csv', 'xlsx']);
export type FileFormat = v.InferOutput<typeof fileFormatSchema>;
export const processKinds = ['data.import', 'data.export', 'media.batch'] as const;
export type ProcessKind = (typeof processKinds)[number];

export const processIssueSchema = v.object({
  item: v.number(),
  fileName: v.optional(v.string()),
  field: v.optional(v.string()),
  code: v.string(),
  message: v.string(),
});
export type ProcessIssue = v.InferOutput<typeof processIssueSchema>;
export const processResultSchema = v.object({
  resourceIds: v.array(v.string()),
  downloadUrl: v.nullable(v.string()),
  total: v.number(),
  succeeded: v.number(),
  failed: v.number(),
});
export type ProcessResult = v.InferOutput<typeof processResultSchema>;
export const processSnapshotSchema = v.object({
  id: v.string(),
  kind: v.picklist(processKinds),
  state: processStateSchema,
  phase: v.picklist(['validate', 'apply', 'generate', 'verify']),
  version: v.number(),
  progress: v.number(),
  processed: v.number(),
  total: v.number(),
  succeeded: v.number(),
  failed: v.number(),
  errorCode: v.nullable(v.string()),
  result: v.nullable(processResultSchema),
  createdAt: v.string(),
  updatedAt: v.string(),
  expiresAt: v.string(),
});
export type ProcessSnapshot = v.InferOutput<typeof processSnapshotSchema>;
export type ProcessInput =
  | {
      kind: 'data.import';
      resource: ImportResource;
      format: FileFormat;
      fileName: string;
      storageKey: string;
    }
  | {
      kind: 'data.export';
      resource: ExportResource;
      format: FileFormat;
      query: Record<string, string | number | boolean | null>;
    }
  | { kind: 'media.batch'; ticketIds: string[] };

export function isTerminalProcess(state: ProcessState) {
  return (
    state === 'completed' ||
    state === 'completed_with_errors' ||
    state === 'failed' ||
    state === 'cancelled'
  );
}
export function processProgress(processed: number, total: number) {
  return total > 0 ? Math.max(0, Math.min(100, Math.floor((processed * 100) / total))) : 0;
}
export interface ProcessApi {
  getProcess(id: string, signal?: AbortSignal): Promise<ProcessSnapshot>;
  getIssues(id: string, page?: number): Promise<{ data: ProcessIssue[]; total: number }>;
  confirm(id: string, expectedVersion: number): Promise<ProcessSnapshot>;
  cancel(id: string, expectedVersion: number): Promise<ProcessSnapshot>;
}

export type { ParsedImportRow } from './imports.js';
export { IMPORT_COLUMNS, parseImportRow } from './imports.js';
