import type { IRoute } from '@/routing/route.types';
import { adminLoginRoute, adminPortalRoutes } from '@/routing/routes/admin.routes';
import {
  storefrontLoginRoute,
  storefrontPasswordRoute,
  storefrontPortalRoutes,
  storefrontRegisterRoute,
} from '@/routing/routes/storefront.routes';

const RouteConfigs: IRoute[] = [
  storefrontLoginRoute,
  storefrontRegisterRoute,
  storefrontPasswordRoute,
  ...storefrontPortalRoutes,
  adminLoginRoute,
  ...adminPortalRoutes,
];

export default RouteConfigs;
