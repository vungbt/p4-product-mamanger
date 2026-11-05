import { randomUUID } from 'node:crypto';
import type { MerchandisingEntry, MerchandisingPayload } from '@p4/shared';
import {
  FileModel,
  MerchandisingEntryModel,
  ProductModel,
  sequelize,
} from '@/sequelize/models/index.js';
import { recordAudit } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { Forbidden, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';
import { getCatalogProduct } from '../catalog/catalog.service.js';
export function merchandisingDto(row: MerchandisingEntryModel): MerchandisingEntry {
  return {
    ...selectFields(row, ['id', 'key', 'payload', 'active', 'version']),
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
  };
}
export function visible(row: MerchandisingEntryModel, now = new Date()) {
  return row.active && (!row.startsAt || row.startsAt <= now) && (!row.endsAt || row.endsAt > now);
}
export async function saveMerchandising(
  actorId: string,
  key: string,
  payload: MerchandisingPayload,
  active: boolean,
  startsAt: Date | null,
  endsAt: Date | null,
  id?: string,
  expectedVersion?: number,
) {
  return sequelize.transaction(async (transaction) => {
    if (startsAt && endsAt && endsAt <= startsAt) throw new BaseError('invalid_schedule');
    if (payload.kind === 'collection')
      for (const productId of payload.productIds)
        if (!(await ProductModel.findByPk(productId, { transaction })))
          throw new NotFound('product_not_found');
    if (payload.kind === 'banner') {
      if (!/^[a-f0-9-]{36}$/i.test(payload.imageFileId)) throw new BaseError('invalid_image');
      const file = await FileModel.findByPk(payload.imageFileId, { transaction });
      if (!file || file.metadata?.ownerId !== actorId || file.metadata?.private)
        throw new Forbidden();
    }
    if (payload.kind === 'home')
      for (const section of payload.sections) {
        if (
          !/^[a-f0-9-]{36}$/i.test(section.entryId) ||
          !(await MerchandisingEntryModel.findOne({
            where: { id: section.entryId, kind: section.type },
            transaction,
          }))
        )
          throw new BaseError('invalid_home_section');
      }
    let row: MerchandisingEntryModel | null;
    if (id) {
      row = await MerchandisingEntryModel.findOne({
        where: { id, kind: payload.kind },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new NotFound();
      assertVersion(row.version, expectedVersion ?? 0);
      await row.update(
        { key, payload, active, startsAt, endsAt, version: row.version + 1 },
        { transaction },
      );
    } else
      row = await MerchandisingEntryModel.create(
        {
          id: randomUUID(),
          kind: payload.kind,
          key,
          payload,
          active,
          startsAt,
          endsAt,
          version: 1,
        },
        { transaction },
      );
    await recordAudit(
      { actorId, action: 'merchandising.saved', resourceType: payload.kind, resourceId: row.id },
      transaction,
    );
    return merchandisingDto(row);
  });
}
export async function publicMerchandising(row: MerchandisingEntryModel) {
  if (!visible(row)) throw new NotFound();
  const payload = row.payload;
  if (payload.kind === 'collection') {
    const products = [];
    for (const id of payload.productIds) {
      const product = await ProductModel.findByPk(id);
      if (product?.status === 'active') products.push(await getCatalogProduct(id));
    }
    return { id: row.id, slug: row.key, title: payload.title, products };
  }
  if (payload.kind === 'banner') {
    const file = await FileModel.findByPk(payload.imageFileId);
    if (!file?.url) throw new NotFound();
    return {
      id: row.id,
      title: payload.title,
      imageUrl: file.url,
      href: payload.href,
      placement: payload.placement,
    };
  }
  if (payload.kind === 'navigation') return { placement: row.key, items: payload.items };
  return { sections: payload.sections };
}
