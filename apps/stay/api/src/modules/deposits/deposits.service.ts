import {
  BaseError,
  buildPaginationMeta,
  listSearch,
  NotFound,
  selectFields,
  setAuditChanges,
} from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import {
  type ContractStatus,
  type DepositBalance,
  type DepositEntry,
  type DepositInput,
  type DepositLedger,
  type DepositSummary,
  isIsoDate,
  type StayUser,
} from '@stay/shared';
import { Op, Transaction, type WhereOptions } from 'sequelize';
import { accessibleBuildingIds, canAccessRecord } from '@/middlewares/ability.middleware.js';
import type { ContractAttributes } from '@/sequelize/models/contract.model.js';
import {
  ContractModel,
  ContractOccupantModel,
  DepositEntryModel,
  RoomModel,
  TenantModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { runIdempotent } from '@/shared/persistence.js';
import type { ModelOrder } from '@/types/database.js';

export interface DepositListQuery extends ListQuery<'code' | 'createdAt'> {
  buildingId?: string;
  status?: ContractStatus;
}

const entryFields = [
  'id',
  'contractId',
  'type',
  'amount',
  'method',
  'occurredOn',
  'note',
  'invoiceId',
] as const;

function entryDto(row: DepositEntryModel): DepositEntry {
  return { ...selectFields(row, entryFields), createdAt: row.createdAt.toISOString() };
}

export function depositBalance(entries: Pick<DepositEntry, 'type' | 'amount'>[]): DepositBalance {
  const sums = { received: 0n, applied: 0n, refunded: 0n, forfeited: 0n };

  for (const entry of entries) sums[entry.type] += BigInt(entry.amount);
  const held = sums.received - sums.applied - sums.refunded - sums.forfeited;

  if (held < 0n)
    throw new BaseError('deposit_insufficient_balance', 422, 'deposit_insufficient_balance');
  if (Object.values(sums).some((sum) => sum > BigInt(Number.MAX_SAFE_INTEGER)))
    throw new BaseError('deposit_amount_overflow', 422, 'deposit_amount_overflow');
  return {
    received: Number(sums.received),
    applied: Number(sums.applied),
    refunded: Number(sums.refunded),
    forfeited: Number(sums.forfeited),
    held: Number(held),
  };
}

async function findContract(user: StayUser, id: string, transaction: Transaction, write = false) {
  const row = await ContractModel.findByPk(id, {
    transaction,
    ...(write ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (
    !row ||
    !canAccessRecord(user, write ? 'manage' : 'read', 'Deposit', {
      buildingId: row.buildingId,
      contractId: row.id,
    })
  )
    throw new NotFound();
  return row;
}

export async function getDeposits(user: StayUser, id: string): Promise<DepositLedger> {
  return auditedTransaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (transaction) => {
      const row = await findContract(user, id, transaction);
      const entries = await DepositEntryModel.findAll({
        where: { contractId: id },
        order: [
          ['occurredOn', 'DESC'],
          ['createdAt', 'DESC'],
          ['id', 'DESC'],
        ],
        transaction,
      });

      setAuditChanges({ buildingId: row.buildingId, contractId: id });
      return {
        contractId: id,
        buildingId: row.buildingId,
        balance: depositBalance(entries),
        entries: entries.map(entryDto),
      };
    },
  );
}

export async function listDeposits(
  user: StayUser,
  query: DepositListQuery,
): Promise<{
  data: DepositSummary[];
  meta: PaginationMeta & {
    totalHeld: number;
    buildingTotals: { buildingId: string; held: number }[];
  };
}> {
  if (
    query.buildingId &&
    !canAccessRecord(user, 'read', 'Deposit', { buildingId: query.buildingId })
  )
    throw new NotFound();
  const ids = accessibleBuildingIds(user, 'read');
  const conditions: WhereOptions<ContractAttributes>[] = [
    listSearch(ContractModel, query.q, ['code']),
  ];

  if (ids !== 'all') conditions.push({ buildingId: { [Op.in]: ids } });
  if (query.buildingId) conditions.push({ buildingId: query.buildingId });
  if (query.status) conditions.push({ status: query.status });
  const order: ModelOrder<ContractAttributes> = [
    [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
    ['id', 'ASC'],
  ];

  return auditedTransaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (transaction) => {
      const contracts = await ContractModel.findAll({
        where: { [Op.and]: conditions },
        order,
        transaction,
      });
      const contractIds = contracts.map((row) => row.id);
      const [entries, rooms, occupants] = await Promise.all([
        DepositEntryModel.findAll({ where: { contractId: { [Op.in]: contractIds } }, transaction }),
        RoomModel.findAll({
          where: { id: { [Op.in]: contracts.map((row) => row.roomId) } },
          transaction,
        }),
        ContractOccupantModel.findAll({
          where: { contractId: { [Op.in]: contractIds }, isPrimary: true },
          transaction,
        }),
      ]);
      const tenants = await TenantModel.findAll({
        where: { id: { [Op.in]: occupants.map((row) => row.tenantId) } },
        transaction,
      });
      const grouped = new Map<string, DepositEntryModel[]>();

      for (const entry of entries) {
        const group = grouped.get(entry.contractId) ?? [];
        group.push(entry);
        grouped.set(entry.contractId, group);
      }
      const all: DepositSummary[] = contracts.map((row) => ({
        contractId: row.id,
        buildingId: row.buildingId,
        code: row.code,
        status: row.status,
        roomCode: rooms.find((room) => room.id === row.roomId)?.code ?? '',
        primaryTenantName:
          tenants.find(
            (tenant) => tenant.id === occupants.find((o) => o.contractId === row.id)?.tenantId,
          )?.fullName ?? null,
        ...depositBalance(grouped.get(row.id) ?? []),
      }));
      const totals = new Map<string, number>();

      for (const row of all)
        totals.set(row.buildingId, (totals.get(row.buildingId) ?? 0) + row.held);
      const totalHeld = all.reduce((sum, row) => sum + row.held, 0);

      if (!Number.isSafeInteger(totalHeld))
        throw new BaseError('deposit_amount_overflow', 422, 'deposit_amount_overflow');
      setAuditChanges({ buildingId: query.buildingId ?? null });
      return {
        data: all.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
        meta: {
          ...buildPaginationMeta(query.page, query.pageSize, all.length),
          totalHeld,
          buildingTotals: [...totals].map(([buildingId, held]) => ({ buildingId, held })),
        },
      };
    },
  );
}

async function insertEntry(
  user: StayUser,
  id: string,
  input: Omit<DepositInput, 'type'> & { type: DepositEntry['type']; invoiceId?: string },
  transaction: Transaction,
): Promise<DepositEntry> {
  // All writers (including activation and settlement) serialize on this contract row.
  const row = await findContract(user, id, transaction, true);

  if (row.status === 'draft' || row.status === 'cancelled')
    throw new BaseError('deposit_contract_not_active', 409, 'deposit_contract_not_active');
  if (
    !Number.isSafeInteger(input.amount) ||
    input.amount <= 0 ||
    !isIsoDate(input.occurredOn) ||
    !['cash', 'bank_transfer', 'other'].includes(input.method) ||
    (input.type === 'forfeited' && !input.reason?.trim())
  )
    throw new BaseError('invalid_deposit_entry', 422, 'invalid_deposit_entry');
  const entries = await DepositEntryModel.findAll({ where: { contractId: id }, transaction });
  const before = depositBalance(entries);
  const after = depositBalance([...entries, input]);
  const entry = await DepositEntryModel.create(
    {
      contractId: id,
      type: input.type,
      amount: input.amount,
      method: input.method,
      occurredOn: input.occurredOn,
      note: input.reason ?? null,
      invoiceId: input.invoiceId ?? null,
    },
    { transaction },
  );
  const facts = {
    buildingId: row.buildingId,
    contractId: id,
    entryId: entry.id,
    type: entry.type,
    amount: entry.amount,
    method: entry.method,
    occurredOn: entry.occurredOn,
    heldBefore: before.held,
    heldAfter: after.held,
  };

  await recordAudit(
    {
      actorId: user.id,
      action: 'deposit.created',
      resourceType: 'deposit_entry',
      resourceId: entry.id,
      changes: facts,
    },
    transaction,
  );
  setAuditChanges(facts);
  return entryDto(entry);
}

export async function createDeposit(
  user: StayUser,
  id: string,
  input: DepositInput,
  key?: string,
): Promise<DepositEntry> {
  // Defend the service boundary too: applied is never accepted by this entry point.
  if (!['received', 'refunded', 'forfeited'].includes(input.type))
    throw new BaseError('invalid_deposit_type', 422, 'invalid_deposit_type');
  if (key) {
    const { result } = await runIdempotent(
      { scope: `deposit.create.${id}`, actorId: user.id, key, payload: { ...input } },
      async (transaction) => (await insertEntry(user, id, input, transaction)).id,
    );

    if (typeof result !== 'string') throw new Error('Invalid stored deposit id');
    const entry = await DepositEntryModel.findByPk(result);

    if (!entry) throw new NotFound();
    return entryDto(entry);
  }
  return auditedTransaction((transaction) => insertEntry(user, id, input, transaction));
}

/** ST-17 only: call inside the settlement's audited READ COMMITTED transaction.
 * Locks the contract, checks balance and audits in that same transaction; caller commits once.
 * Settlement owns invoice/payment creation and its own idempotency key.
 */
export async function applyDepositForSettlement(
  user: StayUser,
  id: string,
  input: Omit<DepositInput, 'type'> & { invoiceId: string },
  transaction: Transaction,
): Promise<DepositEntry> {
  return insertEntry(user, id, { ...input, type: 'applied' }, transaction);
}
