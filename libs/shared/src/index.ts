export type Role = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  imageId?: string | null;
  stock: number;
}

export interface ProductInput {
  name: string;
  price: number;
  description: string;
  stock: number;
  /** Cloudinary public_id (temp) sau khi upload qua signed URL */
  imageStorageId?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface DashboardStats {
  totalRevenue: number;
  orderCount: number;
  lowStockProducts: Product[];
}

/** Query params for list endpoints */
export interface PaginationQuery {
  page: number;
  pageSize: number;
  q: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Standard success envelope */
export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

/** Standard paginated list envelope */
export interface ApiPaginatedSuccess<T> {
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  extensions?: Record<string, unknown>;
}
