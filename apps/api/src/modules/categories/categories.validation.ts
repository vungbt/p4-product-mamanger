import validate from '@/shared/validation.js';

export const validateCategory = validate({
  rules: {
    name: 'required|string',
    slug: 'required|string',
    description: 'string',
  },
});
