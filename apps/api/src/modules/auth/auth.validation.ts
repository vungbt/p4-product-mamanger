import type { NextFunction, Request, Response } from 'express';
import validate from '@/shared/validation.js';

export const validateLoginBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      email: 'required|email',
      password: 'required|string',
    },
  })(req, res, next);

export const validateGoogleLoginBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      credential: 'required|string',
    },
  })(req, res, next);

export const validateRefreshBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      refreshToken: 'required|string',
    },
  })(req, res, next);

export const validateUpdateProfileBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      imageStorageId: 'string',
    },
  })(req, res, next);

export const validateUpdatePasswordBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      currentPassword: 'string',
      newPassword: 'required|string|min:6',
    },
  })(req, res, next);
