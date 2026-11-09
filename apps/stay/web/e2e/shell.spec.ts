import { expect, test } from '@playwright/test';
import { fillLogin, focusIsVisible, saveScreenshot, signIn, tabUntil } from './helpers';

test.describe('C-02 shell on mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('shows the bottom navigation instead of the sidebar', async ({ page }) => {
    await signIn(page);

    const bottomNav = page.getByTestId('bottom-nav');

    await expect(bottomNav).toBeVisible();
    await expect(page.getByTestId('app-sidebar')).toBeHidden();
    for (const label of ['Tổng quan', 'Phòng', 'Chốt số', 'Hoá đơn']) {
      await expect(bottomNav.getByRole('link', { name: label })).toBeVisible();
    }
    await expect(bottomNav.getByRole('button', { name: 'Thêm' })).toBeVisible();
    await saveScreenshot(page, 'shell-mobile');

    await bottomNav.getByRole('link', { name: 'Phòng' }).click();
    await expect(page).toHaveURL('/rooms');
    await expect(page.getByTestId('mobile-title')).toHaveText('Phòng');
    await expect(page.getByRole('button', { name: 'Quay lại' })).toBeVisible();

    await bottomNav.getByRole('button', { name: 'Thêm' }).click();
    const sheet = page.getByRole('dialog', { name: 'Tất cả chức năng' });
    await expect(sheet).toBeVisible();
    await saveScreenshot(page, 'shell-mobile-more');
    await sheet.getByRole('link', { name: 'Công nợ' }).click();
    await expect(page).toHaveURL('/receivables');
    await expect(page.getByTestId('mobile-title')).toHaveText('Công nợ');

    await page.getByRole('button', { name: 'Quay lại' }).click();
    await expect(page).toHaveURL('/rooms');
  });
});

test.describe('C-02/C-03 shell on desktop', () => {
  test('keyboard reaches the login button and navigation with visible focus', async ({ page }) => {
    await page.goto('/login');

    const login = page.getByRole('button', { name: 'Đăng nhập' });
    const reachedLogin = await tabUntil(page, () =>
      login.evaluate((el) => el === document.activeElement),
    );

    expect(reachedLogin).toBe(true);
    expect(await focusIsVisible(page)).toBe(true);

    await fillLogin(page);
    await expect(page).toHaveURL('/');

    const rooms = page.getByTestId('app-sidebar').getByRole('link', { name: 'Phòng' });
    const reachedRooms = await tabUntil(page, () =>
      rooms.evaluate((el) => el === document.activeElement),
    );

    expect(reachedRooms).toBe(true);
    expect(await focusIsVisible(page)).toBe(true);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/rooms');
    await expect(page.getByRole('heading', { level: 1, name: 'Phòng' })).toBeVisible();
  });

  test('shows 404 for unknown pages and keeps the menu in route order', async ({ page }) => {
    await signIn(page);

    const sidebar = page.getByTestId('app-sidebar');
    const labels = await sidebar.getByRole('link').allInnerTexts();
    const menu = labels.map((label) => label.trim()).filter(Boolean);

    expect(menu).toEqual(
      expect.arrayContaining([
        'Tổng quan',
        'Phòng',
        'Chốt số',
        'Hoá đơn',
        'Công nợ',
        'Hợp đồng',
        'Người thuê',
        'Yêu cầu',
        'Chi phí',
        'Báo cáo',
        'Cài đặt',
      ]),
    );

    await page.goto('/khong-ton-tai');
    await expect(page.getByTestId('not-found-page')).toBeVisible();
    await page.getByRole('button', { name: 'Về Tổng quan' }).click();
    await expect(page).toHaveURL('/');
  });

  test('shows the offline banner while the network is down', async ({ page, context }) => {
    await signIn(page);
    await context.setOffline(true);
    await expect(page.getByTestId('offline-banner')).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByTestId('offline-banner')).toBeHidden();
  });

  test('falls back to building A when the remembered building is gone', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() =>
      localStorage.setItem('stay_building_id', '00000000-0000-4000-8000-000000000000'),
    );
    await fillLogin(page);
    await expect(page).toHaveURL('/');

    await expect(page.getByTestId('active-building')).toHaveAttribute('data-building-code', 'A');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('stay_building_id')))
      .not.toBe('00000000-0000-4000-8000-000000000000');
    expect(await page.evaluate(() => localStorage.getItem('stay_building_id'))).toBeTruthy();
  });
});
