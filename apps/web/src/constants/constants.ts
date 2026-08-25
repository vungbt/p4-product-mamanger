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
    home: '/',
    login: '/login',
    register: '/register',
    password: '/account/password',
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

/** Re-exported from `@p4/auth` so trainees can keep importing from constants as before */
export { AUTH_STORAGE_KEY, FAKE_AUTH } from '@p4/auth';
