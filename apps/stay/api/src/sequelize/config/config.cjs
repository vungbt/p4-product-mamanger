// sequelize-cli config for the Stay database (p4_stay); reads STAY_DATABASE_* from the root .env.
require('dotenv').config({
  path: require('node:path').resolve(__dirname, '../../../../../../.env'),
  quiet: true,
});

const common = {
  username: process.env.STAY_DATABASE_USERNAME || 'postgres',
  password: process.env.STAY_DATABASE_PASSWORD || 'postgres',
  database: process.env.STAY_DATABASE_NAME || 'p4_stay',
  host: process.env.STAY_DATABASE_HOST || 'localhost',
  port: Number(process.env.STAY_DATABASE_PORT || 5432),
  dialect: 'postgres',
  logging: false,
};

module.exports = {
  development: { ...common },
  test: { ...common },
  production: { ...common },
};
