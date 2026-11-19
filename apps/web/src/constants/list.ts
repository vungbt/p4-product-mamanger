/** Page sizes offered by admin list tables. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];
export const OPTIONS_PAGE_SIZE = 100;
export const SEARCH_DEBOUNCE_MS = 500;

/** Public catalog and dashboard lists retain their own sizes. */
export const STOREFRONT_PAGE_SIZE = 20;
export const RECENT_ORDER_COUNT = 5;
