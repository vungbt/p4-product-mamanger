import { getApiSdk, useQuery } from '@p4/api-client';
import { unwrap } from '@p4/api-sdk/shared';
import { useMemo } from 'react';

export const DASHBOARD_RANGES = [7, 30, 90] as const;

export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

/** Variants at or below this sellable quantity need restocking. */
const LOW_STOCK_THRESHOLD = 5;
const TOP_PRODUCT_LIMIT = 5;
const LOW_STOCK_LIMIT = 6;
const DAY_MS = 86_400_000;

type ReportQuery = { from: string; to: string; timezone: string };

type ReportRow = Record<string, string | number | null>;

function reportWindow(days: DashboardRange) {
  const end = new Date();

  end.setHours(24, 0, 0, 0);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const start = end.getTime() - days * DAY_MS;

  return {
    current: { from: new Date(start).toISOString(), to: end.toISOString(), timezone },
    previous: {
      from: new Date(start - days * DAY_MS).toISOString(),
      to: new Date(start).toISOString(),
      timezone,
    },
  };
}

async function salesRows(query: ReportQuery, signal: AbortSignal) {
  return unwrap(await getApiSdk().GET('/api/admin/reports/sales', { params: { query }, signal }))
    .data.rows;
}

async function orderRows(query: ReportQuery, signal: AbortSignal) {
  return unwrap(await getApiSdk().GET('/api/admin/reports/orders', { params: { query }, signal }))
    .data.rows;
}

async function productRows(query: ReportQuery, signal: AbortSignal) {
  return unwrap(await getApiSdk().GET('/api/admin/reports/products', { params: { query }, signal }))
    .data.rows;
}

async function inventoryRows(query: ReportQuery, signal: AbortSignal) {
  return unwrap(
    await getApiSdk().GET('/api/admin/reports/inventory', { params: { query }, signal }),
  ).data.rows;
}

const sum = (rows: readonly ReportRow[], key: string) =>
  rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);

/** `YYYY-MM-DD` in local time, matching the report's timezone grouping. */
function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

/** Days without sales stay on the chart as zero, so the time axis is continuous. */
function dailyNet(rows: readonly ReportRow[], query: ReportQuery) {
  const totals = new Map<string, number>();

  for (const row of rows) {
    const key = String(row.day).slice(0, 10);

    totals.set(key, (totals.get(key) ?? 0) + Number(row.net ?? 0));
  }

  const days: { date: Date; net: number }[] = [];
  const end = new Date(query.to).getTime();

  for (let time = new Date(query.from).getTime(); time < end; time += DAY_MS) {
    const date = new Date(time);

    days.push({ date, net: totals.get(dayKey(date)) ?? 0 });
  }

  return days;
}

export function useDashboardReports(days: DashboardRange) {
  const window = useMemo(() => reportWindow(days), [days]);

  const query = useQuery({
    queryKey: ['admin-dashboard', window.current.from, window.current.to],
    queryFn: async ({ signal }) => {
      const [sales, previousSales, orders, previousOrders, products, inventory] = await Promise.all(
        [
          salesRows(window.current, signal),
          salesRows(window.previous, signal),
          orderRows(window.current, signal),
          orderRows(window.previous, signal),
          productRows(window.current, signal),
          inventoryRows(window.current, signal),
        ],
      );

      return { sales, previousSales, orders, previousOrders, products, inventory };
    },
  });

  const summary = useMemo(() => {
    if (!query.data) return null;

    const { sales, previousSales, orders, previousOrders, products, inventory } = query.data;
    const orderTotal = sum(orders, 'count');
    const completed = sum(
      orders.filter((row) => row.status === 'completed'),
      'count',
    );
    const lowStock = inventory
      .filter((row) => Number(row.available ?? 0) <= LOW_STOCK_THRESHOLD)
      .sort((left, right) => Number(left.available ?? 0) - Number(right.available ?? 0));

    return {
      currency: String(sales[0]?.currency ?? 'VND'),
      revenue: sum(sales, 'net'),
      previousRevenue: sum(previousSales, 'net'),
      orderTotal,
      previousOrderTotal: sum(previousOrders, 'count'),
      completionRate: orderTotal ? (completed / orderTotal) * 100 : 0,
      lowStockCount: lowStock.length,
      lowStock: lowStock.slice(0, LOW_STOCK_LIMIT).map((row) => ({
        id: String(row.id),
        sku: String(row.sku),
        available: Number(row.available ?? 0),
      })),
      daily: dailyNet(sales, window.current),
      statuses: orders.map((row) => ({
        status: String(row.status),
        count: Number(row.count ?? 0),
      })),
      topProducts: products
        .filter((row) => Number(row.retained ?? 0) > 0)
        .slice(0, TOP_PRODUCT_LIMIT)
        .map((row) => ({
          id: `${row.productId}-${row.sku}`,
          sku: String(row.sku),
          units: Number(row.retained ?? 0),
        })),
    };
  }, [query.data, window]);

  return { summary, isPending: query.isPending, isError: query.isError, refetch: query.refetch };
}

export type DashboardSummary = NonNullable<ReturnType<typeof useDashboardReports>['summary']>;
