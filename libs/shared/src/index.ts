export type Role = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: Role;
  displayName?: string | null;
  phone?: string | null;
  locale?: string;
  timezone?: string;
  accountStatus?: AccountStatus;
  emailVerified?: boolean;
  staffRole?: StaffRole | null;
  version?: number;
  avatarId?: string | null;
  avatarUrl?: string;
  hasPassword?: boolean;
}

export interface UpdateProfileInput {
  displayName?: string;
  phone?: string | null;
  imageStorageId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export type DescriptionFilter = 'all' | 'has' | 'none';

export const DESCRIPTION_FILTER_VALUES: readonly DescriptionFilter[] = ['all', 'has', 'none'];

/** Supplying any supported query parameter enables paginated category listing. */
export interface CategoryListQuery {
  page: number;
  pageSize: number;
  q?: string;
  description?: DescriptionFilter;
  sortBy?: keyof Pick<Category, 'name' | 'slug' | 'description'>;
  sortOrder?: 'asc' | 'desc';
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
  slug?: string;
  brand?: string;
  material?: string;
  careInstructions?: string;
  seoTitle?: string;
  seoDescription?: string;
  sizeGuideId?: string | null;
  expectedVersion?: number;
  name: string;
  price: number;
  description: string;
  stock: number;
  imageStorageId?: string;
  categoryId?: string | null;
  imageStorageIds?: string[];
}

export interface OrderItem {
  id?: string;
  sku?: string;
  size?: string;
  color?: string;
  imageUrl?: string;
  discountAmount?: number;
  lineTotal?: number;
  cancelledQuantity?: number;
  fulfilledQuantity?: number;
  returnedQuantity?: number;
  variantId?: string | null;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'pending' | 'paid' | 'shipping' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentProvider = 'mock' | 'stripe' | 'cod';
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
  perUserLimit?: number | null;
  variantIds?: string[];
  categoryIds?: string[];
  version?: number;
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
  perUserLimit?: number | null;
  variantIds?: string[];
  categoryIds?: string[];
  expectedVersion?: number;
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
  moderationStatus?: 'pending' | 'published' | 'hidden';
  verifiedPurchase?: boolean;
  mediaIds?: string[];
  reply?: string | null;
  version?: number;
  id: string;
  productId: string;
  userId: string;
  userEmail?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewInput {
  orderItemId?: string;
  mediaIds?: string[];
  rating: number;
  comment?: string;
}

export interface Order {
  lifecycleStatus?: OrderLifecycleStatus;
  version?: number;
  currency?: string;
  snapshot?: CheckoutQuoteSnapshot | null;
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

export interface UpdatePasswordInput {
  currentPassword?: string;
  newPassword: string;
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

/** Normalized list parameters; resource types restrict the public sort allowlist. */
export interface ListQuery<SortField extends string> {
  page: number;
  pageSize: number;
  q?: string;
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListQuery
  extends ListQuery<keyof Pick<Product, 'name' | 'price' | 'stock'> | 'createdAt'> {
  categoryId?: string;
  size?: string;
  color?: string;
  availability?: 'in_stock' | 'out_of_stock';
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
}

export interface OrderListQuery
  extends ListQuery<keyof Pick<Order, 'id' | 'userEmail' | 'status' | 'total' | 'createdAt'>> {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shipmentStatus?: ShipmentStatus;
  createdFrom?: string;
  createdTo?: string;
  minTotal?: number;
  maxTotal?: number;
}

export interface CouponListQuery
  extends ListQuery<
    | keyof Pick<Coupon, 'code' | 'type' | 'value' | 'usedCount' | 'startsAt' | 'endsAt'>
    | 'createdAt'
  > {
  type?: CouponType;
  isActive?: boolean;
}

export interface RefundListQuery
  extends ListQuery<keyof Pick<Refund, 'amount' | 'status' | 'createdAt'>> {
  status?: RefundStatus;
  minAmount?: number;
  maxAmount?: number;
  createdFrom?: string;
  createdTo?: string;
}

export interface ReviewListQuery extends ListQuery<keyof Pick<Review, 'rating' | 'createdAt'>> {
  rating?: number;
}

export interface AddressListQuery
  extends ListQuery<keyof Pick<Address, 'fullName' | 'city' | 'isDefault'> | 'createdAt'> {
  city?: string;
  isDefault?: boolean;
}

export type Permission =
  | 'system:read'
  | 'system:manage'
  | 'staff:read'
  | 'staff:manage'
  | 'customer:read'
  | 'customer:manage'
  | 'audit:read'
  | 'catalog:read'
  | 'catalog:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'settings:manage'
  | 'promotion:read'
  | 'promotion:write'
  | 'order:read'
  | 'order:manage'
  | 'payment:read'
  | 'payment:manage'
  | 'fulfillment:read'
  | 'fulfillment:manage'
  | 'return:read'
  | 'return:manage'
  | 'refund:read'
  | 'refund:manage'
  | 'review:read'
  | 'review:moderate'
  | 'review:reply'
  | 'content:read'
  | 'content:write'
  | 'content:publish'
  | 'support:read'
  | 'support:manage'
  | 'notification:read'
  | 'notification:manage'
  | 'report:read'
  | 'report:export';

export type StaffRole =
  | 'owner'
  | 'administrator'
  | 'catalog'
  | 'content'
  | 'support'
  | 'fulfillment';
export type AccountStatus = 'active' | 'blocked' | 'closed';
export type OrderLifecycleStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'processing'
  | 'completed'
  | 'cancelled';
export type PaymentAttemptStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'cancelled';
export type FulfillmentStatus =
  | 'pending_pack'
  | 'packed'
  | 'ready_for_pickup'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'returned'
  | 'lost'
  | 'cancelled';
export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'in_transit'
  | 'received'
  | 'inspected'
  | 'completed'
  | 'rejected'
  | 'cancelled';
export type RefundAttemptStatus = 'requested' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
export type ExchangeStatus =
  | 'requested'
  | 'approved'
  | 'awaiting_return'
  | 'return_received'
  | 'replacement_processing'
  | 'completed'
  | 'rejected'
  | 'cancelled';
export type ProductPublicationStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'dead_letter' | 'cancelled';
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
export type CapabilityResponse = { contractVersion: string; permissions: Permission[] };

export interface ProfilePreferences {
  locale: 'vi' | 'en';
  timezone: string;
}
export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}
export type AccountTokenPurpose =
  | 'verify_email'
  | 'password_reset'
  | 'email_change'
  | 'staff_invitation';
export interface SessionSummary {
  id: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export const UPLOAD_PURPOSES = [
  'avatar',
  'product',
  'review',
  'return',
  'support',
  'blog',
] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export interface UploadTicket {
  id: string;
  purpose: UploadPurpose;
  resourceId: string | null;
  status: 'pending' | 'completed' | 'rejected';
  private: boolean;
  expiresAt: string;
  fileId: string | null;
  maxBytes: number;
}

export type InventoryMovementKind =
  | 'opening'
  | 'receipt'
  | 'adjust'
  | 'reserve'
  | 'release'
  | 'commit'
  | 'return';
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  size: string;
  color: string;
  price: number;
  status: 'active' | 'inactive';
  isDefault: boolean;
  imageIds: string[];
  available: number;
  version: number;
}
export interface InventoryBalance extends ProductVariant {
  onHand: number;
  reserved: number;
}
export interface SizeGuide {
  id: string;
  name: string;
  measurements: JsonValue;
  version: number;
}

export interface InventoryListQuery
  extends ListQuery<'sku' | 'price' | 'onHand' | 'reserved' | 'createdAt'> {
  productId?: string;
  status?: 'active' | 'inactive';
}
export interface CatalogProduct extends Product {
  slug: string;
  status: ProductPublicationStatus;
  brand: string;
  material: string;
  careInstructions: string;
  seoTitle: string;
  seoDescription: string;
  sizeGuideId: string | null;
  version: number;
}

export interface ShopSettings {
  name: string;
  supportEmail: string;
  supportPhone: string;
  logoFileId: string | null;
  defaultLocale: string;
  currency: string;
  timezone: string;
  version: number;
}
export interface CommerceSettings {
  quoteTtlSeconds: number;
  reservationTtlSeconds: number;
  returnWindowDays: number;
  version: number;
}
export interface ShippingMethod {
  id: string;
  name: string;
  cities: string[];
  active: boolean;
  codEnabled: boolean;
  fee: number;
  freeAbove: number | null;
  estimatedDays: number;
  version: number;
}
export interface ShippingQuote {
  methodId: string;
  methodName: string;
  methodVersion: number;
  fee: number;
  codEnabled: boolean;
  estimatedDays: number;
  currency: string;
}

export interface CartLineInput {
  variantId: string;
  quantity: number;
}
export type CartWarning = 'unavailable' | 'insufficient_stock' | 'price_changed';
export interface CartItem {
  id: string;
  variantId: string;
  productId: string | null;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  available: number;
  warnings: CartWarning[];
}
export interface Cart {
  id: string;
  version: number;
  items: CartItem[];
  subtotal: number;
  currency: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  variantIds: string[];
  categoryIds: string[];
  priority: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  version: number;
}
export interface DiscountLine {
  variantId: string;
  categoryId: string | null;
  quantity: number;
  unitPrice: number;
}
export interface DiscountResult {
  amount: number;
  allocations: number[];
  couponId: string | null;
  promotionId: string | null;
  code: string | null;
  ruleVersion: number | null;
}
export interface PromotionListQuery extends ListQuery<'name' | 'priority' | 'createdAt'> {
  isActive?: boolean;
}

export interface QuoteItemSnapshot extends DiscountLine {
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  imageUrl: string;
  discountAmount: number;
  lineTotal: number;
}
export interface CheckoutQuoteInput {
  items: CartLineInput[];
  addressId?: string;
  shippingAddress?: ShippingAddressInput;
  shippingMethodId?: string;
  couponCode?: string;
}
export interface CheckoutQuoteSnapshot {
  items: QuoteItemSnapshot[];
  addressId: string | null;
  shippingAddress: ShippingAddressInput;
  shipping: ShippingQuote;
  discount: DiscountResult;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  currency: string;
  policyVersion: number;
  reservationTtlSeconds: number;
  returnWindowDays: number;
}
export interface CheckoutQuote extends CheckoutQuoteSnapshot {
  id: string;
  status: 'active' | 'consumed' | 'expired';
  expiresAt: string;
}

export interface OrderQuantityInput {
  orderItemId: string;
  quantity: number;
}
export interface CancellationRequest {
  id: string;
  orderId: string;
  status: 'requested' | 'approved' | 'rejected';
  reason: string;
  resolution: string | null;
  items: OrderQuantityInput[];
  version: number;
  createdAt: string;
}

export interface PaymentAttempt {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  status: PaymentAttemptStatus;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  reconciliation: 'unreconciled' | 'matched' | 'late_paid' | 'duplicate_charge' | 'mismatch';
  expiresAt: string;
  paidAt: string | null;
  version: number;
}

export interface FulfillmentShipment {
  id: string;
  orderId: string;
  fulfillmentStatus: FulfillmentStatus;
  carrier: string | null;
  trackingCode: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  version: number;
  items: Array<OrderQuantityInput & { id: string }>;
}

export interface ReturnInspection {
  orderItemId: string;
  saleableQuantity: number;
  damagedQuantity: number;
}
export interface ReturnRequest {
  id: string;
  orderId: string;
  status: ReturnStatus;
  reason: string;
  resolution: string | null;
  items: OrderQuantityInput[];
  evidenceIds: string[];
  inspection: ReturnInspection[] | null;
  version: number;
  createdAt: string;
}

export type ContentKind = 'post' | 'page';
export type ContentBlock =
  | { type: 'paragraph' | 'heading'; text: string }
  | { type: 'image'; fileId: string; alt: string }
  | { type: 'link'; label: string; href: string };
export interface ContentDraftInput {
  slug: string;
  title: string;
  excerpt: string;
  body: ContentBlock[];
  coverFileId: string | null;
  taxonomyIds: string[];
  seoTitle: string;
  seoDescription: string;
}
export interface PublishedContent extends ContentDraftInput {
  id: string;
  kind: ContentKind;
  version: number;
  publishedAt: string;
}
export interface ContentEntry extends ContentDraftInput {
  id: string;
  kind: ContentKind;
  status: ContentStatus;
  version: number;
  publishedAt: string | null;
  scheduledAt: string | null;
}

export interface NotificationPreferences {
  transactionalEmail: boolean;
  marketingEmail: boolean;
  stockEmail: boolean;
  version: number;
}
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
}

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export interface SupportTicket {
  id: string;
  orderId: string | null;
  subject: string;
  category: string;
  status: SupportTicketStatus;
  assigneeId: string | null;
  version: number;
  createdAt: string;
}
export interface SupportMessage {
  id: string;
  body: string;
  internal: boolean;
  attachmentIds: string[];
  createdAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  children: NavigationItem[];
}
export type MerchandisingPayload =
  | { kind: 'collection'; title: string; productIds: string[] }
  | { kind: 'banner'; title: string; imageFileId: string; href: string; placement: 'home' | 'shop' }
  | { kind: 'navigation'; items: NavigationItem[] }
  | {
      kind: 'home';
      sections: Array<{ id: string; type: 'collection' | 'banner'; entryId: string }>;
    };
export interface MerchandisingEntry {
  id: string;
  key: string;
  payload: MerchandisingPayload;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  version: number;
}

export type ReportKind = 'sales' | 'orders' | 'inventory' | 'products';
export interface ReportQuery {
  from: string;
  to: string;
  timezone: string;
}
export interface ReportExport {
  id: string;
  report: ReportKind;
  status: 'pending' | 'ready' | 'failed';
  expiresAt: string;
  downloadUrl: string | null;
}

export interface ExchangeLine {
  orderItemId: string;
  variantId: string;
  quantity: number;
}
export interface ExchangeRequest {
  id: string;
  orderId: string;
  returnId: string;
  status: ExchangeStatus;
  items: ExchangeLine[];
  reason: string;
  priceDifference: number | null;
  originalRefundAmount: number | null;
  quoteId: string | null;
  replacementOrderId: string | null;
  refundId: string | null;
  version: number;
  settlementPolicy: 'refund_and_repurchase';
}
