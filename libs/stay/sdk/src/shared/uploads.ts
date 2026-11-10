import type { StaySdk } from './client.js';
import { ApiSdkError, unwrap } from './errors.js';
import type { components } from './generated.js';

export type StayUploadPurpose = components['schemas']['StayUpload']['purpose'];

/**
 * Private uploads: a ticket, then the file goes straight to the storage provider (`uploadUrl`,
 * resolved against `baseUrl` when relative), then `complete` returns the `fileId` to attach.
 */
export function createUploadApi(
  sdk: StaySdk,
  options: { baseUrl: string; fetch?: typeof globalThis.fetch },
) {
  const send = options.fetch ?? globalThis.fetch;

  return {
    /** Uploads one image and returns the verified private file id. */
    uploadImage: async ({
      purpose,
      buildingId,
      file,
    }: {
      purpose: StayUploadPurpose;
      buildingId: string;
      file: Blob & { name?: string };
    }): Promise<string> => {
      const ticket = unwrap(await sdk.POST('/api/uploads', { body: { purpose, buildingId } })).data;
      const form = new FormData();

      form.append('file', file, file.name ?? 'image');

      // The signed URL authorises the upload; no cookies go to the storage provider.
      const response = await send(new URL(ticket.uploadUrl, options.baseUrl), {
        method: 'POST',
        body: form,
        credentials: 'omit',
      });

      if (!response.ok)
        throw new ApiSdkError(response.status, await response.json().catch(() => null));

      const completed = unwrap(
        await sdk.POST('/api/uploads/{id}/complete', { params: { path: { id: ticket.id } } }),
      ).data;

      if (!completed.fileId) throw new Error('The upload was not completed.');
      return completed.fileId;
    },
  };
}
