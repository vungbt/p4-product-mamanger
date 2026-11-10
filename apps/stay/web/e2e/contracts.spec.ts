import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { saveScreenshot, signIn } from './helpers';

for (const width of [1280, 375]) {
  test(`ST-10 wizard activates a vacant room and updates room/tenant views at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const headers = { origin: new URL(page.url()).origin };
    const buildings = await page.request.get('/api/buildings');
    expect(buildings.ok()).toBe(true);
    const building = (await buildings.json()).data.find((b: { code: string }) => b.code === 'A');
    const suffix = randomUUID().replaceAll('-', '').slice(0, 7).toUpperCase();
    const code = `CT${suffix}`;
    const roomResponse = await page.request.post(`/api/buildings/${building.id}/rooms`, {
      headers,
      data: {
        code,
        floor: 1,
        listPrice: 3_000_000,
        maxOccupants: 2,
        initialElectric: 0,
        initialWater: 0,
      },
    });
    expect(roomResponse.ok(), await roomResponse.text()).toBe(true);
    const room = (await roomResponse.json()).data;
    await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
    await page.goto(`/contracts/new?roomId=${room.id}`);
    await expect(page.getByRole('heading', { name: 'Tạo hợp đồng', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Lưu nháp & tiếp tục' }).click();
    await expect(page.getByRole('heading', { name: 'Bước 2: Người ở' })).toBeVisible();
    // Quick creation uses the real tenant endpoint and selects the new tenant as representative.
    const name = `Khách hợp đồng ${suffix}`;
    await page.getByLabel('Họ tên', { exact: true }).fill(name);
    await page.getByLabel('Số điện thoại', { exact: true }).fill('0901234567');
    await page.getByRole('button', { name: 'Thêm người thuê', exact: true }).click();
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Lưu nháp & tiếp tục' }).click();
    await expect(page.getByRole('heading', { name: 'Bước 3: Dịch vụ & xe' })).toBeVisible();
    await page.getByRole('button', { name: 'Lưu nháp & tiếp tục' }).click();
    await expect(page.getByRole('heading', { name: 'Bước 4: Cọc & chỉ số' })).toBeVisible();
    await page.getByLabel('Tiền cọc', { exact: true }).fill('3000000');
    await page.getByRole('button', { name: 'Lấy chỉ số gần nhất' }).click();
    await page.getByRole('button', { name: 'Lưu nháp & tiếp tục' }).click();
    await expect(page.getByTestId('move-in-preview')).toContainText('Tiền nhận phòng');
    await expect(page.getByTestId('move-in-preview')).toContainText('Không gồm cọc và điện nước');
    // Reload must resume the same persisted draft at step 5.
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Bước 5: Xem trước & kích hoạt' }),
    ).toBeVisible();
    await saveScreenshot(page, `contracts-preview-${width}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Kích hoạt', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận kích hoạt', exact: true }).click();
    await expect(page).toHaveURL(/\/contracts\/[0-9a-f-]+$/);
    const id = new URL(page.url()).pathname.split('/').pop();
    await expect(page.getByText(`Hiệu lực · Phòng ${code}`)).toBeVisible();
    const detailResponse = await page.request.get(`/api/contracts/${id}`);
    const active = (await detailResponse.json()).data;
    await page.getByRole('tab', { name: 'Lịch sử', exact: true }).click();
    await expect(page.getByRole('tabpanel')).toContainText('Kích hoạt');
    await page.goto('/rooms');
    // Search is server-side so the test room is found even with a paginated map.
    await page.getByRole('searchbox', { name: 'Tìm phòng' }).fill(code);
    const tile = page
      .getByTestId('room-tile')
      .filter({ has: page.getByRole('link', { name: `Phòng ${code}`, exact: true }) });
    await expect(tile).toHaveAttribute('data-status', 'occupied');
    await expect(tile).toContainText(name);
    await page.goto(`/tenants/${active.primaryTenantId}`);
    await expect(
      page.getByTestId('tenant-profile').getByText(`Phòng ${code}`, { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: active.code, exact: true })).toBeVisible();
    // The server rejects a second draft's activation for the occupied room.
    const second = await page.request.post('/api/contracts', {
      headers,
      data: {
        roomId: room.id,
        startDate: active.startDate,
        endDate: null,
        rent: 3_000_000,
        occupantIds: [active.primaryTenantId],
        primaryTenantId: active.primaryTenantId,
      },
    });
    expect(second.status(), await second.text()).toBe(201);
    const secondId = (await second.json()).data.id;
    expect(
      (await page.request.post(`/api/contracts/${secondId}/activate`, { headers })).status(),
    ).toBe(409);
    await page.request.post(`/api/contracts/${secondId}/cancel`, { headers });
    await page.goto('/contracts');
    await expect(page.getByRole('heading', { name: 'Hợp đồng', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: active.code, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await saveScreenshot(page, `contracts-list-${width}`);
  });
}
