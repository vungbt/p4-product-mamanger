import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dashboardService from '@/services/dashboard.service.js';

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.jsonApi(StatusCodes.OK, { data: await dashboardService.getStats() });
  } catch (error) {
    return next(error);
  }
}
