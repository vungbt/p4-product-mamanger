import { Router } from 'express';
import { Op } from 'sequelize';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { getMe, sessionFromHeaders } from '@/modules/auth/auth.service.js';
import { AuthSessionModel, UserModel } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { recordAudit } from '@/shared/audit/record.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import validate from '@/shared/validation.js';
import { NotFound, Unauthorized } from '@/utils/errors/index.js';
import { auditPolicies } from './accounts.audit.js';
import * as accounts from './accounts.service.js';

const router = Router();
const emailRules = validate({ rules: { email: 'required|email|max:255' } });
const tokenRules = validate({ rules: { token: 'required|string|max:128' } });

router.post(
  '/auth/register',
  rateLimit('register', 10, 3_600_000),
  validate({
    rules: {
      email: 'required|email|max:255',
      password: 'required|string|min:10|max:128',
      displayName: 'required|string|max:120',
    },
  }),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return accounts.register({
      email: body.text('email').toLowerCase(),
      password: body.text('password', 128, false),
      displayName: body.text('displayName', 120),
    });
  }, 201),
);
for (const [path, purpose] of Object.entries({
  'email-verification-requests': 'verify_email',
  'password-reset-requests': 'password_reset',
})) {
  router.post(
    `/auth/${path}`,
    rateLimit(path, 5, 3_600_000),
    emailRules,
    apiHandler(async (req) => {
      return accounts.requestAccountEmail(
        requestBody(req).text('email'),
        purpose === 'verify_email' ? 'verify_email' : 'password_reset',
      );
    }, 202),
  );
}
router.post(
  '/auth/email-verifications',
  rateLimit('verify-email', 10),
  tokenRules,
  apiHandler(async (req) => accounts.verifyEmail(requestBody(req).text('token', 128))),
);
router.post(
  '/auth/password-resets',
  rateLimit('reset-password', 10),
  validate({
    rules: { token: 'required|string|max:128', password: 'required|string|min:10|max:128' },
  }),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return accounts.resetPassword(body.text('token', 128), body.text('password', 128, false));
  }),
);
router.get(
  '/me/profile',
  authRequired,
  apiHandler(async (req) => (await getMe(currentUser(req).id)).user),
);
router.patch(
  '/me/profile',
  authRequired,
  apiHandler(async (req) => {
    const body = requestBody(req);
    return (
      await accounts.patchProfile(currentUser(req).id, {
        expectedVersion: body.integer('expectedVersion', 1),
        displayName: body.optionalText('displayName', 120),
        phone: body.data.phone === null ? null : body.optionalText('phone', 30),
        imageStorageId: body.optionalText('imageStorageId'),
      })
    ).user;
  }),
);
router.get(
  '/me/preferences',
  authRequired,
  apiHandler(async (req) => {
    const user = await UserModel.findByPk(currentUser(req).id);
    if (!user) throw new Unauthorized();
    return { locale: user.locale, timezone: user.timezone, version: user.version };
  }),
);
router.patch(
  '/me/preferences',
  authRequired,
  apiHandler(async (req) => {
    const body = requestBody(req);
    const result = await accounts.patchPreferences(currentUser(req).id, {
      locale: body.enum('locale', ['vi', 'en']),
      timezone: body.text('timezone', 80),
      expectedVersion: body.integer('expectedVersion', 1),
    });
    return {
      locale: result.user.locale,
      timezone: result.user.timezone,
      version: result.user.version,
    };
  }),
);
router.post(
  '/me/email-change-requests',
  authRequired,
  rateLimit('email-change', 3, 3_600_000),
  emailRules,
  apiHandler(async (req) => {
    const body = requestBody(req);
    return accounts.requestEmailChange(
      currentUser(req).id,
      body.text('email'),
      body.text('currentPassword', 128, false),
    );
  }, 202),
);
router.post(
  '/me/email-changes/confirm',
  rateLimit('confirm-email-change', 10),
  tokenRules,
  apiHandler(async (req) => accounts.confirmEmailChange(requestBody(req).text('token', 128))),
);
router.get(
  '/me/sessions',
  authRequired,
  apiHandler(async (req) => {
    const rows = await AuthSessionModel.findAll({
      where: { userId: currentUser(req).id, expiresAt: { [Op.gt]: new Date() } },
      attributes: ['id', 'createdAt', 'expiresAt'],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      revokedAt: null,
    }));
  }),
);
router.delete(
  '/me/sessions/:id',
  authRequired,
  apiHandler(async (req) => {
    const user = currentUser(req);
    await auditedTransaction(async (transaction) => {
      const row = await AuthSessionModel.findOne({
        where: { id: uuidRouteId(req), userId: user.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new NotFound();
      await row.destroy({ transaction });
      await recordAudit(
        {
          actorId: user.id,
          action: 'session.revoked',
          resourceType: 'session',
          resourceId: row.id,
        },
        transaction,
      );
    });
    return { revoked: true };
  }),
);
router.post(
  '/me/sessions/revoke-others',
  authRequired,
  apiHandler(async (req) => {
    const user = currentUser(req);
    const session = await sessionFromHeaders(req.headers);
    if (!session) throw new Unauthorized();
    await auditedTransaction(async (transaction) => {
      await AuthSessionModel.destroy({
        where: { userId: user.id, id: { [Op.ne]: session.session.id } },
        transaction,
      });
      await recordAudit(
        {
          actorId: user.id,
          action: 'sessions.revoked_others',
          resourceType: 'user',
          resourceId: user.id,
        },
        transaction,
      );
    });
    return { revoked: true };
  }),
);
export default applyAuditPolicies(router, auditPolicies);
