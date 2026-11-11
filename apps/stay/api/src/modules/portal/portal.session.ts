import { randomBytes } from 'node:crypto';
import { BaseError, NotFound, Unauthorized } from '@p4/server-core';
import {
  PORTAL_LOCK_MINUTES,
  PORTAL_MAX_FAILED_ATTEMPTS,
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_TTL_DAYS,
  type PortalLinkLookup,
  type PortalSessionResult,
  type PortalSignOutResult,
} from '@stay/shared';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { env } from '@/configs/env.js';
import { assertCookieOrigin } from '@/middlewares/cookie-origin.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import {
  BuildingModel,
  RoomModel,
  sequelize,
  TenantModel,
  TenantPortalLinkModel,
  TenantPortalSessionModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { formBody } from '@/shared/input.js';
import type { PortalPrincipal } from '@/types/express.js';
import { contractFactsAt } from '../contracts/contracts.resolvers.js';
import {
  contractContext,
  type LinkContext,
  PORTAL_SECRET_PATTERN,
  phoneLast4,
  portalOpen,
  portalReferenceDate,
  sameSecret,
  sha256,
} from './portal.access.js';

/** Window of the portal rate limits (`env.portalRateLimits`). */
export const PORTAL_RATE_WINDOW_MS = 15 * 60_000;
/** Production cookies need HTTPS (`__Secure-` prefix + `Secure`). */
const COOKIE_NAME = env.isProd ? `__Secure-${PORTAL_SESSION_COOKIE}` : PORTAL_SESSION_COOKIE;
/** The cookie is only sent to portal routes, never to staff routes. */
const COOKIE_PATH = '/api/portal';

/* -------------------------------------------------------------------------- */
/* Cookie                                                                      */
/* -------------------------------------------------------------------------- */

function readSessionCookie(req: Request): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const index = part.indexOf('=');

    if (index > 0 && part.slice(0, index).trim() === COOKIE_NAME)
      return part.slice(index + 1).trim();
  }
  return undefined;
}

function setSessionCookie(res: Response | undefined, value: string, expiresAt: Date) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  res?.append(
    'Set-Cookie',
    [
      `${COOKIE_NAME}=${value}`,
      `Path=${COOKIE_PATH}`,
      `Expires=${expiresAt.toUTCString()}`,
      `Max-Age=${maxAge}`,
      'HttpOnly',
      'SameSite=Lax',
      ...(env.isProd ? ['Secure'] : []),
    ].join('; '),
  );
}

function clearSessionCookie(res: Response | undefined) {
  res?.append(
    'Set-Cookie',
    [
      `${COOKIE_NAME}=`,
      `Path=${COOKIE_PATH}`,
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'Max-Age=0',
      'HttpOnly',
      'SameSite=Lax',
      ...(env.isProd ? ['Secure'] : []),
    ].join('; '),
  );
}

/* -------------------------------------------------------------------------- */
/* Session guard                                                               */
/* -------------------------------------------------------------------------- */

function principalOf(
  session: TenantPortalSessionModel,
  link: TenantPortalLinkModel,
  context: LinkContext,
): PortalPrincipal {
  return {
    sessionId: session.id,
    sessionExpiresAt: session.expiresAt,
    linkId: link.id,
    buildingId: context.contract.buildingId,
    contractId: context.contract.id,
    tenantId: link.tenantId,
    ability: { id: link.tenantId, role: 'tenant', contractIds: [context.contract.id] },
  };
}

/**
 * The portal session of the request's cookie: unexpired, its link not revoked and the portal of
 * the occupant still open (contract ended ≤ 30 days ago, occupant not removed). Only the portal
 * cookie is read: Better Auth staff sessions never count.
 */
async function resolvePortal(req: Request): Promise<PortalPrincipal | undefined> {
  const value = readSessionCookie(req);

  if (!value || !PORTAL_SECRET_PATTERN.test(value)) return undefined;
  const session = await TenantPortalSessionModel.findOne({
    where: { sessionHash: sha256(value), expiresAt: { [Op.gt]: new Date() } },
  });
  const link = session ? await TenantPortalLinkModel.findByPk(session.linkId) : null;

  if (!session || !link || link.revokedAt) return undefined;
  const context = await contractContext(link.contractId);

  if (!context || !portalOpen(context.contract, context.occupants, link.tenantId)) return undefined;
  return principalOf(session, link, context);
}

/**
 * Tenant portal guard (ST-25): 401 `portal_session_invalid` without a valid portal session;
 * cookie writes must come from an allowed web origin (same CSRF guard as staff routes).
 */
export async function portalSessionRequired(req: Request, _res: Response, next: NextFunction) {
  try {
    const principal = await resolvePortal(req);

    if (!principal) throw new BaseError('portal_session_invalid', 401, 'portal_session_invalid');
    req.portal = principal;
    assertCookieOrigin(req);
    next();
  } catch (error) {
    next(error);
  }
}

export function portalOf(req: Request): PortalPrincipal {
  if (!req.portal) throw new Unauthorized('portal_session_invalid');
  return req.portal;
}

/* -------------------------------------------------------------------------- */
/* Rate limits                                                                 */
/* -------------------------------------------------------------------------- */

export const portalSessionIpLimit = rateLimit(
  'stay-portal-session',
  env.portalRateLimits.sessionsPerIp,
  PORTAL_RATE_WINDOW_MS,
);

export const portalLookupIpLimit = rateLimit(
  'stay-portal-lookup',
  env.portalRateLimits.lookupsPerIp,
  PORTAL_RATE_WINDOW_MS,
);

const tokenLimiter = rateLimit(
  'stay-portal-token',
  env.portalRateLimits.sessionsPerToken,
  PORTAL_RATE_WINDOW_MS,
);

/**
 * Session attempts per link token, whatever the client IP. The shared limiter keys by user or
 * IP, so it receives a view of the request whose `ip` is the token hash (never the token).
 */
export const portalSessionTokenLimit: RequestHandler = (req, res, next) => {
  const body: unknown = req.body;
  const token =
    body && typeof body === 'object' && 'token' in body && typeof body.token === 'string'
      ? body.token
      : '';
  const keyed: Request = Object.create(req, {
    ip: { value: `token:${sha256(token)}` },
    user: { value: undefined },
  });

  tokenLimiter(keyed, res, next);
};

/* -------------------------------------------------------------------------- */
/* Sign in / out                                                               */
/* -------------------------------------------------------------------------- */

/** Same answer for an unknown, revoked or expired link and for wrong digits. */
function verificationFailed(): never {
  throw new BaseError('portal_verification_failed', 401, 'portal_verification_failed');
}

function linkLocked(req: Request, until: Date): never {
  const seconds = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 1000));

  req.res?.setHeader('Retry-After', seconds);
  throw new BaseError('portal_link_locked', 429, 'portal_link_locked', {
    retryAfterSeconds: seconds,
  });
}

/**
 * Counts a wrong attempt in its own transaction, so it survives the failed request; the
 * `PORTAL_MAX_FAILED_ATTEMPTS`-th locks the link for `PORTAL_LOCK_MINUTES` and resets the count.
 */
async function recordFailedAttempt(link: TenantPortalLinkModel, context: LinkContext) {
  return sequelize.transaction(async (transaction) => {
    const [row] = await sequelize.query<{ lockedUntil: Date | null }>(
      `UPDATE tenant_portal_links SET
         failed_attempts = CASE WHEN failed_attempts + 1 >= :max THEN 0 ELSE failed_attempts + 1 END,
         locked_until = CASE WHEN failed_attempts + 1 >= :max
           THEN now() + (:minutes * INTERVAL '1 minute') ELSE locked_until END,
         updated_at = now()
       WHERE id = :id
       RETURNING locked_until AS "lockedUntil"`,
      {
        replacements: {
          id: link.id,
          max: PORTAL_MAX_FAILED_ATTEMPTS,
          minutes: PORTAL_LOCK_MINUTES,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    );
    const lockedUntil = row?.lockedUntil && row.lockedUntil > new Date() ? row.lockedUntil : null;

    await recordAudit(
      {
        actorId: null,
        action: 'tenant_portal.verification_failed',
        resourceType: 'tenant_portal_link',
        resourceId: link.id,
        outcome: 'failure',
        changes: {
          buildingId: context.contract.buildingId,
          contractId: context.contract.id,
          linkId: link.id,
          locked: Boolean(lockedUntil),
        },
      },
      transaction,
    );
    return lockedUntil;
  });
}

async function openLink(token: string) {
  if (!PORTAL_SECRET_PATTERN.test(token)) return null;
  const link = await TenantPortalLinkModel.findOne({ where: { tokenHash: sha256(token) } });
  const context = link && !link.revokedAt ? await contractContext(link.contractId) : null;

  if (!link || !context || !portalOpen(context.contract, context.occupants, link.tenantId))
    return null;
  return { link, context };
}

/**
 * `POST /api/portal/sessions` `{ token, phoneLast4 }`: verifies the occupant's last 4 phone
 * digits (constant time) and sets the portal session cookie (random id, only its hash stored,
 * `PORTAL_SESSION_TTL_DAYS`). Unknown/revoked/expired links and wrong digits get the same 401;
 * the fifth wrong attempt locks the link for 15 minutes (429 `portal_link_locked`).
 */
export async function createPortalSession(req: Request): Promise<PortalSessionResult> {
  assertCookieOrigin(req);
  const body = formBody(req);
  const token = body.text('token', 64);
  const digits = body.text('phoneLast4', 4);

  body.check('phoneLast4', /^[0-9]{4}$/.test(digits), 'portal_phone_last4');
  body.assertValid();

  return auditedTransaction(async (transaction) => {
    const opened = await openLink(token);

    if (!opened) verificationFailed();
    const { link, context } = opened;

    if (link.lockedUntil && link.lockedUntil > new Date()) linkLocked(req, link.lockedUntil);
    const tenant = await TenantModel.findByPk(link.tenantId, { attributes: ['id', 'phone'] });

    if (!tenant || !sameSecret(phoneLast4(tenant.phone), digits)) {
      const lockedUntil = await recordFailedAttempt(link, context);

      if (lockedUntil) linkLocked(req, lockedUntil);
      verificationFailed();
    }

    const now = new Date();
    const sessionId = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + PORTAL_SESSION_TTL_DAYS * 86_400_000);

    await TenantPortalSessionModel.destroy({
      where: { linkId: link.id, expiresAt: { [Op.lte]: now } },
      transaction,
    });
    const session = await TenantPortalSessionModel.create(
      {
        linkId: link.id,
        sessionHash: sha256(sessionId),
        expiresAt,
        userAgent: req.get('user-agent')?.slice(0, 255) || null,
      },
      { transaction },
    );

    await TenantPortalLinkModel.update(
      { failedAttempts: 0, lockedUntil: null, lastOpenedAt: now },
      { where: { id: link.id }, transaction },
    );
    // Ids and expiry only: never the token, the session id or their hashes.
    await recordAudit(
      {
        actorId: null,
        action: 'tenant_portal.session_created',
        resourceType: 'tenant_portal_session',
        resourceId: session.id,
        changes: {
          buildingId: context.contract.buildingId,
          contractId: context.contract.id,
          linkId: link.id,
          tenantId: link.tenantId,
          expiresAt: expiresAt.toISOString(),
        },
      },
      transaction,
    );
    setSessionCookie(req.res, sessionId, expiresAt);
    return { expiresAt: expiresAt.toISOString() };
  });
}

/** `DELETE /api/portal/sessions`: signs this device out (the other devices stay signed in). */
export async function deletePortalSession(req: Request): Promise<PortalSignOutResult> {
  const portal = portalOf(req);

  return auditedTransaction(async (transaction) => {
    const removed = await TenantPortalSessionModel.destroy({
      where: { id: portal.sessionId },
      transaction,
    });

    await recordAudit(
      {
        actorId: null,
        action: 'tenant_portal.session_deleted',
        resourceType: 'tenant_portal_session',
        resourceId: portal.sessionId,
        changes: {
          buildingId: portal.buildingId,
          contractId: portal.contractId,
          linkId: portal.linkId,
        },
      },
      transaction,
    );
    clearSessionCookie(req.res);
    return { signedOut: removed > 0 };
  });
}

/**
 * `POST /api/portal/links/lookup` `{ token }` (public, read-only): the greeting of the entry page
 * and whether this device is already signed in with the link. Any invalid link → 404.
 */
export async function lookupPortalLink(req: Request): Promise<PortalLinkLookup> {
  const body = formBody(req);
  const token = body.text('token', 64);

  body.assertValid();
  const opened = await openLink(token);

  if (!opened) throw new NotFound('portal_link_invalid');
  const { link, context } = opened;
  const facts = await contractFactsAt(context.contract.id, portalReferenceDate(context.contract));
  const [room, building, current] = await Promise.all([
    RoomModel.findByPk(facts.roomId, { attributes: ['id', 'code'] }),
    BuildingModel.findByPk(context.contract.buildingId, { attributes: ['id', 'name'] }),
    resolvePortal(req),
  ]);

  return {
    roomCode: room?.code ?? '',
    buildingName: building?.name ?? '',
    signedIn: current?.linkId === link.id,
  };
}
