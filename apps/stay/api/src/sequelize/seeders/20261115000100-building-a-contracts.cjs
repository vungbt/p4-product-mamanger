'use strict';
const { randomUUID } = require('node:crypto');

/** Local/CI only. Nine occupied rooms; three stay vacant for exploring the wizard. */
module.exports = {
  async up(q) {
    if (process.env.NODE_ENV === 'production') throw new Error('Stay seed is local/CI only.');
    await q.sequelize.transaction(async (transaction) => {
      const [buildings] = await q.sequelize.query("SELECT id FROM buildings WHERE code = 'A'", {
        transaction,
      });
      const buildingId = buildings[0]?.id;
      if (!buildingId) return;
      const [rooms] = await q.sequelize.query(
        'SELECT id, list_price FROM rooms WHERE building_id = :buildingId AND NOT maintenance AND archived_at IS NULL ORDER BY code LIMIT 9',
        { replacements: { buildingId }, transaction },
      );
      const [tenants] = await q.sequelize.query(
        "SELECT id FROM tenants WHERE building_id = :buildingId AND phone LIKE '091100%' ORDER BY phone LIMIT 9",
        { replacements: { buildingId }, transaction },
      );
      const [owners] = await q.sequelize.query(
        "SELECT id FROM users WHERE email = 'owner@stay.local'",
        { transaction },
      );
      if (!owners[0] || tenants.length < rooms.length) return;
      for (const [index, room] of rooms.entries()) {
        const code = `HD-A-${String(index + 1).padStart(4, '0')}`;
        const [existing] = await q.sequelize.query(
          "SELECT id FROM contracts WHERE building_id = :buildingId AND (code = :code OR (room_id = :roomId AND status IN ('active','ending')))",
          { replacements: { buildingId, code, roomId: room.id }, transaction },
        );
        if (existing.length) continue;
        const id = `a0000010-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
        const replacements = {
          id,
          buildingId,
          roomId: room.id,
          code,
          rent: room.list_price,
          tenantId: tenants[index].id,
          occupantId: randomUUID(),
          actorId: owners[0].id,
          eventId: randomUUID(),
        };
        await q.sequelize.query(
          `
          INSERT INTO contracts(id,building_id,room_id,code,status,start_date,end_date,rent,initial_electric,initial_water)
          SELECT :id,:buildingId,:roomId,:code,'active','2026-11-01','2027-10-31',:rent,
            COALESCE((SELECT initial_reading FROM meters WHERE room_id=:roomId AND kind='electricity' AND removed_on IS NULL),0),
            COALESCE((SELECT initial_reading FROM meters WHERE room_id=:roomId AND kind='water' AND removed_on IS NULL),0);
          INSERT INTO contract_occupants(id,contract_id,tenant_id,is_primary,from_date) VALUES(:occupantId,:id,:tenantId,true,'2026-11-01');
          INSERT INTO contract_events(id,contract_id,type,actor_id) VALUES(:eventId,:id,'activated',:actorId);
        `,
          { replacements, transaction },
        );
        const [services] = await q.sequelize.query(
          'SELECT service_id FROM room_default_services WHERE room_id=:roomId',
          { replacements, transaction },
        );
        for (const service of services)
          await q.sequelize.query(
            "INSERT INTO contract_services(id,contract_id,service_id,from_date) VALUES(:linkId,:id,:serviceId,'2026-11-01')",
            {
              replacements: { id, linkId: randomUUID(), serviceId: service.service_id },
              transaction,
            },
          );
      }
    });
  },
  async down(q) {
    await q.sequelize.query(`DELETE FROM contract_events WHERE contract_id IN (SELECT id FROM contracts WHERE id::text LIKE 'a0000010-0000-4000-8000-%');
      DELETE FROM contract_services WHERE contract_id IN (SELECT id FROM contracts WHERE id::text LIKE 'a0000010-0000-4000-8000-%');
      DELETE FROM contract_occupants WHERE contract_id IN (SELECT id FROM contracts WHERE id::text LIKE 'a0000010-0000-4000-8000-%');
      DELETE FROM contracts WHERE id::text LIKE 'a0000010-0000-4000-8000-%';`);
  },
};
