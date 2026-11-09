import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /posts/:slug': {
    action: 'read',
    resourceType: 'post',
  },
  'GET /admin/posts': {
    action: 'read',
    resourceType: 'post',
  },
  'GET /admin/posts/:id': {
    action: 'read',
    resourceType: 'post',
  },
  'POST /admin/posts': {
    action: 'create',
    resourceType: 'post',
  },
  'PATCH /admin/posts/:id': {
    action: 'update',
    resourceType: 'post',
  },
  'POST /admin/posts/:id/publish': {
    action: 'publish',
    resourceType: 'post',
  },
  'POST /admin/posts/:id/archive': {
    action: 'archive',
    resourceType: 'post',
  },
  'GET /admin/posts/:id/revisions': {
    action: 'read',
    resourceType: 'post',
  },
  'GET /pages/:slug': {
    action: 'read',
    resourceType: 'page',
  },
  'GET /admin/pages': {
    action: 'read',
    resourceType: 'page',
  },
  'GET /admin/pages/:id': {
    action: 'read',
    resourceType: 'page',
  },
  'POST /admin/pages': {
    action: 'create',
    resourceType: 'page',
  },
  'PATCH /admin/pages/:id': {
    action: 'update',
    resourceType: 'page',
  },
  'POST /admin/pages/:id/publish': {
    action: 'publish',
    resourceType: 'page',
  },
  'POST /admin/pages/:id/archive': {
    action: 'archive',
    resourceType: 'page',
  },
  'GET /admin/pages/:id/revisions': {
    action: 'read',
    resourceType: 'page',
  },
  'GET /posts': {
    action: 'read',
    resourceType: 'post',
  },
  'GET /post-categories': {
    action: 'read',
    resourceType: 'post_category',
  },
  'POST /admin/post-categories': {
    action: 'create',
    resourceType: 'post_category',
  },
  'PATCH /admin/post-categories/:id': {
    action: 'update',
    resourceType: 'post_category',
  },
  'GET /post-tags': {
    action: 'read',
    resourceType: 'post_tag',
  },
  'POST /admin/post-tags': {
    action: 'create',
    resourceType: 'post_tag',
  },
  'PATCH /admin/post-tags/:id': {
    action: 'update',
    resourceType: 'post_tag',
  },
  'GET /policies/current': {
    action: 'read',
    resourceType: 'content',
  },
} satisfies RouteAuditPolicies;
