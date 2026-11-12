import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { StaySdk } from '../shared/client.js';
import { type ContractTemplateListQuery, createDocumentApi } from '../shared/documents.js';
import { useStaySdk } from './provider.js';

export const documentKeys = {
  all: ['stay', 'documents'] as const,
  landlord: ['stay', 'documents', 'landlord'] as const,
  variables: ['stay', 'documents', 'variables'] as const,
  templates: (query?: ContractTemplateListQuery) =>
    ['stay', 'documents', 'templates', query ?? {}] as const,
  template: (id: string) => ['stay', 'documents', 'template', id] as const,
  templateVersion: (id: string) => ['stay', 'documents', 'template-version', id] as const,
  contractDocuments: (contractId: string) =>
    ['stay', 'documents', 'contract', contractId] as const,
  document: (id: string) => ['stay', 'documents', 'document', id] as const,
};

export function documentQueryOptions(sdk: StaySdk) {
  const api = createDocumentApi(sdk);

  return {
    landlord: () =>
      queryOptions({ queryKey: documentKeys.landlord, queryFn: ({ signal }) => api.landlord(signal) }),
    variables: () =>
      queryOptions({
        queryKey: documentKeys.variables,
        queryFn: ({ signal }) => api.variables(signal),
        staleTime: Number.POSITIVE_INFINITY,
      }),
    templates: (query?: ContractTemplateListQuery) =>
      queryOptions({
        queryKey: documentKeys.templates(query),
        queryFn: ({ signal }) => api.templates(query, signal),
      }),
    template: (id: string) =>
      queryOptions({
        queryKey: documentKeys.template(id),
        queryFn: ({ signal }) => api.template(id, signal),
        enabled: Boolean(id),
      }),
    templateVersion: (id: string | null) =>
      queryOptions({
        queryKey: documentKeys.templateVersion(id ?? ''),
        queryFn: ({ signal }) => api.templateVersion(id ?? '', signal),
        enabled: Boolean(id),
      }),
    contractDocuments: (contractId: string) =>
      queryOptions({
        queryKey: documentKeys.contractDocuments(contractId),
        queryFn: ({ signal }) => api.documents(contractId, signal),
        enabled: Boolean(contractId),
      }),
    document: (id: string) =>
      queryOptions({
        queryKey: documentKeys.document(id),
        queryFn: ({ signal }) => api.document(id, signal),
        enabled: Boolean(id),
      }),
  };
}

export function documentMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createDocumentApi(sdk);
  const refresh = () => client.invalidateQueries({ queryKey: documentKeys.all });

  return {
    updateLandlord: () =>
      mutationOptions({ mutationFn: api.updateLandlord, retry: false, onSuccess: refresh }),
    createTemplate: () =>
      mutationOptions({ mutationFn: api.createTemplate, retry: false, onSuccess: refresh }),
    updateTemplate: () =>
      mutationOptions({ mutationFn: api.updateTemplate, retry: false, onSuccess: refresh }),
    saveTemplateVersion: () =>
      mutationOptions({ mutationFn: api.saveTemplateVersion, retry: false, onSuccess: refresh }),
    previewTemplate: () => mutationOptions({ mutationFn: api.previewTemplate, retry: false }),
    importDocx: () => mutationOptions({ mutationFn: api.importDocx, retry: false }),
    createDocument: () =>
      mutationOptions({ mutationFn: api.createDocument, retry: false, onSuccess: refresh }),
    updateDocument: () =>
      mutationOptions({ mutationFn: api.updateDocument, retry: false, onSuccess: refresh }),
    sendDocument: () =>
      mutationOptions({ mutationFn: api.sendDocument, retry: false, onSuccess: refresh }),
    ownerSign: () => mutationOptions({ mutationFn: api.ownerSign, retry: false, onSuccess: refresh }),
    cancelDocument: () =>
      mutationOptions({ mutationFn: api.cancelDocument, retry: false, onSuccess: refresh }),
    markPaper: () => mutationOptions({ mutationFn: api.markPaper, retry: false, onSuccess: refresh }),
    supersede: () => mutationOptions({ mutationFn: api.supersede, retry: false, onSuccess: refresh }),
  };
}

export const useLandlordProfile = () => useQuery(documentQueryOptions(useStaySdk()).landlord());
export const useTemplateVariables = () => useQuery(documentQueryOptions(useStaySdk()).variables());
export const useContractTemplates = (query?: ContractTemplateListQuery) =>
  useQuery(documentQueryOptions(useStaySdk()).templates(query));
export const useContractTemplate = (id: string) =>
  useQuery(documentQueryOptions(useStaySdk()).template(id));
export const useContractTemplateVersion = (id: string | null) =>
  useQuery(documentQueryOptions(useStaySdk()).templateVersion(id));
export const useContractDocuments = (contractId: string) =>
  useQuery(documentQueryOptions(useStaySdk()).contractDocuments(contractId));
export const useContractDocument = (id: string) =>
  useQuery(documentQueryOptions(useStaySdk()).document(id));

function useDocumentMutations() {
  return documentMutationOptions(useStaySdk(), useQueryClient());
}

export const useUpdateLandlordProfile = () => useMutation(useDocumentMutations().updateLandlord());
export const useCreateContractTemplate = () => useMutation(useDocumentMutations().createTemplate());
export const useUpdateContractTemplate = () => useMutation(useDocumentMutations().updateTemplate());
export const useSaveContractTemplateVersion = () =>
  useMutation(useDocumentMutations().saveTemplateVersion());
export const usePreviewContractTemplate = () =>
  useMutation(useDocumentMutations().previewTemplate());
export const useImportDocx = () => useMutation(useDocumentMutations().importDocx());
export const useCreateContractDocument = () => useMutation(useDocumentMutations().createDocument());
export const useUpdateContractDocument = () => useMutation(useDocumentMutations().updateDocument());
export const useSendContractDocument = () => useMutation(useDocumentMutations().sendDocument());
export const useOwnerSignDocument = () => useMutation(useDocumentMutations().ownerSign());
export const useCancelContractDocument = () => useMutation(useDocumentMutations().cancelDocument());
export const useMarkDocumentPaper = () => useMutation(useDocumentMutations().markPaper());
export const useSupersedeDocument = () => useMutation(useDocumentMutations().supersede());
