export type Role = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: Role;
  displayName?: string | null;
  avatarId?: string | null;
  avatarUrl?: string;
}

export interface UpdateProfileInput {
  imageStorageId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
}

export interface ProductImage {
  id: string;
  fileId: string;
  url: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  imageId?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  images?: ProductImage[];
  stock: number;
}

export interface ProductInput {
  name: string;
  price: number;
  description: string;
  stock: number;
  imageStorageId?: string;
  categoryId?: string | null;
  imageStorageIds?: string[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'pending' | 'paid' | 'shipping' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentProvider = 'mock' | 'stripe';
export type ShipmentStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';
export type CouponType = 'percent' | 'fixed';
export type RefundStatus = 'pending' | 'completed' | 'failed';

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
}

export interface Address extends ShippingAddressInput {
  id: string;
  userId: string;
  isDefault: boolean;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  amount: number;
  status: PaymentStatus;
  externalId?: string | null;
  paidAt?: string | null;
  checkoutUrl?: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  carrier?: string | null;
  trackingCode?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
}

export interface CouponInput {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
}

export interface OrderCouponInfo {
  code: string;
  discountAmount: number;
  couponId: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  status: RefundStatus;
  reason?: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userEmail?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewInput {
  rating: number;
  comment?: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  shippingAddress?: ShippingAddressInput | null;
  payment?: Payment | null;
  shipment?: Shipment | null;
  coupon?: OrderCouponInfo | null;
  createdAt: string;
}

export interface CheckoutRequest {
  items: Array<{ productId: string; quantity: number }>;
  addressId?: string;
  shippingAddress?: ShippingAddressInput;
  shippingFee?: number;
  couponCode?: string;
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

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

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
