import { expect, type Page, test } from '@playwright/test';
import { signIn } from './helpers';

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

async function get(page: Page, path: string) {
  const response = await page.request.get(`/api${path}`);

  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}

for (const width of [1280, 375]) {
  test.describe(`ST-21 reports (${width}px)`, () => {
    test.use({ viewport: { width, height: 850 } });

    test('tabs, URL range, API totals, Excel download and contained mobile tables', async ({
      page,
    }) => {
      await signIn(page);
      const building = (await get(page, '/buildings?pageSize=100')).data.find(
        (b: { code: string }) => b.code === 'A',
      );

      expect(building, 'Seeded building A').toBeTruthy();
      await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
      const categories = (await get(page, '/expense-categories')).data;
      const category = categories.find((c: { active: boolean }) => c.active);

      expect(category).toBeTruthy();
      // Own fixture in A only; compare report totals to the API, since A contains other suites' data.
      const writeHeaders = { origin: new URL(page.url()).origin };
      const created = await page.request.post('/api/expenses', {
        headers: writeHeaders,
        data: {
          buildingId: building.id,
          categoryId: category.id,
          amount: 21000,
          spentOn: '2020-01-20',
          note: `ST21 e2e ${width}`,
        },
      });

      expect(created.status(), await created.text()).toBe(201);
      const expense = (await created.json()).data;

      try {
        await page.goto('/reports?from=2020-01&to=2020-01');
        await expect(page.getByRole('heading', { name: 'Báo cáo', exact: true })).toBeVisible();
        await expect(page.getByTestId('revenue-report')).toHaveAttribute('data-to', '2020-01');
        await page.getByLabel('Đến tháng', { exact: true }).fill('2020-02');
        await expect(page).toHaveURL(/to=2020-02/);
        await expect(page.getByTestId('revenue-report')).toHaveAttribute('data-to', '2020-02');
        const report = (
          await get(page, `/reports/revenue?buildingId=${building.id}&from=2020-01&to=2020-02`)
        ).data;
        const totals = page.getByTestId('revenue-totals');

        await expect(totals.getByRole('cell')).toHaveText([
          money(report.totals.billed),
          money(report.totals.collected),
          money(report.totals.expenses),
          money(report.totals.profit),
        ]);
        const noScroll = () =>
          page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

        await expect(page.getByTestId('reports-chart')).toBeVisible();
        expect(await noScroll()).toBe(true);
        await page.getByRole('tab', { name: 'Theo phòng', exact: true }).click();
        await expect(page.getByText('Cả năm 2020', { exact: false })).toBeVisible();
        await expect(page.getByRole('region', { name: 'Báo cáo theo phòng' })).toBeVisible();
        expect(await noScroll()).toBe(true);
        await page.getByRole('tab', { name: 'Điện nước', exact: true }).click();
        await expect(page.getByRole('region', { name: 'Báo cáo điện nước' })).toBeVisible();
        expect(await noScroll()).toBe(true);
        await page.getByRole('button', { name: 'Xuất Excel', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Xuất Excel' });

        await expect(dialog.getByRole('checkbox', { name: 'Hoá đơn', exact: true })).toBeChecked();
        await dialog.getByRole('checkbox', { name: 'Công nợ', exact: true }).click();
        const downloadPromise = page.waitForEvent('download');

        await dialog.getByRole('button', { name: 'Tải Excel', exact: true }).click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
        expect(await download.failure()).toBeNull();
        await expect(dialog).not.toBeVisible();
      } finally {
        const removed = await page.request.delete(`/api/expenses/${expense.id}`, {
          headers: writeHeaders,
        });

        expect(removed.ok(), await removed.text()).toBe(true);
      }
    });
  });
}
