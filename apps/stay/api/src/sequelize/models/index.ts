import { sequelize } from '@/sequelize/index.js';
import { AuditLogModel, initAuditLogModel } from './audit-log.model.js';
import { BuildingModel, initBuildingModel } from './building.model.js';
import { BuildingMemberModel, initBuildingMemberModel } from './building-member.model.js';
import {
  BuildingServicePriceModel,
  initBuildingServicePriceModel,
} from './building-service-price.model.js';
import { DomainEventModel, initDomainEventModel } from './domain-event.model.js';
import { FileModel, initFileModel } from './file.model.js';
import { IdempotencyRecordModel, initIdempotencyRecordModel } from './idempotency-record.model.js';
import { initMeterModel, MeterModel } from './meter.model.js';
import { initRoomModel, RoomModel } from './room.model.js';
import {
  initRoomDefaultServiceModel,
  RoomDefaultServiceModel,
} from './room-default-service.model.js';
import { initServiceDefinitionModel, ServiceDefinitionModel } from './service-definition.model.js';
import { initSystemSettingModel, SystemSettingModel } from './system-setting.model.js';
import { initTenantModel, TenantModel } from './tenant.model.js';
import { initTenantDocumentModel, TenantDocumentModel } from './tenant-document.model.js';
import { initUploadTicketModel, UploadTicketModel } from './upload-ticket.model.js';
import { initUserModel, UserModel } from './user.model.js';
import { initVehicleModel, VehicleModel } from './vehicle.model.js';

initUserModel(sequelize);
initAuditLogModel(sequelize);
initDomainEventModel(sequelize);
initIdempotencyRecordModel(sequelize);
initBuildingModel(sequelize);
initBuildingMemberModel(sequelize);
initSystemSettingModel(sequelize);
initServiceDefinitionModel(sequelize);
initBuildingServicePriceModel(sequelize);
initRoomModel(sequelize);
initRoomDefaultServiceModel(sequelize);
initMeterModel(sequelize);
initFileModel(sequelize);
initUploadTicketModel(sequelize);
initTenantModel(sequelize);
initTenantDocumentModel(sequelize);
initVehicleModel(sequelize);

BuildingMemberModel.belongsTo(BuildingModel, { foreignKey: 'buildingId', as: 'building' });
BuildingMemberModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });
BuildingServicePriceModel.belongsTo(BuildingModel, { foreignKey: 'buildingId', as: 'building' });
BuildingServicePriceModel.belongsTo(ServiceDefinitionModel, {
  foreignKey: 'serviceId',
  as: 'service',
});

RoomModel.belongsTo(BuildingModel, { foreignKey: 'buildingId', as: 'building' });
RoomDefaultServiceModel.belongsTo(RoomModel, { foreignKey: 'roomId', as: 'room' });
RoomDefaultServiceModel.belongsTo(ServiceDefinitionModel, {
  foreignKey: 'serviceId',
  as: 'service',
});
MeterModel.belongsTo(RoomModel, { foreignKey: 'roomId', as: 'room' });

export {
  AuditLogModel,
  BuildingMemberModel,
  BuildingModel,
  BuildingServicePriceModel,
  DomainEventModel,
  FileModel,
  IdempotencyRecordModel,
  MeterModel,
  RoomDefaultServiceModel,
  RoomModel,
  ServiceDefinitionModel,
  SystemSettingModel,
  sequelize,
  TenantDocumentModel,
  TenantModel,
  UploadTicketModel,
  UserModel,
  VehicleModel,
};
