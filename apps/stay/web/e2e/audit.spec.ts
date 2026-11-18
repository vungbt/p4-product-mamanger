// Sign in against the seeded API; fixture audit data keeps UI states deterministic.
import { expect, type Page, test } from '@playwright/test';
import { STAY_CONTRACT_VERSION, type StayRole, stayAbilityKit } from '@stay/shared';
import { chooseOption, signIn } from './helpers';

const buildingId = '00000000-0000-4000-8000-000000000001';
const otherBuilding = '00000000-0000-4000-8000-000000000002';
const entry = {
  id: '00000000-0000-4000-8000-000000000003',
  actorId: '00000000-0000-4000-8000-000000000004',
  actorName: 'Chủ trọ thử nghiệm',
  action: 'issue',
  resourceType: 'invoice',
  resourceId: 'invoice-1',
  outcome: 'success',
  changes: { amount: 3910000, password: '[REDACTED]' },
  createdAt: '2026-11-10T03:00:00.000Z',
};

async function mockApi(page: Page, role?: StayRole) {
  const user = {
    id: entry.actorId,
    role: role ?? 'owner',
    displayName: entry.actorName,
    email: 'test@example.com',
    emailVerified: true,
    avatarUrl: null,
    buildingIds: [buildingId],
    contractIds: [],
  };
  let mode: 'data' | 'empty' | 'error' = 'data';
  const queries: URLSearchParams[] = [];

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let body: unknown;
    let status = 200;

    if (role && path === '/api/auth/get-session')
      body = {
        user,
        session: { id: 'session', userId: user.id, expiresAt: '2099-01-01T00:00:00Z' },
      };
    else if (role && path === '/api/me') body = { data: { user } };
    else if (role && path === '/api/me/capabilities')
      body = {
        data: {
          contractVersion: STAY_CONTRACT_VERSION,
          rules: stayAbilityKit.abilityRules(stayAbilityKit.defineAbilityFor(user)),
        },
      };
    else if (path === '/api/buildings')
      body = {
        data: [buildingId, otherBuilding].map((id, index) => ({
          id,
          code: String(index),
          name: `Toà ${index + 1}`,
        })),
        meta: { page: 1, pageSize: 100, total: 2, totalPages: 1 },
      };
    else if (role && path === '/api/notifications') body = { data: { items: [], unreadCount: 0 } };
    else if (path === `/api/audit-logs/${entry.id}`) body = { data: entry };
    else if (path === '/api/audit-logs') {
      queries.push(url.searchParams);
      status = mode === 'error' ? 500 : 200;
      body =
        mode === 'error'
          ? { code: 'error', message: 'failed' }
          : {
              data: mode === 'empty' ? [] : [entry],
              meta: {
                page: Number(url.searchParams.get('page') ?? 1),
                pageSize: 20,
                total: mode === 'empty' ? 0 : 21,
                totalPages: mode === 'empty' ? 1 : 2,
              },
            };
    } else return route.fallback();
    await route.fulfill({ status, json: body });
  });
  return {
    queries,
    setMode: (next: typeof mode) => {
      mode = next;
    },
  };
}

for (const width of [375, 1280]) {
  test(`audit timeline, URL filters and detail at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const api = await mockApi(page);

    await page.goto(`/audit?buildingId=${buildingId}&page=2`);
    await expect(page.getByRole('heading', { name: 'Lịch sử thay đổi' })).toBeVisible();
    await expect(page.getByText(entry.actorName, { exact: true }).last()).toBeVisible();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('link', { name: 'invoice-1' })).toHaveAttribute(
      'href',
      '/invoices/invoice-1',
    );
    // Each entry reads as a sentence; the detail dialog shows the diff and the redacted JSON.
    await page.getByRole('button', { name: /^Chi tiết thay đổi/ }).click();
    const detail = page.getByRole('dialog', { name: 'Chi tiết thay đổi' });
    await expect(detail.getByText('Phát hành', { exact: true })).toBeVisible();
    await expect(detail.locator('pre')).toContainText('[REDACTED]');
    await page.keyboard.press('Escape');
    await expect(detail).toBeHidden();
    await page.getByRole('searchbox', { name: 'Tìm hành động hoặc bản ghi' }).fill('invoice');
    await expect(page).toHaveURL(/q=invoice/);
    await expect(page).not.toHaveURL(/page=2/);
    // Actions are offered by name ("Phát hành hoá đơn"), filtered by their code in the URL.
    await chooseOption(page, page, 'Hành động', 'Phát hành hoá đơn');
    await expect(page).toHaveURL(/action=issue/);
    await chooseOption(page, page, 'Thứ tự', 'Cũ nhất trước');
    await expect(page).toHaveURL(/sortOrder=asc/);
    await page.reload();
    // The kit Select shows the chosen option next to its (empty) search input.
    await expect(
      page.getByRole('group', { name: 'Bộ lọc' }).getByText('Phát hành hoá đơn', { exact: true }),
    ).toBeVisible();
    await expect.poll(() => api.queries.at(-1)?.get('buildingId')).toBe(buildingId);
    await expect(page.getByRole('combobox', { name: 'Thứ tự' })).toBeVisible();
    await expect
      .poll(() =>
        api.queries.some(
          (query) => query.get('pageSize') === '20' && query.get('sortOrder') === 'asc',
        ),
      )
      .toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `test-results/screenshots/audit-${width}.png`, fullPage: true });
  });
}

test('empty, error and retry states', async ({ page }) => {
  await signIn(page);
  const api = await mockApi(page);
  api.setMode('empty');

  await page.goto('/audit');
  await expect(page.getByText('Chưa có lịch sử phù hợp.')).toBeVisible();
  api.setMode('error');
  await page.getByRole('searchbox', { name: 'Tìm hành động hoặc bản ghi' }).fill('failure');
  await expect(page.getByText('Không tải được dữ liệu.')).toBeVisible();
  api.setMode('data');
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('link', { name: 'invoice-1' })).toBeVisible();
});

// Only this role-switching test fixtures identity and capabilities.
test('manager can open audit; tenant has no audit menu or access', async ({ page }) => {
  await mockApi(page, 'manager');
  await page.goto('/audit');
  await expect(page.getByRole('heading', { name: 'Lịch sử thay đổi' })).toBeVisible();
  await page.unrouteAll({ behavior: 'wait' });
  await mockApi(page, 'tenant');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Bạn không có quyền xem trang này' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lịch sử thay đổi' })).toHaveCount(0);
});
