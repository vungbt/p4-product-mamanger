import { sequelize } from '@/sequelize/index.js';
import { AddressModel, initAddressModel } from '@/sequelize/models/address.model.js';
import { CategoryModel, initCategoryModel } from '@/sequelize/models/category.model.js';
import { CouponModel, initCouponModel } from '@/sequelize/models/coupon.model.js';
import { FileModel, initFileModel } from '@/sequelize/models/file.model.js';
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

initUserModel(sequelize);
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

OrderModel.hasOne(ShipmentModel, { foreignKey: 'orderId', as: 'shipment' });
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
  AddressModel,
  CategoryModel,
  CouponModel,
  FileModel,
  InventoryReservationModel,
  OrderCouponModel,
  OrderItemModel,
  OrderModel,
  PaymentModel,
  ProductImageModel,
  ProductModel,
  RefreshTokenModel,
  RefundModel,
  ReviewModel,
  ShipmentModel,
  sequelize,
  UserModel,
};
