// Compile-time checks of the generated contract (`pnpm --filter @stay/sdk typecheck`).
import {
  buildingKeys,
  settingsKeys,
  useBuildingPrices,
  useBuildings,
  useCapabilities,
  useMe,
  useServices,
} from '../src/react/index.js';
import {
  createBuildingApi,
  createSettingsApi,
  createStaySdk,
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

void checkContract;
void checkHookTypes;
void checkSettingsAndBuildings;
void checkResourceHooks;
