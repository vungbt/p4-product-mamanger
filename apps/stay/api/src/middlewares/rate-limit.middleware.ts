import { createRateLimit } from '@p4/server-core';
import { sequelize } from '@/sequelize/index.js';

export const rateLimit = createRateLimit(sequelize);
