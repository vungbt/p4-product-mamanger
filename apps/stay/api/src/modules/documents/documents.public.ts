import { InputValidError, NotFound } from '@p4/server-core';
import type { DocumentFileCheck, DocumentVerification } from '@stay/shared';
import { BuildingModel, ContractDocumentModel } from '@/sequelize/models/index.js';
import { documentSigners, effectiveStatus, sha256Hex } from './documents.service.js';

const CODE = /^VB-[A-Z0-9]{8}$/;

async function documentByCode(raw: string) {
  const code = raw.trim().toUpperCase();

  if (!CODE.test(code)) throw new NotFound('document_not_found');
  const row = await ContractDocumentModel.findOne({
    where: { code },
    attributes: { exclude: ['bodyHtml', 'dataSnapshot'] },
  });

  // Drafts were never shared: same answer as an unknown code.
  if (!row || row.status === 'draft' || row.status === 'owner_signed')
    throw new NotFound('document_not_found');
  return row;
}

/**
 * `GET /api/public/documents/verify/:code` (P-01, public, rate limited): whether the document
 * exists and its signing state. Never the content, names or CCCD.
 */
export async function verifyDocument(code: string): Promise<DocumentVerification> {
  const row = await documentByCode(code);
  const [signers, building] = await Promise.all([
    documentSigners([row.id]),
    BuildingModel.findByPk(row.buildingId, { attributes: ['id', 'name'] }),
  ]);
  const counted = signers.filter((signer) => signer.required || signer.status === 'signed');

  return {
    code: row.code,
    kind: row.kind,
    buildingName: building?.name ?? '',
    status: effectiveStatus(row, signers),
    signedCount: counted.filter((signer) => signer.status === 'signed').length,
    signerCount: counted.length,
    completedAt: row.completedAt?.toISOString() ?? null,
    pdfSha256: row.pdfSha256,
  };
}

/** `POST /api/public/documents/verify/:code` (multipart `file`): SHA-256 match of a PDF. */
export async function checkDocumentFile(
  code: string,
  bytes: Buffer | undefined,
): Promise<DocumentFileCheck> {
  if (!bytes?.length) throw new InputValidError('input_valid_error', { file: ['upload_missing'] });
  const row = await documentByCode(code);
  const sha256 = sha256Hex(bytes);

  return { code: row.code, matches: Boolean(row.pdfSha256) && row.pdfSha256 === sha256, sha256 };
}
