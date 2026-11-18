import {
  applyAuditPolicies,
  BaseError,
  currentUser,
  InputValidError,
  type RouteAuditPolicies,
  uuidRouteId,
} from '@p4/server-core';
import { isPeriod, type ReadingBulkResult } from '@stay/shared';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { sequelize } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { formBody } from '@/shared/input.js';
import { readReadingInput, readReplacementInput } from './readings.input.js';
import { readingBuilding, readingGrid, replaceMeter, saveReading } from './readings.service.js';

const router = Router();

router.get(
  '/buildings/:buildingId/readings',
  authRequired,
  requireScopedAbility('read', 'MeterReading'),
  apiHandler((req) => {
    const period = req.query.period;
    if (!isPeriod(period))
      throw new InputValidError('input_valid_error', { period: ['Kỳ phải có dạng YYYY-MM.'] });
    return readingGrid(currentUser(req), uuidRouteId(req, 'buildingId'), period);
  }),
);

router.put(
  '/buildings/:buildingId/readings',
  authRequired,
  requireScopedAbility('update', 'MeterReading'),
  apiHandler((req) => {
    const body = formBody(req);
    const rows = body.data.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 400)
      throw new InputValidError('input_valid_error', { rows: ['Gửi từ 1 đến 400 chỉ số.'] });
    const buildingId = uuidRouteId(req, 'buildingId');
    const user = currentUser(req);
    return auditedTransaction(async (transaction) => {
      await readingBuilding(user, buildingId, true, transaction);
      const result: ReadingBulkResult = { results: [] };
      // A savepoint isolates database failures too: valid rows survive mixed batches.
      for (const raw of rows) {
        let meterId = '';
        try {
          const input = readReadingInput(formBody(req, raw));
          meterId = input.meterId;
          const data = await sequelize.transaction({ transaction }, async (savepoint) => {
            const saved = await saveReading(user, input, savepoint, buildingId);
            await recordAudit(
              {
                action: 'meter_reading.update',
                resourceType: 'meter_reading',
                resourceId: saved.id,
                changes: {
                  buildingId,
                  meterId,
                  period: saved.period,
                  reading: saved.reading,
                  version: saved.version,
                  confirmed: input.confirmHighConsumption ?? false,
                },
              },
              savepoint,
            );
            return saved;
          });
          result.results.push({ meterId, data, error: null });
        } catch (error) {
          if (!(error instanceof BaseError)) throw error;
          if (
            !meterId &&
            raw &&
            typeof raw === 'object' &&
            'meterId' in raw &&
            typeof raw.meterId === 'string'
          )
            meterId = raw.meterId;
          result.results.push({
            meterId,
            data: null,
            error: {
              code: error.code,
              message:
                Object.values(error.extensions)
                  .flat()
                  .filter((value): value is string => typeof value === 'string')
                  .join(' ') || error.message,
              status: error.statusCode,
            },
          });
        }
      }
      return result;
    });
  }),
);

router.put(
  '/readings/:id',
  authRequired,
  requireScopedAbility('update', 'MeterReading'),
  apiHandler((req) => {
    const input = readReadingInput(formBody(req));
    return auditedTransaction((transaction) =>
      saveReading(currentUser(req), input, transaction, undefined, uuidRouteId(req)),
    );
  }),
);
router.post(
  '/meters/:id/replace',
  authRequired,
  requireScopedAbility('update', 'MeterReading'),
  apiHandler((req) =>
    replaceMeter(
      currentUser(req),
      uuidRouteId(req),
      readReplacementInput(formBody(req)),
      req.get('Idempotency-Key'),
    ),
  ),
);

const auditPolicies = {
  'GET /buildings/:buildingId/readings': { action: 'read', resourceType: 'meter_reading' },
  'PUT /buildings/:buildingId/readings': { action: 'update', resourceType: 'meter_reading' },
  'PUT /readings/:id': { action: 'update', resourceType: 'meter_reading' },
  'POST /meters/:id/replace': { action: 'update', resourceType: 'meter_reading' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
