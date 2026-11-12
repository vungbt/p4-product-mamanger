import { BaseError, NotFound } from '@p4/server-core';
import {
  type ContractTemplateDetail,
  type ContractTemplateSummary,
  type ContractTemplateVersion,
  type ContractTemplateVersionDetail,
  DOCUMENT_KINDS,
  type DocumentKind,
  isTemplateVariable,
  type StayUser,
  type TemplatePreview,
  templatePlaceholders,
} from '@stay/shared';
import { Op, QueryTypes, type Transaction, type WhereOptions } from 'sequelize';
import { accessibleBuildingIds, canAccessRecord } from '@/middlewares/ability.middleware.js';
import type { ContractTemplateAttributes } from '@/sequelize/models/contract-template.model.js';
import {
  BuildingModel,
  ContractModel,
  ContractTemplateModel,
  ContractTemplateVersionModel,
  sequelize,
  UserModel,
} from '@/sequelize/models/index.js';
import { setAuditChanges } from '@/shared/audit.js';
import { assertVersion, type FormBody } from '@/shared/input.js';
import { contractSnapshot, previewOf, renderTemplate, sampleSnapshot } from './documents.data.js';
import {
  DEFAULT_CONTRACT_TEMPLATE_HTML,
  DEFAULT_CONTRACT_TEMPLATE_NAME,
} from './documents.default-template.js';
import { sanitizeBody } from './documents.html.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Templates `user` may read: shared ones (`buildingId: null`) and those of readable buildings. */
function readableWhere(user: StayUser): WhereOptions<ContractTemplateAttributes> {
  const ids = accessibleBuildingIds(user, 'read');

  return ids === 'all' ? {} : { [Op.or]: [{ buildingId: null }, { buildingId: ids }] };
}

async function documentCounts(templateIds: string[]): Promise<Map<string, number>> {
  if (!templateIds.length) return new Map();
  const rows = await sequelize.query<{ templateId: string; count: string }>(
    `SELECT v.template_id AS "templateId", count(d.id) AS count
       FROM contract_template_versions v
       JOIN contract_documents d ON d.template_version_id = v.id
      WHERE v.template_id IN (:ids)
      GROUP BY v.template_id`,
    { replacements: { ids: templateIds }, type: QueryTypes.SELECT },
  );

  return new Map(rows.map((row) => [row.templateId, Number(row.count)]));
}

async function summaries(rows: ContractTemplateModel[]): Promise<ContractTemplateSummary[]> {
  const ids = rows.map((row) => row.id);
  const [counts, versions, buildings] = await Promise.all([
    documentCounts(ids),
    ContractTemplateVersionModel.findAll({
      where: { id: rows.flatMap((row) => (row.activeVersionId ? [row.activeVersionId] : [])) },
      attributes: ['id', 'version'],
    }),
    BuildingModel.findAll({
      where: { id: rows.flatMap((row) => (row.buildingId ? [row.buildingId] : [])) },
      attributes: ['id', 'name'],
    }),
  ]);

  return rows.map((row) => ({
    id: row.id,
    buildingId: row.buildingId,
    buildingName: buildings.find((item) => item.id === row.buildingId)?.name ?? null,
    kind: row.kind,
    name: row.name,
    active: row.active,
    activeVersion: versions.find((item) => item.id === row.activeVersionId)?.version ?? 0,
    updatedAt: row.updatedAt.toISOString(),
    documentCount: counts.get(row.id) ?? 0,
    version: row.version,
  }));
}

/** `GET /api/contract-templates?buildingId&kind` (O-36). */
export async function listTemplates(
  user: StayUser,
  filters: { buildingId?: string; kind?: DocumentKind },
): Promise<ContractTemplateSummary[]> {
  const rows = await ContractTemplateModel.findAll({
    where: {
      [Op.and]: [
        readableWhere(user),
        filters.kind ? { kind: filters.kind } : {},
        filters.buildingId
          ? { [Op.or]: [{ buildingId: null }, { buildingId: filters.buildingId }] }
          : {},
      ],
    },
    order: [
      ['active', 'DESC'],
      ['kind', 'ASC'],
      ['name', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return summaries(rows);
}

/** A template `user` may read (404 otherwise). */
export async function readableTemplate(
  user: StayUser,
  id: string,
  transaction?: Transaction,
): Promise<ContractTemplateModel> {
  const row = await ContractTemplateModel.findByPk(id, {
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (
    !row ||
    (row.buildingId && !canAccessRecord(user, 'read', 'Contract', { buildingId: row.buildingId }))
  )
    throw new NotFound('template_not_found');
  return row;
}

function versionDto(
  row: ContractTemplateVersionModel,
  users: UserModel[],
): ContractTemplateVersion {
  return {
    id: row.id,
    version: row.version,
    note: row.note,
    createdByName: users.find((user) => user.id === row.createdBy)?.displayName ?? null,
    createdAt: row.createdAt.toISOString(),
    variablesUsed: row.variablesUsed,
  };
}

/** `GET /api/contract-templates/:id`: active body + versions, newest first. */
export async function getTemplate(user: StayUser, id: string): Promise<ContractTemplateDetail> {
  const row = await readableTemplate(user, id);
  const versions = await ContractTemplateVersionModel.findAll({
    where: { templateId: row.id },
    attributes: { exclude: ['bodyHtml'] },
    order: [['version', 'DESC']],
  });
  const active = await ContractTemplateVersionModel.findByPk(row.activeVersionId ?? '');
  const users = await UserModel.findAll({
    where: {
      id: [...new Set(versions.flatMap((item) => (item.createdBy ? [item.createdBy] : [])))],
    },
    attributes: ['id', 'displayName'],
  });
  const [summary] = await summaries([row]);

  if (!summary || !active) throw new NotFound('template_not_found');
  return {
    ...summary,
    activeVersionId: active.id,
    bodyHtml: active.bodyHtml,
    versions: versions.map((item) => versionDto(item, users)),
  };
}

/** `GET /api/contract-template-versions/:id`: one stored body (view or restore). */
export async function getTemplateVersion(
  user: StayUser,
  id: string,
): Promise<ContractTemplateVersionDetail> {
  const row = await ContractTemplateVersionModel.findByPk(id);

  if (!row) throw new NotFound('template_not_found');
  await readableTemplate(user, row.templateId);
  const users = await UserModel.findAll({
    where: { id: row.createdBy ? [row.createdBy] : [] },
    attributes: ['id', 'displayName'],
  });

  return { ...versionDto(row, users), templateId: row.templateId, bodyHtml: row.bodyHtml };
}

async function addVersion(
  template: ContractTemplateModel,
  bodyHtml: string,
  note: string | null,
  user: StayUser,
  transaction: Transaction,
) {
  const last = await ContractTemplateVersionModel.max<number, ContractTemplateVersionModel>(
    'version',
    { where: { templateId: template.id }, transaction },
  );

  return ContractTemplateVersionModel.create(
    {
      templateId: template.id,
      version: (last ?? 0) + 1,
      bodyHtml,
      variablesUsed: templatePlaceholders(bodyHtml).filter(isTemplateVariable),
      note,
      createdBy: user.id,
    },
    { transaction },
  );
}

export interface NewTemplateInput {
  buildingId: string | null;
  kind: DocumentKind;
  name: string;
  source: 'default' | 'blank' | 'copy' | 'html';
  copyFromId: string | null;
  bodyHtml: string | null;
}

export function readNewTemplateInput(body: FormBody): NewTemplateInput {
  const source = body.enum('source', ['default', 'blank', 'copy', 'html'] as const);
  const buildingId = body.optionalText('buildingId', 36) || null;
  const copyFromId = source === 'copy' ? body.text('copyFromId', 36) : null;
  const bodyHtml = source === 'html' ? body.text('bodyHtml', 400_000) : null;

  if (buildingId) body.check('buildingId', UUID.test(buildingId));
  if (copyFromId) body.check('copyFromId', UUID.test(copyFromId));
  const input: NewTemplateInput = {
    buildingId,
    kind: body.isEmpty('kind') ? 'contract' : body.enum('kind', DOCUMENT_KINDS),
    name:
      body.optionalText('name', 160) ||
      (source === 'default' ? DEFAULT_CONTRACT_TEMPLATE_NAME : body.text('name', 160)),
    source,
    copyFromId,
    bodyHtml,
  };

  body.assertValid();
  return input;
}

/**
 * `POST /api/contract-templates`: from the default lease, blank, a copy of another template's
 * active version, or imported HTML (Word import). Shared templates (`buildingId: null`) need
 * manage Settings (route guard); building templates must be in a readable building.
 */
export async function createTemplate(
  user: StayUser,
  input: NewTemplateInput,
  transaction: Transaction,
): Promise<ContractTemplateDetail> {
  if (input.buildingId) {
    const building = await BuildingModel.findByPk(input.buildingId, { transaction });

    if (!building || !canAccessRecord(user, 'read', 'Building', { buildingId: building.id }))
      throw new NotFound('building_not_found');
  }
  let bodyHtml = '<p></p>';

  if (input.source === 'default') bodyHtml = DEFAULT_CONTRACT_TEMPLATE_HTML;
  if (input.source === 'html' && input.bodyHtml) bodyHtml = sanitizeBody(input.bodyHtml);
  if (input.source === 'copy' && input.copyFromId) {
    const source = await readableTemplate(user, input.copyFromId);
    const version = await ContractTemplateVersionModel.findByPk(source.activeVersionId ?? '', {
      transaction,
    });

    if (!version) throw new NotFound('template_not_found');
    bodyHtml = version.bodyHtml;
  }

  const template = await ContractTemplateModel.create(
    { buildingId: input.buildingId, kind: input.kind, name: input.name, createdBy: user.id },
    { transaction },
  );
  const version = await addVersion(template, bodyHtml, null, user, transaction);

  await template.update({ activeVersionId: version.id }, { transaction });
  setAuditChanges({
    templateId: template.id,
    buildingId: input.buildingId,
    kind: input.kind,
    source: input.source,
    version: version.version,
  });
  return getTemplateIn(user, template.id);
}

/** Reads the template after the command (same request transaction through CLS). */
const getTemplateIn = (user: StayUser, id: string) => getTemplate(user, id);

export function readVersionInput(body: FormBody) {
  const input = {
    bodyHtml: body.text('bodyHtml', 400_000),
    note: body.optionalText('note', 255) || null,
    version: body.integer('version', 1),
  };

  body.assertValid();
  return { ...input, bodyHtml: sanitizeBody(input.bodyHtml) };
}

/** `POST /api/contract-templates/:id/versions`: a new active version (documents keep theirs). */
export async function saveTemplateVersion(
  user: StayUser,
  id: string,
  input: { bodyHtml: string; note: string | null; version: number },
  transaction: Transaction,
): Promise<ContractTemplateDetail> {
  const template = await readableTemplate(user, id, transaction);

  assertVersion(template.version, input.version);
  const version = await addVersion(template, input.bodyHtml, input.note, user, transaction);

  template.activeVersionId = version.id;
  template.changed('updatedAt', true);
  await template.save({ transaction });
  setAuditChanges({ templateId: template.id, version: version.version });
  return getTemplateIn(user, template.id);
}

export function readTemplateUpdateInput(body: FormBody) {
  const input = {
    name: body.text('name', 160),
    active: body.boolean('active'),
    version: body.integer('version', 1),
  };

  body.assertValid();
  return input;
}

/** `PUT /api/contract-templates/:id`: rename or disable (used templates are never deleted). */
export async function updateTemplate(
  user: StayUser,
  id: string,
  input: { name: string; active: boolean; version: number },
  transaction: Transaction,
): Promise<ContractTemplateDetail> {
  const template = await readableTemplate(user, id, transaction);

  assertVersion(template.version, input.version);
  await template.update({ name: input.name, active: input.active }, { transaction });
  setAuditChanges({ templateId: template.id, active: input.active });
  return getTemplateIn(user, template.id);
}

/**
 * `POST /api/contract-templates/:id/preview` `{ bodyHtml?, contractId? }`: the body (unsaved
 * editor content, else the active version) filled with sample data or a real contract.
 */
export async function previewTemplate(
  user: StayUser,
  id: string,
  body: FormBody,
): Promise<TemplatePreview> {
  const template = await readableTemplate(user, id);
  const html = body.optionalText('bodyHtml', 400_000);
  const contractId = body.optionalText('contractId', 36);

  if (contractId) body.check('contractId', UUID.test(contractId));
  body.assertValid();
  const source = html
    ? sanitizeBody(html)
    : (await ContractTemplateVersionModel.findByPk(template.activeVersionId ?? ''))?.bodyHtml;

  if (!source) throw new NotFound('template_not_found');
  if (!contractId) return previewOf(renderTemplate(source, sampleSnapshot()));

  const contract = await ContractModel.findByPk(contractId);

  if (
    !contract ||
    !canAccessRecord(user, 'read', 'Contract', {
      buildingId: contract.buildingId,
      contractId: contract.id,
    })
  )
    throw new NotFound('contract_not_found');
  const landlord = await landlordUserFor(user);

  return previewOf(
    renderTemplate(source, await contractSnapshot(contract.id, landlord, 'VB-XEMTRUOC')),
  );
}

/**
 * The owner account whose "Bên cho thuê" profile fills documents: the signed-in owner, else the
 * owner with the most recently updated profile (managers prepare documents for the owner).
 */
export async function landlordUserFor(user: StayUser, transaction?: Transaction): Promise<string> {
  if (user.role === 'owner') return user.id;
  const [row] = await sequelize.query<{ userId: string }>(
    `SELECT p.user_id AS "userId" FROM landlord_profiles p
       JOIN users u ON u.id = p.user_id AND u.role = 'owner' AND u.account_status = 'active'
      ORDER BY p.updated_at DESC LIMIT 1`,
    { type: QueryTypes.SELECT, transaction },
  );

  if (row) return row.userId;
  const owner = await UserModel.findOne({
    where: { role: 'owner', accountStatus: 'active' },
    order: [['createdAt', 'ASC']],
    transaction,
  });

  if (!owner) throw new BaseError('landlord_missing', 409, 'landlord_missing');
  return owner.id;
}
