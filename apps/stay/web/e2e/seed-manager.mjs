// E2E-only seed (local/CI): a manager assigned to building A. Idempotent; refuses production.
// Run after `@stay/api` migrations and seed: `node apps/stay/web/e2e/seed-manager.mjs`.
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';

if (process.env.NODE_ENV === 'production') throw new Error('E2E seed is for local and CI only.');

// `pg` and `bcryptjs` are dependencies of @stay/api.
const require = createRequire(path.resolve(import.meta.dirname, '../../api/package.json'));
const bcrypt = require('bcryptjs');
const pg = require('pg');

export const MANAGER_EMAIL = 'manager-a@stay.local';
export const MANAGER_PASSWORD = 'stay-manager-123';

const client = new pg.Client({
  host: process.env.STAY_DATABASE_HOST ?? 'localhost',
  port: Number(process.env.STAY_DATABASE_PORT ?? 5432),
  database: process.env.STAY_DATABASE_NAME ?? 'p4_stay',
  user: process.env.STAY_DATABASE_USERNAME ?? 'postgres',
  password: process.env.STAY_DATABASE_PASSWORD ?? 'postgres',
});

await client.connect();

try {
  await client.query('BEGIN');

  const hash = await bcrypt.hash(MANAGER_PASSWORD, 12);
  const { rows: users } = await client.query(
    `INSERT INTO users (id, email, display_name, email_verified, role, account_status)
     VALUES ($1, $2, 'Quản lý toà A', true, 'manager', 'active')
     ON CONFLICT ((lower(email))) DO UPDATE SET role = 'manager', account_status = 'active'
     RETURNING id`,
    [randomUUID(), MANAGER_EMAIL],
  );
  const userId = users[0].id;

  await client.query(
    `INSERT INTO auth_accounts (id, account_id, provider_id, user_id, password)
     VALUES ($1, $2, 'credential', $3, $4)
     ON CONFLICT (provider_id, account_id) DO UPDATE SET password = EXCLUDED.password`,
    [randomUUID(), String(userId), userId, hash],
  );

  const { rowCount } = await client.query(
    `INSERT INTO building_members (id, building_id, user_id, role)
     SELECT $1, id, $2, 'manager' FROM buildings WHERE code = 'A'
     ON CONFLICT (building_id, user_id) DO NOTHING`,
    [randomUUID(), userId],
  );

  await client.query('COMMIT');
  console.log(`E2E manager ${MANAGER_EMAIL} assigned to building A (${rowCount} new).`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
