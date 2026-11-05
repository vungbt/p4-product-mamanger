import { Op } from 'sequelize';

export function searchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
}

export function numberRange(min?: number, max?: number) {
  return {
    ...(min !== undefined ? { [Op.gte]: min } : {}),
    ...(max !== undefined ? { [Op.lte]: max } : {}),
  };
}

export function dateRange(from?: string, to?: string) {
  const end = to ? new Date(to) : undefined;
  if (end && /^\d{4}-\d{2}-\d{2}$/.test(to ?? '')) end.setUTCHours(23, 59, 59, 999);
  return { ...(from ? { [Op.gte]: new Date(from) } : {}), ...(end ? { [Op.lte]: end } : {}) };
}
