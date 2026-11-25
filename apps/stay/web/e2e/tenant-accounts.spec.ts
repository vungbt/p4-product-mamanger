import { randomInt, randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { fillLogin, signIn } from './helpers';

test('owner issues credentials, tenant changes password and sees only own invoices', async ({
  page,
  context,
}) => {
  await signIn(page);
  const headers = { origin: new URL(page.url()).origin };

  const post = async (path: string, data: object = {}) => {
    const response = await page.request.post(`/api${path}`, { headers, data });

    expect(response.ok(), await response.text()).toBe(true);
    return (await response.json()).data;
  };
  const get = async (path: string) => {
    const response = await page.request.get(`/api${path}`, { headers });

    expect(response.ok(), await response.text()).toBe(true);
    return (await response.json()).data;
  };

  const building = (await get('/buildings')).find((item: { code: string }) => item.code === 'A');
  const suffix = randomUUID().slice(0, 7);

  const fixture = async (index: number) => {
    const phone = `09${String(randomInt(100000000)).padStart(8, '0')}`;
    const tenant = await post('/tenants', {
      buildingId: building.id,
      fullName: `Tài khoản ${suffix} ${index}`,
      phone,
    });
    const room = await post(`/buildings/${building.id}/rooms`, {
      code: `TA${suffix}${index}`,
      floor: 1,
      listPrice: 2000000,
      maxOccupants: 2,
      initialElectric: 0,
      initialWater: 0,
    });
    const draft = await post('/contracts', {
      roomId: room.id,
      startDate: '2048-01-01',
      endDate: null,
      rent: 2000000,
      depositAmount: 0,
      depositCollected: false,
      depositMethod: 'cash',
      initialElectric: 0,
      initialWater: 0,
      occupantIds: [tenant.id],
      primaryTenantId: tenant.id,
      serviceIds: [],
      vehicleIds: [],
    });
    const contract = await post(`/contracts/${draft.id}/activate`);
    const [moveIn] = await get(`/invoices?contractId=${contract.id}&kind=move_in`);
    const { invoices } = await post('/invoices/issue', { ids: [moveIn.id] });

    return { tenant, phone, contract, invoice: invoices[0] };
  };

  const mine = await fixture(1);
  const other = await fixture(2);

  await page.goto(`/tenants/${mine.tenant.id}`);
  await page.getByRole('button', { name: 'Cấp tài khoản', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Thông tin đăng nhập' });

  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(mine.phone);
  const password = (await dialog.getByTestId('temporary-password').innerText()).trim();

  await expect(dialog.getByRole('button', { name: 'Gửi SMS' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Gửi email' })).toHaveCount(0);
  await context.clearCookies();
  await page.goto('/login');
  await fillLogin(page, mine.phone, password);
  await expect(page).toHaveURL('/account/password');
  await page.goto('/my/invoices');
  await expect(page).toHaveURL('/account/password');
  await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill(password);
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('My-private-password-2468');
  await page.getByRole('button', { name: 'Lưu mật khẩu' }).click();
  await expect(page).toHaveURL('/my');
  await expect(page.getByTestId('app-sidebar')).toBeVisible();
  await page.goto('/my/invoices');
  await expect(
    page.getByText(mine.invoice.code, { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByText(other.invoice.code, { exact: true })).toHaveCount(0);
  await page.goto(`/my/invoices/${other.invoice.id}`);
  await expect(page.getByText(other.invoice.code, { exact: true })).toHaveCount(0);
  await page.goto('/tenants');
  await expect(page.getByTestId('forbidden-page')).toBeVisible();
});
