import type { TenantGender } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** A tenant profile (personal data: never log or audit `idNumber` in clear). */
export interface TenantAttributes {
  id: string;
  buildingId: string;
  fullName: string;
  phone: string;
  email: string | null;
  idNumber: string | null;
  idIssuedAt: string | null;
  birthDate: string | null;
  gender: TenantGender | null;
  hometown: string | null;
  permanentAddress: string | null;
  occupation: string | null;
  note: string | null;
  archivedAt: Date | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TenantCreation = Optional<
  TenantAttributes,
  | 'id'
  | 'email'
  | 'idNumber'
  | 'idIssuedAt'
  | 'birthDate'
  | 'gender'
  | 'hometown'
  | 'permanentAddress'
  | 'occupation'
  | 'note'
  | 'archivedAt'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
>;

export class TenantModel
  extends Model<TenantAttributes, TenantCreation>
  implements TenantAttributes
{
  declare id: string;
  declare buildingId: string;
  declare fullName: string;
  declare phone: string;
  declare email: string | null;
  declare idNumber: string | null;
  declare idIssuedAt: string | null;
  declare birthDate: string | null;
  declare gender: TenantGender | null;
  declare hometown: string | null;
  declare permanentAddress: string | null;
  declare occupation: string | null;
  declare note: string | null;
  declare archivedAt: Date | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initTenantModel(sequelize: Sequelize) {
  TenantModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      fullName: { type: DataTypes.STRING(120), allowNull: false },
      phone: { type: DataTypes.STRING(10), allowNull: false },
      email: { type: DataTypes.STRING, allowNull: true },
      idNumber: { type: DataTypes.STRING(12), allowNull: true },
      idIssuedAt: { type: DataTypes.DATEONLY, allowNull: true },
      birthDate: { type: DataTypes.DATEONLY, allowNull: true },
      gender: { type: DataTypes.STRING(8), allowNull: true },
      hometown: { type: DataTypes.STRING, allowNull: true },
      permanentAddress: { type: DataTypes.STRING, allowNull: true },
      occupation: { type: DataTypes.STRING, allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: true },
      archivedAt: { type: DataTypes.DATE, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'tenants', underscored: true, version: true },
  );
}
