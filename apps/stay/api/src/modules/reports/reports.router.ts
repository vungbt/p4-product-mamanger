import {
  applyAuditPolicies,
  currentUser,
  InputValidError,
  type RouteAuditPolicies,
} from '@p4/server-core';
import { REPORT_SHEETS, type ReportSheet } from '@stay/shared';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { exportReport } from './reports.export.js';
import { revenueReport, roomsReport, utilitiesReport } from './reports.service.js';

const router = Router();

function buildingId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
    throw new InputValidError('input_valid_error', { buildingId: ['Toà nhà không hợp lệ.'] });
  return value;
}

router.get(
  '/reports/revenue',
  authRequired,
  requireScopedAbility('read', 'Report'),
  apiHandler((req) =>
    revenueReport(currentUser(req), buildingId(req.query.buildingId), req.query.from, req.query.to),
  ),
);
router.get(
  '/reports/rooms',
  authRequired,
  requireScopedAbility('read', 'Report'),
  apiHandler((req) =>
    roomsReport(
      currentUser(req),
      buildingId(req.query.buildingId),
      typeof req.query.year === 'string' && /^\d{4}$/.test(req.query.year)
        ? Number(req.query.year)
        : NaN,
    ),
  ),
);
router.get(
  '/reports/utilities',
  authRequired,
  requireScopedAbility('read', 'Report'),
  apiHandler((req) =>
    utilitiesReport(
      currentUser(req),
      buildingId(req.query.buildingId),
      req.query.from,
      req.query.to,
    ),
  ),
);
router.post(
  '/reports/exports',
  authRequired,
  requireScopedAbility('read', 'Report'),
  rateLimit('stay-report-export', 5),
  (req, res, next) => {
    Promise.resolve()
      .then(async () => {
        const body = formBody(req);
        const id = buildingId(body.data.buildingId);
        const from = body.text('from', 7);
        const to = body.text('to', 7);
        const raw = body.data.sheets;
        const selected: ReportSheet[] = REPORT_SHEETS.filter(
          (key) => Array.isArray(raw) && raw.includes(key),
        );

        body.check(
          'sheets',
          Array.isArray(raw) && raw.length > 0 && raw.length === selected.length,
        );
        body.assertValid();
        const file = await exportReport(currentUser(req), {
          buildingId: id,
          from,
          to,
          sheets: selected,
        });

        res.attachment(`stay-${from}-${to}.xlsx`);
        res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Cache-Control', 'no-store');
        res.send(file);
      })
      .catch(next);
  },
);

const auditPolicies = {
  'GET /reports/revenue': { action: 'read', resourceType: 'report' },
  'GET /reports/rooms': { action: 'read', resourceType: 'report' },
  'GET /reports/utilities': { action: 'read', resourceType: 'report' },
  'POST /reports/exports': { action: 'read', resourceType: 'report' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
