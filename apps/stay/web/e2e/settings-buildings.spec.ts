import { expect, test } from '@playwright/test';
import { chooseOption, saveScreenshot, signIn, todayDisplay } from './helpers';

/** A fresh code per run keeps reruns on a local database working (codes stay unique). */
const CODE_B = `B${Date.now().toString(36).slice(-4).toUpperCase()}`;
const NAME_B = 'Toà B';

test.describe('ST-06/ST-07 owner settings and buildings (desktop)', () => {
  test('services, billing cycle, building B, prices and archive', async ({ page }) => {
    await signIn(page);

    await test.step('Tổng quan "Cấu hình đơn giá" opens O-02', async () => {
      await page.getByTestId('onboarding-step-prices').click();
      await expect(page).toHaveURL('/settings/services');
      await expect(
        page.getByRole('heading', { level: 1, name: 'Dịch vụ & đơn giá' }),
      ).toBeVisible();
    });

    await test.step('O-02: edit a service price inline', async () => {
      const row = page.getByTestId('service-row-internet');

      await expect(row).toBeVisible();
      await saveScreenshot(page, 'o02-services-desktop');
      await row.getByRole('button', { name: 'Sửa Internet' }).click();

      const form = page.getByTestId('service-edit-form');

      await form.getByLabel('Đơn giá mặc định').fill('110000');
      await expect(page.getByTestId('price-change-warning')).toContainText(
        'hoá đơn đã phát hành không đổi',
      );
      await saveScreenshot(page, 'o02-service-edit-desktop');
      await form.getByRole('button', { name: 'Lưu thay đổi' }).click();
      await expect(page.getByText('Đã lưu Internet.')).toBeVisible();
      await expect(form).toBeHidden();
      await expect(row.getByTestId('service-price')).toHaveText(/^110\.000\s₫$/);
    });

    await test.step('O-02: only one active electricity service', async () => {
      await page.getByRole('button', { name: 'Thêm dịch vụ' }).first().click();

      const form = page.getByTestId('service-create-form');

      await form.getByLabel('Tên dịch vụ').fill('Điện phụ');
      await chooseOption(page, form, 'Cách tính', 'Điện theo kWh');
      await expect(form.getByLabel('Đơn vị')).toHaveValue('kWh');
      await form.getByLabel('Đơn giá mặc định').fill('4000');
      await form.getByRole('button', { name: 'Thêm dịch vụ' }).click();
      await expect(form.getByRole('alert').filter({ hasText: 'đang bật' })).toBeVisible();
      await saveScreenshot(page, 'o02-service-electricity-error-desktop');
      await form.getByRole('button', { name: 'Huỷ' }).click();
      await expect(form).toBeHidden();
      await expect(page.getByText('Điện phụ')).toHaveCount(0);
    });

    await test.step('O-03: update the billing cycle', async () => {
      await page.goto('/settings');
      await saveScreenshot(page, 'settings-hub-desktop');
      await page.getByTestId('settings-link-billing').click();
      await expect(page).toHaveURL('/settings/billing');

      await chooseOption(page, page, 'Hạn thanh toán', 'Ngày 10');
      await expect(page.getByTestId('billing-preview')).toContainText(/hạn 10\/\d{2}/);
      await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
      await expect(page.getByText('Đã lưu kỳ thu.')).toBeVisible();
      await saveScreenshot(page, 'o03-billing-desktop');

      await page.reload();
      await expect(page.getByTestId('billing-form')).toContainText('Ngày 10');
      await expect(page.getByTestId('billing-preview')).toContainText(/hạn 10\/\d{2}/);
    });

    await test.step('O-04 with one building goes straight to its form (O-05)', async () => {
      await page.goto('/settings');
      await page.getByTestId('settings-link-buildings').click();
      await expect(page).toHaveURL(/\/buildings\/[0-9a-f-]+\/edit$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Sửa Toà A' })).toBeVisible();
      await expect(page.getByTestId('vietqr-code')).toBeVisible();
      await saveScreenshot(page, 'o05-building-edit-desktop');
    });

    await test.step('O-05: unsaved changes ask before leaving', async () => {
      await page.getByRole('button', { name: 'Thêm toà' }).click();
      await expect(page).toHaveURL('/buildings/new');
      await page.getByLabel('Tên toà').fill(NAME_B);
      await page.getByTestId('app-sidebar').getByRole('link', { name: 'Tổng quan' }).click();

      const prompt = page.getByTestId('unsaved-changes-dialog');

      await expect(prompt).toBeVisible();
      await prompt.getByRole('button', { name: 'Ở lại' }).click();
      await expect(page).toHaveURL('/buildings/new');
      await expect(page.getByLabel('Tên toà')).toHaveValue(NAME_B);
    });

    let buildingBPath = '';

    await test.step('O-05: create building B with bank info and a VietQR preview', async () => {
      await page.getByLabel('Mã toà').fill(CODE_B.toLowerCase());
      await expect(page.getByLabel('Mã toà')).toHaveValue(CODE_B);
      await page.getByLabel('Địa chỉ').fill('34 Đường Số 2, TP. Thủ Đức');
      await page.getByRole('combobox', { name: 'Ngân hàng' }).fill('vietin');
      await page.getByRole('option', { name: /^VietinBank \(ICB\)/ }).click();
      await page.getByLabel('Số tài khoản').fill('113366668888');
      await page.getByLabel('Tên chủ tài khoản').fill('Trần Thị Bình');
      await expect(page.getByLabel('Tên chủ tài khoản')).toHaveValue('TRAN THI BINH');
      await expect(page.getByTestId('vietqr-code')).toBeVisible();
      await expect(page.getByTestId('vietqr-preview')).toContainText('10.000');
      await page.getByLabel('Số điện thoại liên hệ').fill('0912 345 678');
      await saveScreenshot(page, 'o05-building-new-desktop');

      await page.getByRole('button', { name: 'Tạo toà' }).click();
      await expect(page).toHaveURL('/buildings');
      await expect(page.getByText(`Đã tạo ${NAME_B}.`)).toBeVisible();
      await expect(page.getByTestId(`building-card-${CODE_B}`)).toBeVisible();
      await saveScreenshot(page, 'o04-buildings-desktop');
    });

    await test.step('two buildings: the header selector appears and switches', async () => {
      const selector = page.getByTestId('building-selector');

      await expect(selector).toBeVisible();
      await expect(page.getByTestId('active-building')).toHaveCount(0);
      await chooseOption(page, page, 'Toà nhà', NAME_B);
      await expect(selector).toContainText(NAME_B);
      await page.reload();
      await expect(page.getByTestId('building-selector')).toContainText(NAME_B);
    });

    await test.step('O-06: set a building price from a date and see it in history', async () => {
      await page
        .getByTestId(`building-card-${CODE_B}`)
        .getByRole('button', { name: `Đơn giá của ${NAME_B}` })
        .click();
      await expect(page).toHaveURL(/\/buildings\/[0-9a-f-]+\/prices$/);
      buildingBPath = new URL(page.url()).pathname;

      const row = page.getByTestId('price-row-internet');

      await expect(row.getByTestId('building-price')).toContainText('Mặc định');
      await row.getByRole('button', { name: 'Đặt giá riêng cho Internet' }).click();

      const dialog = page.getByTestId('price-form');

      await dialog.getByLabel('Giá của toà').fill('150000');
      await saveScreenshot(page, 'o06-price-dialog-desktop');
      await dialog.getByRole('button', { name: 'Đặt giá' }).click();
      await expect(page.getByText(/Đã đặt giá riêng cho Internet từ/)).toBeVisible();
      await expect(row.getByTestId('building-price')).toContainText(/150\.000\s₫/);
      await expect(row.getByTestId('building-price')).toContainText('Giá riêng');

      await row.getByRole('button', { name: 'Lịch sử giá Internet' }).click();

      const entry = row.getByTestId('price-history-entry').first();

      await expect(entry).toContainText(`Từ ${todayDisplay()}`);
      await expect(entry).toContainText(/150\.000\s₫/);
      await expect(entry).toContainText('Đang áp dụng');
      await saveScreenshot(page, 'o06-prices-desktop');
    });

    await test.step('O-04: archive building B', async () => {
      await page.goto('/buildings');
      await page
        .getByTestId(`building-card-${CODE_B}`)
        .getByRole('button', { name: `Lưu trữ ${NAME_B}` })
        .click();

      const dialog = page.getByTestId('archive-building-dialog');

      await expect(dialog).toContainText(`Lưu trữ ${NAME_B}?`);
      await saveScreenshot(page, 'o04-archive-dialog-desktop');
      await dialog.getByRole('button', { name: 'Lưu trữ' }).click();
      await expect(page.getByText(`Đã lưu trữ ${NAME_B}.`)).toBeVisible();

      // Back to a single building: no selector, building A is active again.
      await expect(page.getByTestId('building-selector')).toHaveCount(0);
      await expect(page.getByTestId('active-building')).toHaveAttribute('data-building-code', 'A');

      await page.goto('/buildings?status=archived');
      await expect(page.getByTestId(`building-card-${CODE_B}`)).toContainText('Đã lưu trữ');
      await page.goto(buildingBPath);
      await expect(page.getByText('Toà đã được lưu trữ nên không đổi được đơn giá.')).toBeVisible();
    });
  });
});

test.describe('ST-06/ST-07 screens on mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('every settings and building screen fits 375px', async ({ page }) => {
    await signIn(page);

    const noHorizontalScroll = () =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

    await page.goto('/settings');
    await expect(page.getByTestId('settings-link-services')).toBeVisible();
    await saveScreenshot(page, 'settings-hub-mobile');

    await page.goto('/settings/services');
    await expect(page.getByTestId('service-row-electricity')).toBeVisible();
    expect(await noHorizontalScroll()).toBe(true);
    await saveScreenshot(page, 'o02-services-mobile');
    await page.getByRole('button', { name: 'Sửa Điện' }).click();

    const sheet = page.getByTestId('service-edit-sheet');

    await expect(sheet.getByTestId('service-edit-form')).toBeVisible();
    await saveScreenshot(page, 'o02-service-edit-mobile');
    await sheet.getByRole('button', { name: 'Huỷ' }).click();
    await expect(sheet).toBeHidden();

    await page.goto('/settings/billing');
    await expect(page.getByTestId('billing-preview')).toBeVisible();
    expect(await noHorizontalScroll()).toBe(true);
    await saveScreenshot(page, 'o03-billing-mobile');

    await page.goto('/buildings?status=archived');
    await expect(page.getByTestId('building-list')).toBeVisible();
    expect(await noHorizontalScroll()).toBe(true);
    await saveScreenshot(page, 'o04-buildings-mobile');

    await page.goto('/buildings');
    await expect(page.getByRole('heading', { level: 1, name: 'Sửa Toà A' })).toBeVisible();
    await expect(page.getByTestId('vietqr-code')).toBeVisible();
    expect(await noHorizontalScroll()).toBe(true);
    await saveScreenshot(page, 'o05-building-edit-mobile');

    await page.getByRole('button', { name: 'Đơn giá của toà' }).click();
    await expect(page.getByTestId('price-row-internet')).toBeVisible();
    expect(await noHorizontalScroll()).toBe(true);
    await saveScreenshot(page, 'o06-prices-mobile');

    await page.goto('/buildings/new');
    await expect(page.getByLabel('Mã toà')).toBeVisible();
    expect(await noHorizontalScroll()).toBe(true);
    await saveScreenshot(page, 'o05-building-new-mobile');
  });
});
