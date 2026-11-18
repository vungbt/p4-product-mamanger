// Compile-time checks of the generated contract (`pnpm --filter @stay/sdk typecheck`).
import {
  buildingKeys,
  roomKeys,
  settingsKeys,
  tenantKeys,
  useBuildingPrices,
  useBuildings,
  useCapabilities,
  useMe,
  useRoom,
  useRooms,
  useServices,
  useTenant,
  useTenants,
} from '../src/react/index.js';
import {
  createBuildingApi,
  createRoomApi,
  createSettingsApi,
  createStaySdk,
  createTenantApi,
  createUploadApi,
  getDuplicateTenant,
  unwrap,
} from '../src/shared/index.js';

const sdk = createStaySdk({ baseUrl: 'https://api.example.invalid' });

async function checkContract() {
  const me = unwrap(await sdk.GET('/api/me', {})).data.user;
  const role: 'owner' | 'manager' | 'tenant' = me.role;
  const buildings: string[] = me.buildingIds;
  const capabilities = unwrap(await sdk.GET('/api/me/capabilities', {})).data;
  const version: string = capabilities.contractVersion;

  // @ts-expect-error Unknown endpoint must be rejected by the generated contract.
  void sdk.GET('/api/not-a-real-endpoint', {});
  // @ts-expect-error The user has no password field.
  void me.password;

  return { role, buildings, version };
}

function checkHookTypes() {
  const me = useMe('user-1');
  const capabilities = useCapabilities('user-1');
  const rules = capabilities.data?.rules ?? [];

  return [me.data?.user.email, rules.length];
}

async function checkSettingsAndBuildings() {
  const settings = createSettingsApi(sdk);
  const buildings = createBuildingApi(sdk);
  const billing = await settings.settings();
  const readingDay: number = billing.readingDay;
  const services = await settings.services();
  const kind: 'electricity' | 'water' | 'per_room' | 'per_person' | 'per_vehicle' | undefined =
    services[0]?.kind;
  const page = await buildings.list({ pageSize: 100, status: 'all' });
  const total: number = page.meta.total;
  const building = await buildings.detail('b-1');
  const inherited: number | null = building.readingDay;
  const effective: number = building.billing.dueDay;
  const prices = await buildings.prices('b-1', '2026-11-01');
  const source: 'default' | 'override' | undefined = prices.items[0]?.source;

  await buildings.update({
    id: 'b-1',
    body: { version: building.version, code: 'A', name: 'Toà A', readingDay: null },
  });
  await buildings.setPrice({
    id: 'b-1',
    body: { serviceId: 's-1', effectiveFrom: '2026-12-01', price: null },
  });
  // @ts-expect-error A service's kind cannot change after creation.
  await settings.updateService({ id: 's-1', body: { kind: 'water' } });

  return [readingDay, kind, total, inherited, effective, source];
}

function checkResourceHooks() {
  const buildings = useBuildings({ pageSize: 100 });
  const prices = useBuildingPrices('b-1');
  const services = useServices();

  return [
    buildings.data?.data[0]?.code,
    prices.data?.items.length,
    services.data?.length,
    buildingKeys.detail('b-1'),
    settingsKeys.services(),
  ];
}

async function checkRooms() {
  const rooms = createRoomApi(sdk);
  const page = await rooms.list('b-1', { floor: 1, status: 'vacant', pageSize: 100 });
  const status: 'vacant' | 'reserved' | 'occupied' | 'maintenance' | undefined =
    page.data[0]?.status;
  const summary = await rooms.summary('b-1');
  const vacant: number = summary.counts.vacant;
  const room = await rooms.detail('r-1');
  const meterKind: 'electricity' | 'water' | undefined = room.meters[0]?.kind;
  const preview = await rooms.bulkPreview({
    buildingId: 'b-1',
    body: { floorFrom: 1, floorTo: 3, roomsPerFloor: 4, template: '{floor}{number}' },
  });
  const exists: boolean | undefined = preview.items[0]?.exists;
  const bulk = await rooms.bulkCreate({
    buildingId: 'b-1',
    idempotencyKey: 'rooms-batch-0001',
    body: {
      floorFrom: 1,
      floorTo: 3,
      roomsPerFloor: 4,
      template: '{floor}{number}',
      listPrice: 3_000_000,
      maxOccupants: 2,
      prices: [{ code: '101', listPrice: 3_200_000 }],
    },
  });
  const skipped: 'exists' | undefined = bulk.skipped[0]?.reason;

  await rooms.setMaintenance({
    id: 'r-1',
    body: { maintenance: true, reason: 'Sơn lại', version: room.version },
  });
  // @ts-expect-error Room status is derived from contracts, never sent.
  await rooms.update({ id: 'r-1', body: { status: 'occupied' } });

  return [status, vacant, meterKind, exists, skipped];
}

function checkRoomHooks() {
  const rooms = useRooms('b-1', { status: 'maintenance' });
  const room = useRoom('r-1');

  return [rooms.data?.data[0]?.code, room.data?.defaultServices.length, roomKeys.summary('b-1')];
}

void checkContract;
void checkRooms;
void checkRoomHooks;

async function checkTenants() {
  const tenants = createTenantApi(sdk);
  const page = await tenants.list({ buildingId: 'b-1', status: 'no_contract', q: '1234' });
  const status: 'living' | 'left' | 'no_contract' | undefined = page.data[0]?.status;
  const masked: string | null | undefined = page.data[0]?.idNumberMasked;
  const created = await tenants.create({ buildingId: 'b-1', fullName: 'A', phone: '0901234567' });
  const url: string | null | undefined = created.documents[0]?.url;

  // @ts-expect-error The list never returns the full CCCD.
  void page.data[0]?.idNumber;
  await tenants.update({
    id: created.id,
    body: { fullName: 'B', phone: '0901234567', version: 1 },
  });

  const full: string | null = (await tenants.revealIdNumber(created.id)).idNumber;
  const preview = await tenants.previewImport({ buildingId: 'b-1', file: new Blob([]) });
  const result = await tenants.commitImport({
    idempotencyKey: 'import-key-1',
    body: {
      buildingId: 'b-1',
      rows: preview.rows.map(({ line, values }) => ({ line, values })),
    },
  });
  const replayed: boolean = result.replayed;
  const fileId: string = await createUploadApi(sdk, { baseUrl: 'https://x.invalid' }).uploadImage({
    purpose: 'tenant_document',
    buildingId: 'b-1',
    file: new Blob([]),
  });

  await tenants.attachDocument({ id: created.id, body: { kind: 'id_front', fileId } });
  await tenants.addVehicle({ id: created.id, body: { plate: '59-X1 123.45', type: 'motorbike' } });

  return [status, masked, url, full, replayed, getDuplicateTenant(null)?.tenantId];
}

function checkTenantHooks() {
  return [
    useTenants({ buildingId: 'b-1' }).data?.meta.total,
    useTenant('t-1').data?.vehicles,
    tenantKeys.all,
  ];
}

void checkTenants;
void checkTenantHooks;
void checkHookTypes;
void checkSettingsAndBuildings;
void checkResourceHooks;
