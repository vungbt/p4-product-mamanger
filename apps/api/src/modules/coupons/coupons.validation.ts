import validate from '@/shared/validation.js';

export const validateCoupon = validate({
  rules: {
    code: 'required|string',
    type: 'required|string',
    value: 'required|integer|min:1',
    minOrderAmount: 'integer|min:0',
    maxDiscount: 'integer|min:0',
    usageLimit: 'integer|min:1',
    isActive: 'boolean',
  },
});

export const validatePreview = validate({
  rules: {
    code: 'required|string',
    subtotal: 'required|integer|min:0',
  },
});
