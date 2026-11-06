import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../src/react/index.js';
import { createApiSdk } from '../src/shared/index.js';

const sdk = createApiSdk({ baseUrl: 'https://api.example.invalid' });
void sdk.GET('/api/categories', { params: { query: { sortBy: 'name', sortOrder: 'asc' } } });
// @ts-expect-error Unknown endpoint must be rejected by the generated contract.
void sdk.GET('/api/not-a-real-endpoint', {});
// @ts-expect-error Unsupported sort field must be rejected.
void sdk.GET('/api/categories', { params: { query: { sortBy: 'categoryName' } } });
// @ts-expect-error Required category name and slug must not be omitted.
void sdk.POST('/api/categories', { body: { description: 'Missing fields' } });
// @ts-expect-error Path parameters must be supplied.
void sdk.GET('/api/categories/{id}', {});

// Hook variables and filters come from the same generated API contract.
function checkHookTypes() {
  const query = useCategories({ q: 'shirt', pageSize: 10, sortBy: 'slug' });
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  create.mutate({ name: 'Clothing', slug: 'clothing' });
  update.mutate({ id: 'category-1', body: { name: 'New', slug: 'new' } });
  remove.mutate('category-1');
  // @ts-expect-error Unsupported category sort field.
  useCategories({ sortBy: 'categoryName' });
  // @ts-expect-error Category mutations require a slug.
  create.mutate({ name: 'Missing slug' });
  // @ts-expect-error Update requires a category ID.
  update.mutate({ body: { name: 'New', slug: 'new' } });
  return query.data?.data;
}
void checkHookTypes;
