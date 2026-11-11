import type {
  MaintenanceCategory,
  MaintenanceSeverity,
  MaintenanceSource,
  MaintenanceStatus,
} from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** Báo hỏng (ST-25 from the portal; ST-22 adds the internal workflow and costs). */
export interface MaintenanceRequestAttributes {
  id: string;
  buildingId: string;
  roomId: string | null;
  contractId: string | null;
  tenantId: string | null;
  portalLinkId: string | null;
  source: MaintenanceSource;
  category: MaintenanceCategory;
  severity: MaintenanceSeverity;
  title: string;
  description: string;
  status: MaintenanceStatus;
  reply: string | null;
  repliedAt: Date | null;
  repliedBy: string | null;
  handledBy: string | null;
  handledAt: Date | null;
  costExpenseId: string | null;
  /** Private file ids (`maintenance_photo`). */
  photos: string[];
  createdBy: string | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MaintenanceRequestCreation = Optional<
  MaintenanceRequestAttributes,
  | 'id'
  | 'roomId'
  | 'contractId'
  | 'tenantId'
  | 'portalLinkId'
  | 'severity'
  | 'description'
  | 'status'
  | 'reply'
  | 'repliedAt'
  | 'repliedBy'
  | 'handledBy'
  | 'handledAt'
  | 'costExpenseId'
  | 'photos'
  | 'createdBy'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
>;

export class MaintenanceRequestModel
  extends Model<MaintenanceRequestAttributes, MaintenanceRequestCreation>
  implements MaintenanceRequestAttributes
{
  declare id: string;
  declare buildingId: string;
  declare roomId: string | null;
  declare contractId: string | null;
  declare tenantId: string | null;
  declare portalLinkId: string | null;
  declare source: MaintenanceSource;
  declare category: MaintenanceCategory;
  declare severity: MaintenanceSeverity;
  declare title: string;
  declare description: string;
  declare status: MaintenanceStatus;
  declare reply: string | null;
  declare repliedAt: Date | null;
  declare repliedBy: string | null;
  declare handledBy: string | null;
  declare handledAt: Date | null;
  declare costExpenseId: string | null;
  declare photos: string[];
  declare createdBy: string | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initMaintenanceRequestModel(sequelize: Sequelize) {
  MaintenanceRequestModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      roomId: { type: DataTypes.UUID, allowNull: true },
      contractId: { type: DataTypes.UUID, allowNull: true },
      tenantId: { type: DataTypes.UUID, allowNull: true },
      portalLinkId: { type: DataTypes.UUID, allowNull: true },
      source: { type: DataTypes.STRING(16), allowNull: false },
      category: { type: DataTypes.STRING(32), allowNull: false },
      severity: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'normal' },
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'new' },
      reply: { type: DataTypes.TEXT, allowNull: true },
      repliedAt: { type: DataTypes.DATE, allowNull: true },
      repliedBy: { type: DataTypes.UUID, allowNull: true },
      handledBy: { type: DataTypes.UUID, allowNull: true },
      handledAt: { type: DataTypes.DATE, allowNull: true },
      costExpenseId: { type: DataTypes.UUID, allowNull: true },
      photos: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false, defaultValue: [] },
      createdBy: { type: DataTypes.UUID, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'maintenance_requests', underscored: true, version: true },
  );
}
