import { stayAbilityKit } from '@stay/shared';
import { matchPath, useLocation } from 'react-router-dom';
import { useAbility } from '@/libraries/ability';
import { appRoutes, type StayRoute } from './route-configs';

/**
 * Routes the user may open, for menus. Same check as `useCanAccess` (unconditional access),
 * applied to the whole list in one hook call.
 */
export function useMenuRoutes(): StayRoute[] {
  const ability = useAbility();

  return appRoutes.filter(({ ability: check }) =>
    stayAbilityKit.canAccess(ability, check.action, check.subject),
  );
}

/** The app route matching the current URL (title, back button, placeholders). */
export function useCurrentRoute(): StayRoute | undefined {
  const { pathname } = useLocation();

  return appRoutes.find(({ path }) => matchPath({ path, end: true }, pathname));
}
