import Validator from 'validatorjs';

export type ValidationConfig = {
  data?: Record<string, unknown>;
  rules: Record<string, string>;
  attributes?: Record<string, string>;
  messages?: Record<string, string>;
};

export default Validator;
