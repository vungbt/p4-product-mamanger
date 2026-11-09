import { createNamespace } from 'cls-hooked';
import pg from 'pg';
import { Sequelize } from 'sequelize';
import { env } from '@/configs/env.js';

// Queries inside an audited transaction join it without passing `transaction` explicitly.
Sequelize.useCLS(createNamespace('stay-transactions'));

export const sequelize = new Sequelize(
  env.database.name,
  env.database.username,
  env.database.password,
  {
    host: env.database.host,
    port: env.database.port,
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
  },
);
