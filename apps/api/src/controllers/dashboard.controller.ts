import type { NextFunction, Request, Response } from 'express';
import * as dashboardService from '@/services/dashboard.service.js';

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.jsonApi(200, { data: await dashboardService.getStats() });
  } catch (error) {
    return next(error);
  }
}
