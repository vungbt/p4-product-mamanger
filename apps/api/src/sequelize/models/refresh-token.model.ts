import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface RefreshTokenAttributes {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RefreshTokenCreation = Optional<
  RefreshTokenAttributes,
  'id' | 'revokedAt' | 'createdAt' | 'updatedAt'
>;

export class RefreshTokenModel
  extends Model<RefreshTokenAttributes, RefreshTokenCreation>
  implements RefreshTokenAttributes
{
  declare id: string;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare revokedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initRefreshTokenModel(sequelize: Sequelize) {
  RefreshTokenModel.init(
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
      tokenHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'token_hash',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at',
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'revoked_at',
      },
    },
    {
      sequelize,
      tableName: 'refresh_tokens',
      underscored: true,
    },
  );
  return RefreshTokenModel;
}
