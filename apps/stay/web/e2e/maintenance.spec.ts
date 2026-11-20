import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { chooseOption, fillLogin, MANAGER, pickDate, saveScreenshot, signIn } from './helpers';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

for (const width of [1280, 375]) {
  test(`ST-22 create, photos, edit, status history and expense at ${width}px (building A)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const buildings = await (await page.request.get('/api/buildings?pageSize=100')).json();
    const building = buildings.data.find((row: { code: string }) => row.code === 'A');

    expect(building).toBeTruthy();
    const roomCode = `M${randomUUID().replaceAll('-', '').slice(0, 7).toUpperCase()}`;
    const createdRoom = await page.request.post(`/api/buildings/${building.id}/rooms`, {
      headers: { origin: new URL(page.url()).origin },
      data: {
        code: roomCode,
        floor: 1,
        listPrice: 3000000,
        maxOccupants: 2,
        initialElectric: 0,
        initialWater: 0,
      },
    });

    expect(createdRoom.ok()).toBeTruthy();
    const room = (await createdRoom.json()).data;
    const title = `Bảo trì E2E ${randomUUID()}`;

    // Pin A explicitly; other suites may create their own buildings or jobs.
    await page.evaluate((id: string) => localStorage.setItem('stay_building_id', id), building.id);
    await page.goto(`/maintenance?q=${encodeURIComponent(title)}`);
    await page.getByRole('button', { name: 'Thêm việc bảo trì', exact: true }).click();
    const form = page.getByRole('form', { name: 'Thêm việc bảo trì' });

    await chooseOption(page, form, /Phòng/, roomCode);
    await form.getByRole('textbox', { name: /Tiêu đề/ }).fill(title);
    await form.getByRole('textbox', { name: 'Mô tả', exact: true }).fill('Thay vòi nước');
    await form
      .getByLabel('Ảnh (tối đa 5)')
      .and(page.locator('input[type="file"]'))
      .setInputFiles({ name: 'repair.png', mimeType: 'image/png', buffer: PNG });
    await form.getByRole('button', { name: 'Lưu bảo trì', exact: true }).click();
    await expect(page).toHaveURL(/\/maintenance\/[0-9a-f-]+$/);
    const detailPath = new URL(page.url()).pathname;

    await expect(page.getByRole('img', { name: 'Ảnh bảo trì' })).toBeVisible();
    await expect(
      page.getByText('Chủ trọ / Quản lý', { exact: false }).filter({ visible: true }).first(),
    ).toBeVisible();
    await page.goto(`/rooms/${room.id}`);
    await expect(page.getByTestId('room-open-maintenance')).toBeVisible();
    await page.goto(`/rooms?q=${roomCode}`);
    await expect(
      page
        .getByTestId('room-tile')
        .filter({ hasText: roomCode })
        .getByTestId('room-open-maintenance'),
    ).toBeVisible();
    await page.goto(detailPath);
    await page.getByRole('button', { name: 'Sửa việc bảo trì', exact: true }).click();
    const edit = page.getByRole('form', { name: 'Sửa việc bảo trì' });

    await edit
      .getByRole('textbox', { name: 'Mô tả', exact: true })
      .fill('Thay vòi nước và kiểm tra');
    await edit.getByRole('button', { name: 'Lưu bảo trì', exact: true }).click();
    await expect(page.getByText('Thay vòi nước và kiểm tra', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Đang làm', exact: true }).click();
    await page.getByRole('button', { name: 'Xong', exact: true }).click();
    await expect(
      page
        .getByRole('region', { name: 'Lịch sử trạng thái' })
        .getByRole('listitem')
        .filter({ hasText: 'Xong' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ghi chi phí', exact: true }).click();
    const expense = page.getByRole('form', { name: 'Ghi chi phí' });

    await expense.getByRole('spinbutton', { name: /Số tiền/ }).fill('123456');
    await chooseOption(page, expense, /Danh mục/, 'Sửa chữa');
    await pickDate(page, expense, /Ngày chi/, '2041-08-12');
    await expense.getByRole('textbox', { name: 'Ghi chú', exact: true }).fill(title);
    await expense.getByRole('button', { name: 'Ghi chi phí', exact: true }).click();
    await expect(page.getByText(/123\.456/).first()).toBeVisible();
    await page.getByRole('link', { name: 'Xem chi phí vận hành' }).click();
    await expect(page.getByTestId(/^expense-list-row-/).filter({ hasText: title })).toContainText(
      '123.456',
    );
    await page.goto(`/maintenance?q=${encodeURIComponent(title)}`);
    const row = page.getByTestId(/^maintenance-list-row-/).filter({ hasText: title });

    await expect(row).toContainText(roomCode);
    await expect(row).toContainText('Xong');
    await chooseOption(page, page, 'Xem bảo trì', 'Danh sách');
    await expect(row).toContainText('123.456');
    await chooseOption(page, page, 'Nguồn', 'Người thuê');
    await expect(row).toHaveCount(0);
    await chooseOption(page, page, 'Nguồn', 'Chủ trọ / Quản lý');
    await expect(row).toContainText(title);
    await saveScreenshot(page, `maintenance-${width}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
}

test('operations manager handles a job in building A', async ({ page }) => {
  await signIn(page);
  const buildings = await (await page.request.get('/api/buildings?pageSize=100')).json();
  const building = buildings.data.find((row: { code: string }) => row.code === 'A');
  const rooms = await (
    await page.request.get(`/api/buildings/${building.id}/rooms?pageSize=100`)
  ).json();
  const title = `Manager maintenance ${randomUUID()}`;
  const response = await page.request.post('/api/maintenance', {
    headers: { origin: new URL(page.url()).origin },
    data: { roomId: rooms.data[0].id, title, description: 'Manager A' },
  });

  expect(response.ok()).toBeTruthy();
  const job = (await response.json()).data;

  await page.context().clearCookies();
  await page.goto('/login');
  await fillLogin(page, MANAGER.email, MANAGER.password);
  await expect(page).toHaveURL('/');
  await page.evaluate((id: string) => localStorage.setItem('stay_building_id', id), building.id);
  await page.goto(`/maintenance?q=${encodeURIComponent(title)}&view=list`);
  const row = page.getByTestId(/^maintenance-list-row-/).filter({ hasText: title });

  await row.getByRole('button', { name: 'Xem bảo trì', exact: true }).click();
  await expect(page).toHaveURL(`/maintenance/${job.id}`);
  await page.getByRole('button', { name: 'Đang làm', exact: true }).click();
  await page.getByRole('button', { name: 'Huỷ', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Lịch sử trạng thái' })
      .getByRole('listitem')
      .filter({ hasText: 'Huỷ' }),
  ).toBeVisible();
});
