import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { chooseOption, saveScreenshot, signIn } from './helpers';

for (const width of [1280, 375]) {
  test(`ST-11 add, partial refund, forfeit, balance and totals at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const headers = { origin: new URL(page.url()).origin };
    const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();
    const buildingResponse = await page.request.post('/api/buildings', {
      headers,
      data: { code: `D${suffix}`, name: `Deposit E2E ${suffix}` },
    });
    expect(buildingResponse.ok(), await buildingResponse.text()).toBe(true);
    const building = (await buildingResponse.json()).data;
    const roomResponse = await page.request.post(`/api/buildings/${building.id}/rooms`, {
      headers,
      data: {
        code: 'D101',
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
      data: { buildingId: building.id, fullName: `Khách cọc ${suffix}`, phone: '0901234567' },
    });
    expect(tenantResponse.ok(), await tenantResponse.text()).toBe(true);
    const tenant = (await tenantResponse.json()).data;
    const draftResponse = await page.request.post('/api/contracts', {
      headers,
      data: {
        roomId: room.id,
        startDate: '2026-11-20',
        endDate: null,
        rent: 3000000,
        depositAmount: 1000000,
        depositCollected: true,
        depositMethod: 'cash',
        depositDate: '2026-11-20',
        initialElectric: 0,
        initialWater: 0,
        occupantIds: [tenant.id],
        primaryTenantId: tenant.id,
        serviceIds: [],
        vehicleIds: [],
      },
    });
    expect(draftResponse.ok(), await draftResponse.text()).toBe(true);
    const contract = (await draftResponse.json()).data;
    const activation = await page.request.post(`/api/contracts/${contract.id}/activate`, {
      headers,
    });
    expect(activation.ok(), await activation.text()).toBe(true);
    await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
    await page.goto('/deposits');
    const row = page.getByTestId('deposit-row').filter({ hasText: contract.code });
    const total = page.getByTestId('deposit-total');
    await expect(total).toContainText('1.000.000');
    await expect(row.getByTestId('deposit-held')).toContainText('1.000.000');

    await row.getByRole('button', { name: 'Thu thêm cọc', exact: true }).click();
    let dialog = page.getByRole('dialog', { name: 'Bút toán cọc' });
    await dialog.getByRole('spinbutton', { name: /Số tiền/ }).fill('500000');
    await chooseOption(page, dialog, 'Phương thức', 'Tiền mặt');
    await dialog.getByRole('button', { name: 'Ghi bút toán', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(total).toContainText('1.500.000');
    await expect(row.getByTestId('deposit-held')).toContainText('1.500.000');

    await row.getByRole('link', { name: contract.code }).click();
    await expect(page.getByRole('tab', { name: 'Cọc', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('button', { name: 'Hoàn cọc', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Bút toán cọc' });
    await dialog.getByRole('spinbutton', { name: /Số tiền/ }).fill('200000');
    await dialog.getByRole('button', { name: 'Ghi bút toán', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Cọc đang giữ/ })).toContainText('1.300.000');

    await page.getByRole('button', { name: 'Mất cọc', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Bút toán cọc' });
    await dialog.getByRole('spinbutton', { name: /Số tiền/ }).fill('100000');
    await dialog.getByRole('button', { name: 'Ghi bút toán', exact: true }).click();
    await expect(dialog).toContainText('Nhập lý do mất cọc.');
    await dialog.getByRole('textbox', { name: /Lý do/ }).fill('Bồi thường cửa hỏng');
    await dialog.getByRole('button', { name: 'Ghi bút toán', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('table', { name: 'Lịch sử bút toán cọc' })).toContainText(
      'Bồi thường cửa hỏng',
    );
    await expect(page.getByRole('heading', { name: /Cọc đang giữ/ })).toContainText('1.200.000');

    await page.getByRole('button', { name: 'Hoàn cọc', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Bút toán cọc' });
    await dialog.getByRole('spinbutton', { name: /Số tiền/ }).fill('1200001');
    const denied = page.waitForResponse(
      (response) =>
        response.url().includes(`/contracts/${contract.id}/deposits`) &&
        response.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Ghi bút toán', exact: true }).click();
    expect((await denied).status()).toBe(422);
    await expect(dialog).toContainText('Số dư cọc không đủ');
    await dialog.getByRole('button', { name: 'Huỷ', exact: true }).click();
    await page.goto('/deposits');
    await expect(total).toContainText('1.200.000');
    await expect(row.getByTestId('deposit-held')).toContainText('1.200.000');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await saveScreenshot(page, `st-11-deposits-${width}`);
    await page.reload();
    await expect(total).toContainText('1.200.000');
  });
}
