'use strict';
/**
 * Local/CI seed: 15 fictional tenants of building A and a few vehicles. Names, phones (091100xxxx)
 * and CCCD numbers (prefix 000, not a real province code) are invented. Idempotent: a tenant whose
 * phone already exists in building A is skipped. No room assignments: those come from contracts.
 */
const { randomUUID } = require('node:crypto');

const TENANTS = [
  ['Nguyễn Văn An', '0911000001', '000090000001', 'male', '1998-03-12', 'Nhân viên văn phòng'],
  ['Trần Thị Bình', '0911000002', '000190000002', 'female', '2000-07-21', 'Sinh viên'],
  ['Lê Hoàng Cường', '0911000003', '000090000003', 'male', '1995-11-02', 'Kỹ sư phần mềm'],
  ['Phạm Thu Dung', '0911000004', null, 'female', '1999-01-30', 'Giáo viên'],
  ['Hoàng Minh Đức', '0911000005', '000090000005', 'male', '1997-05-15', 'Shipper'],
  ['Vũ Thị Giang', '0911000006', '000190000006', 'female', '2001-09-09', 'Sinh viên'],
  ['Đặng Quốc Huy', '0911000007', null, 'male', null, null],
  ['Bùi Ngọc Lan', '0911000008', '000190000008', 'female', '1996-12-24', 'Kế toán'],
  ['Đỗ Văn Minh', '0911000009', '000090000009', 'male', '1994-04-18', 'Thợ điện'],
  ['Ngô Thị Ngọc', '0911000010', '000190000010', 'female', '2002-02-14', 'Sinh viên'],
  ['Dương Văn Phúc', '0911000011', null, 'male', '1993-08-08', 'Tài xế'],
  ['Lý Thị Quỳnh', '0911000012', '000190000012', 'female', '1998-10-10', 'Nhân viên bán hàng'],
  ['Mai Văn Sơn', '0911000013', '000090000013', 'male', '1999-06-06', 'Công nhân'],
  ['Trịnh Thu Trang', '0911000014', '000190000014', 'female', '2000-03-03', 'Thiết kế đồ hoạ'],
  ['Phan Văn Tùng', '0911000015', null, 'male', null, null],
];

const VEHICLES = [
  ['0911000001', '59-X1 000.01', 'motorbike'],
  ['0911000003', '59-X1 000.03', 'motorbike'],
  ['0911000003', '51A-000.03', 'car'],
  ['0911000005', '59-X2 000.05', 'motorbike'],
  ['0911000009', '59-X3 000.09', 'electric_bike'],
];

module.exports = {
  async up(queryInterface) {
    if (process.env.NODE_ENV === 'production')
      throw new Error('The Stay seed is for local development and CI only.');

    await queryInterface.sequelize.transaction(async (transaction) => {
      const [buildings] = await queryInterface.sequelize.query(
        "SELECT id FROM buildings WHERE code = 'A'",
        { transaction },
      );
      const buildingId = buildings[0]?.id;

      if (!buildingId) return;

      for (const [fullName, phone, idNumber, gender, birthDate, occupation] of TENANTS) {
        await queryInterface.sequelize.query(
          `INSERT INTO tenants (id, building_id, full_name, phone, id_number, gender, birth_date,
             occupation, hometown)
           SELECT :id, :buildingId, :fullName, :phone, :idNumber, :gender, :birthDate,
             :occupation, 'TP. Hồ Chí Minh'
           WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE building_id = :buildingId AND phone = :phone)
             AND NOT EXISTS (SELECT 1 FROM tenants WHERE id_number = :idNumber)`,
          {
            replacements: {
              id: randomUUID(),
              buildingId,
              fullName,
              phone,
              idNumber,
              gender,
              birthDate,
              occupation,
            },
            transaction,
          },
        );
      }

      for (const [phone, plate, type] of VEHICLES) {
        await queryInterface.sequelize.query(
          `INSERT INTO vehicles (id, tenant_id, plate, plate_key, type)
           SELECT :id, t.id, :plate, :plateKey, :type FROM tenants t
           WHERE t.building_id = :buildingId AND t.phone = :phone
           ON CONFLICT (tenant_id, plate_key) DO NOTHING`,
          {
            replacements: {
              id: randomUUID(),
              buildingId,
              phone,
              plate,
              plateKey: plate.replace(/[^0-9A-Z]/g, ''),
              type,
            },
            transaction,
          },
        );
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM vehicles WHERE tenant_id IN (SELECT id FROM tenants WHERE phone LIKE '091100%');
       DELETE FROM tenants WHERE phone LIKE '091100%' AND id NOT IN (
         SELECT tenant_id FROM tenant_documents);`,
    );
  },
};
