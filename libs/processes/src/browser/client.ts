import type { UploadPurpose } from '@p4/shared';
import * as v from 'valibot';
import type { ExportResource, FileFormat, ImportResource, ProcessApi } from '../shared/index.js';
import { processIssueSchema, processSnapshotSchema } from '../shared/index.js';

export class ProcessApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ProcessApiError';
  }
}
export function createProcessApi({
  baseUrl = '/api',
  getToken,
}: {
  baseUrl?: string;
  getToken: () => string | null;
}) {
  const send = async (path: string, options: RequestInit = {}) => {
    const token = getToken();
    const form = options.body instanceof FormData;
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(form ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const parsed = v.safeParse(
        v.object({ message: v.string(), code: v.optional(v.string(), 'request_failed') }),
        body,
      );
      throw new ProcessApiError(
        response.status,
        parsed.success ? parsed.output.code : 'request_failed',
        parsed.success ? parsed.output.message : 'Request failed',
      );
    }
    return body;
  };
  const processResponse = (body: unknown) =>
    v.parse(v.object({ data: processSnapshotSchema }), body).data;
  const api: ProcessApi = {
    getProcess: async (id, signal) =>
      processResponse(await send(`/processes/${encodeURIComponent(id)}`, { signal })),
    confirm: async (id, expectedVersion) =>
      processResponse(
        await send(`/processes/${encodeURIComponent(id)}/confirm`, {
          method: 'POST',
          body: JSON.stringify({ expectedVersion }),
        }),
      ),
    cancel: async (id, expectedVersion) =>
      processResponse(
        await send(`/processes/${encodeURIComponent(id)}/cancel`, {
          method: 'POST',
          body: JSON.stringify({ expectedVersion }),
        }),
      ),
    getIssues: async (id, page = 1) => {
      const body = await send(`/processes/${encodeURIComponent(id)}/items?page=${page}`);
      const parsed = v.parse(
        v.object({
          data: v.array(v.object({ issues: v.array(processIssueSchema) })),
          meta: v.object({ total: v.number() }),
        }),
        body,
      );
      return { data: parsed.data.flatMap((item) => item.issues), total: parsed.meta.total };
    },
  };
  return {
    ...api,
    importFile: async (resource: ImportResource, file: File, key = crypto.randomUUID()) => {
      const form = new FormData();
      form.append('file', file);
      return processResponse(
        await send(`/admin/imports/${resource}`, {
          method: 'POST',
          headers: { 'Idempotency-Key': key },
          body: form,
        }),
      );
    },
    exportFile: async (
      resource: ExportResource,
      format: FileFormat,
      query: Record<string, string | number | boolean | null> = {},
      key = crypto.randomUUID(),
    ) =>
      processResponse(
        await send('/admin/exports', {
          method: 'POST',
          headers: { 'Idempotency-Key': key },
          body: JSON.stringify({ resource, format, query }),
        }),
      ),
    uploadFiles: async (
      files: File[],
      purpose: UploadPurpose,
      onFile?: (result: UploadFileResult) => void,
      key = crypto.randomUUID(),
    ) => {
      if (!files.length || files.length > 20)
        throw new ProcessApiError(400, 'upload_batch_limit', 'Choose 1–20 images.');
      const ticketSchema = v.object({
        name: v.string(),
        id: v.string(),
        uploadUrl: v.string(),
        publicId: v.string(),
      });
      const response = await send('/files/uploads/batch', {
        method: 'POST',
        body: JSON.stringify({ purpose, names: files.map((file) => file.name) }),
      });
      const tickets = v.parse(
        v.object({ data: v.object({ tickets: v.array(ticketSchema) }) }),
        response,
      ).data.tickets;
      if (tickets.length !== files.length)
        throw new ProcessApiError(500, 'invalid_upload_batch', 'Invalid upload ticket batch.');
      const results: UploadFileResult[] = [];
      let next = 0;
      const upload = async () => {
        while (next < files.length) {
          const index = next++;
          const file = files[index];
          const ticket = tickets[index];
          if (!file || !ticket) continue;
          let result: UploadFileResult;
          try {
            const form = new FormData();
            form.append('file', file);
            const response = await fetch(ticket.uploadUrl, { method: 'POST', body: form });
            if (!response.ok) throw new Error('upload_failed');
            const uploaded: unknown = await response.json();
            const verified = v.parse(v.object({ public_id: v.string() }), uploaded);
            if (verified.public_id !== ticket.publicId) throw new Error('upload_identity_mismatch');
            result = {
              ticketId: ticket.id,
              fileName: file.name,
              state: 'uploaded',
              errorCode: null,
            };
          } catch {
            result = {
              ticketId: ticket.id,
              fileName: file.name,
              state: 'failed',
              errorCode: 'upload_failed',
            };
          }
          results.push(result);
          onFile?.(result);
        }
      };
      await Promise.all(Array.from({ length: Math.min(3, files.length) }, () => upload()));
      const ticketIds = results
        .filter((result) => result.state === 'uploaded')
        .map((result) => result.ticketId);
      const process = ticketIds.length
        ? processResponse(
            await send('/files/uploads/batch/complete', {
              method: 'POST',
              headers: { 'Idempotency-Key': key },
              body: JSON.stringify({ ticketIds }),
            }),
          )
        : null;
      return { process, files: results };
    },
    download: async (id: string) => {
      const token = getToken();
      const response = await fetch(`${baseUrl}/processes/${encodeURIComponent(id)}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok)
        throw new ProcessApiError(response.status, 'download_failed', 'Download failed');
      return response.blob();
    },
  };
}

export interface UploadFileResult {
  ticketId: string;
  fileName: string;
  state: 'uploaded' | 'failed';
  errorCode: string | null;
}
