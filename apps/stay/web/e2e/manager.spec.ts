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
      'Sổ thu',
      'Hợp đồng',
      'Người thuê',
      'Tạm trú',
      'Yêu cầu',
      'Báo cáo',
    ]) {
      // "Yêu cầu" may carry the badge of new tenant requests (ST-25).
      await expect(
        sidebar.getByRole(
          'link',
          label === 'Yêu cầu' ? { name: /^Yêu cầu/ } : { name: label, exact: true },
        ),
      ).toBeVisible();
    }
    for (const label of ['Cài đặt', 'Thành viên', 'Chi phí']) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toHaveCount(0);
    }
    await saveScreenshot(page, 'shell-manager');

    await sidebar.getByRole('link', { name: 'Phòng', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Phòng' })).toBeVisible();

    // ST-06: the "Cấu hình đơn giá" onboarding step needs `manage Settings`.
    await sidebar.getByRole('link', { name: 'Tổng quan', exact: true }).click();
    await expect(page.getByTestId('onboarding-step-rooms')).toBeVisible();
    await expect(page.getByTestId('onboarding-step-prices')).toHaveCount(0);

    await page.goto('/settings');
    await expect(page.getByTestId('forbidden-page')).toBeVisible();
    await page.goto('/settings/services');
    await expect(page.getByTestId('forbidden-page')).toBeVisible();
    await page.goto('/settings/billing');
    await expect(page.getByTestId('forbidden-page')).toBeVisible();
    await saveScreenshot(page, 'o02-services-manager-403');
    await page.goto('/settings/members');
    await expect(page.getByTestId('forbidden-page')).toBeVisible();
  });
});
