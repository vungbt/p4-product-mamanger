import type { ApiSdk } from './client.js';
import { unwrap } from './errors.js';
import type { components, paths } from './generated.js';

export type UploadTicket =
  paths['/api/files/uploads']['post']['responses'][201]['content']['application/json']['data'];

export type VerifiedUpload = { storageId: string; fileId: string; ticketId: string };

export type UploadSession = {
  ticket?: UploadTicket;
  sent: boolean;
  attempted: boolean;
  controller: AbortController;
  result?: VerifiedUpload;
};

function sendFile(
  file: File,
  ticket: UploadTicket,
  signal: AbortSignal,
  progress: (value: number) => void,
  failureMessage: string,
  options: UploadApiOptions,
) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const xhr = options.xhr?.() ?? new XMLHttpRequest();

    const abort = () => xhr.abort();

    const finish = (error?: Error) => {
      signal.removeEventListener('abort', abort);
      if (error) reject(error);
      else resolve();
    };

    xhr.open('POST', new URL(ticket.uploadUrl, options.baseUrl).href);
    xhr.withCredentials = false;
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0)
        progress(Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100))));
    };
    xhr.onload = () =>
      finish(xhr.status >= 200 && xhr.status < 300 ? undefined : new Error(failureMessage));
    xhr.onerror = () => finish(new Error(failureMessage));
    xhr.ontimeout = () => finish(new Error('Upload timed out after 120 seconds.'));
    xhr.onabort = () => finish(new DOMException('Upload aborted.', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    const body = new FormData();
    body.append('file', file);
    try {
      signal.throwIfAborted();
      xhr.send(body);
    } catch (error) {
      signal.removeEventListener('abort', abort);
      reject(error);
    }
  });
}

/** Retry keeps the ticket and verifies ambiguous provider responses before resending. */
async function uploadTicketFile({
  file,
  session,
  createTicket,
  completeTicket,
  onProgress,
  onVerifying,
  failureMessage,
  transfer,
}: {
  file: File;
  session: UploadSession;
  createTicket: () => Promise<UploadTicket>;
  completeTicket: (id: string) => Promise<components['schemas']['UploadTicket']>;
  onProgress: (value: number) => void;
  onVerifying: () => void;
  failureMessage: string;
  transfer: (
    file: File,
    ticket: UploadTicket,
    signal: AbortSignal,
    progress: (value: number) => void,
    failureMessage: string,
  ) => Promise<void>;
}): Promise<VerifiedUpload> {
  const signal = session.controller.signal;
  signal.throwIfAborted();
  if (session.result) return session.result;
  const ticket = session.ticket ?? (await createTicket());
  session.ticket = ticket;
  signal.throwIfAborted();
  if (
    !ticket.allowedMimeTypes.includes(file.type) ||
    file.size > ticket.maxBytes ||
    file.size === 0
  ) {
    throw new Error(failureMessage);
  }

  if (session.attempted && !session.sent) {
    try {
      const verified = await completeTicket(ticket.id);
      signal.throwIfAborted();
      if (verified.status === 'completed' && verified.fileId) {
        session.result = {
          storageId: ticket.publicId,
          fileId: verified.fileId,
          ticketId: ticket.id,
        };
        return session.result;
      }
    } catch {
      // The provider may have received nothing. Resend to the same destination below.
    }
  }

  signal.throwIfAborted();
  if (!session.sent) {
    session.attempted = true;
    await transfer(file, ticket, signal, onProgress, failureMessage);
    session.sent = true;
  }
  signal.throwIfAborted();
  onVerifying();
  const verified = await completeTicket(ticket.id);
  signal.throwIfAborted();
  if (verified.status !== 'completed' || !verified.fileId) throw new Error(failureMessage);
  session.result = { storageId: ticket.publicId, fileId: verified.fileId, ticketId: ticket.id };
  return session.result;
}

export type UploadApiOptions = {
  baseUrl: string;
  /** Factory for progress-capable file transfers; API requests use the SDK's fetch. */
  xhr?: () => XMLHttpRequest;
};

export type UploadFileInput = {
  file: File;
  purpose: UploadTicket['purpose'];
  resourceId?: string;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
  onVerifying?: () => void;
  /** Retain across retries to reuse the ticket and completed steps. */
  session?: UploadSession;
  failureMessage?: string;
};

/** Ticket API calls keep SDK authentication; provider transfers send no cross-origin cookies. */
export function createUploadApi(sdk: ApiSdk, options: UploadApiOptions) {
  const transfer = (
    file: File,
    ticket: UploadTicket,
    signal: AbortSignal,
    progress: (value: number) => void,
    failureMessage: string,
  ) => sendFile(file, ticket, signal, progress, failureMessage, options);

  const api = {
    uploadFile: async (input: UploadFileInput): Promise<VerifiedUpload> => {
      const session = input.session ?? {
        sent: false,
        attempted: false,
        controller: new AbortController(),
      };

      const abort = () => session.controller.abort(input.signal?.reason);

      if (input.signal?.aborted) abort();
      input.signal?.addEventListener('abort', abort, { once: true });
      try {
        return await uploadTicketFile({
          ...input,
          session,
          failureMessage:
            input.failureMessage ??
            'File upload failed or the file does not meet the ticket requirements.',
          onProgress: input.onProgress ?? (() => {}),
          onVerifying: input.onVerifying ?? (() => {}),
          createTicket: async () =>
            unwrap(
              await sdk.POST('/api/files/uploads', {
                body: { purpose: input.purpose, resourceId: input.resourceId },
                signal: session.controller.signal,
              }),
            ).data,
          completeTicket: async (id) =>
            unwrap(
              await sdk.POST('/api/files/uploads/{id}/complete', {
                params: { path: { id } },
                signal: session.controller.signal,
              }),
            ).data,
          transfer,
        });
      } finally {
        input.signal?.removeEventListener('abort', abort);
      }
    },
    /** Batch completion is asynchronous. Track the returned process before attaching any files. */
    uploadFiles: async (
      files: readonly File[],
      input: {
        purpose: UploadTicket['purpose'];
        resourceId?: string;
        signal?: AbortSignal;
        onProgress?: (index: number, progress: number) => void;
        idempotencyKey?: string;
        sessions?: readonly UploadSession[];
        onVerifying?: (index: number) => void;
      },
    ) => {
      input.signal?.throwIfAborted();
      if (!files.length || files.length > 20) throw new Error('Choose 1–20 files.');
      const { tickets } = unwrap(
        await sdk.POST('/api/files/uploads/batch', {
          body: {
            names: files.map((file) => file.name),
            purpose: input.purpose,
            resourceId: input.resourceId,
          },
          signal: input.signal,
        }),
      ).data;
      if (tickets.length !== files.length) throw new Error('Invalid upload ticket batch.');
      const filesResult = await Promise.allSettled(
        files.map(async (file, index) => {
          const ticket = tickets[index];
          if (!ticket) throw new Error('Missing upload ticket.');
          const session = input.sessions?.[index];
          if (session) session.ticket = ticket;
          const signal = AbortSignal.any([
            ...(session ? [session.controller.signal] : []),
            ...(input.signal ? [input.signal] : []),
          ]);
          signal.throwIfAborted();
          if (
            !ticket.allowedMimeTypes.includes(file.type) ||
            file.size > ticket.maxBytes ||
            file.size === 0
          )
            throw new Error('File does not meet the ticket requirements.');
          if (session) session.attempted = true;
          await transfer(
            file,
            ticket,
            signal,
            (value) => input.onProgress?.(index, value),
            'File upload failed.',
          );
          signal.throwIfAborted();
          if (session) session.sent = true;
          input.onVerifying?.(index);
          return { ticketId: ticket.id, storageId: ticket.publicId };
        }),
      );
      input.signal?.throwIfAborted();
      const ticketIds = filesResult.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value.ticketId] : [],
      );
      const process = ticketIds.length
        ? unwrap(
            await sdk.POST('/api/files/uploads/batch/complete', {
              params: {
                header: { 'Idempotency-Key': input.idempotencyKey ?? crypto.randomUUID() },
              },
              body: { ticketIds },
              signal: input.signal,
            }),
          ).data
        : null;
      return { files: filesResult, process };
    },
    /** Wait for worker outcomes; a provider response alone is never attachable. */
    verifyBatch: async (
      batch: {
        files: readonly PromiseSettledResult<{ ticketId: string; storageId: string }>[];
        process: { id: string; state: string } | null;
      },
      input: { signal?: AbortSignal; pollIntervalMs?: number } = {},
    ): Promise<PromiseSettledResult<VerifiedUpload>[]> => {
      let process = batch.process;
      if (process) {
        const deadline = Date.now() + 300_000;
        while (
          !['completed', 'completed_with_errors', 'failed', 'cancelled'].includes(process.state)
        ) {
          input.signal?.throwIfAborted();
          if (Date.now() >= deadline)
            throw new Error('Upload verification timed out. Retry to verify the ticket.');
          await new Promise<void>((resolve, reject) => {
            const abort = () => {
              clearTimeout(timer);
              reject(input.signal?.reason);
            };

            const timer = setTimeout(() => {
              input.signal?.removeEventListener('abort', abort);
              resolve();
            }, input.pollIntervalMs ?? 1000);
            input.signal?.addEventListener('abort', abort, { once: true });
          });
          process = unwrap(
            await sdk.GET('/api/processes/{id}', {
              params: { path: { id: process.id } },
              signal: input.signal,
            }),
          ).data;
        }
      }
      const outcomes = process
        ? unwrap(
            await sdk.GET('/api/processes/{id}/items', {
              params: { path: { id: process.id }, query: { pageSize: 100 } },
              signal: input.signal,
            }),
          ).data
        : [];
      input.signal?.throwIfAborted();
      return batch.files.map((file) => {
        if (file.status === 'rejected') return file;
        const outcome = outcomes.find((item) => {
          const data = item.data;
          return (
            data &&
            typeof data === 'object' &&
            !Array.isArray(data) &&
            data.ticketId === file.value.ticketId
          );
        });
        const result = outcome?.result;
        if (
          outcome?.state === 'applied' &&
          result &&
          typeof result === 'object' &&
          !Array.isArray(result) &&
          typeof result.fileId === 'string' &&
          result.fileId
        ) {
          return { status: 'fulfilled', value: { ...file.value, fileId: result.fileId } };
        }
        return {
          status: 'rejected',
          reason: new Error(outcome?.issues?.[0]?.message ?? 'File verification failed.'),
        };
      });
    },
  };
  return api;
}
