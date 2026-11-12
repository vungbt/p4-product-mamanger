import type { StaySdk } from './client.js';
import { ApiSdkError, unwrap } from './errors.js';
import type { paths } from './generated.js';

type JsonBody<
  Path extends keyof paths,
  Method extends 'post' | 'put',
> = paths[Path][Method] extends {
  requestBody?: { content: { 'application/json': infer Body } };
}
  ? Body
  : never;

export type LandlordProfileInput = JsonBody<'/api/settings/landlord', 'put'>;
export type ContractTemplateCreateInput = JsonBody<'/api/contract-templates', 'post'>;
export type ContractTemplateUpdateInput = JsonBody<'/api/contract-templates/{id}', 'put'>;
export type ContractTemplateVersionInput = JsonBody<
  '/api/contract-templates/{id}/versions',
  'post'
>;
export type ContractTemplatePreviewInput = JsonBody<'/api/contract-templates/{id}/preview', 'post'>;
export type ContractTemplateListQuery = NonNullable<
  paths['/api/contract-templates']['get']['parameters']['query']
>;
export type DocumentCreateInput = JsonBody<'/api/contracts/{id}/documents', 'post'>;
export type DocumentUpdateInput = JsonBody<'/api/documents/{id}', 'put'>;
export type DocumentSendInput = JsonBody<'/api/documents/{id}/send', 'post'>;
export type DocumentOwnerSignInput = JsonBody<'/api/documents/{id}/owner-sign', 'post'>;
export type DocumentCancelInput = JsonBody<'/api/documents/{id}/cancel', 'post'>;
export type DocumentPaperInput = {
  file: Blob & { name?: string };
  signedOn: string;
  version: number;
};

const path = (id: string) => ({ params: { path: { id } } });

async function fileOf(result: { response: Response; data?: unknown; error?: unknown }) {
  if (!result.response.ok) throw new ApiSdkError(result.response.status, result.error);
  if (!(result.data instanceof Blob)) throw new Error('The file download is empty.');
  return result.data;
}

/** ST-30a: landlord profile, contract templates and contract documents (staff). */
export function createDocumentApi(sdk: StaySdk) {
  return {
    landlord: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/settings/landlord', { signal })).data,
    updateLandlord: async (body: LandlordProfileInput) =>
      unwrap(await sdk.PUT('/api/settings/landlord', { body })).data,
    variables: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/contract-template-variables', { signal })).data,
    templates: async (query?: ContractTemplateListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/contract-templates', { params: { query }, signal })).data,
    template: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/contract-templates/{id}', { ...path(id), signal })).data,
    templateVersion: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/contract-template-versions/{id}', { ...path(id), signal })).data,
    createTemplate: async (body: ContractTemplateCreateInput) =>
      unwrap(await sdk.POST('/api/contract-templates', { body })).data,
    updateTemplate: async ({ id, body }: { id: string; body: ContractTemplateUpdateInput }) =>
      unwrap(await sdk.PUT('/api/contract-templates/{id}', { ...path(id), body })).data,
    saveTemplateVersion: async ({ id, body }: { id: string; body: ContractTemplateVersionInput }) =>
      unwrap(await sdk.POST('/api/contract-templates/{id}/versions', { ...path(id), body })).data,
    previewTemplate: async ({ id, body }: { id: string; body: ContractTemplatePreviewInput }) =>
      unwrap(await sdk.POST('/api/contract-templates/{id}/preview', { ...path(id), body })).data,
    /** Converts a Word file to template HTML (nothing is stored). */
    importDocx: async (file: Blob & { name?: string }) => {
      const form = new FormData();

      form.append('file', file, file.name ?? 'template.docx');
      return unwrap(
        await sdk.POST('/api/contract-templates/import-docx', {
          body: { file: '' },
          bodySerializer: () => form,
        }),
      ).data;
    },
    documents: async (contractId: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/contracts/{id}/documents', { ...path(contractId), signal })).data,
    createDocument: async ({
      contractId,
      body,
    }: {
      contractId: string;
      body: DocumentCreateInput;
    }) =>
      unwrap(await sdk.POST('/api/contracts/{id}/documents', { ...path(contractId), body })).data,
    document: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/documents/{id}', { ...path(id), signal })).data,
    updateDocument: async ({ id, body }: { id: string; body: DocumentUpdateInput }) =>
      unwrap(await sdk.PUT('/api/documents/{id}', { ...path(id), body })).data,
    sendDocument: async ({ id, body }: { id: string; body: DocumentSendInput }) =>
      unwrap(await sdk.POST('/api/documents/{id}/send', { ...path(id), body })).data,
    ownerSign: async ({ id, body }: { id: string; body: DocumentOwnerSignInput }) =>
      unwrap(await sdk.POST('/api/documents/{id}/owner-sign', { ...path(id), body })).data,
    cancelDocument: async ({ id, body }: { id: string; body: DocumentCancelInput }) =>
      unwrap(await sdk.POST('/api/documents/{id}/cancel', { ...path(id), body })).data,
    /** Paper fallback: multipart scan (PDF/JPG/PNG) + signing date. */
    markPaper: async ({ id, body }: { id: string; body: DocumentPaperInput }) => {
      const form = new FormData();

      form.append('signedOn', body.signedOn);
      form.append('version', String(body.version));
      form.append('file', body.file, body.file.name ?? 'scan.pdf');
      return unwrap(
        await sdk.POST('/api/documents/{id}/paper', {
          ...path(id),
          body: { file: '' },
          bodySerializer: () => form,
        }),
      ).data;
    },
    supersede: async (id: string) =>
      unwrap(await sdk.POST('/api/documents/{id}/supersede', path(id))).data,
    pdf: async (id: string) =>
      fileOf(await sdk.GET('/api/documents/{id}/pdf', { ...path(id), parseAs: 'blob' })),
    scan: async (id: string) =>
      fileOf(await sdk.GET('/api/documents/{id}/scan', { ...path(id), parseAs: 'blob' })),
  };
}
