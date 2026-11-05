import type { MerchandisingPayload } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface MerchandisingEntryAttributes {
  id: string;
  kind: MerchandisingPayload['kind'];
  key: string;
  payload: MerchandisingPayload;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export class MerchandisingEntryModel
  extends Model<MerchandisingEntryAttributes>
  implements MerchandisingEntryAttributes
{
  declare id: string;
  declare kind: MerchandisingPayload['kind'];
  declare key: string;
  declare payload: MerchandisingPayload;
  declare active: boolean;
  declare startsAt: Date | null;
  declare endsAt: Date | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initMerchandisingEntryModel(sequelize: Sequelize) {
  MerchandisingEntryModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      kind: { type: DataTypes.STRING, allowNull: false },
      key: { type: DataTypes.STRING, allowNull: false },
      payload: { type: DataTypes.JSONB, allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false },
      startsAt: { type: DataTypes.DATE, allowNull: true },
      endsAt: { type: DataTypes.DATE, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'merchandising_entries', underscored: true },
  );
}
