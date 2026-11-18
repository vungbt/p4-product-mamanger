import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

for (const width of [1280, 375]) {
  test(`ST-26 settings and notifications at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const headers = { origin: new URL(page.url()).origin };
    const response = await page.request.get('/api/buildings');

    expect(response.ok()).toBe(true);
    const building = (await response.json()).data.find((row: { code: string }) => row.code === 'A');

    expect(building).toBeTruthy();
    const path = `/api/buildings/${building.id}/automation`;
    const originalResponse = await page.request.get(path);

    expect(originalResponse.ok()).toBe(true);
    const original = (await originalResponse.json()).data;

    try {
      await page.goto(`/buildings/${building.id}/edit`);
      const form = page.getByTestId('automation-settings');
      const reading = form.getByRole('switch', { name: 'Nhắc chủ trọ ngày chốt số' });
      const disabled = form.getByRole('switch', { name: 'Tắt toàn bộ nhắc người thuê' });

      await expect(reading).toHaveAttribute('aria-checked', String(original.readingReminder));
      await reading.click();
      await disabled.click();
      await form.getByRole('button', { name: 'Lưu tự động hoá' }).click();
      await expect(page.getByText('Đã lưu tự động hoá', { exact: true })).toBeVisible();
      await page.reload();
      await expect(reading).toHaveAttribute('aria-checked', String(!original.readingReminder));
      await expect(disabled).toHaveAttribute(
        'aria-checked',
        String(!original.tenantRemindersDisabled),
      );
      const bell = page.getByRole('button', { name: /^Thông báo \(/ });

      await bell.click();
      await expect(page.getByTestId('notifications-dropdown')).toBeVisible();
      await expect(page.getByRole('heading', { name: /^Thông báo ·/ })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('notifications-dropdown')).toBeHidden();
    } finally {
      const currentResponse = await page.request.get(path);

      expect(currentResponse.ok()).toBe(true);
      const current = (await currentResponse.json()).data;
      const restore = await page.request.put(path, {
        headers,
        data: { ...original, version: current.version },
      });

      expect(restore.ok(), await restore.text()).toBe(true);
    }
  });
}
