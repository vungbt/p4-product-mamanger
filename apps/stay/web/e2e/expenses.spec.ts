import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { chooseOption, fillLogin, MANAGER, pickDate, saveScreenshot, signIn } from './helpers';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

for (const width of [1280, 375]) {
  test(`O-27 receipt, totals, edit and delete at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const note = `Chi phí E2E ${randomUUID()}`;

    await page.goto(`/expenses?period=2041-08&q=${encodeURIComponent(note)}`);
    await expect(page.getByRole('heading', { name: 'Chi phí vận hành' })).toBeVisible();
    await page.getByRole('button', { name: 'Thêm chi phí', exact: true }).click();
    const form = page.getByRole('form', { name: 'Thêm chi phí' });

    await form.getByRole('spinbutton', { name: /Số tiền/ }).fill('123456');
    await chooseOption(page, form, 'Danh mục', 'Sửa chữa');
    await pickDate(page, form, /Ngày chi/, '2041-08-12');
    await chooseOption(page, form, 'Phòng', 'Cả toà');
    await form.getByRole('textbox', { name: 'Ghi chú', exact: true }).fill(note);
    await form
      .getByLabel('Ảnh hoá đơn', { exact: true })
      .setInputFiles({ name: 'receipt.png', mimeType: 'image/png', buffer: PNG });
    await form.getByRole('button', { name: 'Lưu chi phí' }).click();

    const row = page.getByTestId(/^expense-list-row-/).filter({ hasText: note });
    const totals = page.getByTestId('expense-totals');

    await expect(row).toContainText('123.456');
    await expect(totals).toContainText('123.456');
    await expect(row.getByRole('link', { name: 'Ảnh hoá đơn', exact: true })).toHaveAttribute(
      'href',
      /signature=/,
    );
    const receiptUrl = await row
      .getByRole('link', { name: 'Ảnh hoá đơn', exact: true })
      .getAttribute('href');

    expect(receiptUrl).toBeTruthy();
    const receipt = await page.request.get(receiptUrl ?? '');

    expect(receipt.ok()).toBeTruthy();
    const unsigned = new URL(receiptUrl ?? '', page.url());

    unsigned.search = '';
    expect((await page.request.get(unsigned.toString())).status()).toBe(403);
    await saveScreenshot(page, `expenses-${width}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);

    await row.getByRole('button', { name: 'Sửa chi phí', exact: true }).click();
    const edit = page.getByRole('form', { name: 'Sửa chi phí' });

    await edit.getByRole('spinbutton', { name: /Số tiền/ }).fill('234567');
    await edit.getByRole('button', { name: 'Lưu chi phí' }).click();
    await expect(row).toContainText('234.567');
    await expect(totals).toContainText('234.567');
    await expect(totals).not.toContainText('123.456');
    await row.getByRole('button', { name: 'Xoá chi phí', exact: true }).click();
    const dialog = page.getByRole('alertdialog');

    await expect(dialog).toContainText('234.567');
    await dialog.getByRole('button', { name: 'Xoá', exact: true }).click();
    await expect(row).toHaveCount(0);
    await expect(totals).not.toContainText('234.567');
    await expect(page.getByText('Chưa có chi phí trong kỳ này.')).toBeVisible();
  });
}

test('category settings create, rename and deactivate', async ({ page }) => {
  await signIn(page);
  await page.goto('/settings');
  await page.getByTestId('settings-link-expenseCategories').click();
  const name = `Danh mục E2E ${randomUUID()}`;

  await page.getByRole('button', { name: 'Thêm danh mục' }).click();
  const form = page.getByRole('form', { name: 'Danh mục chi phí' });

  await form.getByRole('textbox', { name: /Tên danh mục/ }).fill(name);
  await form.getByRole('button', { name: 'Lưu danh mục' }).click();
  await page.getByRole('button', { name: `Sửa ${name}`, exact: true }).click();
  await form.getByRole('textbox', { name: /Tên danh mục/ }).fill(`${name} sửa`);
  await form.getByRole('switch', { name: 'Đang hoạt động' }).click();
  await form.getByRole('button', { name: 'Lưu danh mục' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: `${name} sửa` })).toContainText(
    'Đã tắt',
  );
});

test('manager cannot see Chi phí or open expense/category routes', async ({ page }) => {
  await page.goto('/login');
  await fillLogin(page, MANAGER.email, MANAGER.password);
  await expect(page).toHaveURL('/');
  await expect(
    page.getByTestId('app-sidebar').getByRole('link', { name: 'Chi phí', exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByTestId('bottom-nav').getByRole('button', { name: /Thêm/ }).click();
  await expect(page.getByRole('link', { name: 'Chi phí', exact: true })).toHaveCount(0);
  await page.goto('/expenses');
  await expect(page.getByText('Bạn không có quyền xem trang này')).toBeVisible();
  await page.goto('/settings/expense-categories');
  await expect(page.getByText('Bạn không có quyền xem trang này')).toBeVisible();
});
