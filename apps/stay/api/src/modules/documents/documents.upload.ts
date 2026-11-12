import { InputValidError } from '@p4/server-core';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

/** Multipart `file` held in memory (≤ `maxBytes`); a larger file answers 400 `upload_too_large`. */
export function receiveFile(maxBytes: number) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 5, parts: 6 },
  }).single('file');

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError)
        return next(
          new InputValidError('input_valid_error', {
            file: [req.t('error:upload_too_large')],
          }),
        );
      next(error);
    });
  };
}

/** `application/pdf` (or an image) download with no caching. */
export function sendFile(
  res: Response,
  bytes: Buffer,
  filename: string,
  type = 'application/pdf',
  inline = false,
) {
  res.setHeader('Content-Type', type);
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(bytes);
}
