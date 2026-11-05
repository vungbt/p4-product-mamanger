import { type NextFunction, type Request, type Response, Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { ReportExportModel } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import { NotFound } from '@/utils/errors/index.js';
import * as reports from './reports.service.js';

const router = Router();
for (const kind of ['sales', 'orders', 'inventory', 'products'] as const)
  router.get(
    `/admin/reports/${kind}`,
    authRequired,
    requirePermission('report:read'),
    rateLimit('reports', 30),
    apiHandler(async (req) => ({
      definition:
        kind === 'sales'
          ? 'Captured and refunded cash by ledger timestamp; net = captured - refunded.'
          : kind === 'inventory'
            ? 'Current balance plus movement deltas in the selected period.'
            : 'Order creation cohort in the selected period.',
      range: reports.requestReportQuery(req),
      rows: await reports.reportRows(kind, reports.requestReportQuery(req)),
    })),
  );
router.post(
  '/admin/report-exports',
  authRequired,
  requirePermission('report:export'),
  rateLimit('report-export', 10, 3600000),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return reports.createExport(
      currentUser(req).id,
      body.enum('report', ['sales', 'orders', 'inventory', 'products']),
      reports.reportQuery(body.data),
      req.header('Idempotency-Key') ?? '',
    );
  }, 202),
);
router.get(
  '/admin/report-exports/:id',
  authRequired,
  requirePermission('report:export'),
  apiHandler(async (req) => {
    const row = await ReportExportModel.findOne({
      where: { id: uuidRouteId(req), userId: currentUser(req).id },
    });
    if (!row) throw new NotFound();
    return reports.exportDto(row);
  }),
);
router.get(
  '/admin/report-exports/:id/download',
  authRequired,
  requirePermission('report:export'),
  (req: Request, res: Response, next: NextFunction) => {
    void ReportExportModel.findOne({
      where: { id: uuidRouteId(req), userId: currentUser(req).id, status: 'ready' },
    })
      .then((row) => {
        if (!row || row.expiresAt.getTime() <= Date.now() || !row.content) throw new NotFound();
        res.setHeader('Cache-Control', 'no-store');
        res.type('text/csv').attachment(`report-${row.id}.csv`).send(row.content);
      })
      .catch(next);
  },
);
export default router;
