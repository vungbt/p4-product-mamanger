require('dotenv').config({
  path: require('node:path').resolve(__dirname, '../../../../.env'),
  quiet: true,
});

const common = {
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'p4_product_manager',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  dialect: 'postgres',
  logging: false,
};

module.exports = {
  development: { ...common },
  test: { ...common, database: `${common.database}_test` },
  production: { ...common },
};
