import { sequelize } from '@/sequelize/index.js';
import {
  AccountTokenModel,
  initAccountTokenModel,
} from '@/sequelize/models/account-token.model.js';
import { AddressModel, initAddressModel } from '@/sequelize/models/address.model.js';
import { AuditLogModel, initAuditLogModel } from '@/sequelize/models/audit-log.model.js';
import { CategoryModel, initCategoryModel } from '@/sequelize/models/category.model.js';
import { CouponModel, initCouponModel } from '@/sequelize/models/coupon.model.js';
import { DomainEventModel, initDomainEventModel } from '@/sequelize/models/domain-event.model.js';
import { FileModel, initFileModel } from '@/sequelize/models/file.model.js';
import {
  IdempotencyRecordModel,
  initIdempotencyRecordModel,
} from '@/sequelize/models/idempotency-record.model.js';
import {
  InventoryReservationModel,
  initInventoryReservationModel,
} from '@/sequelize/models/inventory-reservation.model.js';
import { initOrderModel, OrderModel } from '@/sequelize/models/order.model.js';
import { initOrderCouponModel, OrderCouponModel } from '@/sequelize/models/order-coupon.model.js';
import { initOrderItemModel, OrderItemModel } from '@/sequelize/models/order-item.model.js';
import { initPaymentModel, PaymentModel } from '@/sequelize/models/payment.model.js';
import { initProductModel, ProductModel } from '@/sequelize/models/product.model.js';
import {
  initProductImageModel,
  ProductImageModel,
} from '@/sequelize/models/product-image.model.js';
import {
  initRefreshTokenModel,
  RefreshTokenModel,
} from '@/sequelize/models/refresh-token.model.js';
import { initRefundModel, RefundModel } from '@/sequelize/models/refund.model.js';
import { initReviewModel, ReviewModel } from '@/sequelize/models/review.model.js';
import { initShipmentModel, ShipmentModel } from '@/sequelize/models/shipment.model.js';
import { initUserModel, UserModel } from '@/sequelize/models/user.model.js';
import {
  CancellationRequestModel,
  initCancellationRequestModel,
} from './cancellation-request.model.js';
import { CartModel, initCartModel } from './cart.model.js';
import { CartItemModel, initCartItemModel } from './cart-item.model.js';
import { CheckoutQuoteModel, initCheckoutQuoteModel } from './checkout-quote.model.js';
import { ContentEntryModel, initContentEntryModel } from './content-entry.model.js';
import { ContentRedirectModel, initContentRedirectModel } from './content-redirect.model.js';
import { ContentRevisionModel, initContentRevisionModel } from './content-revision.model.js';
import { ContentTaxonomyModel, initContentTaxonomyModel } from './content-taxonomy.model.js';
import { CouponRedemptionModel, initCouponRedemptionModel } from './coupon-redemption.model.js';
import { ExchangeRequestModel, initExchangeRequestModel } from './exchange-request.model.js';
import { InventoryMovementModel, initInventoryMovementModel } from './inventory-movement.model.js';
import {
  initMerchandisingEntryModel,
  MerchandisingEntryModel,
} from './merchandising-entry.model.js';
import { initNotificationModel, NotificationModel } from './notification.model.js';
import {
  initNotificationDeliveryModel,
  NotificationDeliveryModel,
} from './notification-delivery.model.js';
import {
  initNotificationPreferencesModel,
  NotificationPreferencesModel,
} from './notification-preferences.model.js';
import {
  initNotificationTemplateModel,
  NotificationTemplateModel,
} from './notification-template.model.js';
import { initOrderEventModel, OrderEventModel } from './order-event.model.js';
import { initPaymentAttemptModel, PaymentAttemptModel } from './payment-attempt.model.js';
import { initPaymentLedgerModel, PaymentLedgerModel } from './payment-ledger.model.js';
import { initProcessModel, ProcessModel } from './process.model.js';
import { initProcessItemModel, ProcessItemModel } from './process-item.model.js';
import {
  initProductSlugRedirectModel,
  ProductSlugRedirectModel,
} from './product-slug-redirect.model.js';
import { initProductVariantModel, ProductVariantModel } from './product-variant.model.js';
import { initPromotionModel, PromotionModel } from './promotion.model.js';
import { initRealtimeEventModel, RealtimeEventModel } from './realtime-event.model.js';
import { initReportExportModel, ReportExportModel } from './report-export.model.js';
import { initReturnRequestModel, ReturnRequestModel } from './return-request.model.js';
import { initShipmentEventModel, ShipmentEventModel } from './shipment-event.model.js';
import { initShipmentItemModel, ShipmentItemModel } from './shipment-item.model.js';
import { initShippingMethodModel, ShippingMethodModel } from './shipping-method.model.js';
import { initShopSettingsModel, ShopSettingsModel } from './shop-settings.model.js';
import { initSizeGuideModel, SizeGuideModel } from './size-guide.model.js';
import {
  initStockAlertSubscriptionModel,
  StockAlertSubscriptionModel,
} from './stock-alert-subscription.model.js';
import { initSupportMessageModel, SupportMessageModel } from './support-message.model.js';
import { initSupportTicketModel, SupportTicketModel } from './support-ticket.model.js';
import { initUploadTicketModel, UploadTicketModel } from './upload-ticket.model.js';
import { initWebhookReceiptModel, WebhookReceiptModel } from './webhook-receipt.model.js';
import { initWishlistItemModel, WishlistItemModel } from './wishlist-item.model.js';

initUserModel(sequelize);
initRealtimeEventModel(sequelize);
initProcessItemModel(sequelize);
initProcessModel(sequelize);
initExchangeRequestModel(sequelize);
initReportExportModel(sequelize);
initMerchandisingEntryModel(sequelize);
initSupportMessageModel(sequelize);
initSupportTicketModel(sequelize);
initNotificationDeliveryModel(sequelize);
initNotificationTemplateModel(sequelize);
initNotificationModel(sequelize);
initNotificationPreferencesModel(sequelize);
initContentRedirectModel(sequelize);
initContentTaxonomyModel(sequelize);
initContentRevisionModel(sequelize);
initContentEntryModel(sequelize);
initStockAlertSubscriptionModel(sequelize);
initWishlistItemModel(sequelize);
initReturnRequestModel(sequelize);
initShipmentEventModel(sequelize);
initShipmentItemModel(sequelize);
initWebhookReceiptModel(sequelize);
initPaymentLedgerModel(sequelize);
initPaymentAttemptModel(sequelize);
initOrderEventModel(sequelize);
initCancellationRequestModel(sequelize);
initCheckoutQuoteModel(sequelize);
initCouponRedemptionModel(sequelize);
initPromotionModel(sequelize);
initCartItemModel(sequelize);
initCartModel(sequelize);
initShippingMethodModel(sequelize);
initShopSettingsModel(sequelize);
initInventoryMovementModel(sequelize);
initProductSlugRedirectModel(sequelize);
initSizeGuideModel(sequelize);
initProductVariantModel(sequelize);
initUploadTicketModel(sequelize);
initAccountTokenModel(sequelize);
initIdempotencyRecordModel(sequelize);
initDomainEventModel(sequelize);
initAuditLogModel(sequelize);
initFileModel(sequelize);
initCategoryModel(sequelize);
initProductModel(sequelize);
initProductImageModel(sequelize);
initAddressModel(sequelize);
initOrderModel(sequelize);
initOrderItemModel(sequelize);
initPaymentModel(sequelize);
initShipmentModel(sequelize);
initCouponModel(sequelize);
initOrderCouponModel(sequelize);
initInventoryReservationModel(sequelize);
initRefundModel(sequelize);
initReviewModel(sequelize);
initRefreshTokenModel(sequelize);

UserModel.hasMany(OrderModel, { foreignKey: 'userId', as: 'orders' });
OrderModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

UserModel.hasMany(AddressModel, { foreignKey: 'userId', as: 'addresses' });
AddressModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

OrderModel.belongsTo(AddressModel, { foreignKey: 'addressId', as: 'address' });
AddressModel.hasMany(OrderModel, { foreignKey: 'addressId', as: 'orders' });

OrderModel.hasMany(OrderItemModel, { foreignKey: 'orderId', as: 'items' });
OrderItemModel.belongsTo(OrderModel, { foreignKey: 'orderId', as: 'order' });

OrderModel.hasOne(PaymentModel, { foreignKey: 'orderId', as: 'payment' });
PaymentModel.belongsTo(OrderModel, { foreignKey: 'orderId', as: 'order' });

OrderModel.hasMany(ShipmentModel, { foreignKey: 'orderId', as: 'shipments' });
ShipmentModel.belongsTo(OrderModel, { foreignKey: 'orderId', as: 'order' });

UserModel.hasMany(RefreshTokenModel, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshTokenModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

ProductModel.belongsTo(FileModel, { foreignKey: 'imageId', as: 'image' });
FileModel.hasMany(ProductModel, { foreignKey: 'imageId', as: 'products' });

UserModel.belongsTo(FileModel, { foreignKey: 'avatarId', as: 'avatar' });
FileModel.hasMany(UserModel, { foreignKey: 'avatarId', as: 'avatarUsers' });

CategoryModel.hasMany(ProductModel, { foreignKey: 'categoryId', as: 'products' });
ProductModel.belongsTo(CategoryModel, { foreignKey: 'categoryId', as: 'category' });

ProductModel.hasMany(ProductImageModel, { foreignKey: 'productId', as: 'gallery' });
ProductImageModel.belongsTo(ProductModel, { foreignKey: 'productId', as: 'product' });
ProductImageModel.belongsTo(FileModel, { foreignKey: 'fileId', as: 'file' });
FileModel.hasMany(ProductImageModel, { foreignKey: 'fileId', as: 'productImages' });

OrderModel.hasOne(OrderCouponModel, { foreignKey: 'orderId', as: 'orderCoupon' });
OrderCouponModel.belongsTo(OrderModel, { foreignKey: 'orderId', as: 'order' });
OrderCouponModel.belongsTo(CouponModel, { foreignKey: 'couponId', as: 'coupon' });
CouponModel.hasMany(OrderCouponModel, { foreignKey: 'couponId', as: 'orderCoupons' });

OrderModel.hasMany(InventoryReservationModel, {
  foreignKey: 'orderId',
  as: 'reservations',
});
InventoryReservationModel.belongsTo(OrderModel, { foreignKey: 'orderId', as: 'order' });
InventoryReservationModel.belongsTo(ProductModel, { foreignKey: 'productId', as: 'product' });

PaymentModel.hasMany(RefundModel, { foreignKey: 'paymentId', as: 'refunds' });
RefundModel.belongsTo(PaymentModel, { foreignKey: 'paymentId', as: 'payment' });
RefundModel.belongsTo(OrderModel, { foreignKey: 'orderId', as: 'order' });
OrderModel.hasMany(RefundModel, { foreignKey: 'orderId', as: 'refunds' });

ProductModel.hasMany(ReviewModel, { foreignKey: 'productId', as: 'reviews' });
ReviewModel.belongsTo(ProductModel, { foreignKey: 'productId', as: 'product' });
ReviewModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });
UserModel.hasMany(ReviewModel, { foreignKey: 'userId', as: 'reviews' });

export {
  AccountTokenModel,
  AddressModel,
  AuditLogModel,
  CancellationRequestModel,
  CartItemModel,
  CartModel,
  CategoryModel,
  CheckoutQuoteModel,
  ContentEntryModel,
  ContentRedirectModel,
  ContentRevisionModel,
  ContentTaxonomyModel,
  CouponModel,
  CouponRedemptionModel,
  DomainEventModel,
  ExchangeRequestModel,
  FileModel,
  IdempotencyRecordModel,
  InventoryMovementModel,
  InventoryReservationModel,
  MerchandisingEntryModel,
  NotificationDeliveryModel,
  NotificationModel,
  NotificationPreferencesModel,
  NotificationTemplateModel,
  OrderCouponModel,
  OrderEventModel,
  OrderItemModel,
  OrderModel,
  PaymentAttemptModel,
  PaymentLedgerModel,
  PaymentModel,
  ProcessItemModel,
  ProcessModel,
  ProductImageModel,
  ProductModel,
  ProductSlugRedirectModel,
  ProductVariantModel,
  PromotionModel,
  RealtimeEventModel,
  RefreshTokenModel,
  RefundModel,
  ReportExportModel,
  ReturnRequestModel,
  ReviewModel,
  ShipmentEventModel,
  ShipmentItemModel,
  ShipmentModel,
  ShippingMethodModel,
  ShopSettingsModel,
  SizeGuideModel,
  StockAlertSubscriptionModel,
  SupportMessageModel,
  SupportTicketModel,
  sequelize,
  UploadTicketModel,
  UserModel,
  WebhookReceiptModel,
  WishlistItemModel,
};
