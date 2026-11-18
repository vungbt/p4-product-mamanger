import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type SignatureFormat = 'png' | 'jpg';

/** "Bên cho thuê" of an owner account (ST-30). CCCD and signature are private. */
export interface LandlordProfileAttributes {
  id: string;
  userId: string;
  fullName: string;
  birthDate: string | null;
  idNumber: string | null;
  idIssuedAt: string | null;
  idIssuedBy: string | null;
  permanentAddress: string | null;
  phone: string | null;
  signatureImage: Buffer | null;
  signatureFormat: SignatureFormat | null;
  signatureUpdatedAt: Date | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type LandlordProfileCreation = Optional<
  LandlordProfileAttributes,
  | 'id'
  | 'birthDate'
  | 'idNumber'
  | 'idIssuedAt'
  | 'idIssuedBy'
  | 'permanentAddress'
  | 'phone'
  | 'signatureImage'
  | 'signatureFormat'
  | 'signatureUpdatedAt'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
>;

export class LandlordProfileModel
  extends Model<LandlordProfileAttributes, LandlordProfileCreation>
  implements LandlordProfileAttributes
{
  declare id: string;
  declare userId: string;
  declare fullName: string;
  declare birthDate: string | null;
  declare idNumber: string | null;
  declare idIssuedAt: string | null;
  declare idIssuedBy: string | null;
  declare permanentAddress: string | null;
  declare phone: string | null;
  declare signatureImage: Buffer | null;
  declare signatureFormat: SignatureFormat | null;
  declare signatureUpdatedAt: Date | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initLandlordProfileModel(sequelize: Sequelize) {
  LandlordProfileModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      fullName: { type: DataTypes.STRING(120), allowNull: false },
      birthDate: { type: DataTypes.DATEONLY, allowNull: true },
      idNumber: { type: DataTypes.STRING(12), allowNull: true },
      idIssuedAt: { type: DataTypes.DATEONLY, allowNull: true },
      idIssuedBy: { type: DataTypes.STRING(120), allowNull: true },
      permanentAddress: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      signatureImage: { type: DataTypes.BLOB, allowNull: true },
      signatureFormat: { type: DataTypes.STRING(8), allowNull: true },
      signatureUpdatedAt: { type: DataTypes.DATE, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'landlord_profiles', underscored: true, version: true },
  );
}
