export const LOW_STOCK_THRESHOLD = 10;

/** Keys map to language/{locale}/error.json — handler translates via i18n */
export const errorKeys = {
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  invalidToken: 'invalid_token',
  notFound: 'not_found',
  productNotFound: 'product_not_found',
  invalidCredentials: 'invalid_credentials',
  invalidQuantity: 'invalid_quantity',
  itemsRequired: 'items_required',
  invalidPagination: 'invalid_pagination',
  cloudinaryNotConfigured: 'cloudinary_not_configured',
  uploadFileRequired: 'upload_file_required',
  uploadInvalidType: 'upload_invalid_type',
  uploadInvalidFolder: 'upload_invalid_folder',
  invalidRefreshToken: 'invalid_refresh_token',
  refreshTokenExpired: 'refresh_token_expired',
} as const;
