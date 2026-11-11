import { randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { saveScreenshot, signIn } from './helpers';

type Invoice = { id: string; code: string | null; status: string; total: number };

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

/** Same-origin API calls of the signed-in page (writes carry the web origin). */
function api(page: Page) {
  const headers = { origin: new URL(page.url()).origin };

  return {
    post: async (path: string, data: object = {}) => {
      const response = await page.request.post(`/api${path}`, { headers, data });
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
 * A new room of building A with an active contract from January of a random far-future year for
 * one new tenant, and its issued move-in invoice (isolated from seeded data and other runs).
 */
async function rentedRoom(page: Page) {
  const { get, post } = api(page);
  const building = (await get('/buildings')).find(
    (candidate: { code: string }) => candidate.code === 'A',
  );
  expect(building, 'Seeded building A must exist').toBeTruthy();
  const year = randomInt(2100, 2900);
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
  const phone = `09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
  const fullName = `Khách cổng ${suffix}`;
  const room = await post(`/buildings/${building.id}/rooms`, {
    code: `PT${suffix}`,
    floor: 1,
    listPrice: 3_000_000,
    maxOccupants: 2,
    initialElectric: 0,
    initialWater: 0,
  });
  const tenant = await post('/tenants', { buildingId: building.id, fullName, phone });
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
  const [invoice]: Invoice[] = (await post('/invoices/issue', { ids: [moveIn.id] })).invoices;

  expect(invoice.status).toBe('issued');
  await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
  return {
    building,
    room,
    contract,
    invoice,
    fullName,
    last4: phone.slice(-4),
    wrong4: String((Number(phone.slice(-4)) + 1) % 10_000).padStart(4, '0'),
  };
}

for (const width of [1280, 375]) {
  test(`ST-25 portal link: tenant signs in with 4 digits, reads invoices, staff revokes at ${width}px`, async ({
    page,
    browser,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const rented = await rentedRoom(page);
    const code = rented.invoice.code ?? '';

    // O-17 "Cổng người thuê": create the occupant's link; it is shown once with a QR.
    await page.goto(`/contracts/${rented.contract.id}`);
    await expect(page.getByRole('heading', { level: 1, name: rented.contract.code })).toBeVisible();
    await page.getByRole('tab', { name: 'Cổng người thuê' }).click();
    const panel = page.getByTestId('portal-links');
    const row = panel.getByTestId('portal-link-row').filter({ hasText: rented.fullName });
    await expect(row).toContainText('Chưa có link.');
    await row.getByRole('button', { name: `Tạo link cho ${rented.fullName}` }).click();
    const dialog = page.getByRole('dialog', { name: 'Link cổng người thuê' });
    const field = dialog.getByRole('textbox', { name: 'Link cổng người thuê' });
    await expect(field).toHaveValue(/\/p\/[A-Za-z0-9_-]{43}$/);
    const url = await field.inputValue();
    await expect(dialog.getByRole('img', { name: 'Mã QR của link cổng người thuê' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Sao chép link', exact: true }).click();
    await expect(page.getByText(/sao chép (được )?link/i).first()).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `portal-link-dialog-${width}`);
    await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(row).toContainText('Đang hoạt động');
    await expect(row).toContainText('Chưa mở');

    // T-02 in a new signed-out browser context: greeting, wrong digits, then the right ones.
    const visitor = await browser.newContext({ locale: 'vi-VN', viewport: { width, height: 900 } });
    const tenantPage = await visitor.newPage();

    await tenantPage.goto(url);
    await expect(
      tenantPage.getByRole('heading', {
        level: 1,
        name: `Xin chào, phòng ${rented.room.code} – ${rented.building.name}`,
      }),
    ).toBeVisible();
    await expect(tenantPage).toHaveTitle('Cổng người thuê');
    await expect(tenantPage.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const digits = tenantPage.getByRole('textbox', { name: /4 số cuối số điện thoại/ });
    await digits.fill(rented.wrong4);
    await tenantPage.getByRole('button', { name: 'Vào cổng', exact: true }).click();
    await expect(tenantPage.getByTestId('form-error')).toHaveText(
      'Link không còn hiệu lực hoặc 4 số cuối điện thoại không đúng.',
    );
    await expect(tenantPage).toHaveURL(url);
    await digits.fill(rented.last4);
    await tenantPage.getByRole('button', { name: 'Vào cổng', exact: true }).click();

    // T-03: home with the room, the issued invoice and its VietQR; no management menu.
    await expect(tenantPage).toHaveURL(/\/p$/);
    await expect(
      tenantPage.getByRole('heading', { level: 1, name: `Phòng ${rented.room.code}` }),
    ).toBeVisible();
    await expect(tenantPage.getByTestId('portal-current-code')).toHaveText(code);
    await expect(tenantPage.getByTestId('portal-current-remaining')).toContainText(
      money(rented.invoice.total),
    );
    await tenantPage.getByRole('button', { name: 'Thanh toán', exact: true }).click();
    const qr = tenantPage.getByRole('img', { name: /Mã VietQR chuyển khoản/ });
    await expect(qr).toBeVisible();
    await expect(qr).toHaveAccessibleName(
      new RegExp(money(rented.invoice.total).replaceAll('.', '\\.')),
    );
    await expect(tenantPage.getByTestId('public-invoice-content')).toContainText(
      code.replaceAll('-', ' '),
    );
    const portalNav = tenantPage.getByRole('navigation', { name: 'Điều hướng cổng người thuê' });
    await expect(portalNav).toBeVisible();
    await expect(tenantPage.getByRole('link', { name: 'Tổng quan' })).toHaveCount(0);
    expect(await noHorizontalScroll(tenantPage)).toBe(true);
    await saveScreenshot(tenantPage, `portal-home-${width}`);

    // T-04 → T-05: invoice list and detail (QR, payment history).
    await portalNav.getByRole('link', { name: 'Hoá đơn' }).click();
    await expect(
      tenantPage.getByRole('heading', { level: 1, name: 'Hoá đơn của tôi' }),
    ).toBeVisible();
    await tenantPage.getByTestId('portal-invoice-row').filter({ hasText: code }).click();
    await expect(
      tenantPage.getByRole('heading', { level: 1, name: 'Hoá đơn tiền phòng' }),
    ).toBeVisible();
    await expect(tenantPage.getByTestId('public-invoice-code')).toHaveText(code);
    await expect(tenantPage.getByRole('img', { name: /Mã VietQR chuyển khoản/ })).toBeVisible();
    await expect(tenantPage.getByTestId('portal-payments')).toContainText(
      'Chưa có khoản thanh toán nào',
    );
    expect(await noHorizontalScroll(tenantPage)).toBe(true);

    // T-06: the contract, read-only.
    await portalNav.getByRole('link', { name: 'Hợp đồng' }).click();
    await expect(
      tenantPage.getByRole('heading', { level: 1, name: 'Hợp đồng của tôi' }),
    ).toBeVisible();
    await expect(tenantPage.getByTestId('portal-contract')).toContainText(rented.contract.code);
    await expect(tenantPage.getByText(`${rented.fullName} (bạn)`)).toBeVisible();
    expect(await noHorizontalScroll(tenantPage)).toBe(true);
    await saveScreenshot(tenantPage, `portal-contract-${width}`);

    // The owner sees the last opening, then revokes the link.
    await page.reload();
    await expect(row).toContainText('Lần mở gần nhất');
    await row.getByRole('button', { name: `Thu hồi link của ${rented.fullName}` }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Thu hồi link cổng?' });
    await confirm.getByRole('button', { name: 'Thu hồi', exact: true }).click();
    await expect(
      page.getByText('Đã thu hồi link; mọi thiết bị đã vào đều bị đăng xuất.'),
    ).toBeVisible();
    await expect(confirm).toBeHidden();
    await expect(row).toContainText('Đã thu hồi');
    expect(await noHorizontalScroll(page)).toBe(true);

    // The tenant's device is signed out: T-11, and the link itself no longer opens.
    await tenantPage.reload();
    await expect(tenantPage.getByTestId('portal-invalid')).toBeVisible();
    await expect(
      tenantPage.getByRole('heading', { level: 1, name: 'Link không còn hiệu lực' }),
    ).toBeVisible();
    await expect(tenantPage.getByTestId('portal-current-code')).toHaveCount(0);
    await tenantPage.goto(url);
    await expect(tenantPage.getByTestId('portal-invalid')).toBeVisible();
    expect(await noHorizontalScroll(tenantPage)).toBe(true);
    await visitor.close();
  });
}
