import { randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { chooseOption, pickDate, saveScreenshot, signIn } from './helpers';

type Invoice = { id: string; code: string | null; status: string; total: number };
type InboxItem = { id: string; kind: string };

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
// 1×1 transparent PNG (receipt photo).
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

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
 * A new room of building A (never another building) with an active contract in a random
 * far-future year for one new tenant, its issued move-in invoice and the tenant's portal link.
 */
async function rentedRoom(page: Page) {
  const { get, post } = api(page);
  const building = (await get('/buildings?pageSize=100')).find(
    (candidate: { code: string }) => candidate.code === 'A',
  );
  expect(building, 'Seeded building A must exist').toBeTruthy();
  // Within the kit DatePicker range (up to 2100) so the tenant can pick dates of the stay.
  const year = randomInt(2030, 2100);
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
  const phone = `09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
  const fullName = `Khách yêu cầu ${suffix}`;
  // A leading 0 sorts the room first in the announcement room list.
  const room = await post(`/buildings/${building.id}/rooms`, {
    code: `0${suffix}`,
    floor: 1,
    listPrice: 3_000_000,
    maxOccupants: 3,
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
  const link = await post(`/contracts/${contract.id}/portal-links`, { tenantId: tenant.id });

  expect(invoice.status).toBe('issued');
  await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
  return {
    building,
    room,
    contract,
    invoice,
    year,
    suffix,
    url: new URL(link.path, page.url()).toString(),
    last4: phone.slice(-4),
  };
}

for (const width of [1280, 375]) {
  test(`ST-25 part B: claim, báo hỏng, yêu cầu and announcements at ${width}px`, async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const rented = await rentedRoom(page);
    const { get } = api(page);
    const code = rented.invoice.code ?? '';
    const title = `Vòi nước rò ${rented.suffix}`;
    const newcomer = `Người mới ${rented.suffix}`;

    // Tenant: a separate signed-out context, the real link + 4 digits flow.
    const visitor = await browser.newContext({ locale: 'vi-VN', viewport: { width, height: 900 } });
    const tenant = await visitor.newPage();
    const portal = (path: string) => new URL(path, rented.url).toString();

    await tenant.goto(rented.url);
    await tenant.getByRole('textbox', { name: /4 số cuối số điện thoại/ }).fill(rented.last4);
    await tenant.getByRole('button', { name: 'Vào cổng', exact: true }).click();
    await expect(tenant).toHaveURL(/\/p$/);

    // T-05 "Tôi đã chuyển khoản": amount defaults to the remaining amount, with a receipt.
    await tenant.goto(portal(`/p/invoices/${rented.invoice.id}`));
    await tenant.getByRole('button', { name: 'Tôi đã chuyển khoản', exact: true }).click();
    const claimForm = tenant.getByTestId('portal-claim-form');
    await expect(claimForm.getByRole('spinbutton', { name: /Số tiền đã chuyển/ })).toHaveValue(
      new RegExp(money(rented.invoice.total).replaceAll('.', '\\.?')),
    );
    await claimForm
      .getByLabel('Ảnh biên lai')
      .and(page.locator('input[type="file"]'))
      .setInputFiles({ name: 'bien-lai.png', mimeType: 'image/png', buffer: PNG });
    await claimForm.getByRole('button', { name: 'Gửi xác nhận', exact: true }).click();
    await expect(claimForm).toBeHidden();
    await expect(tenant.getByTestId('portal-claims')).toContainText('Đang chờ xác nhận');
    expect(await noHorizontalScroll(tenant)).toBe(true);

    // T-08 báo hỏng.
    await tenant.goto(portal('/p/maintenance/new'));
    await chooseOption(tenant, tenant, /Hạng mục/, 'Nước');
    await tenant.getByRole('textbox', { name: /Tiêu đề/ }).fill(title);
    await tenant.getByRole('textbox', { name: /Mô tả/ }).fill('Rò nước dưới bồn rửa');
    await tenant.getByRole('button', { name: 'Gửi báo hỏng', exact: true }).click();
    await expect(tenant).toHaveURL(/\/p\/maintenance$/);
    await expect(tenant.getByTestId('portal-maintenance-list')).toContainText(title);
    expect(await noHorizontalScroll(tenant)).toBe(true);

    // T-09 yêu cầu thêm người ở (type-specific fields).
    await tenant.goto(portal('/p/requests/new'));
    await chooseOption(tenant, tenant, /Loại yêu cầu/, 'Thêm người ở');
    await tenant.getByRole('textbox', { name: /Họ tên người ở mới/ }).fill(newcomer);
    await tenant
      .getByRole('textbox', { name: /Số điện thoại/ })
      .fill(`09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`);
    await pickDate(tenant, tenant, /Ở từ ngày/, `${rented.year}-03-01`);
    await tenant.getByRole('button', { name: 'Gửi yêu cầu', exact: true }).click();
    await expect(tenant).toHaveURL(/\/p\/requests$/);
    await expect(tenant.getByTestId('portal-request-list')).toContainText(newcomer);
    expect(await noHorizontalScroll(tenant)).toBe(true);
    await saveScreenshot(tenant, `portal-requests-${width}`);

    // Staff inbox (O-26), filtered to this room.
    const items: InboxItem[] = await get(`/requests?contractId=${rented.contract.id}`);
    const idOf = (kind: string) => items.find((item) => item.kind === kind)?.id ?? '';
    expect(items).toHaveLength(3);

    await page.goto(`/requests?q=${rented.room.code}`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Yêu cầu từ người thuê' }),
    ).toBeVisible();
    const detail = page.getByTestId('request-detail');
    for (const kind of ['payment_claim', 'maintenance', 'tenant_request'])
      await expect(page.getByTestId(`request-row-${idOf(kind)}`)).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `requests-inbox-${width}`);

    // Confirm the claim, seeing the receipt image and the amount.
    await page.getByTestId(`request-row-${idOf('payment_claim')}`).click();
    await expect(detail.getByRole('img', { name: 'Ảnh biên lai' })).toBeVisible();
    await detail.getByRole('button', { name: 'Xác nhận đã nhận tiền', exact: true }).click();
    await expect(detail.getByTestId('claim-confirm-summary')).toContainText(
      money(rented.invoice.total),
    );
    await detail.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(detail).toContainText('Xong');
    await detail.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(detail).toBeHidden();

    // Reject the maintenance report with a reason (the tenant reads it as the reply).
    await page.getByTestId(`request-row-${idOf('maintenance')}`).click();
    await detail.getByRole('button', { name: 'Từ chối', exact: true }).click();
    await detail.getByRole('textbox', { name: /Lý do/ }).fill(`Đã sửa hôm qua ${rented.suffix}`);
    await detail.getByRole('button', { name: 'Xác nhận từ chối', exact: true }).click();
    await expect(detail).toContainText(`Đã sửa hôm qua ${rented.suffix}`);
    await detail.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(detail).toBeHidden();

    // Accept the add-occupant request: the ST-12 change runs.
    await page.getByTestId(`request-row-${idOf('tenant_request')}`).click();
    await detail.getByRole('button', { name: 'Duyệt', exact: true }).click();
    await detail.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click();
    await expect(detail).toContainText('Xong');
    await detail.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(detail).toBeHidden();

    // The contract shows the new occupant from the requested date.
    await page.goto(`/contracts/${rented.contract.id}`);
    await expect(page.getByText(newcomer).first()).toBeVisible();

    // The tenant sees the invoice paid and the reply.
    await tenant.goto(portal(`/p/invoices/${rented.invoice.id}`));
    await expect(tenant.getByTestId('portal-claims')).toContainText('Đã xác nhận');
    await expect(tenant.getByTestId('portal-payments')).toContainText(money(rented.invoice.total));
    await expect(tenant.getByTestId('public-invoice-code')).toHaveText(code);
    await tenant.goto(portal('/p/maintenance'));
    await expect(tenant.getByTestId('portal-maintenance-list')).toContainText(
      `Đã sửa hôm qua ${rented.suffix}`,
    );
    await tenant.goto(portal('/p/requests'));
    await expect(tenant.getByTestId('portal-request-list')).toContainText('Đã duyệt');

    // O-32: an announcement pinned for this room only.
    const notice = `Cắt nước phòng ${rented.room.code}`;
    await page.goto('/announcements');
    await page.getByRole('button', { name: 'Tạo thông báo', exact: true }).click();
    const form = page.getByRole('form', { name: 'Thông báo cho người thuê' });
    await form.getByRole('textbox', { name: /Tiêu đề/ }).fill(notice);
    await form.getByRole('textbox', { name: /Nội dung/ }).fill('Sáng mai cắt nước 8h–10h.');
    await form.getByRole('radio', { name: 'Một số phòng' }).click();
    await form.getByRole('checkbox', { name: `Phòng ${rented.room.code}` }).click();
    await form.getByRole('checkbox', { name: 'Ghim lên trang chủ người thuê' }).click();
    await form.getByRole('button', { name: 'Lưu thông báo', exact: true }).click();
    await expect(form).toBeHidden();
    await expect(page.getByTestId('announcement-list')).toContainText(notice);
    expect(await noHorizontalScroll(page)).toBe(true);

    await tenant.goto(portal('/p'));
    const pinned = tenant.getByRole('region', { name: 'Thông báo từ chủ trọ' });
    await expect(pinned).toContainText(notice);
    expect(await noHorizontalScroll(tenant)).toBe(true);
    await saveScreenshot(tenant, `portal-home-notice-${width}`);
    await visitor.close();
  });
}
