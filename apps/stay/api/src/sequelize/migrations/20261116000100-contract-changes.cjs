'use strict';
module.exports = {
  async up(q) {
    await q.sequelize.query(`
CREATE INDEX contract_events_history ON contract_events(contract_id,type,created_at,id);
-- Room identity is resolved at a business date, including future and backdated moves.
CREATE FUNCTION stay_contract_room_at(contract_uuid uuid, business_date date) RETURNS uuid
LANGUAGE sql STABLE AS $$
 SELECT COALESCE(
  (SELECT (payload->>'roomId')::uuid FROM contract_events
   WHERE contract_id=contract_uuid AND type='room-change'
    AND (payload->>'effectiveDate')::date <= business_date
   ORDER BY (payload->>'effectiveDate')::date DESC, (payload->>'version')::integer DESC NULLS LAST, created_at DESC, id DESC LIMIT 1),
  (SELECT (payload->>'roomId')::uuid FROM contract_events
   WHERE contract_id=contract_uuid AND type='activated' ORDER BY created_at LIMIT 1),
  (SELECT (payload->>'oldRoomId')::uuid FROM contract_events
   WHERE contract_id=contract_uuid AND type='room-change' ORDER BY created_at, id LIMIT 1),
  (SELECT room_id FROM contracts WHERE id=contract_uuid)
 )
$$;
`);
  },
  async down(q) {
    await q.sequelize.query(
      'DROP FUNCTION stay_contract_room_at(uuid,date); DROP INDEX contract_events_history',
    );
  },
};
