import { rulesToCondition, type StayAction, type StaySubject, type StayUser } from '@stay/shared';
import { Op, type WhereOptions } from 'sequelize';
import { abilityOf } from './ability.middleware.js';

/** Fail closed: only the operators and record attributes used by the Stay kit are supported. */
export function conditionWhere(condition: unknown, fields: Record<string, string>): WhereOptions {
  if (!condition || typeof condition !== 'object' || Array.isArray(condition))
    throw new Error('Invalid ability condition');
  const clauses: WhereOptions[] = [];

  for (const [key, value] of Object.entries(condition)) {
    if (key === '$and' || key === '$or') {
      if (!Array.isArray(value)) throw new Error('Invalid ability junction');
      clauses.push({
        [key === '$and' ? Op.and : Op.or]: value.map((item) => conditionWhere(item, fields)),
      });
      continue;
    }
    const field = fields[key];

    if (!field) throw new Error(`Unsupported ability field: ${key}`);
    if (typeof value === 'string') clauses.push({ [field]: value });
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!Object.keys(value).length) throw new Error('Empty ability operand');
      for (const [operator, operand] of Object.entries(value)) {
        if (operator === '$eq' && typeof operand === 'string')
          clauses.push({ [field]: { [Op.eq]: operand } });
        else if (
          operator === '$in' &&
          Array.isArray(operand) &&
          operand.every((id) => typeof id === 'string')
        )
          clauses.push({ [field]: { [Op.in]: operand } });
        else throw new Error(`Unsupported ability operator: ${operator}`);
      }
    } else throw new Error('Invalid ability operand');
  }
  return { [Op.and]: clauses };
}

/** CASL → Sequelize; null means denied, {} means unconditional. Map buildingId to id for buildings. */
export function accessibleWhere(
  user: StayUser,
  action: StayAction,
  subject: StaySubject,
  fields: Record<string, string> = { buildingId: 'buildingId', contractId: 'contractId' },
): WhereOptions {
  const condition = rulesToCondition(
    abilityOf(user).rulesFor(action, subject),
    (rule) => {
      if (rule.inverted) throw new Error('Inverted ability rules are unsupported');
      return rule.conditions ?? {};
    },
    {
      and: (conditions) => ({ $and: conditions }),
      or: (conditions) => ({ $or: conditions }),
      empty: () => ({}),
    },
  );

  return condition === null ? { id: { [Op.in]: [] } } : conditionWhere(condition, fields);
}
