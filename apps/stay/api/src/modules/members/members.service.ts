import { randomUUID } from 'node:crypto';
import {
  BaseError,
  buildPaginationMeta,
  createOutbox,
  NotFound,
  searchPattern,
  selectFields,
} from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import type { MemberInput, MemberInvitationInput, StayMember } from '@stay/shared';
import { hash } from 'bcryptjs';
import { Op, type Transaction, UniqueConstraintError, type WhereOptions } from 'sequelize';
import {
  BuildingMemberModel,
  BuildingModel,
  DomainEventModel,
  sequelize,
  UserModel,
} from '@/sequelize/models/index.js';
import type { UserAttributes } from '@/sequelize/models/user.model.js';
import { auditedTransaction, setAuditChanges } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import type { ModelOrder } from '@/types/database.js';

export type MemberSortField = 'email' | 'displayName';
export interface MemberListQuery extends ListQuery<MemberSortField> {}

const { enqueueEvent } = createOutbox({
  insertEvent: (row, transaction) => DomainEventModel.create(row, { transaction }),
});

async function dto(row: UserModel, transaction?: Transaction): Promise<StayMember> {
  const assignments = await BuildingMemberModel.findAll({ where: { userId: row.id }, transaction });
  const buildings = await BuildingModel.findAll({
    where: { id: { [Op.in]: assignments.map((item) => item.buildingId) } },
    order: [['code', 'ASC']],
    transaction,
  });

  return {
    ...selectFields(row, [
      'id',
      'email',
      'displayName',
      'accountStatus',
      'permissionGroups',
      'version',
    ]),
    buildingIds: buildings.map((building) => building.id),
    buildingNames: buildings.map((building) => building.name),
  };
}

export async function listMembers(
  query: MemberListQuery,
): Promise<{ data: StayMember[]; meta: PaginationMeta }> {
  const where: WhereOptions<UserAttributes> = {
    role: 'manager',
    ...(query.q ? { email: { [Op.iLike]: searchPattern(query.q) } } : {}),
  };
  const order: ModelOrder<UserAttributes> = [
    [query.sortBy ?? 'email', query.sortOrder === 'desc' ? 'DESC' : 'ASC'],
    ['id', 'ASC'],
  ];
  const { rows, count } = await UserModel.findAndCountAll({
    where,
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return {
    data: await Promise.all(rows.map((row) => dto(row))),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

async function assign(row: UserModel, input: MemberInput, transaction: Transaction) {
  // Lock buildings so concurrent archival cannot invalidate the assignment.
  const buildings = await BuildingModel.findAll({
    where: { id: { [Op.in]: input.buildingIds }, archivedAt: null },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (buildings.length !== input.buildingIds.length)
    throw new BaseError('building_not_found', 404, 'building_not_found');
  await BuildingMemberModel.destroy({ where: { userId: row.id }, transaction });
  await BuildingMemberModel.bulkCreate(
    input.buildingIds.map((buildingId) => ({ buildingId, userId: row.id, role: 'manager' })),
    { transaction },
  );
}

export async function inviteMember(input: MemberInvitationInput): Promise<StayMember> {
  try {
    return await auditedTransaction(async (transaction) => {
      // Unique lower(email) index resolves concurrent invitations without promoting existing users.
      if (
        await UserModel.findOne({
          where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), input.email),
          transaction,
        })
      )
        throw new BaseError('email_exists', 409, 'email_exists');
      const id = randomUUID();
      const row = await UserModel.create(
        {
          id,
          email: input.email,
          displayName: input.email,
          emailVerified: false,
          avatarUrl: null,
          role: 'manager',
          accountStatus: 'active',
          permissionGroups: input.permissionGroups,
        },
        { transaction },
      );

      await sequelize.query(
        `INSERT INTO auth_accounts (id, account_id, provider_id, user_id, password) VALUES (:accountId, :id, 'credential', :id, :password)`,
        {
          replacements: { accountId: randomUUID(), id, password: await hash(randomUUID(), 12) },
          transaction,
        },
      );
      await assign(row, input, transaction);
      await enqueueEvent(
        {
          type: 'stay.member.invitation',
          aggregateType: 'member',
          aggregateId: id,
          payload: { userId: id },
        },
        transaction,
      );
      setAuditChanges({
        memberId: id,
        buildingIds: input.buildingIds,
        permissionGroups: input.permissionGroups,
      });
      return dto(row, transaction);
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError)
      throw new BaseError('email_exists', 409, 'email_exists');
    throw error;
  }
}

export async function updateMember(
  id: string,
  input: MemberInput,
  version: number,
): Promise<StayMember> {
  return auditedTransaction(async (transaction) => {
    const row = await UserModel.findOne({
      where: { id, role: 'manager' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!row) throw new NotFound();
    assertVersion(row.version, version);
    await assign(row, input, transaction);
    await row.update(
      { permissionGroups: input.permissionGroups, version: row.version + 1 },
      { transaction },
    );
    setAuditChanges({
      memberId: id,
      buildingIds: input.buildingIds,
      permissionGroups: input.permissionGroups,
    });
    return dto(row, transaction);
  });
}

export async function disableMember(id: string): Promise<StayMember> {
  return auditedTransaction(async (transaction) => {
    const row = await UserModel.findOne({
      where: { id, role: 'manager' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!row) throw new NotFound();
    // Existing users_blocked trigger atomically revokes every Better Auth session.
    if (row.accountStatus !== 'blocked')
      await row.update({ accountStatus: 'blocked', version: row.version + 1 }, { transaction });
    setAuditChanges({ memberId: id, accountStatus: 'blocked' });
    return dto(row, transaction);
  });
}
