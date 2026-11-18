import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { ROUTES } from '@/routing/route-configs';

/**
 * Keeps a room page and the header building in step: opening a room of another listed building
 * selects that building; choosing another building afterwards goes back to the room map.
 */
export function useRoomBuilding(roomBuildingId: string | undefined) {
  const navigate = useNavigate();
  const { buildingId, buildings, selectBuilding } = useActiveBuilding();
  const synced = useRef(false);

  useEffect(() => {
    if (!roomBuildingId || !buildingId) return;
    if (roomBuildingId === buildingId) {
      synced.current = true;
      return;
    }
    if (!synced.current && buildings.some(({ id }) => id === roomBuildingId)) {
      synced.current = true;
      selectBuilding(roomBuildingId);
      return;
    }
    navigate(ROUTES.rooms, { replace: true });
  }, [roomBuildingId, buildingId, buildings, selectBuilding, navigate]);
}
