// Compile-time checks of the generated contract (`pnpm --filter @stay/sdk typecheck`).
import { useCapabilities, useMe } from '../src/react/index.js';
import { createStaySdk, unwrap } from '../src/shared/index.js';

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

void checkContract;
void checkHookTypes;
