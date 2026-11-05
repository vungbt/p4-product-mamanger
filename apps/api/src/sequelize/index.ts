import pg from 'pg';
import { Sequelize } from 'sequelize';
import { env } from '@/configs/env.js';

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

export default sequelize;
