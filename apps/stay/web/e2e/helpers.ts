import path from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Picks an option of a kit `Select` (react-select): the combobox input is a tiny focus target,
 * so open the menu from the keyboard, then click the option.
 */
export async function chooseOption(
  page: Page,
  scope: Page | Locator,
  label: string | RegExp,
  option: string | RegExp,
) {
  await scope.getByRole('combobox', { name: label }).focus();
  await page.keyboard.press('ArrowDown');
  await page
    .getByRole(
      'option',
      typeof option === 'string' ? { name: option, exact: true } : { name: option },
    )
    .click();
}

/**
 * Picks `isoDate` (`YYYY-MM-DD`) in a kit `DatePicker`: opens it from its label, jumps to the
 * year with the calendar's searchable "Năm" select, steps to the month with its month buttons,
 * then clicks the day (react-day-picker marks each day cell `data-day="YYYY-MM-DD"`). Required
 * fields append "*" to the label, so pass a RegExp for them.
 */
export async function pickDate(
  page: Page,
  scope: Page | Locator,
  label: string | RegExp,
  isoDate: string,
) {
  await scope
    .getByRole('button', typeof label === 'string' ? { name: label, exact: true } : { name: label })
    .click();

  // The open calendar renders in a portal; only one is open at a time.
  const shownDay = page.locator('td[data-day]:not([data-outside])').first();
  const target = page.locator(`td[data-day="${isoDate}"]:not([data-outside]) button`);
  const month = isoDate.slice(0, 7);

  await expect(shownDay).toBeVisible();
  if ((await shownDay.getAttribute('data-day'))?.slice(0, 4) !== isoDate.slice(0, 4)) {
    await page.getByRole('combobox', { name: 'Năm', exact: true }).focus();
    await page.keyboard.type(isoDate.slice(0, 4));
    await page.keyboard.press('Enter');
    await expect(shownDay).toHaveAttribute('data-day', new RegExp(`^${isoDate.slice(0, 4)}-`));
  }
  for (let step = 0; step < 24 && !(await target.count()); step += 1) {
    const shown = (await shownDay.getAttribute('data-day')) ?? isoDate;

    await page
      .getByRole('button', {
        name: shown.slice(0, 7) < month ? 'Tháng sau' : 'Tháng trước',
        exact: true,
      })
      .click();
    await expect(shownDay).not.toHaveAttribute('data-day', shown);
  }
  await target.click();
  await expect(target).toBeHidden();
}

/**
 * Picks `period` (`YYYY-MM`) in a kit `MonthPicker` (`PeriodPicker`): opens it from its label,
 * steps years with "Năm trước"/"Năm sau" until the month grid shows the year, then clicks the
 * month (grid cells run January → December). Far years (fixtures use 2100–2900) are reached with
 * the grid's PageUp/PageDown keys (one year each) before the buttons finish the walk. Pass a
 * RegExp label for required fields ("*").
 */
export async function pickMonth(
  page: Page,
  scope: Page | Locator,
  label: string | RegExp,
  period: string,
) {
  const trigger = scope.getByRole(
    'button',
    typeof label === 'string' ? { name: label, exact: true } : { name: label },
  );

  await trigger.click();

  // The open panel renders in a portal; only one is open at a time.
  const grid = page.getByRole('grid', { name: /^Các tháng năm \d{4}$/ });
  const year = Number(period.slice(0, 4));
  const shownYear = async () => Number((await grid.getAttribute('aria-label'))?.slice(-4));

  await expect(grid).toBeVisible();
  const distance = year - (await shownYear());

  if (Math.abs(distance) > 3) {
    await grid.locator('button[tabindex="0"]').focus();
    for (let step = 0; step < Math.abs(distance) - 1; step += 1)
      await page.keyboard.press(distance > 0 ? 'PageDown' : 'PageUp');
    await expect(grid).not.toHaveAttribute('aria-label', `Các tháng năm ${year - distance}`);
  }
  for (let step = 0; step < 12; step += 1) {
    const shown = await shownYear();

    if (shown === year) break;
    await page
      .getByRole('button', { name: shown < year ? 'Năm sau' : 'Năm trước', exact: true })
      .click();
    await expect(grid).not.toHaveAttribute('aria-label', `Các tháng năm ${shown}`);
  }
  await expect(grid).toHaveAttribute('aria-label', `Các tháng năm ${year}`);
  await grid
    .getByRole('gridcell')
    .nth(Number(period.slice(5)) - 1)
    .getByRole('button')
    .click();
  await expect(grid).toBeHidden();
  await expect(trigger).toHaveText(displayPeriod(period));
}

/** Picker text of a kit `MonthPicker` value (`MM/yyyy`). */
export function displayPeriod(period: string) {
  return `${period.slice(5)}/${period.slice(0, 4)}`;
}

/** Picker text of a kit `DatePicker` value (`dd/MM/yyyy`). */
export function displayIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');

  return `${day}/${month}/${year}`;
}

/** Today in Asia/Ho_Chi_Minh as the UI shows dates (`dd/MM/yyyy`). */
export function todayDisplay() {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

/** Seeded local/CI owner (apps/stay/api README); never valid in production. */
export const OWNER = {
  email: process.env.STAY_E2E_EMAIL ?? 'owner@stay.local',
  password: process.env.STAY_E2E_PASSWORD ?? 'stay-owner-123',
};

/** Manager of building A, created by `e2e/seed-manager.mjs` (local/CI only). */
export const MANAGER = {
  email: 'manager-a@stay.local',
  password: 'stay-manager-123',
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
