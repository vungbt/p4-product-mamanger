import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface ShopSettingsAttributes {
  id: string;
  name: string;
  supportEmail: string;
  supportPhone: string;
  defaultLocale: string;
  currency: string;
  timezone: string;
  logoFileId: string | null;
  quoteTtlSeconds: number;
  reservationTtlSeconds: number;
  returnWindowDays: number;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ShopSettingsModel
  extends Model<ShopSettingsAttributes>
  implements ShopSettingsAttributes
{
  declare id: string;
  declare name: string;
  declare supportEmail: string;
  declare supportPhone: string;
  declare defaultLocale: string;
  declare currency: string;
  declare timezone: string;
  declare logoFileId: string | null;
  declare quoteTtlSeconds: number;
  declare reservationTtlSeconds: number;
  declare returnWindowDays: number;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initShopSettingsModel(sequelize: Sequelize) {
  ShopSettingsModel.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      supportEmail: { type: DataTypes.STRING, allowNull: false },
      supportPhone: { type: DataTypes.STRING, allowNull: false },
      defaultLocale: { type: DataTypes.STRING, allowNull: false },
      currency: { type: DataTypes.STRING, allowNull: false },
      timezone: { type: DataTypes.STRING, allowNull: false },
      logoFileId: { type: DataTypes.UUID, allowNull: true },
      quoteTtlSeconds: { type: DataTypes.INTEGER, allowNull: false },
      reservationTtlSeconds: { type: DataTypes.INTEGER, allowNull: false },
      returnWindowDays: { type: DataTypes.INTEGER, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'shop_settings', underscored: true },
  );
}
