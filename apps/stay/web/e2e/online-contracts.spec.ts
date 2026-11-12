import { randomInt, randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { chooseOption, OWNER, signIn } from './helpers';

const SIGNATURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/** Isolated data in building A. Never depends on global list counts or seeded occupants. */
async function setup(page: Page) {
  const headers = { origin: new URL(page.url()).origin };
  const call = async (method: 'get' | 'post' | 'put', path: string, data?: object) => {
    const response = await page.request[method](`/api${path}`, { headers, data });

    expect(response.ok(), await response.text()).toBe(true);
    return (await response.json()).data;
  };
  const building = (await call('get', '/buildings')).find(
    (row: { code: string }) => row.code === 'A',
  );

  expect(building, 'Seeded building A must exist').toBeTruthy();
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  const phone = `09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
  const fullName = `Nguyễn Văn Ký ${suffix}`;
  const room = await call('post', `/buildings/${building.id}/rooms`, {
    code: `DOC${suffix}`,
    floor: 1,
    listPrice: 3500000,
    maxOccupants: 2,
    initialElectric: 0,
    initialWater: 0,
  });
  const tenant = await call('post', '/tenants', {
    buildingId: building.id,
    fullName,
    phone,
    idNumber: `0${String(randomInt(0, 100_000_000_000)).padStart(11, '0')}`,
  });
  const draft = await call('post', '/contracts', {
    roomId: room.id,
    startDate: `${randomInt(2100, 2900)}-01-01`,
    endDate: null,
    rent: 3500000,
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
  const contract = await call('post', `/contracts/${draft.id}/activate`);
  const profile = await call('get', '/settings/landlord');

  await call('put', '/settings/landlord', {
    fullName: 'Nguyễn Văn Chủ',
    idNumber: '079075000123',
    phone: '0901234567',
    signatureImage: SIGNATURE,
    version: profile.version,
  });
  const template = await call('post', '/contract-templates', {
    buildingId: building.id,
    source: 'default',
    name: `Mẫu ký ${suffix}`,
  });
  const portal = await call('post', `/contracts/${contract.id}/portal-links`, {
    tenantId: tenant.id,
  });

  await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
  return { contract, template, portal, fullName, last4: phone.slice(-4) };
}

test('ST-30a: create from default template, send, tenant types signature, owner signs, download immutable PDF', async ({
  page,
  browser,
}) => {
  await signIn(page);
  const data = await setup(page);

  await page.goto(`/contracts/${data.contract.id}`);
  await page.getByRole('tab', { name: 'Văn bản', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo văn bản', exact: true }).click();
  await chooseOption(page, page, /Chọn mẫu/, `${data.template.name} · v1`);
  await page.getByRole('button', { name: 'Tạo văn bản', exact: true }).last().click();
  await expect(page).toHaveURL(/\/contracts\/.+\/documents\/.+/);
  const documentUrl = page.url();
  const documentId = new URL(documentUrl).pathname.split('/').at(-1);

  await expect(page.getByRole('button', { name: 'Gửi văn bản', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Gửi văn bản', exact: true }).click();
  await page.getByRole('button', { name: 'Gửi văn bản', exact: true }).last().click();
  await expect(page.getByText('Chờ ký', { exact: true })).toBeVisible();

  const visitor = await browser.newContext({
    locale: 'vi-VN',
    viewport: { width: 375, height: 812 },
  });

  try {
    const tenant = await visitor.newPage();

    await tenant.goto(new URL(data.portal.path, page.url()).href);
    await tenant.getByRole('textbox', { name: /4 số cuối số điện thoại/ }).fill(data.last4);
    await tenant.getByRole('button', { name: 'Vào cổng', exact: true }).click();
    await expect(tenant).toHaveURL(/\/p$/);
    await expect(tenant.getByTestId('portal-awaiting-documents')).toBeVisible();
    await tenant.goto(`/p/documents/${documentId}`);
    const sign = tenant.getByRole('button', { name: 'Ký văn bản', exact: true });

    await expect(sign).toBeDisabled();
    await tenant.getByTestId('document-reader').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event('scroll'));
    });
    await tenant.getByRole('textbox', { name: 'Họ tên đầy đủ', exact: true }).fill(data.fullName);
    await tenant.getByRole('textbox', { name: /4 số cuối số điện thoại/ }).fill(data.last4);
    await tenant.getByRole('checkbox', { name: /Tôi đã đọc và đồng ý/ }).check();
    await tenant.getByRole('button', { name: 'Dùng chữ ký đánh máy', exact: true }).click();
    await sign.click();
    await expect(tenant.getByText('Đã ký, chờ chủ trọ ký', { exact: true })).toBeVisible();
    expect(await tenant.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );

    await page.reload();
    await page.getByRole('button', { name: 'Chủ trọ ký', exact: true }).click();
    await page.getByLabel('Mật khẩu đăng nhập', { exact: false }).fill(OWNER.password);
    await page.getByRole('button', { name: 'Chủ trọ ký', exact: true }).last().click();
    await expect(page.getByText('Hoàn tất', { exact: true }).first()).toBeVisible();
    const ownerDownload = page.waitForEvent('download');

    await page.getByRole('button', { name: 'Tải PDF', exact: true }).click();
    const pdf = await ownerDownload;

    expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
    expect(await pdf.failure()).toBeNull();
    await tenant.reload();
    const tenantDownload = tenant.waitForEvent('download');

    await tenant.getByRole('link', { name: 'Tải PDF', exact: true }).click();
    expect(await (await tenantDownload).failure()).toBeNull();
  } finally {
    await visitor.close();
  }
});
