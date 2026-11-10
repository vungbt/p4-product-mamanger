'use strict';
/**
 * Local/CI seed: 12 rooms in building A (floors 1–3, rooms 01–04 → 101…304), each with an
 * electricity and a water meter and the per-room default services. Only runs while building A
 * has no rooms, so local edits are kept and running it twice creates nothing.
 */
const { randomUUID } = require('node:crypto');

const FLOORS = [1, 2, 3];
const ROOMS_PER_FLOOR = 4;
const DEFAULT_SERVICE_CODES = ['internet', 'garbage', 'common_fee'];

module.exports = {
  async up(queryInterface) {
    if (process.env.NODE_ENV === 'production')
      throw new Error('The Stay seed is for local development and CI only.');

    await queryInterface.sequelize.transaction(async (transaction) => {
      const [buildings] = await queryInterface.sequelize.query(
        `SELECT b.id, (SELECT count(*) FROM rooms r WHERE r.building_id = b.id) AS room_count
         FROM buildings b WHERE b.code = 'A' FOR UPDATE OF b`,
        { transaction },
      );
      const building = buildings[0];

      if (!building || Number(building.room_count) > 0) return;

      const [services] = await queryInterface.sequelize.query(
        'SELECT id FROM service_definitions WHERE code IN (:codes) AND active',
        { replacements: { codes: DEFAULT_SERVICE_CODES }, transaction },
      );
      const installedOn = new Date().toISOString().slice(0, 10);

      for (const floor of FLOORS) {
        for (let number = 1; number <= ROOMS_PER_FLOOR; number += 1) {
          const roomId = randomUUID();
          const code = `${floor}${String(number).padStart(2, '0')}`;
          // Corner rooms (01, 04) are larger and cost more.
          const corner = number === 1 || number === ROOMS_PER_FLOOR;

          await queryInterface.sequelize.query(
            `INSERT INTO rooms (id, building_id, code, floor, area_m2, list_price, max_occupants)
             VALUES (:roomId, :buildingId, :code, :floor, :area, :price, :maxOccupants)`,
            {
              replacements: {
                roomId,
                buildingId: building.id,
                code,
                floor,
                area: corner ? 25 : 20,
                price: corner ? 3_500_000 : 3_000_000,
                maxOccupants: corner ? 3 : 2,
              },
              transaction,
            },
          );
          for (const service of services)
            await queryInterface.sequelize.query(
              'INSERT INTO room_default_services (room_id, service_id) VALUES (:roomId, :serviceId)',
              { replacements: { roomId, serviceId: service.id }, transaction },
            );
          for (const [kind, reading] of [
            ['electricity', 1000 + floor * 100 + number * 10],
            ['water', 100 + floor * 10 + number],
          ])
            await queryInterface.sequelize.query(
              `INSERT INTO meters (id, room_id, kind, installed_on, initial_reading)
               VALUES (:id, :roomId, :kind, :installedOn, :reading)`,
              {
                replacements: { id: randomUUID(), roomId, kind, installedOn, reading },
                transaction,
              },
            );
        }
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM meters WHERE room_id IN (
         SELECT r.id FROM rooms r JOIN buildings b ON b.id = r.building_id WHERE b.code = 'A');
       DELETE FROM rooms WHERE building_id IN (SELECT id FROM buildings WHERE code = 'A');`,
    );
  },
};
