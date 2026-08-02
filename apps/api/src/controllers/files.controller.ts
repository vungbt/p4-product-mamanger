import type { NextFunction, Request, Response } from 'express';
import * as filesService from '@/services/files/files.service.js';

export async function getSignUploadUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const name = typeof req.query.name === 'string' ? req.query.name : '';
    const data = filesService.signUploadUrl(name);
    return res.jsonApi(200, { data });
  } catch (error) {
    return next(error);
  }
}

export async function getSignUploadUrls(req: Request, res: Response, next: NextFunction) {
  try {
    let names = req.query.names ?? [];
    if (typeof names === 'string') {
      names = names
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (!Array.isArray(names)) {
      names = [];
    }
    const list = (names as unknown[]).map(String);
    const data = filesService.signUploadUrls(list);
    return res.jsonApi(200, { data });
  } catch (error) {
    return next(error);
  }
}
