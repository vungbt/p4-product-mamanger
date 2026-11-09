import { matchPath, useLocation } from 'react-router-dom';
import { canOpen, useAbility } from '@/libraries/ability';
import { appRoutes, type StayRoute } from './route-configs';

/** Menu routes the user may open (same `canOpen` check as the page guard). */
export function useMenuRoutes(): StayRoute[] {
  const ability = useAbility();

  return appRoutes.filter((route) => !route.hideInMenu && canOpen(ability, route.ability));
}

/** The app route matching the current URL (title, back button, placeholders). */
export function useCurrentRoute(): StayRoute | undefined {
  const { pathname } = useLocation();

  return appRoutes.find(({ path }) => matchPath({ path, end: true }, pathname));
}
