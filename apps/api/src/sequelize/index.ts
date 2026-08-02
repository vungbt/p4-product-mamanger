import pg from 'pg';
import { Sequelize } from 'sequelize';
import { env } from '@/configs/env.js';
import { logger } from '@/utils/logger.js';

export const sequelize = new Sequelize(
  env.database.name,
  env.database.username,
  env.database.password,
  {
    host: env.database.host,
    port: env.database.port,
    dialect: 'postgres',
    dialectModule: pg,
    logging: env.isProd ? false : (sql) => logger.debug(sql),
  },
);

export default sequelize;
