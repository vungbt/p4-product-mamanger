import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/**
 * Dated price override of a service in a building. The price on date X is the row with the
 * latest `effectiveFrom` ≤ X (`resolvePrice`); `price: null` returns to the default price.
 */
export interface BuildingServicePriceAttributes {
  id: string;
  buildingId: string;
  serviceId: string;
  price: number | null;
  /** `YYYY-MM-DD` (`DATE`). */
  effectiveFrom: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BuildingServicePriceCreation = Optional<
  BuildingServicePriceAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class BuildingServicePriceModel
  extends Model<BuildingServicePriceAttributes, BuildingServicePriceCreation>
  implements BuildingServicePriceAttributes
{
  declare id: string;
  declare buildingId: string;
  declare serviceId: string;
  declare price: number | null;
  declare effectiveFrom: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initBuildingServicePriceModel(sequelize: Sequelize) {
  BuildingServicePriceModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      serviceId: { type: DataTypes.UUID, allowNull: false },
      price: {
        type: DataTypes.BIGINT,
        allowNull: true,
        // pg returns BIGINT as a string; amounts stay within the safe integer range.
        get() {
          const value = this.getDataValue('price');

          return value === null ? null : Number(value);
        },
      },
      effectiveFrom: { type: DataTypes.DATEONLY, allowNull: false },
    },
    { sequelize, tableName: 'building_service_prices', underscored: true },
  );
}
