'use strict';
/**
 * ST-16: share links of issued invoices. Only the SHA-256 hash of the random token is stored
 * (`share_token_hash`, from ST-14); `share_expires_at` ends the link. Refreshing replaces both
 * (the old link stops working), revoking clears both. Public lookups go through the hash index.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS share_expires_at timestamptz;
      UPDATE invoices SET share_token_hash = NULL WHERE share_expires_at IS NULL;
      ALTER TABLE invoices ADD CONSTRAINT invoices_share_pair_check
        CHECK ((share_token_hash IS NULL) = (share_expires_at IS NULL));
      CREATE UNIQUE INDEX IF NOT EXISTS invoices_share_token_hash_idx
        ON invoices (share_token_hash) WHERE share_token_hash IS NOT NULL;
    `);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS invoices_share_token_hash_idx;
      ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_share_pair_check;
      ALTER TABLE invoices DROP COLUMN IF EXISTS share_expires_at;
    `);
  },
};
