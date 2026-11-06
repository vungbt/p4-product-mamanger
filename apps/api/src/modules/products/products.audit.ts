import * as reviewsController from '@/modules/reviews/reviews.controller.js';
import type { RouteAuditPolicies } from '@/shared/audit/types.js';
import * as productsController from './products.controller.js';

export const auditPolicies = {
  'GET /': {
    action: 'read',
    resourceType: 'product',
  },
  'GET /:id': {
    action: 'read',
    resourceType: 'product',
  },
  'GET /:id/reviews': {
    action: 'read',
    resourceType: 'review',
  },
  'POST /:id/reviews': {
    auditedHandler: reviewsController.create,
    action: 'create',
    resourceType: 'review',
  },
  'DELETE /:id/reviews/:reviewId': {
    auditedHandler: reviewsController.remove,
    action: 'delete',
    resourceType: 'review',
  },
  'POST /': {
    auditedHandler: productsController.create,
    action: 'create',
    resourceType: 'product',
  },
  'PUT /:id': {
    auditedHandler: productsController.update,
    action: 'update',
    resourceType: 'product',
  },
  'DELETE /:id': {
    auditedHandler: productsController.remove,
    action: 'delete',
    resourceType: 'product',
  },
  'POST /:id/images': {
    auditedHandler: productsController.addImage,
    action: 'create',
    resourceType: 'product_image',
  },
  'DELETE /:id/images/:imageId': {
    auditedHandler: productsController.removeImage,
    action: 'delete',
    resourceType: 'product_image',
  },
} satisfies RouteAuditPolicies;
