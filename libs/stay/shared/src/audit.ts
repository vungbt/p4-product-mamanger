type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Public audit entry; sensitive values are redacted on every read. */
export interface StayAuditLog {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'success' | 'failure';
  changes: JsonValue;
  createdAt: string;
}
