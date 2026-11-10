import { expect, test } from '@playwright/test';
import { fillLogin, OWNER, saveScreenshot, signIn } from './helpers';

test.describe('C-01 login and session', () => {
  test('signs in with the seeded owner and lands on Tổng quan', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeVisible();
    await saveScreenshot(page, 'login');

    await fillLogin(page);

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1, name: /Xin chào/ })).toBeVisible();
    await expect(page.getByTestId('signed-in-user')).toContainText(OWNER.email);
    await expect(page.getByTestId('signed-in-user')).toContainText('Chủ trọ');
    await expect(page.getByRole('heading', { name: 'Bắt đầu với toà nhà của bạn' })).toBeVisible();
    await expect(page.getByTestId('app-sidebar')).toBeVisible();
    // The seed has one building: no selector, building A is the active one.
    await expect(page.getByTestId('active-building')).toHaveAttribute('data-building-code', 'A');
    await expect(page.getByTestId('building-selector')).toHaveCount(0);
    await saveScreenshot(page, 'shell-desktop');
  });

  test('keeps the session across a reload without storing tokens', async ({ page, context }) => {
    await signIn(page);
    await page.reload();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1, name: /Xin chào/ })).toBeVisible();

    const cookie = (await context.cookies()).find(({ name }) =>
      name.endsWith('stay.session_token'),
    );
    expect(cookie?.httpOnly).toBe(true);

    const stored = await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    );
    expect(stored.toLowerCase()).not.toContain('token');
  });

  test('sends a signed-out visitor to login and back to the page they wanted', async ({ page }) => {
    await page.goto('/invoices?period=2026-11');

    await expect(page).toHaveURL('/login');
    await fillLogin(page);

    await expect(page).toHaveURL('/invoices?period=2026-11');
    await expect(page.getByRole('heading', { level: 1, name: 'Hoá đơn' })).toBeVisible();
    await expect(page.getByLabel('Kỳ', { exact: true })).toHaveValue('2026-11');
  });

  test('shows field errors and a generic message for wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill('not-an-email');
    await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('short');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page.getByText('Email không hợp lệ')).toBeVisible();
    await expect(page.getByText('Mật khẩu tối thiểu 8 ký tự')).toBeVisible();

    await fillLogin(page, OWNER.email, 'wrong-password-123');

    await expect(page.getByTestId('login-error')).toHaveText('Email hoặc mật khẩu không đúng');
    await expect(page).toHaveURL('/login');
  });

  test('signs out from the account menu', async ({ page }) => {
    await signIn(page);

    await page.getByRole('button', { name: 'Tài khoản' }).click();
    await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('re-syncs on focus and signs out when the server session is gone', async ({
    page,
    context,
  }) => {
    await signIn(page);
    await context.clearCookies();
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));

    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Phiên đăng nhập đã hết hạn')).toBeVisible();
  });

  test('remembers the email on this device only when asked', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Ghi nhớ email trên máy này').check();
    await fillLogin(page);
    await expect(page).toHaveURL('/');

    const remembered = await page.evaluate(() => localStorage.getItem('stay_login_email'));
    expect(remembered).toBe(OWNER.email);
  });
});
