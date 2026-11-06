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
  const total: number | undefined = query.data?.meta?.total;
  void total;
  return query.data?.data;
}
void checkHookTypes;

// List contracts: filters are endpoint-specific and flow through the SDK unchanged.
void sdk.GET('/api/products', {
  params: {
    query: {
      q: 'shirt',
      page: 2,
      pageSize: 10,
      categoryId: 'category',
      size: 'M',
      color: 'red',
      availability: 'in_stock',
      minPrice: 100,
      maxPrice: 1000,
      minRating: 4,
      sortBy: 'price',
      sortOrder: 'desc',
    },
  },
});
void sdk.GET('/api/orders', {
  params: {
    query: {
      q: 'customer',
      page: 1,
      pageSize: 10,
      status: 'pending',
      paymentStatus: 'paid',
      shipmentStatus: 'shipped',
      minTotal: 100,
      createdFrom: '2026-01-01',
      sortBy: 'total',
      sortOrder: 'desc',
    },
  },
});
void sdk.GET('/api/admin/inventory', {
  params: {
    query: {
      q: 'SKU-M',
      page: 1,
      pageSize: 10,
      productId: 'product',
      status: 'active',
      sortBy: 'onHand',
      sortOrder: 'asc',
    },
  },
});
void sdk.GET('/api/notifications', {
  params: { query: { q: 'order', page: 1, pageSize: 10, sortBy: 'createdAt', sortOrder: 'desc' } },
});
// @ts-expect-error Product sort fields are checked against the API allowlist.
void sdk.GET('/api/products', { params: { query: { sortBy: 'categoryName' } } });
// @ts-expect-error Prices must be numbers, not unparsed URL strings.
void sdk.GET('/api/products', { params: { query: { minPrice: '100' } } });
// @ts-expect-error Order status is a contract enum.
void sdk.GET('/api/orders', { params: { query: { status: 'made_up_status' } } });
// @ts-expect-error Inventory sorting cannot use product name.
void sdk.GET('/api/admin/inventory', { params: { query: { sortBy: 'name' } } });
// @ts-expect-error The read filter uses the readStatus enum, not an arbitrary boolean field.
void sdk.GET('/api/notifications', { params: { query: { unread: true } } });

void sdk.GET('/api/notifications', {
  params: {
    query: {
      q: 'order',
      readStatus: 'unread',
      type: 'order.placed',
      sortBy: 'title',
      sortOrder: 'asc',
    },
  },
});

void sdk.GET('/api/admin/inventory/movements', {
  params: {
    query: {
      q: 'adjust',
      kind: 'return',
      variantId: 'variant',
      createdFrom: '2026-01-01',
      sortBy: 'quantity',
      sortOrder: 'desc',
    },
  },
});
void sdk.GET('/api/admin/support/tickets', {
  params: {
    query: {
      q: 'order',
      status: 'open',
      category: 'order',
      assigneeId: 'staff',
      sortBy: 'subject',
    },
  },
});
void sdk.GET('/api/admin/returns', {
  params: { query: { status: 'received', sortBy: 'status', orderId: 'order' } },
});
void sdk.GET('/api/admin/exchanges', {
  params: { query: { status: 'return_received', sortBy: 'status' } },
});
void sdk.GET('/api/post-categories', {
  params: { query: { q: 'fashion', sortBy: 'slug', pageSize: 10 } },
});
void sdk.GET('/api/admin/notification-templates', {
  params: { query: { locale: 'vi', type: 'order.placed', q: 'Order' } },
});
// @ts-expect-error Unsupported movement kind cannot bypass the shared contract.
void sdk.GET('/api/admin/inventory/movements', { params: { query: { kind: 'restock' } } });
void sdk.GET('/api/support/tickets/{id}/messages', {
  // @ts-expect-error Message lists cannot sort by the parent ticket's subject.
  params: { path: { id: 'ticket' }, query: { sortBy: 'subject' } },
});
void sdk.GET('/api/admin/posts/{id}/revisions', {
  // @ts-expect-error Revision lists must use revision fields rather than parent entry fields.
  params: { path: { id: 'post' }, query: { sortBy: 'title' } },
});
