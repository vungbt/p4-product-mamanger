'use strict';
const { randomUUID } = require('node:crypto');

module.exports = {
  async up(q) {
    if (process.env.NODE_ENV === 'production') throw new Error('Stay seed is local/CI only.');
    await q.sequelize.transaction(async (transaction) => {
      const [meters] = await q.sequelize.query(
        `SELECT m.id, m.kind, m.initial_reading
        FROM meters m JOIN contracts c ON c.room_id=m.room_id
        WHERE c.id::text LIKE 'a0000010-0000-4000-8000-%' AND c.status IN ('active','ending')
          AND m.removed_on IS NULL`,
        { transaction },
      );
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      const year = Number(today.slice(0, 4));
      const month = Number(today.slice(5, 7));
      const historyStart = new Date(Date.UTC(year, month - 4, 1)).toISOString().slice(0, 10);
      // Only untouched local fixtures are moved back to make the historical readings coherent.
      await q.sequelize.query(
        `UPDATE contracts SET start_date=LEAST(start_date,:historyStart)
        WHERE id::text LIKE 'a0000010-0000-4000-8000-%' AND version=1
          AND NOT EXISTS (SELECT 1 FROM meter_readings r JOIN meters m ON m.id=r.meter_id WHERE m.room_id=contracts.room_id)`,
        { replacements: { historyStart }, transaction },
      );
      for (const meter of meters) {
        const [existing] = await q.sequelize.query(
          'SELECT 1 FROM meter_readings WHERE meter_id=:meterId LIMIT 1',
          { replacements: { meterId: meter.id }, transaction },
        );
        if (existing.length) continue;
        await q.sequelize.query(
          'UPDATE meters SET installed_on=LEAST(installed_on,:historyStart) WHERE id=:meterId',
          { replacements: { historyStart, meterId: meter.id }, transaction },
        );
        for (let index = 0; index < 3; index++) {
          const date = new Date(Date.UTC(year, month - 3 + index, 0));
          const readOn = date.toISOString().slice(0, 10);
          await q.sequelize.query(
            `INSERT INTO meter_readings(id,meter_id,period,reading,read_on)
            VALUES(:id,:meterId,:period,:reading,:readOn) ON CONFLICT (meter_id,period) DO NOTHING`,
            {
              replacements: {
                id: randomUUID(),
                meterId: meter.id,
                period: readOn.slice(0, 7),
                readOn,
                reading:
                  Number(meter.initial_reading) +
                  (index + 1) * (meter.kind === 'electricity' ? 100 : 8),
              },
              transaction,
            },
          );
        }
      }
    });
  },
  async down(q) {
    await q.sequelize.query(`DELETE FROM meter_readings WHERE meter_id IN
      (SELECT m.id FROM meters m JOIN contracts c ON c.room_id=m.room_id
       WHERE c.id::text LIKE 'a0000010-0000-4000-8000-%')`);
  },
};
