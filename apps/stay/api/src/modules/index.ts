import { Router } from 'express';
import buildingsRouter from './buildings/buildings.router.js';
import meRouter from './me/me.router.js';
import roomsRouter from './rooms/rooms.router.js';
import settingsRouter from './settings/settings.router.js';

// Each router ends with applyAuditPolicies: a route without an explicit policy stops startup.
// Mount with `apiRouter.use(...)` so the OpenAPI generator finds the module.
const apiRouter = Router();

apiRouter.use(meRouter);
apiRouter.use(settingsRouter);
apiRouter.use(buildingsRouter);
apiRouter.use(roomsRouter);

export default apiRouter;
