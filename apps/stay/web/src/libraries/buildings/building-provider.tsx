import { useStaySdk } from '@stay/sdk/react';
import { useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { useAuth } from '@/libraries/session/auth-provider';
import type { BuildingLoader, BuildingOption } from './load-buildings';

const STORAGE_KEY = 'stay_building_id';

type BuildingContextValue = {
  buildings: BuildingOption[];
  /** Selected building; the remembered one when still available, else the first. */
  building: BuildingOption | null;
  /** Put this in the query keys of building-scoped data so switching reloads it. */
  buildingId: string | null;
  selectBuilding: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
};

const BuildingContext = createContext<BuildingContextValue | null>(null);

function readRemembered(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function remember(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
}

/** Buildings of the signed-in user and the current selection (remembered on this device). */
export function BuildingProvider({
  loader,
  children,
}: {
  loader: BuildingLoader;
  children: ReactNode;
}) {
  const sdk = useStaySdk();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(readRemembered);

  const query = useQuery({
    queryKey: ['stay', 'buildings', user?.id],
    enabled: Boolean(user),
    queryFn: ({ signal }) => loader({ sdk, signal }),
  });

  const buildings = query.data ?? [];
  const building = buildings.find(({ id }) => id === selectedId) ?? buildings[0] ?? null;

  const selectBuilding = useCallback((id: string) => {
    remember(id);
    setSelectedId(id);
  }, []);

  const retry = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);

  const value: BuildingContextValue = {
    buildings,
    building,
    buildingId: building?.id ?? null,
    selectBuilding,
    isLoading: query.isLoading,
    isError: query.isError,
    retry,
  };

  return <BuildingContext.Provider value={value}>{children}</BuildingContext.Provider>;
}

export function useBuilding(): BuildingContextValue {
  const context = useContext(BuildingContext);

  if (!context) throw new Error('useBuilding must be used within BuildingProvider.');
  return context;
}
