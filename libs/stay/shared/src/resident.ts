/** One dated occupant stay, rather than the tenant's lifetime registration. */
export interface StayResident {
  occupantId: string;
  tenantId: string;
  contractId: string;
  fullName: string;
  birthDate: string | null;
  idNumber: string | null;
  hometown: string | null;
  permanentAddress: string | null;
  roomId: string;
  roomCode: string;
  arrivalDate: string;
  registeredOn: string | null;
}

export interface ResidentRegistrationInput {
  registeredOn: string;
  note?: string;
}

export interface ResidentExportInput {
  date: string;
}
