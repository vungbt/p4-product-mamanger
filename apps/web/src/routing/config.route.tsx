import type { IRoute } from '@/routing/route.types';
import { adminLoginRoute, adminPortalRoutes } from '@/routing/routes/admin.routes';
import {
  storefrontLoginRoute,
  storefrontPortalRoutes,
  storefrontRegisterRoute,
} from '@/routing/routes/storefront.routes';

const RouteConfigs: IRoute[] = [
  storefrontLoginRoute,
  storefrontRegisterRoute,
  ...storefrontPortalRoutes,
  adminLoginRoute,
  ...adminPortalRoutes,
];

export default RouteConfigs;
