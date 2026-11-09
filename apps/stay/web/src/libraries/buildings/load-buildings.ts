import type { StaySdk } from '@stay/sdk/shared';

/** What the header selector and building-scoped screens need about a building. */
export type BuildingOption = {
  id: string;
  name: string;
};

export type BuildingLoaderContext = {
  sdk: StaySdk;
  signal: AbortSignal;
};

/** The only source of the building list; `BuildingProvider` receives it as a prop. */
export type BuildingLoader = (context: BuildingLoaderContext) => Promise<BuildingOption[]>;

/**
 * Placeholder until ST-07 ships `GET /api/buildings`: no list API exists yet, so this returns
 * no buildings and the selector stays hidden. ST-07 replaces only this function, e.g.
 * `unwrap(await sdk.GET('/api/buildings', { signal })).data.map(({ id, name }) => ({ id, name }))`.
 */
export const loadBuildings: BuildingLoader = async () => [];
