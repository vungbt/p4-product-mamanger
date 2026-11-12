import { randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { signIn } from './helpers';

/** Same-origin API calls of the signed-in page (writes carry the web origin). */
function api(page: Page) {
  const headers = { origin: new URL(page.url()).origin };

  return {
    post: async (path: string, data: object = {}) => {
      const response = await page.request.post(`/api${path}`, { headers, data });
      expect(response.ok(), await response.text()).toBe(true);
      return (await response.json()).data;
    },
    get: async (path: string) => {
      const response = await page.request.get(`/api${path}`);
      expect(response.ok(), await response.text()).toBe(true);
      return (await response.json()).data;
    },
  };
}

const unreadOf = async (bell: ReturnType<Page['getByRole']>) =>
  Number((await bell.getAttribute('aria-label'))?.match(/\((\d+) chưa đọc\)/)?.[1] ?? 'NaN');

test('bells update live (SSE): tenant report → owner, owner reply → tenant', async ({
  page,
  browser,
}) => {
  await signIn(page);
  const { get, post } = api(page);
  const building = (await get('/buildings?pageSize=100')).find(
    (candidate: { code: string }) => candidate.code === 'A',
  );
  expect(building, 'Seeded building A must exist').toBeTruthy();
  // A new room of building A with a far-future contract and the tenant's portal link.
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
  const phone = `09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
  const room = await post(`/buildings/${building.id}/rooms`, {
    code: `N${suffix}`,
    floor: 1,
    listPrice: 3_000_000,
    maxOccupants: 2,
    initialElectric: 0,
    initialWater: 0,
  });
  const tenant = await post('/tenants', {
    buildingId: building.id,
    fullName: `Khách thông báo ${suffix}`,
    phone,
  });
  const draft = await post('/contracts', {
    roomId: room.id,
    startDate: `${randomInt(2030, 2100)}-01-01`,
    endDate: null,
    rent: 3_000_000,
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
  const link = await post(`/contracts/${contract.id}/portal-links`, { tenantId: tenant.id });

  const bell = page.getByRole('button', { name: /^Thông báo \(/ });

  await expect(bell).toBeVisible();
  const before = await unreadOf(bell);

  // Tenant on its own device: portal session, then a maintenance report.
  const tenantContext = await browser.newContext();
  const tenantPage = await tenantContext.newPage();

  await tenantPage.goto(link.path);
  await tenantPage.getByRole('textbox', { name: /4 số cuối số điện thoại/ }).fill(phone.slice(-4));
  await tenantPage.getByRole('button', { name: 'Vào cổng', exact: true }).click();
  await expect(tenantPage.getByTestId('portal-building')).toBeVisible();
  const tenantBell = tenantPage.getByTestId('portal-bell');

  await expect(tenantBell).toBeVisible();
  const tenantBefore = await unreadOf(tenantBell);
  const report = await tenantPage.request.post('/api/portal/maintenance', {
    headers: { origin: new URL(tenantPage.url()).origin },
    data: {
      title: `Bóng đèn hỏng ${suffix}`,
      description: 'Phòng tắm',
      category: 'electricity',
      severity: 'normal',
      photoFileIds: [],
    },
  });

  expect(report.ok(), await report.text()).toBe(true);
  const maintenance = (await report.json()).data;

  // No reload: the owner's bell and a toast update from the stream.
  await expect(page.getByText(`Phòng N${suffix} báo hỏng`).first()).toBeVisible();
  await expect.poll(() => unreadOf(bell)).toBeGreaterThan(before);

  await post(`/requests/${maintenance.id}/reply`, { message: `Mai thợ tới ${suffix}` });
  await expect.poll(() => unreadOf(tenantBell)).toBeGreaterThan(tenantBefore);
  await tenantBell.click();
  await expect(tenantPage.getByTestId('portal-notifications')).toContainText(
    `Mai thợ tới ${suffix}`,
  );
  await expect(tenantPage.getByTestId('portal-notification-settings')).toBeVisible();
  await tenantContext.close();

  // Settings: reachable from the bell, toggles saved per person.
  await page.goto('/account/notifications');
  const settings = page.getByTestId('notification-settings');
  const requests = settings.getByRole('switch', { name: 'Báo hỏng và yêu cầu' });

  await expect(requests).toHaveAttribute('aria-checked', 'true');
  await requests.click();
  await expect(requests).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await expect(requests).toHaveAttribute('aria-checked', 'false');
  await requests.click();
  await expect(requests).toHaveAttribute('aria-checked', 'true');
});
