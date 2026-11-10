import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

for (const width of [1280, 375]) {
  test(`ST-12 changes, history and room map at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const headers = { origin: new URL(page.url()).origin };
    const building = (await (await page.request.get('/api/buildings')).json()).data.find(
      (b: { code: string }) => b.code === 'A',
    );
    expect(building).toBeTruthy();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(
      new Date(),
    );
    const createRoom = async (index: number) => {
      const r = await page.request.post(`/api/buildings/${building.id}/rooms`, {
        headers,
        data: {
          code: `CH${suffix}${index}`,
          floor: 1,
          listPrice: 3000000,
          maxOccupants: 3,
          initialElectric: 0,
          initialWater: 0,
        },
      });
      expect(r.status(), await r.text()).toBe(201);
      return (await r.json()).data;
    };
    const old = await createRoom(1),
      target = await createRoom(2),
      occupied = await createRoom(3);
    const t = await page.request.post('/api/tenants', {
      headers,
      data: { buildingId: building.id, fullName: `ST12 owner ${suffix}`, phone: '0901234567' },
    });
    expect(t.status()).toBe(201);
    const tenant = (await t.json()).data;
    const activate = async (roomId: string, occupant = tenant) => {
      const draft = await page.request.post('/api/contracts', {
        headers,
        data: {
          roomId,
          startDate: today,
          rent: 3000000,
          occupantIds: [occupant.id],
          primaryTenantId: occupant.id,
        },
      });
      expect(draft.status(), await draft.text()).toBe(201);
      const id = (await draft.json()).data.id;
      const active = await page.request.post(`/api/contracts/${id}/activate`, { headers });
      expect(active.ok(), await active.text()).toBe(true);
      return (await active.json()).data;
    };
    const contract = await activate(old.id);
    const otherTenantResponse = await page.request.post('/api/tenants', {
      headers,
      data: { buildingId: building.id, fullName: `Other ${suffix}`, phone: '0901111111' },
    });
    expect(otherTenantResponse.status()).toBe(201);
    await activate(occupied.id, (await otherTenantResponse.json()).data);
    await page.evaluate((id) => localStorage.setItem('stay_building_id', id), building.id);
    await page.goto(`/contracts/${contract.id}`);
    // Building A has many rooms: open the menu, search on the server, and click only once the
    // filtered result is the single remaining option (earlier renders get detached).
    const pickRoom = async (code: string) => {
      const dialog = page.getByRole('dialog');
      const input = dialog.getByRole('combobox', { name: /Phòng mới/ });
      await input.focus();
      await page.keyboard.press('ArrowDown');
      await input.pressSequentially(code);
      await expect(page.getByRole('option')).toHaveCount(1);
      await page.getByRole('option', { name: code, exact: true }).click();
      await expect(dialog.getByText(code, { exact: true })).toBeVisible();
    };
    const openChange = async (label: string) => {
      await page.getByRole('button', { name: 'Thay đổi', exact: true }).click();
      await page.getByRole('menuitem', { name: label, exact: true }).click();
      return page.getByRole('dialog', { name: label, exact: true });
    };
    const save = async (dialog: ReturnType<typeof page.getByRole>) => {
      await expect(dialog.getByRole('region', { name: 'Ảnh hưởng tới hoá đơn' })).toContainText(
        'Từ kỳ',
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await dialog.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
      await expect(dialog).toBeHidden();
    };
    const person = `Người ở mới ${suffix}`;
    let dialog = await openChange('Thêm người ở');
    await dialog.getByRole('textbox', { name: /Họ tên/ }).fill(person);
    await dialog.getByRole('textbox', { name: /Số điện thoại/ }).fill('0987654321');
    await save(dialog);
    await expect(page.getByRole('tabpanel')).toContainText(person);
    dialog = await openChange('Đổi giá thuê');
    await dialog.getByRole('spinbutton', { name: /Giá thuê mới/ }).fill('3500000');
    await save(dialog);
    const afterRent = (await (await page.request.get(`/api/contracts/${contract.id}`)).json()).data;
    expect(afterRent.rent).toBe(3500000);
    dialog = await openChange('Đổi phòng');
    // Kit Select performs server search; no assumption about building-wide room totals/pages.
    await pickRoom(occupied.code);
    await dialog.getByRole('spinbutton', { name: /Giá thuê mới/ }).fill('3600000');
    await dialog.getByRole('spinbutton', { name: /Điện cuối phòng cũ/ }).fill('25');
    await dialog.getByRole('spinbutton', { name: /Nước cuối phòng cũ/ }).fill('5');
    await expect(dialog.getByRole('alert').first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
    const rejected = await page.request.post(`/api/contracts/${contract.id}/room-change`, {
      headers,
      data: {
        version: afterRent.version,
        effectiveDate: today,
        roomId: occupied.id,
        rent: 3600000,
        closingElectric: 25,
        closingWater: 5,
        initialElectric: 0,
        initialWater: 0,
      },
    });
    expect(rejected.status()).toBe(409);
    await pickRoom(target.code);
    await save(dialog);
    await expect(page.getByText(`Hiệu lực · Phòng ${target.code}`)).toBeVisible();
    await page.getByRole('tab', { name: 'Lịch sử', exact: true }).click();
    for (const label of ['Thêm người ở', 'Đổi giá thuê', 'Đổi phòng'])
      await expect(page.getByRole('tabpanel')).toContainText(label);
    await expect(page.getByRole('tabpanel')).toContainText(
      afterRent.events.find((event: { type: string }) => event.type === 'rent-change').actorName,
    );
    await expect(page.getByRole('tabpanel')).toContainText(/\d{2}:\d{2}/);
    for (const [code, status] of [
      [old.code, 'vacant'],
      [target.code, 'occupied'],
    ]) {
      await page.goto('/rooms');
      await page.getByRole('searchbox', { name: 'Tìm phòng' }).fill(code);
      await expect(
        page
          .getByTestId('room-tile')
          .filter({ has: page.getByRole('link', { name: `Phòng ${code}`, exact: true }) }),
      ).toHaveAttribute('data-status', status);
    }
    await page.goto(`/tenants/${tenant.id}`);
    await expect(
      page.getByTestId('tenant-profile').getByText(`Phòng ${target.code}`, { exact: true }).first(),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
