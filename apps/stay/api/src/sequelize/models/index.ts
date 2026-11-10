import { sequelize } from '@/sequelize/index.js';
import { AuditLogModel, initAuditLogModel } from './audit-log.model.js';
import { BuildingModel, initBuildingModel } from './building.model.js';
import { BuildingMemberModel, initBuildingMemberModel } from './building-member.model.js';
import {
  BuildingServicePriceModel,
  initBuildingServicePriceModel,
} from './building-service-price.model.js';
import { ContractModel, initContractModel } from './contract.model.js';
import { ContractEventModel, initContractEventModel } from './contract-event.model.js';
import { ContractOccupantModel, initContractOccupantModel } from './contract-occupant.model.js';
import { ContractServiceModel, initContractServiceModel } from './contract-service.model.js';
import { ContractVehicleModel, initContractVehicleModel } from './contract-vehicle.model.js';
import { DepositEntryModel, initDepositEntryModel } from './deposit-entry.model.js';
import { DomainEventModel, initDomainEventModel } from './domain-event.model.js';
import { ExpenseModel, initExpenseModel } from './expense.model.js';
import { ExpenseCategoryModel, initExpenseCategoryModel } from './expense-category.model.js';
import { FileModel, initFileModel } from './file.model.js';
import { IdempotencyRecordModel, initIdempotencyRecordModel } from './idempotency-record.model.js';
import { InvoiceModel, initInvoiceModel } from './invoice.model.js';
import { InvoiceLineModel, initInvoiceLineModel } from './invoice-line.model.js';
import {
  InvoiceMeterReadingModel,
  initInvoiceMeterReadingModel,
} from './invoice-meter-reading.model.js';
import { InvoiceSequenceModel, initInvoiceSequenceModel } from './invoice-sequence.model.js';
import { initMeterModel, MeterModel } from './meter.model.js';
import { initMeterReadingModel, MeterReadingModel } from './meter-reading.model.js';
import { initPaymentModel, PaymentModel } from './payment.model.js';
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

initExpenseCategoryModel(sequelize);
initExpenseModel(sequelize);
initContractModel(sequelize);
initContractOccupantModel(sequelize);
initContractServiceModel(sequelize);
initContractVehicleModel(sequelize);
initContractEventModel(sequelize);
initDepositEntryModel(sequelize);
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
initMeterReadingModel(sequelize);
initFileModel(sequelize);
initUploadTicketModel(sequelize);
initTenantModel(sequelize);
initTenantDocumentModel(sequelize);
initVehicleModel(sequelize);
initInvoiceModel(sequelize);
initInvoiceLineModel(sequelize);
initInvoiceSequenceModel(sequelize);
initInvoiceMeterReadingModel(sequelize);
initPaymentModel(sequelize);

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
  ContractEventModel,
  ContractModel,
  ContractOccupantModel,
  ContractServiceModel,
  ContractVehicleModel,
  DepositEntryModel,
  DomainEventModel,
  ExpenseCategoryModel,
  ExpenseModel,
  FileModel,
  IdempotencyRecordModel,
  InvoiceLineModel,
  InvoiceMeterReadingModel,
  InvoiceModel,
  InvoiceSequenceModel,
  MeterModel,
  MeterReadingModel,
  PaymentModel,
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
