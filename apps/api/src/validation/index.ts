import type { NextFunction, Request, Response } from 'express';
import Validator, { type ValidationConfig } from '@/configs/validator.js';
import { InputValidError } from '@/utils/errors/index.js';

type AttributeMap = Record<string, string>;

function asObjectMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, string>;
}

/** Middleware validate body theo rule validatorjs + i18n (pattern next-chapter) */
export function validate(
  config: Omit<ValidationConfig, 'data'> & { data?: Record<string, unknown> },
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const lang = req.language?.split('-')[0] || 'vi';
      Validator.useLang(lang);

      const attributeNs = asObjectMap(req.t('validator:attribute', { returnObjects: true }));
      const messageNs = asObjectMap(req.t('validator:message', { returnObjects: true }));

      const data = (config.data ?? req.body ?? {}) as Record<string, unknown>;
      const validator = new Validator(data, config.rules, {
        ...messageNs,
        ...(config.messages ?? {}),
      });

      const attributes: AttributeMap = {
        ...attributeNs,
        ...(config.attributes ?? {}),
      };
      validator.setAttributeNames(attributes);

      if (validator.fails()) {
        next(
          new InputValidError(
            req.t('error:input_valid_error'),
            validator.errors.errors as Record<string, string[]>,
          ),
        );
        return;
      }

      req.body = validator.input;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default validate;
