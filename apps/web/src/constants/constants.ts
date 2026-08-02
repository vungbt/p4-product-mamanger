// Dev: Vite proxy `/api` → localhost:3001. Prod (Vercel): set VITE_API_URL=https://your-api-host
export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api`
  : '/api';

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const ROUTES = {
  storefront: {
    login: '/login',
    shop: '/shop',
    cart: '/cart',
  },
  admin: {
    login: '/admin/login',
    dashboard: '/admin/dashboard',
    products: '/admin/products',
    'product-new': '/admin/products/new',
    'product-edit': (id: string) => `/admin/products/${id}/edit`,
    orders: '/admin/orders',
  },
} as const;

export const AUTH_STORAGE_KEY = 'p4_auth';

/** Fake auth để demo structure — học viên thay bằng API thật */
export const FAKE_AUTH = {
  admin: {
    username: 'admin',
    password: 'admin',
    user: {
      id: '1',
      email: 'admin@demo.com',
      role: ROLES.ADMIN,
    },
  },
  user: {
    username: 'user',
    password: 'user',
    user: {
      id: '2',
      email: 'user@demo.com',
      role: ROLES.USER,
    },
  },
} as const;
