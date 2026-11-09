import { expect, test } from '@playwright/test';
import { fillLogin, MANAGER, saveScreenshot } from './helpers';

test.describe('building manager (conditional rules)', () => {
  test('sees building-scoped areas but not owner settings', async ({ page }) => {
    await page.goto('/login');
    await fillLogin(page, MANAGER.email, MANAGER.password);

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('signed-in-user')).toContainText('Người quản lý');
    await expect(page.getByTestId('active-building')).toHaveAttribute('data-building-code', 'A');

    const sidebar = page.getByTestId('app-sidebar');

    for (const label of [
      'Tổng quan',
      'Phòng',
      'Chốt số',
      'Hoá đơn',
      'Công nợ',
      'Hợp đồng',
      'Người thuê',
      'Yêu cầu',
      'Báo cáo',
    ]) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    for (const label of ['Cài đặt', 'Thành viên', 'Chi phí']) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toHaveCount(0);
    }
    await saveScreenshot(page, 'shell-manager');

    await sidebar.getByRole('link', { name: 'Phòng', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Phòng' })).toBeVisible();

    await page.goto('/settings');
    await expect(page.getByTestId('forbidden-page')).toBeVisible();
    await page.goto('/settings/members');
    await expect(page.getByTestId('forbidden-page')).toBeVisible();
  });
});
