import { expect, type Page, test } from '@playwright/test';
import { saveScreenshot, signIn } from './helpers';

type Link = { path: string; query: Record<string, string> };
type Todo = { kind: string; count: number; link: Link };
type Overview = {
  period: string;
  receivables: { overdueRemaining: number; totalRemaining: number };
  todos: Todo[];
};

/** Heading of the screen each to-do opens. */
const HEADINGS: Record<string, string | RegExp> = {
  '/readings': 'Chốt số điện nước',
  '/invoices/run': /^Lập hoá đơn kỳ/,
  '/invoices': 'Hoá đơn',
  '/invoices/share': /^Chia sẻ kỳ/,
  '/receivables': 'Công nợ',
  '/contracts': 'Hợp đồng',
};

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

const shiftMonth = (period: string, months: number) => {
  const index = Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1 + months;

  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
};

const hrefOf = (link: Link) => {
  const search = new URLSearchParams(link.query).toString();

  return search ? `${link.path}?${search}` : link.path;
};

/** Seeded building A and an API reader using the signed-in page's session. */
async function api(page: Page) {
  const get = async (path: string) => {
    const response = await page.request.get(`/api${path}`);

    expect(response.ok(), await response.text()).toBe(true);
    return response.json();
  };
  const building = (await get('/buildings')).data.find(
    (candidate: { code: string }) => candidate.code === 'A',
  );

  expect(building, 'Seeded building A must exist').toBeTruthy();
  return {
    overview: async (period?: string): Promise<Overview> =>
      (await get(`/buildings/${building.id}/overview${period ? `?period=${period}` : ''}`)).data,
    receivables: async () =>
      (await get(`/buildings/${building.id}/receivables?pageSize=1`)).meta as {
        overdueRemaining: number;
        totalRemaining: number;
      },
  };
}

/** Waits until the page shows the figures of `period` (previous data stays while loading). */
async function shown(page: Page, period: string) {
  await expect(page.getByTestId('overview')).toHaveAttribute('data-period', period);
}

for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
]) {
  test.describe(`O-01 Tổng quan (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('cards, to-dos and chart; overdue equals receivables; period picker', async ({ page }) => {
      await signIn(page);
      const reader = await api(page);
      const data = await reader.overview();

      await shown(page, data.period);
      await expect(page.getByLabel('Kỳ', { exact: true })).toHaveValue(data.period);
      for (const id of ['billed', 'collected', 'remaining', 'overdue', 'rooms'])
        await expect(page.getByTestId(`overview-card-${id}`)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Việc cần làm' })).toBeVisible();
      await expect(page.getByTestId('overview-chart')).toBeVisible();

      // Công nợ quá hạn = the receivables screen's overdue total (same query).
      const totals = await reader.receivables();

      await expect(page.getByTestId('overview-value-overdue')).toHaveAttribute(
        'data-value',
        String(totals.overdueRemaining),
      );

      // To-dos: one link per unfinished item, in calendar order, with the API's target.
      const open = data.todos.filter((todo) => todo.count > 0);

      if (open.length === 0) await expect(page.getByTestId('overview-todo-empty')).toBeVisible();
      else
        await expect(page.getByTestId('overview-todos').getByRole('link')).toHaveCount(open.length);
      for (const todo of open)
        await expect(page.getByTestId(`overview-todo-${todo.kind}`)).toHaveAttribute(
          'href',
          hrefOf(todo.link),
        );
      expect(await noHorizontalScroll(page)).toBe(true);
      await saveScreenshot(page, `o01-overview-${viewport.name}`);

      // The period picker keeps the period on the URL and loads its figures.
      const previous = shiftMonth(data.period, -1);

      await page.getByLabel('Kỳ', { exact: true }).fill(previous);
      await expect(page).toHaveURL(`/?period=${previous}`);
      await shown(page, previous);
      await expect(
        page.getByRole('heading', { name: `Kỳ ${previous.slice(5)}/${previous.slice(0, 4)}` }),
      ).toBeVisible();
      expect(await noHorizontalScroll(page)).toBe(true);
      await page.reload();
      await shown(page, previous);
      await expect(page.getByLabel('Kỳ', { exact: true })).toHaveValue(previous);
    });

    test('every to-do link opens its screen', async ({ page }) => {
      await signIn(page);
      const reader = await api(page);
      // A far period has readings and invoices to create for the seeded contracts; overdue
      // invoices and contract items do not depend on the period.
      const periods = [(await reader.overview()).period, '2041-05'];

      for (const period of periods) {
        const data = await reader.overview(period);

        for (const todo of data.todos.filter((item) => item.count > 0)) {
          await page.goto(`/?period=${period}`);
          await shown(page, period);
          await page.getByTestId(`overview-todo-${todo.kind}`).click();

          await expect
            .poll(() => new URL(page.url()).pathname, { message: todo.kind })
            .toBe(todo.link.path);
          const url = new URL(page.url());

          for (const [key, value] of Object.entries(todo.link.query))
            expect(url.searchParams.get(key), `${todo.kind} ${key}`).toBe(value);
          await expect(
            page.getByRole('heading', { level: 1, name: HEADINGS[todo.link.path] }),
          ).toBeVisible();
          expect(await noHorizontalScroll(page)).toBe(true);
        }
      }
    });
  });
}
