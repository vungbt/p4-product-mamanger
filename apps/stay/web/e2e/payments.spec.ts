import { randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { chooseOption, pickDate, saveScreenshot, signIn } from './helpers';

type Invoice = { id: string; code: string | null; status: string; total: number };

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

/**
 * A new room of building A with a contract from January of a random far-future year; its move-in
 * invoice is issued through the API (isolated from seeded data and other runs).
 */
async function issuedInvoice(page: Page): Promise<Invoice & { roomCode: string }> {
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
  const year = randomInt(2100, 2900);
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
  const room = await post(`/buildings/${building.id}/rooms`, {
    code: `PY${suffix}`,
    floor: 1,
    listPrice: 3_000_000,
    maxOccupants: 2,
    initialElectric: 0,
    initialWater: 0,
  });
  const tenant = await post('/tenants', {
    buildingId: building.id,
    fullName: `Khách thu tiền ${suffix}`,
    phone: '0907654329',
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
    serviceIds: [],
    vehicleIds: [],
  });
  const contract = await post(`/contracts/${draft.id}/activate`);
  const [moveIn]: Invoice[] = await get(`/invoices?contractId=${contract.id}&kind=move_in`);
  const [issued]: Invoice[] = (await post('/invoices/issue', { ids: [moveIn.id] })).invoices;

  expect(issued.status).toBe('issued');
  expect(issued.total).toBeGreaterThan(1_000_000);
  await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
  return { ...issued, roomCode: room.code };
}

for (const width of [1280, 375]) {
  test(`ST-15 collect, pay in full, overpay, reverse and Sổ thu at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const invoice = await issuedInvoice(page);
    const code = invoice.code ?? '';
    const partial = 1_000_000;
    const rest = invoice.total - partial;
    // A past date of its own (payments cannot be dated in the future) isolates our row.
    const paidOn = `${randomInt(2001, 2020)}-0${randomInt(1, 9)}-1${randomInt(0, 9)}`;
    const status = page.getByTestId('invoice-code').locator('xpath=..').locator('[data-status]');
    const payments = page.getByTestId('invoice-payment');

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByRole('heading', { level: 1, name: code })).toBeVisible();
    await expect(status).toHaveText('Chưa thu');
    await expect(payments).toHaveCount(0);

    // Overpay: the amount field shows the error, nothing is recorded.
    await page.getByRole('button', { name: 'Thu tiền', exact: true }).click();
    let dialog = page.getByRole('dialog', { name: 'Thu tiền' });
    const amount = dialog.getByRole('spinbutton', { name: /Số tiền/ });
    await expect(amount).toHaveValue(new RegExp(money(invoice.total).replaceAll('.', '\\.?')));
    await amount.fill(String(invoice.total + 1000));
    await dialog.getByRole('button', { name: 'Ghi khoản thu', exact: true }).click();
    await expect(dialog.getByText(/Số tiền vượt số còn lại/)).toBeVisible();
    await expect(dialog).toBeVisible();

    // Partial payment by bank transfer, dated in the past → "Thu một phần".
    await amount.fill(String(partial));
    await chooseOption(page, dialog, /Phương thức/, 'Chuyển khoản');
    await pickDate(page, dialog, /Ngày thu/, paidOn);
    await dialog.getByRole('textbox', { name: /Mã giao dịch/ }).fill(`FT${code}`);
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `payments-dialog-${width}`);
    await dialog.getByRole('button', { name: 'Ghi khoản thu', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(status).toHaveText('Thu một phần');
    await expect(payments).toHaveCount(1);
    await expect(payments.first()).toContainText(money(partial));
    await expect(payments.first()).toContainText('Chuyển khoản');
    await expect(page.getByTestId('invoice-totals')).toContainText(money(rest));

    // One tap "Thu đủ" records the remaining amount → "Đã thu".
    await page.getByRole('button', { name: 'Thu tiền', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Thu tiền' });
    await expect(dialog.getByTestId('payment-remaining')).toContainText(money(rest));
    await dialog.getByRole('button', { name: 'Thu đủ', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(status).toHaveText('Đã thu');
    await expect(payments).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Thu tiền', exact: true })).toHaveCount(0);

    // Reverse the full payment: reason required, status goes back to "Thu một phần".
    await payments
      .filter({ hasText: money(rest) })
      .getByRole('button', { name: /^Huỷ bút toán/ })
      .click();
    const reverse = page.getByRole('dialog', { name: 'Huỷ bút toán thu' });
    await reverse.getByRole('button', { name: 'Huỷ bút toán', exact: true }).click();
    await expect(reverse.getByText('Nhập lý do huỷ.')).toBeVisible();
    await reverse.getByRole('textbox', { name: /Lý do huỷ/ }).fill('Ghi nhầm khoản thu');
    await reverse.getByRole('button', { name: 'Huỷ bút toán', exact: true }).click();
    await expect(reverse).toBeHidden();
    await expect(status).toHaveText('Thu một phần');
    await expect(page.locator('[data-payment-status="reversed"]')).toHaveCount(1);
    await expect(page.getByTestId('reverse-reason')).toContainText('Ghi nhầm khoản thu');
    await expect(page.getByRole('button', { name: 'Thu tiền', exact: true })).toBeEnabled();
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `payments-invoice-${width}`);

    // Sổ thu: our invoice, filtered by the payment date range.
    await page.goto('/payments');
    await expect(page.getByRole('heading', { level: 1, name: 'Sổ thu' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Tìm' }).fill(code);
    await pickDate(page, page, 'Từ ngày', paidOn);
    await pickDate(page, page, 'Đến ngày', paidOn);
    await expect(page).toHaveURL(new RegExp(`from=${paidOn}`));
    await expect(page).toHaveURL(new RegExp(`to=${paidOn}`));
    await expect(page).toHaveURL(/q=/);
    const rows = page.getByTestId(/^payment-list-row-/).filter({ hasText: code });
    // The previous (unfiltered) page stays visible until the filtered result arrives.
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(money(partial));
    await expect(rows.first()).toContainText('Chuyển khoản');
    await expect(rows.first().locator('[data-payment-status]')).toHaveAttribute(
      'data-payment-status',
      'recorded',
    );
    await expect(page.getByTestId('payment-total-bank_transfer')).toContainText(money(partial));
    await expect(page.getByTestId('payment-total-all')).toContainText(money(partial));
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `payments-ledger-${width}`);

    // Today's range: only the reversed payment of our invoice (struck through, not counted).
    await pickDate(page, page, 'Đến ngày', today());
    await pickDate(page, page, 'Từ ngày', today());
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('[data-payment-status]')).toHaveAttribute(
      'data-payment-status',
      'reversed',
    );
    await expect(page.getByTestId('payment-total-all')).toContainText(/(^|\D)0\s₫/);
  });
}
