import { sequelize } from '@/sequelize/index.js';
import { FileModel, initFileModel } from '@/sequelize/models/file.model.js';
import { initOrderModel, OrderModel } from '@/sequelize/models/order.model.js';
import { initOrderItemModel, OrderItemModel } from '@/sequelize/models/order-item.model.js';
import { initProductModel, ProductModel } from '@/sequelize/models/product.model.js';
import {
  initRefreshTokenModel,
  RefreshTokenModel,
} from '@/sequelize/models/refresh-token.model.js';
import { initUserModel, UserModel } from '@/sequelize/models/user.model.js';

initUserModel(sequelize);
initFileModel(sequelize);
initProductModel(sequelize);
initOrderModel(sequelize);
initOrderItemModel(sequelize);
initRefreshTokenModel(sequelize);

UserModel.hasMany(OrderModel, { foreignKey: 'userId', as: 'orders' });
OrderModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

OrderModel.hasMany(OrderItemModel, { foreignKey: 'orderId', as: 'items' });
OrderItemModel.belongsTo(OrderModel, { foreignKey: 'orderId', as: 'order' });

UserModel.hasMany(RefreshTokenModel, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshTokenModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

ProductModel.belongsTo(FileModel, { foreignKey: 'imageId', as: 'image' });
FileModel.hasMany(ProductModel, { foreignKey: 'imageId', as: 'products' });

export {
  FileModel,
  OrderItemModel,
  OrderModel,
  ProductModel,
  RefreshTokenModel,
  sequelize,
  UserModel,
};
