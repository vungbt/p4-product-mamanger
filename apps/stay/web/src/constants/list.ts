/** Page sizes offered by list tables (the API accepts up to 100). */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;
export const OPTIONS_PAGE_SIZE = 100;
export const SEARCH_DEBOUNCE_MS = 500;

/** The building card grid keeps twelve cards per page. */
export const BUILDINGS_PAGE_SIZE = 12;
/** The room map shows a whole building on one page; larger ones paginate. */
export const ROOM_MAP_PAGE_SIZE = 100;
/** Bulk invoice generation starts with the API's largest page. */
export const INVOICE_RUN_PAGE_SIZE = 100;
/** At most one page of a building's invoices of a period is listed before sharing. */
export const INVOICE_SHARE_PAGE_SIZE = 100;
export const CONTRACT_INVOICES_PAGE_SIZE = 100;
/** Recent entries the audit summary cards are computed from. */
export const AUDIT_SAMPLE_SIZE = 100;
