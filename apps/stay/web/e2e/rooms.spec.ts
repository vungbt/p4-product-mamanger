import { randomUUID } from 'node:crypto';
import { type APIRequestContext, expect, type Page, request, test } from '@playwright/test';
import { OWNER, saveScreenshot, signIn } from './helpers';

// Same origin as `use.baseURL` in playwright.config.ts (override only for local runs).
const BASE_URL = process.env.STAY_E2E_BASE_URL ?? 'http://localhost:5174';
const headers = { origin: BASE_URL };

/** A fresh building per run (archived afterwards, so other suites still see only building A). */
const code = `E${randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase()}`;
let api: APIRequestContext;
let buildingId: string;

/** `data` of a successful JSON API response. */
async function json(
  response: Awaited<ReturnType<APIRequestContext['get']>>,
): Promise<Record<string, unknown>> {
  expect(response.ok(), await response.text()).toBe(true);

  const body: unknown = await response.json();
  const data: unknown = body && typeof body === 'object' ? Reflect.get(body, 'data') : null;

  return data && typeof data === 'object' ? Object.fromEntries(Object.entries(data)) : {};
}

/** Opens `path` with the test building selected in the header. */
async function openInBuilding(page: Page, path: string) {
  // The shell may still persist its default building after sign-in; retry until ours sticks.
  await expect(async () => {
    await page.evaluate((id) => localStorage.setItem('stay_building_id', id), buildingId);
    await page.goto(path);
    await expect(page.getByTestId('active-building')).toHaveAttribute('data-building-code', code, {
      timeout: 3000,
    });
  }).toPass({ timeout: 20000 });
}

test.describe
  .serial('ST-08 rooms and the room map', () => {
    test.beforeAll(async () => {
      api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: headers });
      await json(await api.post('/api/auth/sign-in/email', { data: OWNER }));

      const building = await json(
        await api.post('/api/buildings', { data: { code, name: `Toà ${code}` } }),
      );

      buildingId = String(building.id);
    });

    test.afterAll(async () => {
      await api.post(`/api/buildings/${buildingId}/archive`);
      await api.dispose();
    });

    test('bulk-create a new building, browse the map, edit, toggle maintenance', async ({
      page,
    }) => {
      await signIn(page);
      await openInBuilding(page, '/rooms');

      // Empty building → bulk creation.
      const empty = page.getByTestId('rooms-empty');

      await expect(empty).toBeVisible();
      await empty.getByRole('button', { name: 'Tạo nhanh nhiều phòng' }).click();
      await expect(page).toHaveURL('/rooms/bulk');

      await page.getByLabel('Giá niêm yết chung').fill('3000000');
      await page.getByRole('button', { name: 'Xem trước' }).click();

      const preview = page.getByTestId('bulk-preview');

      await expect(preview.getByTestId('bulk-summary')).toHaveText(
        'Sẽ tạo 12 phòng, bỏ qua 0 mã đã có.',
      );
      await preview.getByLabel('Giá niêm yết phòng 304').fill('3500000');
      await saveScreenshot(page, 'rooms-bulk-desktop');
      await page.getByTestId('bulk-create').click();

      await expect(page).toHaveURL('/rooms');
      await expect(page.getByText('Đã tạo 12 phòng, bỏ qua 0 mã đã có.')).toBeVisible();

      // The map shows three floors of four vacant rooms.
      await expect(page.getByTestId('room-floor')).toHaveCount(3);
      await expect(page.getByTestId('room-tile')).toHaveCount(12);
      await expect(page.getByTestId('room-count-vacant')).toContainText('12');
      await expect(page.getByRole('heading', { level: 2, name: /Tầng 2/ })).toBeVisible();
      await saveScreenshot(page, 'rooms-map-desktop');

      // Filters live in the URL.
      await page.getByRole('searchbox', { name: 'Tìm phòng' }).fill('30');
      await expect(page).toHaveURL(/q=30/);
      await expect(page.getByTestId('room-tile')).toHaveCount(4);
      await page.reload();
      await expect(page.getByTestId('room-tile')).toHaveCount(4);
      await page.goto('/rooms');

      // Detail of room 304 with its own price.
      await page.getByRole('link', { name: 'Phòng 304' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Phòng 304' })).toBeVisible();
      await expect(page.getByTestId('room-info')).toContainText('3.500.000');
      await expect(page.getByTestId('meter-electricity')).toContainText('Chỉ số ban đầu 0');
      await expect(page.getByTestId('room-contract')).toContainText('Phòng chưa có hợp đồng.');
      await saveScreenshot(page, 'rooms-detail-desktop');

      // Edit while someone else saves first: 409 → reload → save again.
      const roomId = page.url().split('/').at(-1) ?? '';

      await page.getByRole('button', { name: 'Sửa phòng' }).click();
      await expect(page).toHaveURL(`/rooms/${roomId}/edit`);

      const current = await json(await api.get(`/api/rooms/${roomId}`));

      await json(
        await api.put(`/api/rooms/${roomId}`, {
          data: {
            code: current.code,
            floor: current.floor,
            listPrice: 3_550_000,
            maxOccupants: 2,
            note: 'Sửa từ máy khác',
            version: current.version,
          },
        }),
      );

      await page.getByLabel('Giá niêm yết').fill('3600000');
      await page.getByRole('button', { name: 'Lưu phòng' }).click();

      const formError = page.getByTestId('room-form-error');

      await expect(formError).toContainText('Dữ liệu đã thay đổi, tải lại?');
      await formError.getByRole('button', { name: 'Tải lại' }).click();
      await expect(page.getByLabel('Ghi chú')).toHaveValue('Sửa từ máy khác');
      await page.getByLabel('Giá niêm yết').fill('3600000');
      await page.getByRole('button', { name: 'Lưu phòng' }).click();
      await expect(page).toHaveURL(`/rooms/${roomId}`);
      await expect(page.getByTestId('room-info')).toContainText('3.600.000');

      // Maintenance on from the detail page.
      await page.getByRole('button', { name: 'Bật bảo trì' }).click();

      const dialog = page.getByTestId('maintenance-dialog');

      await dialog.getByRole('button', { name: 'Bật bảo trì' }).click();
      await expect(dialog.getByText('Vui lòng nhập lý do.')).toBeVisible();
      await dialog.getByLabel('Lý do').fill('Sơn lại tường');
      await dialog.getByRole('button', { name: 'Bật bảo trì' }).click();
      await expect(page.getByTestId('room-maintenance')).toContainText('Sơn lại tường');

      // The map shows it in orange; switch it off from the quick actions menu.
      await page.goto('/rooms');

      const tile = page.locator('[data-testid="room-tile"][data-room-code="304"]');

      await expect(tile).toHaveAttribute('data-status', 'maintenance');
      await expect(page.getByTestId('room-count-maintenance')).toContainText('1');
      await tile.getByRole('button', { name: 'Thao tác phòng 304' }).click();
      await page.getByRole('menuitem', { name: 'Tắt bảo trì' }).click();
      await page
        .getByTestId('maintenance-dialog')
        .getByRole('button', { name: 'Tắt bảo trì' })
        .click();
      await expect(tile).toHaveAttribute('data-status', 'vacant');
      await expect(page.getByTestId('room-count-vacant')).toContainText('12');
    });

    test('the map, detail and bulk form fit a 375px screen', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await signIn(page);
      await openInBuilding(page, '/rooms');

      await expect(page.getByTestId('room-tile')).toHaveCount(12);
      await expect(page.getByTestId('mobile-title')).toHaveText('Phòng');

      const overflow = () =>
        page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

      expect(await overflow()).toBeLessThanOrEqual(0);
      await saveScreenshot(page, 'rooms-map-mobile');

      await page.getByRole('link', { name: 'Phòng 101' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Phòng 101' })).toBeVisible();
      expect(await overflow()).toBeLessThanOrEqual(0);
      await saveScreenshot(page, 'rooms-detail-mobile');

      await page.goto('/rooms/bulk');
      await page.getByLabel('Giá niêm yết chung').fill('3000000');
      await page.getByRole('button', { name: 'Xem trước' }).click();
      // Every code exists now: nothing to create.
      await expect(page.getByTestId('bulk-summary')).toHaveText(
        'Sẽ tạo 0 phòng, bỏ qua 12 mã đã có.',
      );
      expect(await overflow()).toBeLessThanOrEqual(0);
      await saveScreenshot(page, 'rooms-bulk-mobile');
    });
  });
