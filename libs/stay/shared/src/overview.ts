import { type IsoDate, parseIsoDate, periodOfIsoDate } from './date.js';
import { addMonths, type Period, previousPeriod } from './period.js';
import type { RoomStatusCounts } from './room.js';
import { billingDayOf } from './settings.js';

/** Periods in the overview chart (screens.md O-01: "6 kỳ gần nhất"). */
export const OVERVIEW_SERIES_LENGTH = 6;

/**
 * To-do items of the overview, in monthly calendar order (screens.md O-01): close meters of
 * M−1, create the invoices of M, issue drafts, send links, chase overdue invoices, then
 * contracts ending within 30 days and move-out notices (`ending`).
 */
export const OVERVIEW_TODO_KINDS = [
  'readings',
  'invoices_to_create',
  'draft_invoices',
  'unshared_invoices',
  'overdue_invoices',
  'expiring_contracts',
  'ending_contracts',
] as const;
export type OverviewTodoKind = (typeof OVERVIEW_TODO_KINDS)[number];

/** `count` periods ending with `period`, oldest first. */
export function periodSeries(period: Period, count: number = OVERVIEW_SERIES_LENGTH): Period[] {
  if (!Number.isInteger(count) || count < 1) throw new RangeError(`Invalid count ${count}`);

  return Array.from({ length: count }, (_, index) => addMonths(period, index - count + 1));
}

/**
 * Billing period shown by default on `today`: the latest period whose issue date (the
 * building/system `issueDay` of that month) is on or before `today`.
 */
export function currentBillingPeriod(today: IsoDate, issueDay: number): Period {
  const { year, month, day } = parseIsoDate(today);
  const period = periodOfIsoDate(today);

  return day >= billingDayOf(issueDay, year, month) ? period : previousPeriod(period);
}

/** Occupied share of the rooms, 0–1 with four decimals; `null` without rooms. */
export function occupancyRate(occupied: number, total: number): number | null {
  if (!Number.isFinite(total) || total <= 0) return null;

  return Math.round((Math.min(Math.max(occupied, 0), total) / total) * 10_000) / 10_000;
}

/** Change of a value against the previous period; `ratio` is `null` when there was nothing. */
export function periodChange(
  current: number,
  previous: number,
): { delta: number; ratio: number | null } {
  return {
    delta: current - previous,
    ratio: previous > 0 ? Math.round(((current - previous) / previous) * 10_000) / 10_000 : null,
  };
}

/** Screen a to-do item opens: `path` plus query parameters (e.g. `/readings?period=…`). */
export interface OverviewLink {
  path: string;
  query: Record<string, string>;
}

/** One "Việc cần làm" item; the web hides items with `count = 0`. */
export interface OverviewTodo {
  kind: OverviewTodoKind;
  /** Rooms, contracts or invoices still to handle. */
  count: number;
  /** Rooms to close for `readings` ("còn X/Y phòng"); `null` for other items. */
  total: number | null;
  /** Amount still owed for `overdue_invoices`; `null` for other items. */
  amount: number | null;
  link: OverviewLink;
}

/** Issued invoices (`issued`/`partially_paid`/`paid`, every kind) of one period M. */
export interface OverviewPeriodAmounts {
  period: Period;
  /** Sum of the invoice totals. */
  billed: number;
  /** Non-reversed payments of those invoices, whenever they were paid. */
  collected: number;
  /** `billed − collected`. */
  remaining: number;
  invoiceCount: number;
}

/** Rooms occupied on `date` (the period's last day, or today for the current period). */
export interface OverviewOccupancy {
  date: IsoDate;
  occupied: number;
  /** Rooms that existed and were not archived on `date`. */
  total: number;
  /** `occupied / total` (0–1), `null` without rooms. */
  rate: number | null;
}

/** `GET /api/buildings/:buildingId/overview` (ST-19, O-01). */
export interface StayOverview {
  buildingId: string;
  period: Period;
  previousPeriod: Period;
  /** Business date of the figures (Asia/Ho_Chi_Minh). */
  today: IsoDate;
  current: OverviewPeriodAmounts;
  previous: OverviewPeriodAmounts;
  /** Cash basis: non-reversed payments with `paidOn` in calendar month M, any invoice period. */
  collectedInMonth: number;
  /** Equal to the ST-18 receivables totals (`meta.totalRemaining`/`overdueRemaining`). */
  receivables: {
    totalRemaining: number;
    overdueRemaining: number;
    overdueInvoiceCount: number;
  };
  /** Non-archived rooms by their status today (room map derivation). */
  rooms: RoomStatusCounts & { total: number };
  occupancy: OverviewOccupancy;
  previousOccupancy: OverviewOccupancy;
  /** The last `OVERVIEW_SERIES_LENGTH` periods ending with M, oldest first. */
  series: OverviewPeriodAmounts[];
  /** Every kind of `OVERVIEW_TODO_KINDS`, in that order (zero counts included). */
  todos: OverviewTodo[];
}
