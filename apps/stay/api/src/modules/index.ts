import { Router } from 'express';
import auditRouter from './audit/audit.router.js';
import buildingsRouter from './buildings/buildings.router.js';
import contractsRouter from './contracts/contracts.router.js';
import expensesRouter from './expenses/expenses.router.js';
import meRouter from './me/me.router.js';
import roomsRouter from './rooms/rooms.router.js';
import settingsRouter from './settings/settings.router.js';
import tenantsRouter from './tenants/tenants.router.js';
import uploadsRouter from './uploads/uploads.router.js';

// Each router ends with applyAuditPolicies: a route without an explicit policy stops startup.
// Mount with `apiRouter.use(...)` so the OpenAPI generator finds the module.
const apiRouter = Router();

apiRouter.use(auditRouter);
apiRouter.use(expensesRouter);
apiRouter.use(contractsRouter);
apiRouter.use(meRouter);
apiRouter.use(settingsRouter);
apiRouter.use(buildingsRouter);
apiRouter.use(roomsRouter);
apiRouter.use(uploadsRouter);
apiRouter.use(tenantsRouter);

export default apiRouter;
