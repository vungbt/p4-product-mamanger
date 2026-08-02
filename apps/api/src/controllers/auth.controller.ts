import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as authService from '@/services/auth.service.js';
import { Unauthorized } from '@/utils/errors/index.js';
import { verifyAccessToken } from '@/utils/jwt.js';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const body = await authService.login(email, password);
    return res.jsonApi(StatusCodes.OK, { data: body });
  } catch (error) {
    return next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const body = await authService.refresh(refreshToken);
    return res.jsonApi(StatusCodes.OK, { data: body });
  } catch (error) {
    return next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new Unauthorized();
    }
    return res.jsonApi(StatusCodes.OK, { data: await authService.getMe(req.user.id) });
  } catch (error) {
    return next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new Unauthorized();
    }
    const data = await authService.updateProfile(req.user.id, req.body);
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:profile_updated' });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = (req.body ?? {}) as { refreshToken?: string };
    let userId: string | undefined;
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        userId = verifyAccessToken(header.slice(7)).sub;
      } catch {
        // Access có thể đã hết hạn — vẫn logout bằng refreshToken
      }
    }
    return res.jsonApi(StatusCodes.OK, {
      data: await authService.logout({ refreshToken, userId }),
    });
  } catch (error) {
    return next(error);
  }
}
