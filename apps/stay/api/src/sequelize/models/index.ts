import { sequelize } from '@/sequelize/index.js';
import { AuditLogModel, initAuditLogModel } from './audit-log.model.js';
import { BuildingModel, initBuildingModel } from './building.model.js';
import { BuildingMemberModel, initBuildingMemberModel } from './building-member.model.js';
import {
  BuildingServicePriceModel,
  initBuildingServicePriceModel,
} from './building-service-price.model.js';
import { DomainEventModel, initDomainEventModel } from './domain-event.model.js';
import { IdempotencyRecordModel, initIdempotencyRecordModel } from './idempotency-record.model.js';
import { initServiceDefinitionModel, ServiceDefinitionModel } from './service-definition.model.js';
import { initSystemSettingModel, SystemSettingModel } from './system-setting.model.js';
import { initUserModel, UserModel } from './user.model.js';

initUserModel(sequelize);
initAuditLogModel(sequelize);
initDomainEventModel(sequelize);
initIdempotencyRecordModel(sequelize);
initBuildingModel(sequelize);
initBuildingMemberModel(sequelize);
initSystemSettingModel(sequelize);
initServiceDefinitionModel(sequelize);
initBuildingServicePriceModel(sequelize);

BuildingMemberModel.belongsTo(BuildingModel, { foreignKey: 'buildingId', as: 'building' });
BuildingMemberModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });
BuildingServicePriceModel.belongsTo(BuildingModel, { foreignKey: 'buildingId', as: 'building' });
BuildingServicePriceModel.belongsTo(ServiceDefinitionModel, {
  foreignKey: 'serviceId',
  as: 'service',
});

export {
  AuditLogModel,
  BuildingMemberModel,
  BuildingModel,
  BuildingServicePriceModel,
  DomainEventModel,
  IdempotencyRecordModel,
  ServiceDefinitionModel,
  SystemSettingModel,
  sequelize,
  UserModel,
};
