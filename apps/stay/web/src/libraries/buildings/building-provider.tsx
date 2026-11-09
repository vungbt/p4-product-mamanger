import { useBuildings } from '@stay/sdk/react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'stay_building_id';

/** The header selector reads up to this many buildings (owners rarely have more). */
const BUILDING_QUERY = { pageSize: 100 };

export type BuildingOption = {
  id: string;
  code: string;
  name: string;
};

type BuildingContextValue = {
  buildings: BuildingOption[];
  /** Active building: the remembered one while it is still listed, else the first. */
  building: BuildingOption | null;
  /** Put this in the query keys of building-scoped data so switching reloads it. */
  buildingId: string | null;
  selectBuilding: (id: string) => void;
  /** Call when `GET /api/buildings/:id` answers 404: drops it and reloads the list. */
  reportMissingBuilding: (id: string) => void;
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

function remember(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
}

/**
 * Buildings the signed-in user may see (`GET /api/buildings`, archived hidden) and the active
 * one, remembered on this device. Mount inside the signed-in area only.
 */
export function BuildingProvider({ children }: { children: ReactNode }) {
  const query = useBuildings(BUILDING_QUERY);
  const [selectedId, setSelectedId] = useState(readRemembered);

  const buildings = useMemo(
    () => (query.data?.data ?? []).map(({ id, code, name }) => ({ id, code, name })),
    [query.data],
  );
  const building = buildings.find(({ id }) => id === selectedId) ?? buildings[0] ?? null;
  const buildingId = building?.id ?? null;

  // A remembered building that is gone (archived, unassigned, deleted) falls back to the first.
  useEffect(() => {
    if (query.isSuccess && buildingId !== selectedId) {
      remember(buildingId);
      setSelectedId(buildingId);
    }
  }, [query.isSuccess, buildingId, selectedId]);

  const selectBuilding = useCallback((id: string) => {
    remember(id);
    setSelectedId(id);
  }, []);

  const { refetch } = query;

  const reportMissingBuilding = useCallback(
    (id: string) => {
      if (id === readRemembered()) remember(null);
      setSelectedId((current) => (current === id ? null : current));
      void refetch();
    },
    [refetch],
  );

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const value: BuildingContextValue = {
    buildings,
    building,
    buildingId,
    selectBuilding,
    reportMissingBuilding,
    isLoading: query.isLoading,
    isError: query.isError,
    retry,
  };

  return <BuildingContext.Provider value={value}>{children}</BuildingContext.Provider>;
}

export function useActiveBuilding(): BuildingContextValue {
  const context = useContext(BuildingContext);

  if (!context) throw new Error('useActiveBuilding must be used within BuildingProvider.');
  return context;
}
