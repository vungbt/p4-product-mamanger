// Re-export @p4/api-client — import from here or from `@p4/api-client`.
// Call the API through the typed SDK: `getApiSdk().GET('/api/products', …)` with `unwrap`.
export {
  categoryKeys,
  configureApiClient,
  getAccessToken,
  getApiSdk,
  orderKeys,
  productKeys,
  queryKeysFactory,
  useQueryClient,
} from '@p4/api-client';
