import type { RequestHandler, Router } from 'express';
import { requestStore } from '@/shared/request-store.js';
import type { RouteAuditPolicies } from './types.js';
import { AUDIT_ACTIONS } from './types.js';

export function applyAuditPolicies(router: Router, policies: RouteAuditPolicies) {
  const covered = new Set<string>();
  for (const layer of router.stack) {
    const route = layer.route;
    if (!route) continue;
    const methods = new Set(route.stack.flatMap((entry) => (entry.method ? [entry.method] : [])));
    for (const method of methods) {
      const key = `${method.toUpperCase()} ${String(route.path)}`;
      const policy = policies[key];
      if (!policy) throw new Error(`Missing explicit audit action for ${key}`);
      if (
        AUDIT_ACTIONS[policy.action].changesData &&
        policy.auditedHandler !== route.stack.at(-1)?.handle &&
        !route.stack.some((entry) => Reflect.has(entry.handle, 'apiHandler'))
      ) {
        throw new Error(`Audit action ${key} requires apiHandler or a declared audited command.`);
      }
      covered.add(key);
      const first = route.stack.find((entry) => entry.method === method);
      if (!first) continue;
      const original = first.handle;
      const middleware: RequestHandler = (req, res, next) => {
        const context = requestStore.getStore();
        const id =
          req.params.variantId ??
          req.params.reviewId ??
          req.params.imageId ??
          req.params.id ??
          req.params.productId;
        if (context) {
          context.route = `${req.baseUrl}${String(route.path)}`;
          context.audit = { ...policy, resourceId: typeof id === 'string' ? id : undefined };
        }
        original(req, res, next);
      };
      first.handle = Object.assign(middleware, original, {
        auditPolicy: policy,
        originalHandler: original,
      });
    }
  }
  for (const key of Object.keys(policies)) {
    if (!covered.has(key)) throw new Error(`Stale audit route policy: ${key}`);
  }
  return router;
}
