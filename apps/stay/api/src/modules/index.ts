import { Router } from 'express';
import announcementsRouter from './announcements/announcements.router.js';
import auditRouter from './audit/audit.router.js';
import automationRouter from './automation/automation.router.js';
import buildingsRouter from './buildings/buildings.router.js';
import contractsRouter from './contracts/contracts.router.js';
import depositsRouter from './deposits/deposits.router.js';
import expensesRouter from './expenses/expenses.router.js';
import invoicesPublicRouter from './invoices/invoices.public.router.js';
import invoicesRouter from './invoices/invoices.router.js';
import meRouter from './me/me.router.js';
import membersRouter from './members/members.router.js';
import overviewRouter from './overview/overview.router.js';
import paymentsRouter from './payments/payments.router.js';
import portalRouter from './portal/portal.router.js';
import portalLinksRouter from './portal/portal-links.router.js';
import readingsRouter from './readings/readings.router.js';
import receivablesRouter from './receivables/receivables.router.js';
import reportsRouter from './reports/reports.router.js';
import requestsRouter from './requests/requests.router.js';
import residentsRouter from './residents/residents.router.js';
import roomsRouter from './rooms/rooms.router.js';
import settingsRouter from './settings/settings.router.js';
import tenantsRouter from './tenants/tenants.router.js';
import uploadsRouter from './uploads/uploads.router.js';

// Each router ends with applyAuditPolicies: a route without an explicit policy stops startup.
// Mount with `apiRouter.use(...)` so the OpenAPI generator finds the module.
const apiRouter = Router();

apiRouter.use(invoicesPublicRouter);
apiRouter.use(auditRouter);
apiRouter.use(automationRouter);
apiRouter.use(invoicesRouter);
apiRouter.use(paymentsRouter);
apiRouter.use(receivablesRouter);
apiRouter.use(overviewRouter);
apiRouter.use(reportsRouter);
apiRouter.use(readingsRouter);
apiRouter.use(expensesRouter);
apiRouter.use(depositsRouter);
apiRouter.use(contractsRouter);
apiRouter.use(meRouter);
apiRouter.use(membersRouter);
apiRouter.use(settingsRouter);
apiRouter.use(buildingsRouter);
apiRouter.use(roomsRouter);
apiRouter.use(residentsRouter);
apiRouter.use(uploadsRouter);
apiRouter.use(tenantsRouter);
apiRouter.use(portalLinksRouter);
apiRouter.use(requestsRouter);
apiRouter.use(announcementsRouter);
// ST-25 tenant portal: public + portal-cookie routes, outside the staff `authRequired`.
apiRouter.use(portalRouter);

export default apiRouter;
