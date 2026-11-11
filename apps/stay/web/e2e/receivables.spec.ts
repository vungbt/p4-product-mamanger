import { randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { saveScreenshot, signIn } from './helpers';

type Invoice = { id: string; code: string | null; status: string; total: number };

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
/** Exactly this amount (`3.000.000 ₫`), not a longer number containing it. */
const exactly = (value: number) => new RegExp(`^\\s*${money(value).replaceAll('.', '\\.')}\\D*$`);
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

/**
 * A new room of building A with a contract from January of a random past year and no metered
 * services; the February invoice is drafted and issued through the API. Its due date comes from
 * the building settings (February of that year), so it is more than 30 days overdue.
 */
async function overdueInvoice(page: Page) {
  const headers = { origin: new URL(page.url()).origin };
  const post = async (path: string, data: object = {}, extra: Record<string, string> = {}) => {
    const response = await page.request.post(`/api${path}`, {
      headers: { ...headers, ...extra },
      data,
    });
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
  const year = randomInt(2001, 2020);
  const period = `${year}-02`;
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
  const room = await post(`/buildings/${building.id}/rooms`, {
    code: `CN${suffix}`,
    floor: 1,
    listPrice: 3_000_000,
    maxOccupants: 2,
    initialElectric: 0,
    initialWater: 0,
  });
  const tenant = await post('/tenants', {
    buildingId: building.id,
    fullName: `Khách công nợ ${suffix}`,
    phone: '0907654331',
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

  await post(
    `/buildings/${building.id}/billing/${period}/drafts`,
    {},
    {
      'Idempotency-Key': randomUUID(),
    },
  );
  const [monthly]: Invoice[] = await get(
    `/invoices?contractId=${contract.id}&period=${period}&kind=monthly`,
  );
  expect(monthly, 'The February draft of our contract must exist').toBeTruthy();
  const [issued]: Invoice[] = (await post('/invoices/issue', { ids: [monthly.id] })).invoices;

  expect(issued.status).toBe('issued');
  expect(issued.total).toBeGreaterThan(1_000_000);
  await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
  return { invoice: issued, roomCode: room.code as string, phone: tenant.phone as string };
}

/** The amount of a money cell (`3.000.000 ₫`) as a number. */
async function amountOf(page: Page, testId: string) {
  return Number(((await page.getByTestId(testId).textContent()) ?? '').replace(/\D/g, ''));
}

for (const width of [1280, 375]) {
  test(`ST-18 Công nợ: overdue row, partial and full payment at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const { invoice, roomCode, phone } = await overdueInvoice(page);
    const code = invoice.code ?? '';
    const partial = 1_000_000;
    const total = page.getByTestId('receivables-total');

    // Baseline: the building total (no search, no bucket) includes our new invoice.
    await page.goto('/receivables');
    await expect(page.getByRole('heading', { level: 1, name: 'Công nợ' })).toBeVisible();
    await expect(total).toBeVisible();
    const baseline = await amountOf(page, 'receivables-total');

    expect(baseline).toBeGreaterThanOrEqual(invoice.total);

    // Search our room: one row, the invoice total, more than 30 days overdue.
    await page.getByRole('searchbox', { name: 'Tìm' }).fill(roomCode);
    await expect(page).toHaveURL(new RegExp(`q=${roomCode}`));
    const rows = page.getByTestId('receivable-row');
    const row = rows.filter({ hasText: roomCode });
    // The previous (unfiltered) page stays visible until the filtered result arrives.
    await expect(rows).toHaveCount(1);
    await expect(row).toHaveAttribute('data-bucket', 'over_30');
    await expect(row.getByTestId('receivable-remaining')).toHaveText(exactly(invoice.total));
    await expect(row).toContainText(`Khách công nợ`);
    await expect(row.getByText(/^Quá hạn \d+ ngày$/)).toBeVisible();
    await expect(total).toHaveText(exactly(invoice.total));
    await expect(row.getByRole('link', { name: /^Gọi Khách công nợ/ })).toHaveAttribute(
      'href',
      `tel:${phone}`,
    );

    // The bucket chip is kept on the URL.
    await page.getByTestId('bucket-over_30').click();
    await expect(page).toHaveURL(/bucket=over_30/);
    await expect(row).toHaveCount(1);
    await page.getByTestId('bucket-1_7').click();
    await expect(page).toHaveURL(/bucket=1_7/);
    await expect(row).toHaveCount(0);
    await page.getByTestId('bucket-1_7').click();
    await expect(page).not.toHaveURL(/bucket=/);
    await expect(row).toHaveCount(1);

    // Expanding the row lists the invoice with its link.
    await row.getByRole('button', { name: new RegExp(`kỳ nợ phòng ${roomCode}`) }).click();
    await expect(row.getByTestId('receivable-invoice')).toHaveCount(1);
    await expect(row.getByRole('link', { name: code, exact: true })).toHaveAttribute(
      'href',
      `/invoices/${invoice.id}`,
    );

    // "Gửi lại link" opens the share dialog of the invoice.
    await row
      .getByRole('button', { name: `Gửi lại link hoá đơn ${code} phòng ${roomCode}` })
      .click();
    const share = page.getByRole('dialog', { name: 'Chia sẻ hoá đơn' });
    await expect(share).toBeVisible();
    await share.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(share).toBeHidden();
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `receivables-${width}`);

    // Partial payment: the row shows the rest right away.
    await row.getByRole('button', { name: `Thu tiền phòng ${roomCode}`, exact: true }).click();
    let dialog = page.getByRole('dialog', { name: `Thu tiền phòng ${roomCode}` });
    await expect(dialog.getByTestId('payment-remaining')).toContainText(money(invoice.total));
    await dialog.getByRole('spinbutton', { name: /Số tiền/ }).fill(String(partial));
    await dialog.getByRole('button', { name: 'Ghi khoản thu', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(row.getByTestId('receivable-remaining')).toHaveText(
      exactly(invoice.total - partial),
    );
    await expect(total).toHaveText(exactly(invoice.total - partial));

    // Paying the rest removes the row.
    await row.getByRole('button', { name: `Thu tiền phòng ${roomCode}`, exact: true }).click();
    dialog = page.getByRole('dialog', { name: `Thu tiền phòng ${roomCode}` });
    await expect(dialog.getByTestId('payment-remaining')).toContainText(
      money(invoice.total - partial),
    );
    await dialog.getByRole('button', { name: 'Thu đủ', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(rows).toHaveCount(0);
    await expect(page.getByText('Không có công nợ phù hợp')).toBeVisible();

    // Without the search the building total dropped by exactly the paid amounts.
    await page.getByRole('searchbox', { name: 'Tìm' }).fill('');
    await expect(page).not.toHaveURL(/q=/);
    await expect(total).toHaveText(exactly(baseline - invoice.total));
    expect(await noHorizontalScroll(page)).toBe(true);
  });
}
