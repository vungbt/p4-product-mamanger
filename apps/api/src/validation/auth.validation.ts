import type { NextFunction, Request, Response } from 'express';
import validate from '@/validation/index.js';

export const validateLoginBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      email: 'required|email',
      password: 'required|string',
    },
  })(req, res, next);

export const validateRefreshBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      refreshToken: 'required|string',
    },
  })(req, res, next);
