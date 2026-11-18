import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';

export type ReportRange = { buildingId: string; from: string; to: string };
export type ReportExport = ReportRange & {
  sheets: ('invoices' | 'payments' | 'expenses' | 'receivables')[];
};

export function createReportsApi(sdk: StaySdk) {
  return {
    revenue: async (query: ReportRange, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/reports/revenue', { params: { query }, signal })).data,
    rooms: async (query: { buildingId: string; year: number }, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/reports/rooms', { params: { query }, signal })).data,
    utilities: async (query: ReportRange, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/reports/utilities', { params: { query }, signal })).data,
    export: async (body: ReportExport) =>
      unwrap(await sdk.POST('/api/reports/exports', { body, parseAs: 'blob' })),
  };
}

/** Uses the SDK's staff cookie and configured API origin. Release the object URL after download. */
export async function downloadReport(sdk: StaySdk, input: ReportExport): Promise<void> {
  const blob = await createReportsApi(sdk).export(input);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `stay-${input.from}-${input.to}.xlsx`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
