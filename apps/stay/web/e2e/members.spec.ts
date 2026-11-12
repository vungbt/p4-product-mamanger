import { expect, test } from '@playwright/test';
import { fillLogin, OWNER } from './helpers';

test('owner invites a manager of A, edits permissions, then disables the account', async ({
  page,
}) => {
  const email = `st27-e2e-${Date.now()}@stay.local`;

  await page.goto('/login');
  await fillLogin(page, OWNER.email, OWNER.password);
  await expect(page).toHaveURL('/');
  const response = await page.request.get('/api/buildings?pageSize=100&status=active');
  const buildings = await response.json();
  const a = buildings.data.find((building: { code: string }) => building.code === 'A');

  expect(a).toBeTruthy();
  await page.goto('/settings/members');
  await page.getByRole('button', { name: 'Mời người quản lý', exact: true }).click();
  const form = page.getByRole('form', { name: 'Người quản lý' });

  await form.getByLabel('Email', { exact: false }).fill(email);
  await form.getByRole('checkbox', { name: a.name, exact: true }).check();
  await form.getByRole('checkbox', { name: 'Chốt số điện nước', exact: true }).check();
  await form.getByRole('checkbox', { name: 'Thu tiền', exact: true }).check();
  await form.getByRole('button', { name: 'Gửi lời mời', exact: true }).click();
  await expect(form).toBeHidden();
  await page.getByLabel('Tìm email', { exact: true }).fill(email);
  const edit = page.getByRole('button', { name: `Sửa ${email}`, exact: true });

  await expect(edit).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(email)}`));
  await edit.click();
  await expect(form.getByRole('checkbox', { name: a.name, exact: true })).toBeChecked();
  await form.getByRole('checkbox', { name: 'Thu tiền', exact: true }).uncheck();
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(form).toBeHidden();
  await page.getByRole('button', { name: `Khoá ${email}`, exact: true }).click();
  await page.getByRole('button', { name: 'Khoá tài khoản', exact: true }).click();
  await expect(page.getByRole('button', { name: `Khoá ${email}`, exact: true })).toHaveCount(0);
  await expect(edit).toBeVisible();
});
