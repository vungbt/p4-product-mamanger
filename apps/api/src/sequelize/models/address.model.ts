import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface AddressAttributes {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AddressCreation = Optional<
  AddressAttributes,
  'id' | 'isDefault' | 'createdAt' | 'updatedAt'
>;

export class AddressModel
  extends Model<AddressAttributes, AddressCreation>
  implements AddressAttributes
{
  declare id: string;
  declare userId: string;
  declare fullName: string;
  declare phone: string;
  declare line1: string;
  declare city: string;
  declare isDefault: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initAddressModel(sequelize: Sequelize) {
  AddressModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'full_name',
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      line1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_default',
      },
    },
    {
      sequelize,
      tableName: 'addresses',
      underscored: true,
    },
  );
  return AddressModel;
}
