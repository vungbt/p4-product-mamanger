import type { NextFunction, Request, Response } from 'express';
import Validator, { type ValidationConfig } from '@/configs/validator.js';
import { InputValidError } from '@/utils/errors/index.js';

type AttributeMap = Record<string, string>;
type ValidationOptions = Omit<ValidationConfig, 'data'> & {
  data?: Record<string, unknown>;
  source?: 'body' | 'query';
};

function asObjectMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, string>;
}

/** Validate body or scalar query parameters using validatorjs and the request locale. */
export function validate(config: ValidationOptions) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const lang = req.language?.split('-')[0] || 'vi';
      Validator.useLang(lang);

      const attributeNs = asObjectMap(req.t('validator:attribute', { returnObjects: true }));
      const messageNs = asObjectMap(req.t('validator:message', { returnObjects: true }));

      const source = config.source ?? 'body';
      const data = { ...(config.data ?? (source === 'query' ? req.query : req.body) ?? {}) };

      if (source === 'query') {
        const errors: Record<string, string[]> = {};

        for (const field of Object.keys(config.rules)) {
          const value = data[field];
          if (value === undefined) continue;
          if (typeof value !== 'string') {
            errors[field] = [req.t('validator:message.query_string')];
          } else {
            data[field] = value.trim();
          }
        }

        if (Object.keys(errors).length) {
          next(new InputValidError(req.t('error:input_valid_error'), errors));
          return;
        }
      }

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

      if (source === 'body') req.body = validator.input;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default validate;
