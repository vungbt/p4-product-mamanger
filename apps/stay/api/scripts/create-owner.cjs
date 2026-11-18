'use strict';
/**
 * Creates the production owner account (or resets its password with --reset). Run inside the API
 * container so it uses the same database settings:
 *
 *   docker compose -p stay exec -e STAY_OWNER_PASSWORD='…' api \
 *     node scripts/create-owner.cjs owner@example.com "Tên chủ trọ" [--reset]
 *
 * The password comes from the environment, never from the command arguments, and is not logged.
 * It is stored as a bcrypt hash (12 rounds) in the Better Auth credential account.
 */
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const [email, displayName = 'Chủ trọ', flag] = process.argv.slice(2);
const password = process.env.STAY_OWNER_PASSWORD ?? '';
const reset = flag === '--reset' || displayName === '--reset';

async function main() {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Usage: node scripts/create-owner.cjs <email> [display name] [--reset]');
  if (password.length < 8) throw new Error('STAY_OWNER_PASSWORD must be at least 8 characters.');

  const client = new Client({
    host: process.env.STAY_DATABASE_HOST,
    port: Number(process.env.STAY_DATABASE_PORT || 5432),
    user: process.env.STAY_DATABASE_USERNAME,
    password: process.env.STAY_DATABASE_PASSWORD,
    database: process.env.STAY_DATABASE_NAME,
  });
  const hash = await bcrypt.hash(password, 12);

  await client.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT id, role FROM users WHERE lower(email) = lower($1)',
      [email],
    );
    let userId = existing.rows[0]?.id;

    if (userId && !reset)
      throw new Error('The account exists; pass --reset to set a new password.');
    if (userId && existing.rows[0].role !== 'owner')
      throw new Error('The account is not an owner.');
    if (!userId) {
      userId = randomUUID();
      await client.query(
        `INSERT INTO users (id, email, display_name, email_verified, role, account_status)
         VALUES ($1, lower($2), $3, true, 'owner', 'active')`,
        [userId, email, reset ? 'Chủ trọ' : displayName],
      );
    }
    await client.query(
      `INSERT INTO auth_accounts (id, account_id, provider_id, user_id, password)
       VALUES ($1, $2, 'credential', $2, $3)
       ON CONFLICT (provider_id, account_id) DO UPDATE SET password = EXCLUDED.password`,
      [randomUUID(), userId, hash],
    );
    await client.query('COMMIT');
    console.log(`Owner ready: ${email.toLowerCase()}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
