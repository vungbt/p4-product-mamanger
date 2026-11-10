import { randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { chooseOption, saveScreenshot, signIn } from './helpers';

type Grid = {
  rooms: {
    roomId: string;
    code: string;
    meters: {
      meterId: string;
      kind: string;
      consumption: number | null;
      current: { reading: number } | null;
    }[];
  }[];
};

async function fixtures(page: Page) {
  const headers = { origin: new URL(page.url()).origin };
  const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();
  const post = async (path: string, data: object) => {
    const response = await page.request.post(`/api${path}`, { headers, data });
    expect(response.ok(), await response.text()).toBe(true);
    return (await response.json()).data;
  };
  const building = await post('/buildings', { code: `R${suffix}`, name: `ST13 ${suffix}` });
  const tenant = await post('/tenants', {
    buildingId: building.id,
    fullName: 'Khách chốt số',
    phone: '0901234567',
  });
  for (let index = 1; index <= 3; index++) {
    const room = await post(`/buildings/${building.id}/rooms`, {
      code: `${index}01`,
      floor: index,
      listPrice: 3000000,
      maxOccupants: 2,
      initialElectric: 0,
      initialWater: 0,
    });
    const contract = await post('/contracts', {
      roomId: room.id,
      startDate: '2044-01-01',
      endDate: '2045-01-01',
      rent: 3000000,
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
    // Each tenant can only live in one active contract; use a fresh tenant next iteration.
    await post(`/contracts/${contract.id}/activate`, {});
    if (index < 3) {
      const nextTenant = await post('/tenants', {
        buildingId: building.id,
        fullName: `Khách chốt số ${index}`,
        phone: `090123456${index}`,
      });
      tenant.id = nextTenant.id;
    }
  }
  const response = await page.request.get(`/api/buildings/${building.id}/readings?period=2044-04`);
  const grid: Grid = (await response.json()).data;
  for (const [period, reading] of [
    ['2044-01', 10],
    ['2044-02', 20],
    ['2044-03', 30],
  ] as const) {
    const saved = await page.request.put(`/api/buildings/${building.id}/readings`, {
      headers,
      data: {
        rows: grid.rooms.flatMap((room) =>
          room.meters.map((meter) => ({
            meterId: meter.meterId,
            period,
            reading,
            readOn: `${period}-28`,
            version: 0,
          })),
        ),
      },
    });
    expect(saved.ok(), await saved.text()).toBe(true);
    expect((await saved.json()).data.results.every((row: { error: unknown }) => !row.error)).toBe(
      true,
    );
  }
  await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
  await page.goto('/readings?period=2044-04');
  return { building, headers };
}

for (const width of [1280, 375]) {
  test(`ST-13 real API closing, validation, replacement and offline sync at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const { building } = await fixtures(page);
    const cards = page.getByTestId('reading-room');
    await expect(cards).toHaveCount(3);
    for (let index = 0; index < 2; index++) {
      const card = cards.nth(index);
      await card.getByRole('spinbutton', { name: /Điện số mới/ }).fill('40');
      await card.getByRole('spinbutton', { name: /Điện số mới/ }).press('Enter');
      await expect(card.getByRole('spinbutton', { name: /Nước số mới/ })).toBeFocused();
      await card.getByRole('spinbutton', { name: /Nước số mới/ }).fill('40');
      await expect(card.getByRole('status')).toHaveText('Đã lưu');
    }
    const first = cards.first();
    await first.getByRole('spinbutton', { name: /Điện số mới/ }).fill('29');
    await expect(first.getByText('Số mới phải lớn hơn hoặc bằng số cũ.')).toBeVisible();
    await first.getByRole('spinbutton', { name: /Điện số mới/ }).fill('100');
    await first.getByRole('checkbox', { name: /Xác nhận chỉ số điện/ }).check();
    await expect(first.getByRole('status')).toHaveText('Đã lưu');

    const third = cards.nth(2);
    await third.getByRole('button', { name: 'Thay đồng hồ điện', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Thay đồng hồ', exact: true });
    await dialog.getByRole('spinbutton', { name: /Số cuối đồng hồ cũ/ }).fill('35');
    await dialog.getByRole('spinbutton', { name: /Số đầu đồng hồ mới/ }).fill('5');
    await dialog.getByLabel(/Ngày thay/).fill('2044-04-15');
    await dialog.getByRole('textbox', { name: /Seri mới/ }).fill('ST13-NEW');
    await dialog.getByRole('button', { name: 'Thay đồng hồ', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await third.getByRole('spinbutton', { name: /Điện số mới/ }).fill('15');
    await third.getByRole('spinbutton', { name: /Nước số mới/ }).fill('40');
    await expect(third.getByRole('status')).toHaveText('Đã lưu');
    await expect(third.getByText(/Tiêu thụ: 15 kWh/)).toBeVisible();
    await expect(page.getByText(/đã nhập 3\/3 phòng/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Lập hoá đơn kỳ/ })).toBeDisabled();

    await page.context().setOffline(true);
    await first.getByRole('spinbutton', { name: /Nước số mới/ }).fill('45');
    await expect(first.getByRole('status')).toHaveText('Chưa đồng bộ');
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).some((key) => key.startsWith('stay:readings:')),
      ),
    ).toBe(true);
    await page.context().setOffline(false);
    await expect(first.getByRole('status')).toHaveText('Đã lưu');
    const response = await page.request.get(
      `/api/buildings/${building.id}/readings?period=2044-04`,
    );
    const grid: Grid = (await response.json()).data;
    expect(grid.rooms[0]?.meters.find((m) => m.kind === 'water')?.current?.reading).toBe(45);
    await chooseOption(page, page, 'Lọc tầng', 'Tầng 2');
    await expect(page.getByRole('article', { name: 'Phòng 101' })).not.toBeVisible();
    await expect(page.getByRole('article', { name: 'Phòng 201' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await saveScreenshot(page, `readings-${width}`);
  });
}
