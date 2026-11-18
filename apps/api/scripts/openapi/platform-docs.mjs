import { operationNames } from '../../../../libs/api-sdk/scripts/operation-names.mjs';

const platforms = {
  storefront: {
    name: 'Storefront',
    description: 'Catalog công khai và các luồng mua hàng của khách.',
  },
  admin: {
    name: 'Admin',
    description: 'Quản trị tài nguyên; backend kiểm tra quyền theo operation.',
  },
  shared: {
    name: 'Shared',
    description: 'Auth, hồ sơ, file, process và tài nguyên theo owner/quyền dùng chung.',
  },
  integration: {
    name: 'Integration',
    description: 'Callback/provider/webhook; dùng xác thực riêng của tích hợp.',
  },
  operations: { name: 'Operations', description: 'Health, metrics và vận hành hệ thống.' },
};

const shortHooks = {
  get_api_admin_products: 'useProducts',
  get_api_admin_products_id: 'useProduct',
  get_api_admin_products_id_variants: 'useProductVariants',
  get_api_products: 'useStorefrontProducts',
  get_api_products_id: 'useStorefrontProduct',
  get_api_products_by_slug_slug: 'useProductBySlug',
  post_api_products: 'useCreateProduct',
  put_api_products_id: 'useUpdateProduct',
  delete_api_products_id: 'useDeleteProduct',
  patch_api_products_id_publication: 'useUpdateProductPublication',
  post_api_products_id_variants: 'useCreateProductVariant',
  patch_api_products_id_variants_variantId: 'useUpdateProductVariant',
  patch_api_products_id_variants_variantId_images: 'useUpdateProductVariantImages',
  post_api_products_id_images: 'useAddProductImage',
  delete_api_products_id_images_imageId: 'useRemoveProductImage',
  get_api_categories: 'useCategories',
  get_api_categories_id: 'useCategory',
  post_api_categories: 'useCreateCategory',
  put_api_categories_id: 'useUpdateCategory',
  delete_api_categories_id: 'useDeleteCategory',
  get_api_me_capabilities: 'useCapabilities',
};

function platformFor(path, method, operation) {
  if (/\/webhook(?:\/|$)|\/callback(?:\/|$)/.test(path)) return 'integration';
  if (path.startsWith('/health') || path.startsWith('/api/internal/')) return 'operations';
  if (path.startsWith('/api/admin/')) return 'admin';
  if (
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/me/') ||
    path.startsWith('/api/files/') ||
    path.startsWith('/api/processes')
  )
    return 'shared';
  // Route guards supply this description; URL prefixes alone do not determine access.
  if (operation.description?.includes('**Quyền:**')) return 'admin';
  if (operation.description?.includes('**Vai trò:** admin')) return 'admin';
  if (
    !operation.security?.length ||
    path.startsWith('/api/cart') ||
    path.startsWith('/api/checkout') ||
    path.startsWith('/api/wishlist') ||
    path.startsWith('/api/addresses') ||
    path.endsWith('/mine') ||
    (path === '/api/orders' && method === 'post')
  )
    return 'storefront';
  return 'shared';
}

/** Documentation audiences are navigation labels, never authorization rules. */
export function decoratePlatformDocs(spec) {
  const tags = new Map();
  const originalTags = new Map(spec.tags.map((tag) => [tag.name, tag.description]));
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(item)) {
      if (!operation.operationId) continue;
      const platform = platformFor(path, method, operation);
      const resource = operation.tags[0];
      const tag = `${platforms[platform].name} / ${resource}`;
      const names = operationNames(operation.operationId, method);
      const alias = shortHooks[operation.operationId];
      operation.tags = [tag];
      operation['x-platform'] = platform;
      operation['x-resource'] = resource;
      operation['x-sdk'] = {
        ...names,
        ...(alias ? { resourceHook: alias } : {}),
        reactPackage: '@p4/api-sdk/react',
        sharedPackage: '@p4/api-sdk/shared',
      };
      const sample =
        method === 'get'
          ? `import { ${names.hook} } from '@p4/api-sdk/react';\nimport type { ${names.input} } from '@p4/api-sdk/shared';\n\nexport function useExample(input: ${names.input}) {\n  return ${names.hook}(input, { enabled: true });\n}`
          : `import { ${names.hook} } from '@p4/api-sdk/react';\nimport type { ${names.input} } from '@p4/api-sdk/shared';\n\nexport function useExample(input: ${names.input}) {\n  const mutation = ${names.hook}();\n  const submit = () => mutation.mutateAsync(input);\n  return { ...mutation, submit };\n}`;
      operation['x-codeSamples'] = [
        { lang: 'TypeScript', label: 'SDK · React Query', source: sample },
      ];
      operation.description = [
        operation.description,
        `### Platform và SDK\nNhóm sử dụng: **${platforms[platform].name}**. Đây là nhãn tài liệu; quyền và owner vẫn do API kiểm tra.\n\n| Export | Tên |\n| --- | --- |\n| Hook | \`${names.hook}\` |\n| Helper | \`${names.helper}\` |\n| Input | \`${names.input}\` |\n| Options | \`${names.options}\` |${alias ? `\n| Resource hook | \`${alias}\` |` : ''}\n\nHooks import từ \`@p4/api-sdk/react\`; helper/input từ \`@p4/api-sdk/shared\`. Hooks không tự gate permission; dùng capabilities và \`enabled\` khi cần.`,
        `\`\`\`tsx\n${sample}\n\`\`\``,
      ]
        .filter(Boolean)
        .join('\n\n');
      tags.set(tag, {
        name: tag,
        description: `${platforms[platform].description}\n\n${originalTags.get(resource) ?? ''}`,
      });
    }
  }
  spec.tags = [...tags.values()].sort((a, b) => a.name.localeCompare(b.name));
  spec['x-tagGroups'] = Object.entries(platforms)
    .map(([, platform]) => ({
      name: platform.name,
      tags: spec.tags
        .filter((tag) => tag.name.startsWith(`${platform.name} / `))
        .map((tag) => tag.name),
    }))
    .filter((group) => group.tags.length);
  return spec;
}
