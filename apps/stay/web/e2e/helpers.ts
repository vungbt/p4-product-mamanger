import path from 'node:path';
import { expect, type Page } from '@playwright/test';

/** Seeded local/CI owner (apps/stay/api README); never valid in production. */
export const OWNER = {
  email: process.env.STAY_E2E_EMAIL ?? 'owner@stay.local',
  password: process.env.STAY_E2E_PASSWORD ?? 'stay-owner-123',
};

/** Screens kept as CI artifacts for review (login, desktop shell, mobile shell). */
export const SCREENSHOT_DIR = path.resolve(import.meta.dirname, '../test-results/screenshots');

export async function saveScreenshot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`) });
}

export async function fillLogin(page: Page, email = OWNER.email, password = OWNER.password) {
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

export async function signIn(page: Page) {
  await page.goto('/login');
  await fillLogin(page);
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1, name: /Xin chào/ })).toBeVisible();
}

/** Whether the focused element shows a focus indicator (outline or ring). */
export function focusIsVisible(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement;

    if (!element || element === document.body) return false;

    const style = getComputedStyle(element);
    const outline = style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;

    return outline || style.boxShadow !== 'none';
  });
}

/** Presses Tab until `matches` holds for the focused element (at most `limit` times). */
export async function tabUntil(
  page: Page,
  matches: () => Promise<boolean>,
  limit = 30,
): Promise<boolean> {
  for (let index = 0; index < limit; index += 1) {
    await page.keyboard.press('Tab');
    if (await matches()) return true;
  }
  return false;
}
