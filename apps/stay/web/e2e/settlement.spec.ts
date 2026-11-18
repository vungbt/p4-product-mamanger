import { randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { displayIsoDate, pickDate, saveScreenshot, signIn } from './helpers';

type Preview = { total: number; ownerRefunds: number; tenantPays: number; amountDue: number };

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

/** First day of the month before today: the move-in invoice covers it, this month is unbilled. */
function lastMonthStart() {
  const [year, month] = today().split('-').map(Number);
  const previous = month === 1 ? [year - 1, 12] : [year, month - 1];

  return `${previous[0]}-${String(previous[1]).padStart(2, '0')}-01`;
}

/**
 * A new room of building A with an active contract from last month, a collected deposit and
 * metered services; its move-in invoice is issued (a draft would block the settlement).
 */
async function activeContract(page: Page) {
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
  const services: { id: string; kind: string; active: boolean }[] = await get('/services');
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
  const room = await post(`/buildings/${building.id}/rooms`, {
    code: `TL${suffix}`,
    floor: 1,
    listPrice: 3_000_000,
    maxOccupants: 2,
    initialElectric: 100,
    initialWater: 10,
  });
  const tenant = await post('/tenants', {
    buildingId: building.id,
    fullName: `Khách thanh lý ${suffix}`,
    phone: '0907654330',
  });
  const startDate = lastMonthStart();
  const draft = await post('/contracts', {
    roomId: room.id,
    startDate,
    endDate: null,
    rent: 3_000_000,
    depositAmount: 6_000_000,
    depositCollected: true,
    depositMethod: 'cash',
    depositDate: startDate,
    initialElectric: 100,
    initialWater: 10,
    occupantIds: [tenant.id],
    primaryTenantId: tenant.id,
    serviceIds: services
      .filter((service) => service.active && ['electricity', 'water'].includes(service.kind))
      .map((service) => service.id),
    vehicleIds: [],
  });
  const contract = await post(`/contracts/${draft.id}/activate`);
  const [moveIn] = await get(`/invoices?contractId=${contract.id}&kind=move_in`);

  await post('/invoices/issue', { ids: [moveIn.id] });
  await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
  return { contract, room, post, get };
}

for (const width of [1280, 375]) {
  test(`ST-17 notice, settlement with a surcharge, vacant room at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const { contract, room, post, get } = await activeContract(page);
    const moveOutDate = today();
    const body = {
      moveOutDate,
      finalElectric: 130,
      finalWater: 12,
      surcharges: [{ amount: 200_000, reason: 'Dọn dẹp phòng' }],
    };

    // Báo trả phòng from the contract detail.
    await page.goto(`/contracts/${contract.id}`);
    await expect(page.getByRole('heading', { level: 1, name: contract.code })).toBeVisible();
    await page.getByRole('button', { name: 'Thay đổi', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Báo trả phòng', exact: true }).click();
    const notice = page.getByRole('dialog', { name: 'Báo trả phòng' });
    await pickDate(page, notice, /Ngày dự kiến trả phòng/, moveOutDate);
    await notice.getByRole('textbox', { name: /Ghi chú/ }).fill('Chuyển công tác');
    expect(await noHorizontalScroll(page)).toBe(true);
    await notice.getByRole('button', { name: 'Báo trả phòng', exact: true }).click();
    await expect(notice).toBeHidden();
    await expect(page.getByTestId('contract-notice')).toBeVisible();
    await expect(page.getByText(/Đã báo trả · Phòng/)).toBeVisible();

    // Thanh lý: step 1 move-out date and final readings.
    await page.getByTestId('contract-notice').getByRole('link', { name: 'Thanh lý' }).click();
    await expect(page).toHaveURL(`/contracts/${contract.id}/settle`);
    await expect(page.getByRole('heading', { level: 1, name: 'Thanh lý hợp đồng' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ngày trả phòng/ })).toContainText(
      displayIsoDate(moveOutDate),
    );
    await page.getByRole('spinbutton', { name: /Chỉ số điện cuối/ }).fill('130');
    await page.getByRole('spinbutton', { name: /Chỉ số nước cuối/ }).fill('12');
    expect(await noHorizontalScroll(page)).toBe(true);
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();

    // Step 2: building A follows the system move-out fee (300.000 ₫), prefilled and removable.
    const fee = page.getByRole('group', { name: 'Phụ thu 1' });
    await expect(page.getByTestId('settle-move-out-fee')).toBeVisible();
    await expect(fee.getByRole('spinbutton', { name: /Số tiền/ })).toHaveValue(/300[.,]000/);
    await expect(fee.getByRole('textbox', { name: /Lý do/ })).toHaveValue(
      'Khấu hao cơ sở vật chất',
    );
    await fee.getByRole('button', { name: 'Xoá phụ thu 1', exact: true }).click();
    await expect(fee).toBeHidden();

    // One surcharge with its reason (the reason is required).
    await page.getByRole('button', { name: 'Thêm phụ thu', exact: true }).click();
    const surcharge = page.getByRole('group', { name: 'Phụ thu 1' });
    await surcharge.getByRole('spinbutton', { name: /Số tiền/ }).fill('200000');
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
    await expect(surcharge.getByText('Nhập lý do.')).toBeVisible();
    await surcharge.getByRole('textbox', { name: /Lý do/ }).fill('Dọn dẹp phòng');
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();

    // Step 3: the summary is the API computation.
    const summary = page.getByTestId('settlement-summary');
    await expect(summary).toBeVisible();
    const expected: Preview = await post(`/contracts/${contract.id}/settlement-preview`, body);
    await expect(page.getByTestId('settle-total')).toContainText(money(expected.total));
    await expect(page.getByTestId('settle-amount-due')).toContainText(money(expected.amountDue));
    await expect(page.getByTestId('settle-surcharges')).toContainText(money(200_000));
    await expect(page.getByTestId('settle-deposit')).toContainText(money(6_000_000));
    await expect(page.getByTestId('settle-result')).toContainText(
      expected.ownerRefunds > 0
        ? `Chủ trọ hoàn ${money(expected.ownerRefunds)}`
        : `Người thuê trả thêm ${money(expected.tenantPays)}`,
    );
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `settlement-summary-${width}`);

    // Confirm (the dialog repeats the result), then the success screen.
    await page.getByRole('button', { name: 'Xác nhận thanh lý', exact: true }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Xác nhận thanh lý?' });
    await expect(confirm).toContainText(
      expected.ownerRefunds > 0 ? money(expected.ownerRefunds) : money(expected.tenantPays),
    );
    await confirm.getByRole('button', { name: 'Thanh lý', exact: true }).click();
    await expect(page.getByTestId('settle-done')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: `Đã thanh lý ${contract.code}` }),
    ).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, `settlement-done-${width}`);

    // The settlement invoice exists, issued with the previewed total.
    const invoices = await get(`/invoices?contractId=${contract.id}&kind=settlement`);
    expect(invoices).toHaveLength(1);
    expect(invoices[0].total).toBe(expected.total);
    expect(invoices[0].status).not.toBe('draft');
    await page.getByRole('link', { name: 'Xem hoá đơn thanh lý', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: invoices[0].code })).toBeVisible();

    // The contract reads "Đã kết thúc".
    await page.goto(`/contracts/${contract.id}`);
    await expect(page.getByTestId('contract-ended')).toBeVisible();
    await expect(page.getByText(/Đã kết thúc · Phòng/)).toBeVisible();

    // The room is vacant on the map (found by its code).
    await page.goto('/rooms');
    await page.getByRole('searchbox', { name: 'Tìm phòng' }).fill(room.code);
    const tile = page.locator(`[data-testid="room-tile"][data-room-code="${room.code}"]`);
    await expect(tile).toHaveCount(1);
    await expect(tile).toHaveAttribute('data-status', 'vacant');
    expect(await noHorizontalScroll(page)).toBe(true);
  });
}
