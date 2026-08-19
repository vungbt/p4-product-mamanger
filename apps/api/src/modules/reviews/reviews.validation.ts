import validate from '@/shared/validation.js';

export const validateReview = validate({
  rules: {
    rating: 'required|integer|min:1|max:5',
    comment: 'string',
  },
});
