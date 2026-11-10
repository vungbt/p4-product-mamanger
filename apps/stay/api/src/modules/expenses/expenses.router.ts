import {
  applyAuditPolicies,
  currentUser,
  InputValidError,
  queryText,
  uuidQueryRule,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { isPeriod } from '@stay/shared';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { auditPolicies } from './expenses.audit.js';
import { readCategoryInput, readExpenseInput } from './expenses.input.js';
import {
  deleteExpense,
  type ExpenseListQuery,
  type ExpenseSortField,
  listCategories,
  listExpenses,
  saveCategory,
  saveExpense,
} from './expenses.service.js';

const router = Router();
const sortFields: ExpenseSortField[] = ['spentOn', 'amount', 'createdAt'];
const expenseQuery = validateListQuery({
  sortFields,
  defaultSort: 'spentOn',
  defaultOrder: 'desc',
  rules: () => ({
    buildingId: uuidQueryRule,
    categoryId: uuidQueryRule,
    roomId: uuidQueryRule,
    period: 'sometimes|required|string|max:7',
  }),
  normalize: (query, base): ExpenseListQuery => {
    const period = queryText(query, 'period');

    if (period !== undefined && !isPeriod(period))
      throw new InputValidError('input_valid_error', { period: ['Kỳ phải có dạng YYYY-MM.'] });
    return {
      ...base,
      buildingId: queryText(query, 'buildingId'),
      categoryId: queryText(query, 'categoryId'),
      roomId: queryText(query, 'roomId'),
      period,
    };
  },
});

router.get(
  '/expense-categories',
  authRequired,
  requireAbility('manage', 'Expense'),
  apiHandler(() => listCategories()),
);
router.post(
  '/expense-categories',
  authRequired,
  requireAbility('manage', 'Expense'),
  apiHandler((req) => saveCategory(readCategoryInput(formBody(req))), 201),
);
router.put(
  '/expense-categories/:id',
  authRequired,
  requireAbility('manage', 'Expense'),
  apiHandler((req) => {
    const body = formBody(req);
    const version = body.integer('version', 1);

    return saveCategory(readCategoryInput(body), uuidRouteId(req), version);
  }),
);
router.get(
  '/expenses',
  authRequired,
  requireAbility('read', 'Expense'),
  expenseQuery,
  listHandler((req, query: ExpenseListQuery) => listExpenses(currentUser(req), query)),
);
router.post(
  '/expenses',
  authRequired,
  requireAbility('manage', 'Expense'),
  apiHandler((req) => saveExpense(currentUser(req), readExpenseInput(formBody(req))), 201),
);
router.put(
  '/expenses/:id',
  authRequired,
  requireAbility('manage', 'Expense'),
  apiHandler((req) => {
    const body = formBody(req);
    const version = body.integer('version', 1);

    return saveExpense(currentUser(req), readExpenseInput(body), uuidRouteId(req), version);
  }),
);
router.delete(
  '/expenses/:id',
  authRequired,
  requireAbility('manage', 'Expense'),
  apiHandler((req) => deleteExpense(currentUser(req), uuidRouteId(req))),
);

export default applyAuditPolicies(router, auditPolicies);
