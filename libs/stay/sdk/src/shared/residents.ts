import type { StaySdk } from './client.js';
import { ApiSdkError, unwrap } from './errors.js';
import type { paths } from './generated.js';

export type ResidentListQuery = NonNullable<
  paths['/api/buildings/{buildingId}/residents']['get']['parameters']['query']
>;
export type ResidentRegistrationInput =
  paths['/api/resident-stays/{id}/registration']['post']['requestBody']['content']['application/json'];

export function createResidentApi(sdk: StaySdk) {
  return {
    list: async (buildingId: string, query: ResidentListQuery, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/buildings/{buildingId}/residents', {
          params: { path: { buildingId }, query },
          signal,
        }),
      ),
    register: async ({ id, body }: { id: string; body: ResidentRegistrationInput }) =>
      unwrap(
        await sdk.POST('/api/resident-stays/{id}/registration', { params: { path: { id } }, body }),
      ).data,
    unmark: async (id: string) =>
      unwrap(
        await sdk.DELETE('/api/resident-stays/{id}/registration', { params: { path: { id } } }),
      ).data,
    export: async ({ buildingId, date }: { buildingId: string; date: string }) => {
      const result = await sdk.POST('/api/buildings/{buildingId}/residents/export', {
        params: { path: { buildingId } },
        body: { date },
        parseAs: 'blob',
      });

      if (!result.response.ok) throw new ApiSdkError(result.response.status, result.error);
      if (!(result.data instanceof Blob)) throw new Error('Không nhận được file Excel.');
      return result.data;
    },
  };
}

/** Browser-only file download; the SDK request has already applied auth/error handling. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
