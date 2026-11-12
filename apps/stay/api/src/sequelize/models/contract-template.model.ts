import type { DocumentKind } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** A document template (ST-30); its body lives in immutable versions. */
export interface ContractTemplateAttributes {
  id: string;
  buildingId: string | null;
  kind: DocumentKind;
  name: string;
  activeVersionId: string | null;
  active: boolean;
  createdBy: string | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ContractTemplateCreation = Optional<
  ContractTemplateAttributes,
  | 'id'
  | 'buildingId'
  | 'activeVersionId'
  | 'active'
  | 'createdBy'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
>;

export class ContractTemplateModel
  extends Model<ContractTemplateAttributes, ContractTemplateCreation>
  implements ContractTemplateAttributes
{
  declare id: string;
  declare buildingId: string | null;
  declare kind: DocumentKind;
  declare name: string;
  declare activeVersionId: string | null;
  declare active: boolean;
  declare createdBy: string | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContractTemplateModel(sequelize: Sequelize) {
  ContractTemplateModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: true },
      kind: { type: DataTypes.STRING(16), allowNull: false },
      name: { type: DataTypes.STRING(160), allowNull: false },
      activeVersionId: { type: DataTypes.UUID, allowNull: true },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: { type: DataTypes.UUID, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'contract_templates', underscored: true, version: true },
  );
}

/** One saved body of a template; never updated (st-30.md "Sửa mẫu tạo phiên bản mới"). */
export interface ContractTemplateVersionAttributes {
  id: string;
  templateId: string;
  version: number;
  bodyHtml: string;
  variablesUsed: string[];
  note: string | null;
  createdBy: string | null;
  createdAt?: Date;
}

export type ContractTemplateVersionCreation = Optional<
  ContractTemplateVersionAttributes,
  'id' | 'variablesUsed' | 'note' | 'createdBy' | 'createdAt'
>;

export class ContractTemplateVersionModel
  extends Model<ContractTemplateVersionAttributes, ContractTemplateVersionCreation>
  implements ContractTemplateVersionAttributes
{
  declare id: string;
  declare templateId: string;
  declare version: number;
  declare bodyHtml: string;
  declare variablesUsed: string[];
  declare note: string | null;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
}

export function initContractTemplateVersionModel(sequelize: Sequelize) {
  ContractTemplateVersionModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      templateId: { type: DataTypes.UUID, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
      bodyHtml: { type: DataTypes.TEXT, allowNull: false },
      variablesUsed: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false, defaultValue: [] },
      note: { type: DataTypes.STRING(255), allowNull: true },
      createdBy: { type: DataTypes.UUID, allowNull: true },
    },
    {
      sequelize,
      tableName: 'contract_template_versions',
      underscored: true,
      updatedAt: false,
    },
  );
}
