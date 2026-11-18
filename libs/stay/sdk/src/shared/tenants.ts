import type { StaySdk } from './client.js';
import { ApiSdkError, unwrap } from './errors.js';
import type { components, paths } from './generated.js';

export type TenantListQuery = NonNullable<paths['/api/tenants']['get']['parameters']['query']>;
export type TenantCreateInput =
  paths['/api/tenants']['post']['requestBody']['content']['application/json'];
export type TenantUpdateInput =
  paths['/api/tenants/{id}']['put']['requestBody']['content']['application/json'];
export type VehicleInput =
  paths['/api/tenants/{id}/vehicles']['post']['requestBody']['content']['application/json'];
export type TenantDocumentInput =
  paths['/api/tenants/{id}/documents']['post']['requestBody']['content']['application/json'];
export type TenantImportCommitInput = components['schemas']['TenantImportCommitInput'];
export type DuplicateTenantRef = components['schemas']['DuplicateTenantRef'];

/** `extensions.duplicateTenant` of a 400 (CCCD already used), else `undefined`. */
export function getDuplicateTenant(error: unknown): DuplicateTenantRef | undefined {
  if (!(error instanceof ApiSdkError) || !error.data || typeof error.data !== 'object')
    return undefined;

  const extensions: unknown = Reflect.get(error.data, 'extensions');
  const duplicate: unknown =
    extensions && typeof extensions === 'object'
      ? Reflect.get(extensions, 'duplicateTenant')
      : undefined;

  if (!duplicate || typeof duplicate !== 'object') return undefined;

  const field: unknown = Reflect.get(duplicate, 'field');
  const tenantId: unknown = Reflect.get(duplicate, 'tenantId');

  if (field !== 'idNumber' && field !== 'phone') return undefined;
  return { field, tenantId: typeof tenantId === 'string' ? tenantId : null };
}

/** `/api/tenants`: profiles, CCCD reveal, documents, vehicles and import. */
export function createTenantApi(sdk: StaySdk) {
  return {
    /** Paginated `{ data, meta }`. */
    list: async (query?: TenantListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/tenants', { params: { query }, signal })),
    detail: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/tenants/{id}', { params: { path: { id } }, signal })).data,
    create: async (body: TenantCreateInput) =>
      unwrap(await sdk.POST('/api/tenants', { body })).data,
    update: async ({ id, body }: { id: string; body: TenantUpdateInput }) =>
      unwrap(await sdk.PUT('/api/tenants/{id}', { params: { path: { id } }, body })).data,
    archive: async (id: string) =>
      unwrap(await sdk.POST('/api/tenants/{id}/archive', { params: { path: { id } } })).data,
    /** The full CCCD (audited on the server). */
    revealIdNumber: async (id: string) =>
      unwrap(await sdk.POST('/api/tenants/{id}/reveal-id', { params: { path: { id } } })).data,
    attachDocument: async ({ id, body }: { id: string; body: TenantDocumentInput }) =>
      unwrap(await sdk.POST('/api/tenants/{id}/documents', { params: { path: { id } }, body }))
        .data,
    addVehicle: async ({ id, body }: { id: string; body: VehicleInput }) =>
      unwrap(await sdk.POST('/api/tenants/{id}/vehicles', { params: { path: { id } }, body })).data,
    updateVehicle: async ({
      id,
      vehicleId,
      body,
    }: {
      id: string;
      vehicleId: string;
      body: VehicleInput;
    }) =>
      unwrap(
        await sdk.PUT('/api/tenants/{id}/vehicles/{vehicleId}', {
          params: { path: { id, vehicleId } },
          body,
        }),
      ).data,
    removeVehicle: async ({ id, vehicleId }: { id: string; vehicleId: string }) =>
      unwrap(
        await sdk.DELETE('/api/tenants/{id}/vehicles/{vehicleId}', {
          params: { path: { id, vehicleId } },
        }),
      ).data,
    /** Checks a CSV/XLSX file; writes nothing. */
    previewImport: async ({
      buildingId,
      file,
    }: {
      buildingId: string;
      file: Blob & { name?: string };
    }) => {
      const form = new FormData();

      form.append('file', file, file.name ?? 'import.csv');
      return unwrap(
        await sdk.POST('/api/tenants/import/preview', {
          params: { query: { buildingId } },
          body: { file: '' },
          bodySerializer: () => form,
        }),
      ).data;
    },
    /** Creates the valid rows; reuse `idempotencyKey` when retrying the same commit. */
    commitImport: async ({
      body,
      idempotencyKey,
    }: {
      body: TenantImportCommitInput;
      idempotencyKey: string;
    }) =>
      unwrap(
        await sdk.POST('/api/tenants/import', {
          params: { header: { 'Idempotency-Key': idempotencyKey } },
          body,
        }),
      ).data,
    /** The import template as a file. */
    template: async (format: 'xlsx' | 'csv' = 'xlsx') => {
      const result = await sdk.GET('/api/tenants/import/template', {
        params: { query: { format } },
        parseAs: 'blob',
      });

      if (!result.response.ok) throw new ApiSdkError(result.response.status, result.error);
      if (!(result.data instanceof Blob)) throw new Error('The template download is empty.');
      return result.data;
    },
  };
}
