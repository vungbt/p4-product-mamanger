import { randomUUID } from 'node:crypto';
import type {
  ContentDraftInput,
  ContentEntry,
  ContentKind,
  ContentStatus,
  PublishedContent,
} from '@p4/shared';
import { Op, type Transaction } from 'sequelize';
import {
  ContentEntryModel,
  ContentRedirectModel,
  ContentRevisionModel,
  ContentTaxonomyModel,
  FileModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { recordAudit } from '@/shared/audit/record.js';
import { enqueueEvent } from '@/shared/commerce/persistence.js';
import { assertTransition, assertVersion } from '@/shared/commerce/transitions.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { Forbidden, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';

export function contentDto(row: ContentEntryModel): ContentEntry {
  return {
    ...selectFields(row, [
      'id',
      'kind',
      'slug',
      'title',
      'excerpt',
      'body',
      'coverFileId',
      'taxonomyIds',
      'seoTitle',
      'seoDescription',
      'status',
      'version',
    ]),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
  };
}
async function revision(row: ContentEntryModel, actorId: string, transaction: Transaction) {
  await ContentRevisionModel.create(
    { id: randomUUID(), entryId: row.id, actorId, version: row.version, snapshot: contentDto(row) },
    { transaction },
  );
}
async function validateMedia(input: ContentDraftInput, actorId: string, transaction: Transaction) {
  const ids = [
    input.coverFileId,
    ...input.body.flatMap((block) => (block.type === 'image' ? [block.fileId] : [])),
  ].filter((id): id is string => id !== null);
  for (const id of ids) {
    if (!/^[a-f0-9-]{36}$/i.test(id)) throw new BaseError('invalid_media_id');
    const file = await FileModel.findByPk(id, { transaction });
    if (
      !file ||
      file.metadata?.ownerId !== actorId ||
      file.metadata?.purpose !== 'blog' ||
      file.metadata?.private
    )
      throw new Forbidden();
  }
  for (const id of input.taxonomyIds) {
    if (!/^[a-f0-9-]{36}$/i.test(id) || !(await ContentTaxonomyModel.findByPk(id, { transaction })))
      throw new BaseError('invalid_taxonomy');
  }
}
export async function saveContent(
  actorId: string,
  kind: ContentKind,
  input: ContentDraftInput,
  id?: string,
  expectedVersion?: number,
) {
  return auditedTransaction(async (transaction) => {
    await validateMedia(input, actorId, transaction);
    const reserved = await ContentRedirectModel.findOne({
      where: { kind, slug: input.slug },
      transaction,
    });
    if (reserved && reserved.entryId !== id)
      throw new BaseError('slug_reserved', 409, 'slug_reserved');
    let row: ContentEntryModel | null;
    if (id) {
      row = await ContentEntryModel.findOne({
        where: { id, kind },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new NotFound();
      assertVersion(row.version, expectedVersion ?? 0);
      if (row.slug !== input.slug)
        await ContentRedirectModel.findOrCreate({
          where: { kind, slug: row.slug },
          defaults: { id: randomUUID(), kind, slug: row.slug, entryId: id },
          transaction,
        });
      await row.update(
        { ...input, status: 'draft', scheduledAt: null, version: row.version + 1 },
        { transaction },
      );
    } else
      row = await ContentEntryModel.create(
        {
          id: randomUUID(),
          kind,
          ...input,
          authorId: actorId,
          status: 'draft',
          publishedAt: null,
          scheduledAt: null,
          version: 1,
          publishedSnapshot: null,
        },
        { transaction },
      );
    await revision(row, actorId, transaction);
    await recordAudit(
      { actorId, action: 'content.saved', resourceType: kind, resourceId: row.id },
      transaction,
    );
    return contentDto(row);
  });
}
export async function publishContent(
  actorId: string,
  id: string,
  kind: ContentKind,
  expectedVersion: number,
  status: ContentStatus,
  scheduledAt?: Date,
) {
  return auditedTransaction(async (transaction) => {
    const row = await ContentEntryModel.findOne({
      where: { id, kind },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new NotFound();
    assertVersion(row.version, expectedVersion);
    if (row.status !== status) assertTransition('content', row.status, status);
    if (status === 'scheduled' && (!scheduledAt || scheduledAt.getTime() <= Date.now()))
      throw new BaseError('invalid_schedule');
    const now = new Date();
    const snapshot: PublishedContent = {
      ...selectFields(row, [
        'id',
        'kind',
        'slug',
        'title',
        'excerpt',
        'body',
        'coverFileId',
        'taxonomyIds',
        'seoTitle',
        'seoDescription',
      ]),
      version: row.version + 1,
      publishedAt: now.toISOString(),
    };
    await row.update(
      {
        status,
        version: row.version + 1,
        scheduledAt: status === 'scheduled' ? scheduledAt : null,
        publishedAt: status === 'published' ? now : row.publishedAt,
        publishedSnapshot:
          status === 'published' ? snapshot : status === 'archived' ? null : row.publishedSnapshot,
      },
      { transaction },
    );
    await revision(row, actorId, transaction);
    await recordAudit(
      { actorId, action: `content.${status}`, resourceType: kind, resourceId: id },
      transaction,
    );
    await enqueueEvent(
      { type: `content.${status}`, aggregateType: kind, aggregateId: id, payload: { entryId: id } },
      transaction,
    );
    return contentDto(row);
  });
}
export async function publicContent(kind: ContentKind, slug: string) {
  let row = await ContentEntryModel.findOne({
    where: { kind, 'publishedSnapshot.slug': slug, status: { [Op.ne]: 'archived' } },
  });
  let redirect: string | null = null;
  if (!row) {
    const old = await ContentRedirectModel.findOne({ where: { kind, slug } });
    if (old) {
      row = await ContentEntryModel.findByPk(old.entryId);
      redirect = row?.publishedSnapshot?.slug ?? null;
    }
  }
  if (row?.publishedSnapshot?.slug !== slug && !redirect) throw new NotFound();
  if (
    !row?.publishedSnapshot ||
    row.status === 'archived' ||
    new Date(row.publishedSnapshot.publishedAt).getTime() > Date.now()
  )
    throw new NotFound();
  // Published content is immutable while an editor works on the next draft revision.
  return { ...row.publishedSnapshot, redirect };
}
export async function publishScheduledContent() {
  const rows = await ContentEntryModel.findAll({
    where: { status: 'scheduled', scheduledAt: { [Op.lte]: new Date() } },
    limit: 100,
    order: [['scheduledAt', 'ASC']],
  });
  for (const row of rows) {
    try {
      await publishContent(row.authorId, row.id, row.kind, row.version, 'published');
    } catch (error) {
      if (!(error instanceof BaseError && error.code === 'version_conflict')) throw error;
    }
  }
  return rows.length;
}
