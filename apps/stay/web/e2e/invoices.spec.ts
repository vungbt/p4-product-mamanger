import { randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { chooseOption, saveScreenshot, signIn } from './helpers';

type Service = { id: string; kind: string; active: boolean };
type ReadingGrid = { rooms: { roomId: string; meters: { meterId: string; kind: string }[] }[] };
type Invoice = {
  id: string;
  kind: string;
  code: string | null;
  status: string;
  total: number;
  lines: { amount: number }[];
};

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

/**
 * Two new rooms of building A with active contracts from January of a random far-future year
 * (isolated from seeded data and other runs): the first has January readings (eligible for the
 * February run), the second has none (excluded for a missing reading).
 */
async function fixtures(page: Page) {
  const headers = { origin: new URL(page.url()).origin };
  const post = async (path: string, data: object = {}) => {
    const response = await page.request.post(`/api${path}`, { headers, data });
    expect(response.ok(), await response.text()).toBe(true);
    return (await response.json()).data;
  };
  const get = async (path: string) => {
    const response = await page.request.get(`/api${path}`);
    expect(response.ok(), await response.text()).toBe(true);
    return (await response.json()).data;
  };
  const building = (await get('/buildings')).find(
    (candidate: { code: string }) => candidate.code === 'A',
  );
  expect(building, 'Seeded building A must exist').toBeTruthy();
  const services: Service[] = await get('/services');
  const metered = ['electricity', 'water'].map((kind) => {
    const service = services.find((row) => row.kind === kind && row.active);
    expect(service, `An active ${kind} service must exist`).toBeTruthy();
    return service?.id ?? '';
  });
  const year = randomInt(2100, 2900);
  const usage = `${year}-01`;
  const period = `${year}-02`;
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
  const contracts: { id: string; code: string; room: { id: string; code: string } }[] = [];

  for (const index of [1, 2]) {
    const room = await post(`/buildings/${building.id}/rooms`, {
      code: `IV${suffix}${index}`,
      floor: 1,
      listPrice: 3_000_000,
      maxOccupants: 2,
      initialElectric: 0,
      initialWater: 0,
    });
    const tenant = await post('/tenants', {
      buildingId: building.id,
      fullName: `Khách hoá đơn ${suffix} ${index}`,
      phone: `090765432${index}`,
    });
    const draft = await post('/contracts', {
      roomId: room.id,
      startDate: `${year}-01-01`,
      endDate: null,
      rent: 3_000_000,
      depositAmount: 0,
      depositCollected: false,
      depositMethod: 'cash',
      initialElectric: 0,
      initialWater: 0,
      occupantIds: [tenant.id],
      primaryTenantId: tenant.id,
      serviceIds: metered,
      vehicleIds: [],
    });
    const contract = await post(`/contracts/${draft.id}/activate`);
    contracts.push({ id: contract.id, code: contract.code, room });
  }

  const grid: ReadingGrid = await get(`/buildings/${building.id}/readings?period=${usage}`);
  const meters = grid.rooms.find((room) => room.roomId === contracts[0].room.id)?.meters ?? [];
  expect(meters).toHaveLength(2);
  const saved = await page.request.put(`/api/buildings/${building.id}/readings`, {
    headers,
    data: {
      rows: meters.map((meter) => ({
        meterId: meter.meterId,
        period: usage,
        reading: meter.kind === 'electricity' ? 120 : 10,
        readOn: `${usage}-28`,
        version: 0,
      })),
    },
  });
  expect(saved.ok(), await saved.text()).toBe(true);
  expect((await saved.json()).data.results.every((row: { error: unknown }) => !row.error)).toBe(
    true,
  );
  await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);

  return { year, usage, period, eligible: contracts[0], excluded: contracts[1], get };
}

for (const width of [1280, 375]) {
  test(`ST-14 billing run, drafts, issue, detail, void and list at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const { year, usage, period, eligible, excluded, get } = await fixtures(page);
    const billingRow = (code: string) => page.getByTestId('billing-row').filter({ hasText: code });

    // Step 1: preview scoped to our two contracts.
    await page.goto(`/invoices/run?period=${period}`);
    await expect(
      page.getByRole('heading', { level: 1, name: `Lập hoá đơn kỳ 02/${year}` }),
    ).toBeVisible();
    await expect(billingRow(eligible.room.code)).toContainText('Đủ điều kiện');
    await expect(billingRow(excluded.room.code)).toContainText(
      new RegExp(`Thiếu chỉ số (điện|nước) tháng 01/${year}`),
    );
    await expect(
      billingRow(excluded.room.code).getByRole('link', { name: `Chốt số tháng 01/${year}` }),
    ).toHaveAttribute('href', `/readings?period=${usage}`);
    expect(await noHorizontalScroll(page)).toBe(true);

    // Step 2: drafts (fresh Idempotency-Key per click), then open ours.
    await page.getByRole('button', { name: 'Tạo bản nháp', exact: true }).click();
    const draftRow = page.getByTestId('draft-row').filter({ hasText: eligible.room.code });
    await expect(draftRow).toBeVisible();
    await expect(page.getByTestId('draft-row').filter({ hasText: excluded.room.code })).toHaveCount(
      0,
    );
    await saveScreenshot(page, `invoices-run-${width}`);
    await draftRow.getByRole('link', { name: `Xem nháp phòng ${eligible.room.code}` }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Hoá đơn nháp' })).toBeVisible();
    const lines = page.getByTestId('invoice-line');
    await expect(lines.filter({ hasText: `Tiền phòng tháng 02/${year}` })).toContainText(
      '3.000.000',
    );
    await expect(lines.filter({ hasText: `Tiền điện tháng 01/${year}` })).toContainText(
      '(120 − 0)',
    );
    await expect(lines.filter({ hasText: `Tiền nước tháng 01/${year}` })).toContainText(
      'Chỉ số đầu 0 · cuối 10',
    );

    const addLine = async (type: 'Phụ thu' | 'Giảm trừ', amount: string, reason: string) => {
      await page.getByRole('button', { name: 'Thêm phụ thu / giảm trừ', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Phụ thu / giảm trừ' });
      if (type === 'Giảm trừ') await chooseOption(page, dialog, /Loại/, 'Giảm trừ');
      await dialog.getByRole('spinbutton', { name: /Số tiền/ }).fill(amount);
      await dialog.getByRole('textbox', { name: /Lý do/ }).fill(reason);
      await dialog.getByRole('button', { name: 'Thêm dòng', exact: true }).click();
      await expect(dialog).toBeHidden();
    };
    await addLine('Phụ thu', '50000', 'Phí vệ sinh');
    await expect(lines.filter({ hasText: 'Phụ thu: Phí vệ sinh' })).toContainText('50.000');
    await addLine('Giảm trừ', '20000', 'Giảm thử');
    await expect(lines.filter({ hasText: 'Giảm trừ: Giảm thử' })).toContainText('20.000');
    await page.getByRole('button', { name: 'Xoá dòng Giảm trừ: Giảm thử', exact: true }).click();
    await page
      .getByRole('alertdialog', { name: 'Xoá dòng?' })
      .getByRole('button', { name: 'Xoá dòng', exact: true })
      .click();
    await expect(lines.filter({ hasText: 'Giảm trừ: Giảm thử' })).toHaveCount(0);

    const contractInvoices = async (): Promise<Invoice[]> => {
      const rows: { id: string }[] = await get(
        `/invoices?contractId=${eligible.id}&period=${period}&kind=monthly`,
      );
      return Promise.all(rows.map((row) => get(`/invoices/${row.id}`)));
    };
    const [draft] = await contractInvoices();
    expect(draft.status).toBe('draft');
    expect(draft.lines.reduce((sum, line) => sum + line.amount, 0)).toBe(draft.total);
    await expect(page.getByTestId('invoice-totals')).toContainText(money(draft.total));
    expect(await noHorizontalScroll(page)).toBe(true);

    // Step 3: select our draft only and issue it with a confirmation summary.
    await page.getByRole('link', { name: `Lập hoá đơn kỳ 02/${year}` }).click();
    await page
      .getByRole('checkbox', { name: new RegExp(`^Phòng ${eligible.room.code} · `) })
      .check();
    await expect(page.getByText(`Đã chọn 1 hoá đơn · tổng ${money(draft.total)}`)).toBeVisible();
    await page.getByRole('button', { name: 'Phát hành', exact: true }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Phát hành hoá đơn?' });
    await expect(confirm).toContainText(`Phát hành 1 hoá đơn, tổng ${money(draft.total)}`);
    await confirm.getByRole('button', { name: 'Phát hành', exact: true }).click();
    await expect(
      page.getByText(`Đã phát hành 1 hoá đơn, tổng ${money(draft.total)}`),
    ).toBeVisible();
    await expect(billingRow(eligible.room.code)).toContainText('Đã phát hành hoá đơn kỳ này');

    const [issued] = await contractInvoices();
    expect(issued.status).toBe('issued');
    expect(issued.code).toMatch(new RegExp(`^A-${year}02-\\d{3}$`));

    // Detail: code, lines, coming-soon actions, then void with a required reason.
    await page.goto(`/invoices/${issued.id}`);
    await expect(page.getByRole('heading', { level: 1, name: issued.code ?? '' })).toBeVisible();
    await expect(lines.filter({ hasText: 'Phụ thu: Phí vệ sinh' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thu tiền', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Chia sẻ', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Thêm phụ thu / giảm trừ' })).toHaveCount(0);
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `invoices-detail-${width}`);
    await page.getByRole('button', { name: 'Void', exact: true }).click();
    const voidDialog = page.getByRole('dialog', { name: 'Void hoá đơn' });
    await voidDialog.getByRole('button', { name: 'Void hoá đơn', exact: true }).click();
    await expect(voidDialog.getByText('Nhập lý do void.')).toBeVisible();
    await voidDialog.getByRole('textbox', { name: /Lý do void/ }).fill('Lập sai kỳ');
    await voidDialog.getByRole('button', { name: 'Void hoá đơn', exact: true }).click();
    await expect(voidDialog).toBeHidden();
    await expect(page.getByTestId('void-reason')).toContainText('Lập sai kỳ');
    await expect(page.locator('[data-status="void"]')).toHaveText('Đã huỷ');

    // List: the period filter (URL) shows our voided invoice and not the move-in drafts of M−1.
    await page.goto('/invoices');
    await page.getByLabel('Kỳ', { exact: true }).fill(period);
    await expect(page).toHaveURL(new RegExp(`period=${period}`));
    const listRow = (code: string) => page.getByTestId('invoice-row').filter({ hasText: code });
    // The previous (unfiltered) page stays visible until the filtered result arrives.
    await expect(listRow(eligible.room.code)).toHaveCount(1);
    await expect(listRow(eligible.room.code)).toContainText(issued.code ?? '');
    await expect(listRow(eligible.room.code)).toContainText('Đã huỷ');
    await expect(listRow(excluded.room.code)).toHaveCount(0);
    await page.goto(`/invoices?period=${usage}`);
    await expect(listRow(excluded.room.code)).toContainText('Nhận phòng');
    await expect(listRow(excluded.room.code).getByRole('link', { name: 'Nháp' })).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `invoices-list-${width}`);

    // O-17 tab "Hoá đơn": the activation move-in draft and the voided monthly invoice.
    await page.goto(`/contracts/${eligible.id}?tab=Hoá đơn`);
    const tab = page.getByRole('tabpanel');
    await expect(tab.getByTestId('contract-invoice')).toHaveCount(2);
    await expect(tab.getByRole('link', { name: issued.code ?? '' })).toBeVisible();
    await expect(tab.getByRole('button', { name: 'Tạo hoá đơn nhận phòng' })).toHaveCount(0);
    expect(await noHorizontalScroll(page)).toBe(true);
  });
}
