import { sequelize } from '@/sequelize/index.js';
import { AuditLogModel, initAuditLogModel } from './audit-log.model.js';
import { BuildingModel, initBuildingModel } from './building.model.js';
import { BuildingMemberModel, initBuildingMemberModel } from './building-member.model.js';
import { DomainEventModel, initDomainEventModel } from './domain-event.model.js';
import { IdempotencyRecordModel, initIdempotencyRecordModel } from './idempotency-record.model.js';
import { initUserModel, UserModel } from './user.model.js';

initUserModel(sequelize);
initAuditLogModel(sequelize);
initDomainEventModel(sequelize);
initIdempotencyRecordModel(sequelize);
initBuildingModel(sequelize);
initBuildingMemberModel(sequelize);

BuildingMemberModel.belongsTo(BuildingModel, { foreignKey: 'buildingId', as: 'building' });
BuildingMemberModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

export {
  AuditLogModel,
  BuildingMemberModel,
  BuildingModel,
  DomainEventModel,
  IdempotencyRecordModel,
  sequelize,
  UserModel,
};
