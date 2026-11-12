import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { saveScreenshot, signIn } from './helpers';

/** Seeded fictional tenant of building A (apps/stay/api seeders, local/CI only). */
const SEEDED = { name: 'Nguyễn Văn An', idNumber: '000090000001', masked: '000*****0001' };

/** Header row of the import template (`TENANT_IMPORT_COLUMNS` in @stay/shared). */
const IMPORT_HEADER =
  'Họ tên,Số điện thoại,Email,Số CCCD,Ngày cấp,Ngày sinh,Giới tính,Quê quán,Địa chỉ thường trú,Nghề nghiệp,Ghi chú';

function randomDigits(count: number) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 10)).join('');
}

/** A phone no other run uses (`09` + 8 random digits, never the seeded `091100xxxx`). */
function uniquePhone() {
  return `098${randomDigits(7)}`;
}

/** Six rows with unique phones: four valid, one bad phone, one bad CCCD. */
async function writeImportFile(path: string) {
  const rows = [
    `Lê Thị E2E Một,${uniquePhone()},,,,,Nữ,,,Sinh viên,`,
    `Trần Văn E2E Hai,${uniquePhone()},e2e-hai@example.com,,,15/03/1999,Nam,,,,`,
    `Phạm E2E Ba,12345,,,,,,,,,SĐT sai`,
    `Hoàng E2E Bốn,${uniquePhone()},,,,,,,,,`,
    `Vũ E2E Năm,${uniquePhone()},,123,,,,,,,CCCD sai`,
    `Đỗ E2E Sáu,${uniquePhone()},,,,,Khác,Huế,,,`,
  ];

  await writeFile(path, `${IMPORT_HEADER}\n${rows.join('\n')}\n`, 'utf8');
}

async function openSeededProfile(page: Page) {
  await page.goto(`/tenants?q=${encodeURIComponent(SEEDED.name)}`);
  await page.getByRole('link', { name: SEEDED.name }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: SEEDED.name })).toBeVisible();
}

async function previewImport(page: Page, path: string) {
  await page.goto('/tenants/import');
  await page
    .getByLabel(/File CSV hoặc XLSX/)
    .and(page.locator('input[type="file"]'))
    .setInputFiles(path);
  await page.getByRole('button', { name: 'Kiểm tra file' }).click();
  await expect(page.getByTestId('import-summary')).toHaveText('6 dòng: 4 hợp lệ, 2 lỗi, 0 trùng.');
  // Screenshots show the preview table, not the steps above it.
  await page.getByTestId('import-summary').evaluate((element) => element.scrollIntoView());
}

async function hasNoHorizontalScroll(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
}

test.describe('O-11..O-14 tenants (desktop)', () => {
  test('creates a tenant with only a name and a phone', async ({ page }) => {
    await signIn(page);
    await page.goto('/tenants');
    await page.getByRole('button', { name: 'Thêm người thuê' }).first().click();
    await expect(page).toHaveURL('/tenants/new');

    const name = `Khách E2E ${randomDigits(4)}`;

    await page.getByRole('textbox', { name: /Họ tên/ }).fill(name);
    await page.getByRole('textbox', { name: /Số điện thoại/ }).fill(uniquePhone());
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();

    await expect(page).toHaveURL(/\/tenants\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(page.getByTestId('tenant-profile')).toContainText('Chưa có hợp đồng');
  });

  test('a CCCD already in use shows a field error linking to the existing profile', async ({
    page,
  }) => {
    await signIn(page);
    await page.goto('/tenants/new');
    await page.getByRole('textbox', { name: /Họ tên/ }).fill('Người trùng CCCD');
    await page.getByRole('textbox', { name: /Số điện thoại/ }).fill(uniquePhone());
    await page.getByRole('textbox', { name: /Số CCCD/ }).fill(SEEDED.idNumber);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();

    await expect(page.getByText('Số CCCD này đã có trong hồ sơ người thuê khác.')).toBeVisible();
    await page.getByRole('link', { name: 'Xem hồ sơ đã có' }).click();
    await expect(page.getByRole('heading', { level: 1, name: SEEDED.name })).toBeVisible();
  });

  test('Quét CCCD: camera fallback message, then a card photo prefills the form', async ({
    page,
  }) => {
    await signIn(page);
    await page.goto('/tenants/new');
    await page.getByRole('button', { name: 'Quét CCCD', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Quét mã QR trên CCCD' });

    await expect(dialog).toBeVisible();
    // Headless Chromium has no camera (or no permission): a clear message, never a blank dialog.
    await expect(dialog.getByRole('status')).toContainText(
      /Đang mở camera|Đang tìm mã QR|camera|Chọn ảnh thẻ/,
    );
    // A synthetic card QR (fixtures/cccd-qr.png) read from a picked photo, in the browser only.
    await dialog
      .getByLabel('Chọn ảnh thẻ')
      .and(page.locator('input[type="file"]'))
      .setInputFiles(path.resolve(import.meta.dirname, 'fixtures/cccd-qr.png'));
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId('cccd-scan-filled')).toContainText('Đã điền từ CCCD');
    await expect(page.getByRole('textbox', { name: /Họ tên/ })).toHaveValue('Phạm Thị E2E Quét');
    await expect(page.getByRole('textbox', { name: /Số CCCD/ })).toHaveValue('079199000123');
    await expect(page.getByRole('textbox', { name: /Địa chỉ thường trú/ })).toHaveValue(
      /Phường Bến Nghé/,
    );
    await expect(page.getByRole('button', { name: /Ngày sinh/ })).toContainText('15/08/1999');
    await saveScreenshot(page, 'tenant-cccd-scan');
  });

  test('the list searches tenants and the profile reveals the full CCCD', async ({ page }) => {
    await signIn(page);
    await page.goto('/tenants');
    // Other suites add tenants to building A, so the seeded one may not be on the first page.
    await page.getByRole('searchbox', { name: 'Tìm người thuê' }).fill(SEEDED.name);
    await expect(page.getByTestId('tenant-table')).toContainText(SEEDED.name);
    await saveScreenshot(page, 'tenants-list-desktop');

    await openSeededProfile(page);

    const idNumber = page.getByTestId('tenant-id-number');

    await expect(idNumber).toHaveText(SEEDED.masked);
    await expect(page.getByRole('img', { name: 'Ảnh CCCD mặt trước' })).toHaveCount(0);
    await saveScreenshot(page, 'tenant-profile-desktop');

    await page.getByRole('button', { name: 'Hiện' }).click();
    await expect(idNumber).toHaveText(SEEDED.idNumber);
    await page.getByRole('button', { name: 'Ẩn' }).click();
    await expect(idNumber).toHaveText(SEEDED.masked);
  });

  test('adds a vehicle to a profile', async ({ page }) => {
    await signIn(page);
    await openSeededProfile(page);

    const plate = `59-T${randomDigits(1)} ${randomDigits(3)}.${randomDigits(2)}`;
    const vehicles = page.getByTestId('tenant-vehicles');

    await vehicles.getByRole('button', { name: 'Thêm xe' }).click();
    await vehicles.getByRole('textbox', { name: /Biển số/ }).fill(plate);
    await vehicles.getByRole('button', { name: 'Lưu xe' }).click();

    await expect(vehicles.getByTestId('vehicle-item').filter({ hasText: plate })).toBeVisible();
    await expect(vehicles.getByRole('button', { name: `Xoá xe ${plate}` })).toBeVisible();
  });

  test('imports a CSV: preview shows the bad rows, commit creates the valid ones', async ({
    page,
  }, testInfo) => {
    const file = testInfo.outputPath('tenants-import.csv');

    await writeImportFile(file);
    await signIn(page);
    await previewImport(page, file);

    const errors = page.getByTestId('import-cell-error');

    await expect(errors).toHaveCount(2);
    await expect(page.getByTestId('import-row-4')).toHaveAttribute('data-status', 'error');
    await expect(page.getByTestId('import-row-4')).toContainText(
      'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.',
    );
    await expect(page.getByTestId('import-row-6')).toContainText('Số CCCD phải gồm 12 chữ số.');
    await saveScreenshot(page, 'tenant-import-preview-desktop');

    await page.getByRole('button', { name: 'Nhập 4 dòng hợp lệ' }).click();
    await expect(page.getByTestId('import-result')).toHaveText(
      'Đã tạo 4 người thuê, bỏ qua 0 dòng.',
    );

    await page.getByRole('link', { name: 'Về danh sách người thuê' }).click();
    await page.getByRole('searchbox', { name: 'Tìm người thuê' }).fill('Đỗ E2E Sáu');
    await expect(page.getByTestId('tenant-table')).toContainText('Đỗ E2E Sáu');
  });
});

test.describe('O-11..O-14 tenants on mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('list has call/Zalo links; profile and import preview fit the screen', async ({
    page,
  }, testInfo) => {
    await signIn(page);
    await page.goto(`/tenants?q=${encodeURIComponent(SEEDED.name)}`);

    const card = page.getByTestId('tenant-cards').getByRole('listitem').first();

    await expect(card.getByRole('link', { name: `Gọi ${SEEDED.name}` })).toHaveAttribute(
      'href',
      'tel:0911000001',
    );
    await expect(card.getByRole('link', { name: `Nhắn Zalo cho ${SEEDED.name}` })).toHaveAttribute(
      'href',
      'https://zalo.me/0911000001',
    );
    await page.goto('/tenants');
    // Other suites add tenants to building A, so the seeded one may not be on the first page.
    await page.getByRole('searchbox', { name: 'Tìm người thuê' }).fill(SEEDED.name);
    await expect(page.getByTestId('tenant-cards')).toContainText(SEEDED.name);
    expect(await hasNoHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, 'tenants-list-mobile');

    await openSeededProfile(page);
    expect(await hasNoHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, 'tenant-profile-mobile');

    const file = testInfo.outputPath('tenants-import-mobile.csv');

    await writeImportFile(file);
    await previewImport(page, file);
    expect(await hasNoHorizontalScroll(page)).toBe(true);
    await saveScreenshot(page, 'tenant-import-preview-mobile');
  });
});
