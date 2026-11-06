import type { ProductListQuery } from '@p4/shared';
import { type NextFunction, type Request, type Response, Router } from 'express';
import { Op } from 'sequelize';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { validateProductsListQuery } from '@/modules/products/products.validation.js';
import { CategoryModel, ProductModel } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { searchPattern } from '@/shared/list-filters.js';
import type { ListLocals } from '@/shared/list-query.js';
import { queryText } from '@/shared/list-query.js';
import validate from '@/shared/validation.js';
import { selectFields } from '@/utils/select-fields.js';
import { auditPolicies } from './discovery.audit.js';
import { facets } from './discovery.service.js';

const router = Router();
router.get(
  '/products/facets',
  validateProductsListQuery,
  (_req: Request, res: Response<unknown, ListLocals<ProductListQuery>>, next: NextFunction) => {
    void facets(res.locals.listQuery)
      .then((data) => res.jsonApi(200, { data }))
      .catch(next);
  },
);
router.get(
  '/search/suggestions',
  rateLimit('search-suggestions', 60),
  validate({ source: 'query', rules: { q: 'required|string|max:100' } }),
  apiHandler(async (req) => {
    const q = queryText(req.query, 'q') ?? '';
    if (q.length < 2) return { products: [], categories: [] };
    const pattern = searchPattern(q);
    const products = await ProductModel.findAll({
      where: { status: 'active', name: { [Op.iLike]: pattern } },
      order: [
        ['name', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: 6,
    });
    const categories = await CategoryModel.findAll({
      where: { name: { [Op.iLike]: pattern } },
      order: [
        ['name', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: 4,
    });
    return {
      products: products.map((row) => selectFields(row, ['id', 'name', 'slug', 'price'])),
      categories: categories.map((row) => selectFields(row, ['id', 'name', 'slug'])),
    };
  }),
);
export default applyAuditPolicies(router, auditPolicies);
