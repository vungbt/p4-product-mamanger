/**
 * What other modules know about a room. Occupants (ST-10), meter readings (ST-13) and invoices
 * (ST-14/ST-18) do not exist yet: each function returns the empty answer and the owning task adds
 * its query here, so the room map and room detail need no other change. No placeholder data.
 */
import type { RoomInvoiceSummary, RoomOccupant } from '@stay/shared';

/** Latest recorded reading per meter id (ST-13). */
export interface LatestReading {
  reading: number;
  period: string;
}

/** Unpaid total of issued invoices per room id (ST-14/ST-18); rooms without debt are absent. */
export async function roomDebts(_roomIds: readonly string[]): Promise<Map<string, number>> {
  return new Map();
}

/** People living in the room under its holding contract, primary tenant first (ST-10). */
export async function roomOccupants(_roomId: string): Promise<RoomOccupant[]> {
  return [];
}

/** The room's latest invoices, newest first (ST-14). */
export async function roomRecentInvoices(
  _roomId: string,
  _limit: number,
): Promise<RoomInvoiceSummary[]> {
  return [];
}

/** Latest reading per meter id (ST-13); meters without readings are absent. */
export async function latestMeterReadings(
  _meterIds: readonly string[],
): Promise<Map<string, LatestReading>> {
  return new Map();
}
