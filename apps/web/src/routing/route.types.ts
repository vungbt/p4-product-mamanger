import { type IconName, RenderIcon } from '@p4/ui';
import { type ComponentType, createElement, type LazyExoticComponent, type ReactNode } from 'react';
import type { Role } from '@/types/types';

export interface IRoute {
  path: string;
  name: string;
  label?: string;
  /** Icon name — `@p4/ui` (Lucide aliases) */
  iconName?: IconName;
  /** Hoặc truyền ReactNode trực tiếp */
  icon?: ReactNode;
  component: LazyExoticComponent<ComponentType<object>>;
  hideInMenu?: boolean;
  existSubMenu?: boolean;
  exact?: boolean;
  /** Role được phép — portal hoặc leaf (VD: checkout). Không set = public */
  authority?: Role[];
  loginPath?: string;
  /** Trang login — redirect nếu đã đăng nhập đúng role */
  guestOnly?: boolean;
  guestAuthority?: Role[];
  guestRedirect?: string;
  routes?: IRoute[];
}

export interface IMasterRouter {
  routes: IRoute[];
}

export type MenuItem =
  | { type: 'item'; name: string; label: string; path: string; icon?: ReactNode }
  | { type: 'submenu'; name: string; label: string; icon?: ReactNode; children: MenuItem[] };

function resolveRouteIcon(route: IRoute): ReactNode | undefined {
  if (route.icon) return route.icon;
  if (route.iconName) return createElement(RenderIcon, { name: route.iconName });
  return undefined;
}

/** Flatten menu từ IRoute tree (support submenu) */
export function buildMenuItems(routes: IRoute[] = []): MenuItem[] {
  const items: MenuItem[] = [];

  for (const route of routes) {
    if (route.hideInMenu) continue;

    if (route.existSubMenu && route.routes?.length) {
      const children = buildMenuItems(route.routes);
      if (children.length > 0) {
        items.push({
          type: 'submenu',
          name: route.name,
          label: route.label ?? route.name,
          icon: resolveRouteIcon(route),
          children,
        });
      }
      continue;
    }

    items.push({
      type: 'item',
      name: route.name,
      label: route.label ?? route.name,
      path: route.path,
      icon: resolveRouteIcon(route),
    });
  }

  return items;
}

/** Lấy menu routes của portal từ RouteConfigs */
export function getPortalMenuRoutes(configs: IRoute[], portalName: string): IRoute[] {
  const portal = configs.find((r) => r.name === portalName);
  return portal?.routes ?? [];
}

/** Flatten route paths cho RR v7 (submenu → sibling routes) */
export function flattenRouteElements(routes: IRoute[]): IRoute[] {
  const result: IRoute[] = [];

  for (const route of routes) {
    if (route.existSubMenu && route.routes?.length) {
      result.push(...flattenRouteElements(route.routes));
    } else {
      result.push(route);
    }
  }

  return result;
}

export function renderMenuItems(
  items: MenuItem[],
  renderLink: (path: string, label: string, key: string, icon?: ReactNode) => ReactNode,
  renderSubmenu: (
    label: string,
    key: string,
    icon: ReactNode | undefined,
    children: ReactNode,
  ) => ReactNode,
): ReactNode[] {
  return items.map((item) => {
    if (item.type === 'submenu') {
      return renderSubmenu(
        item.label,
        item.name,
        item.icon,
        item.children.map((child) =>
          child.type === 'item'
            ? renderLink(child.path, child.label, child.name, child.icon)
            : null,
        ),
      );
    }
    return renderLink(item.path, item.label, item.name, item.icon);
  });
}
