'use strict';
/**
 * Local/CI seed: the owner account and building A. Idempotent; refuses to run in production.
 * The password is published in apps/stay/api/README.md and blocked in production
 * (`isBlockedPassword` in src/configs/production.ts).
 */
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');

const OWNER_EMAIL = 'owner@stay.local';
const OWNER_PASSWORD = 'stay-owner-123';

module.exports = {
  async up(queryInterface) {
    if (process.env.NODE_ENV === 'production')
      throw new Error('The Stay seed is for local development and CI only.');

    const hash = await bcrypt.hash(OWNER_PASSWORD, 12);

    await queryInterface.sequelize.transaction(async (transaction) => {
      const [owners] = await queryInterface.sequelize.query(
        `INSERT INTO users (id, email, display_name, email_verified, role, account_status)
         VALUES (:id, :email, 'Chủ trọ', true, 'owner', 'active')
         ON CONFLICT ((lower(email))) DO UPDATE SET updated_at = users.updated_at
         RETURNING id`,
        { replacements: { id: randomUUID(), email: OWNER_EMAIL }, transaction },
      );
      const ownerId = owners[0].id;

      await queryInterface.sequelize.query(
        `INSERT INTO auth_accounts (id, account_id, provider_id, user_id, password)
         VALUES (:id, :ownerId, 'credential', :ownerId, :hash)
         ON CONFLICT (provider_id, account_id) DO NOTHING`,
        { replacements: { id: randomUUID(), ownerId, hash }, transaction },
      );
      await queryInterface.sequelize.query(
        `INSERT INTO buildings (id, code, name) VALUES (:id, 'A', 'Toà A')
         ON CONFLICT (code) DO NOTHING`,
        { replacements: { id: randomUUID() }, transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM buildings WHERE code = 'A';
       DELETE FROM users WHERE lower(email) = :email;`,
      { replacements: { email: OWNER_EMAIL } },
    );
  },
};
