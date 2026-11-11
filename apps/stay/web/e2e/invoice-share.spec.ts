import { randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { saveScreenshot, signIn } from './helpers';

type Invoice = { id: string; code: string | null; status: string; total: number };

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

/** Same-origin API calls of the signed-in page (writes carry the web origin). */
function api(page: Page) {
  const headers = { origin: new URL(page.url()).origin };

  return {
    post: async (path: string, data: object = {}, extra: Record<string, string> = {}) => {
      const response = await page.request.post(`/api${path}`, {
        headers: { ...headers, ...extra },
        data,
      });
      expect(response.ok(), await response.text()).toBe(true);
      return (await response.json()).data;
    },
    get: async (path: string) => {
      const response = await page.request.get(`/api${path}`);
      expect(response.ok(), await response.text()).toBe(true);
      return (await response.json()).data;
    },
  };
}

/**
 * A new room of building A with a contract from January of a random far-future year; its move-in
 * invoice is issued through the API (isolated from seeded data and other runs).
 */
async function issuedInvoice(page: Page): Promise<Invoice & { roomCode: string }> {
  const { get, post } = api(page);
  const building = (await get('/buildings')).find(
    (candidate: { code: string }) => candidate.code === 'A',
  );
  expect(building, 'Seeded building A must exist').toBeTruthy();
  const year = randomInt(2100, 2900);
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
  const room = await post(`/buildings/${building.id}/rooms`, {
    code: `SH${suffix}`,
    floor: 1,
    listPrice: 3_000_000,
    maxOccupants: 2,
    initialElectric: 0,
    initialWater: 0,
  });
  const tenant = await post('/tenants', {
    buildingId: building.id,
    fullName: `Khách chia sẻ ${suffix}`,
    phone: '0907654328',
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
  test(`ST-16 share an invoice, open it signed out, pay and revoke at ${width}px`, async ({
    page,
    browser,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const invoice = await issuedInvoice(page);
    const code = invoice.code ?? '';
    const partial = 1_000_000;

    // O-22: "Chia sẻ" → create the link; it is shown once in a read-only field.
    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByRole('heading', { level: 1, name: code })).toBeVisible();
    await page.getByRole('button', { name: 'Chia sẻ', exact: true }).click();
    let dialog = page.getByRole('dialog', { name: 'Chia sẻ hoá đơn' });
    await expect(dialog.getByText('Chưa có link chia sẻ')).toBeVisible();
    await dialog.getByRole('button', { name: 'Tạo link', exact: true }).click();
    const field = dialog.getByRole('textbox', { name: 'Link hoá đơn' });
    await expect(field).toHaveValue(/\/i\/[A-Za-z0-9_-]{43}$/);
    const url = await field.inputValue();
    await expect(dialog.getByTestId('share-link-expiry')).toContainText('Link có hiệu lực đến');
    await dialog.getByRole('button', { name: 'Sao chép link', exact: true }).click();
    await expect(page.getByText(/sao chép (được )?link/i).first()).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `invoice-share-dialog-${width}`);
    await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(dialog).toBeHidden();

    // T-01 in a new signed-out browser context.
    const visitor = await browser.newContext({ locale: 'vi-VN', viewport: { width, height: 900 } });
    const tenantPage = await visitor.newPage();

    await tenantPage.goto(url);
    await expect(tenantPage).toHaveURL(url);
    await expect(
      tenantPage.getByRole('heading', { level: 1, name: 'Hoá đơn tiền phòng' }),
    ).toBeVisible();
    await expect(tenantPage).toHaveTitle('Hoá đơn tiền phòng');
    await expect(tenantPage.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(tenantPage.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Hoá đơn tiền phòng',
    );
    await expect(tenantPage.getByTestId('public-invoice-code')).toHaveText(code);
    await expect(tenantPage.getByTestId('public-invoice-remaining')).toContainText(
      money(invoice.total),
    );
    const qr = tenantPage.getByRole('img', { name: /Mã VietQR chuyển khoản/ });
    await expect(qr).toBeVisible();
    await expect(qr).toHaveAccessibleName(new RegExp(money(invoice.total).replaceAll('.', '\\.')));
    await expect(tenantPage.getByTestId('public-invoice-content')).toContainText(
      code.replaceAll('-', ' '),
    );
    // No sidebar or sign-in redirect on the public page.
    await expect(tenantPage.getByRole('navigation')).toHaveCount(0);
    expect(await noHorizontalScroll(tenantPage)).toBe(true);
    await saveScreenshot(tenantPage, `invoice-public-${width}`);

    // A partial payment: the page asks for the rest; paying the rest shows "Đã thanh toán".
    const { post } = api(page);
    const pay = (amount: number) =>
      post(
        `/invoices/${invoice.id}/payments`,
        { amount, method: 'bank_transfer', paidOn: today() },
        { 'Idempotency-Key': randomUUID() },
      );

    await pay(partial);
    await tenantPage.reload();
    await expect(tenantPage.getByTestId('public-invoice-remaining')).toContainText(
      money(invoice.total - partial),
    );
    await expect(qr).toHaveAccessibleName(
      new RegExp(money(invoice.total - partial).replaceAll('.', '\\.')),
    );
    await pay(invoice.total - partial);
    await tenantPage.reload();
    await expect(tenantPage.getByTestId('public-invoice-paid')).toContainText('Đã thanh toán');
    await expect(tenantPage.getByRole('img', { name: /Mã VietQR/ })).toHaveCount(0);
    expect(await noHorizontalScroll(tenantPage)).toBe(true);

    // Revoke with confirmation → the public link shows the "no longer valid" page.
    await page.reload();
    await page.getByRole('button', { name: 'Chia sẻ', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Chia sẻ hoá đơn' });
    await expect(dialog.getByTestId('share-link-expiry')).toContainText(
      'Đã có link đang hoạt động',
    );
    await dialog.getByRole('button', { name: 'Thu hồi link', exact: true }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Thu hồi link chia sẻ?' });
    await confirm.getByRole('button', { name: 'Thu hồi', exact: true }).click();
    await expect(page.getByText('Đã thu hồi link chia sẻ.')).toBeVisible();
    await expect(dialog.getByText('Chưa có link chia sẻ')).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);

    await tenantPage.reload();
    await expect(tenantPage.getByTestId('public-invoice-not-found')).toBeVisible();
    await expect(
      tenantPage.getByRole('heading', { level: 1, name: 'Link hoá đơn không còn hiệu lực' }),
    ).toBeVisible();
    await expect(tenantPage.getByTestId('public-invoice-code')).toHaveCount(0);
    expect(await noHorizontalScroll(tenantPage)).toBe(true);
    await visitor.close();
  });
}
