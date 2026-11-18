import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

for (const width of [1280, 375]) {
  test(`ST-28 marks registration and downloads Excel at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const headers = { origin: new URL(page.url()).origin };
    const buildings = await page.request.get('/api/buildings');

    expect(buildings.ok()).toBe(true);
    const building = (await buildings.json()).data.find(
      (item: { code: string }) => item.code === 'A',
    );
    const suffix = randomUUID().replaceAll('-', '').slice(0, 7).toUpperCase();
    const name = `Tạm trú ${suffix}`;
    const roomResponse = await page.request.post(`/api/buildings/${building.id}/rooms`, {
      headers,
      data: {
        code: `TR${suffix}`,
        floor: 1,
        listPrice: 3000000,
        maxOccupants: 2,
        initialElectric: 0,
        initialWater: 0,
      },
    });

    expect(roomResponse.ok(), await roomResponse.text()).toBe(true);
    const room = (await roomResponse.json()).data;
    const tenantResponse = await page.request.post('/api/tenants', {
      headers,
      data: { buildingId: building.id, fullName: name, phone: '0901234567' },
    });

    expect(tenantResponse.ok(), await tenantResponse.text()).toBe(true);
    const tenant = (await tenantResponse.json()).data;
    const draftResponse = await page.request.post('/api/contracts', {
      headers,
      data: {
        roomId: room.id,
        startDate: '2020-01-01',
        endDate: '2098-12-31',
        rent: 3000000,
        initialElectric: 0,
        initialWater: 0,
        occupantIds: [tenant.id],
        primaryTenantId: tenant.id,
      },
    });

    expect(draftResponse.ok(), await draftResponse.text()).toBe(true);
    const draft = (await draftResponse.json()).data;
    const activation = await page.request.post(`/api/contracts/${draft.id}/activate`, { headers });

    expect(activation.ok(), await activation.text()).toBe(true);
    await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
    await page.goto('/residents');
    await expect(page.getByRole('heading', { name: 'Tạm trú', exact: true })).toBeVisible();
    const screen = page.getByTestId('residents-page');

    await screen.getByRole('searchbox', { name: 'Tìm người tạm trú' }).fill(name);
    await expect(
      screen.getByRole('link', { name, exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(
      new RegExp(`q=${encodeURIComponent(name).replaceAll('%20', '\\+')}`),
    );
    await screen.getByRole('switch', { name: 'Chỉ người chưa khai báo' }).click();
    await expect(page).toHaveURL(/status=unregistered/);
    await expect(screen.getByTestId('resident-unregistered').filter({ visible: true })).toHaveText(
      'Mới · Chưa khai báo',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await screen
      .getByRole('button', { name: 'Đánh dấu đã khai báo', exact: true })
      .filter({ visible: true })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Đánh dấu đã khai báo', exact: true });

    await expect(dialog).toBeVisible();
    await dialog
      .getByRole('textbox', { name: 'Ghi chú', exact: true })
      .fill('Đã khai báo thử nghiệm');
    await dialog.getByRole('button', { name: 'Lưu khai báo', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(screen.getByTestId('resident-unregistered')).toHaveCount(0);
    await expect(screen.getByText('Không có người tạm trú phù hợp')).toBeVisible();
    // Wait for the dialog to close before interacting with filters behind it.
    await screen.getByRole('switch', { name: 'Chỉ người chưa khai báo' }).click();
    await expect(
      screen.getByRole('link', { name, exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await expect(screen.getByText(/^Đã khai báo ·/).filter({ visible: true })).toBeVisible();
    await expect(screen.getByTestId('resident-unregistered')).toHaveCount(0);
    await page.reload();
    await expect(screen.getByRole('searchbox', { name: 'Tìm người tạm trú' })).toHaveValue(name);
    const downloadEvent = page.waitForEvent('download');

    await screen.getByRole('button', { name: 'Xuất Excel', exact: true }).click();
    const download = await downloadEvent;

    expect(download.suggestedFilename()).toMatch(/^tam-tru-\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(await download.failure()).toBeNull();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
